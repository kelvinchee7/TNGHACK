import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Beneficiary, KycStatus, Estate, AuditLog
from ..services.notifications import notify
from ..services.velocity_guard import ClaimVelocityGuard

router = APIRouter(prefix="/claims", tags=["claims"])


class SubmitClaimRequest(BaseModel):
    estate_id: str
    name: str
    nic: str
    email: str
    contact_number: str | None = None
    wallet_id: str | None = None
    transfer_method: str = "TNG"
    fx_currency: str | None = None


def _write_audit(db: Session, estate_id: str | None, actor_ip: str | None,
                 action: str, payload=None):
    log = AuditLog(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        actor_ip=actor_ip,
        action=action,
        payload_json=json.dumps(payload) if payload else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)


@router.post("", status_code=201)
def submit_claim(body: SubmitClaimRequest, request: Request, db: Session = Depends(get_db)):
    actor_ip = request.client.host if request.client else None

    # Validate estate exists
    estate = db.get(Estate, body.estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")

    # Duplicate NIC check on same estate
    existing = db.query(Beneficiary).filter(
        Beneficiary.estate_id == body.estate_id,
        Beneficiary.nic_enc == body.nic,
    ).first()
    if existing:
        raise HTTPException(409, "duplicate_claim")

    # Fraud velocity check (>3 claims in 30 days across all estates)
    if ClaimVelocityGuard.is_blocked(db, body.nic):
        _write_audit(db, body.estate_id, actor_ip, "FRAUD_VELOCITY_BLOCK", {"nic": body.nic[:4] + "****"})
        db.commit()
        notify("FRAUD_VELOCITY_BLOCK", {"nic_prefix": body.nic[:4], "ip": actor_ip})
        raise HTTPException(429, "Too many estate claims from this identity within 30 days")

    beneficiary = Beneficiary(
        id=str(uuid.uuid4()),
        estate_id=body.estate_id,
        name_enc=body.name,
        nic_enc=body.nic,
        email_enc=body.email,
        contact_number=body.contact_number,
        wallet_id=body.wallet_id,
        transfer_method=body.transfer_method,
        fx_currency=body.fx_currency,
        kyc_status=KycStatus.PENDING,
    )
    db.add(beneficiary)

    _write_audit(db, body.estate_id, actor_ip, "CLAIM_SUBMITTED",
                 {"beneficiary_id": beneficiary.id})
    db.commit()
    db.refresh(beneficiary)

    # Send magic-link email (best-effort)
    try:
        from ..services.notifications import send_magic_link
        send_magic_link(body.email, beneficiary.id)
    except Exception:
        pass

    return {"id": beneficiary.id, "kyc_status": beneficiary.kyc_status}


@router.post("/{claim_id}/kyc")
async def upload_kyc(
    claim_id: str,
    step: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    beneficiary = db.get(Beneficiary, claim_id)
    if not beneficiary:
        raise HTTPException(404, "Claim not found")

    VALID_STEPS = {"id_upload", "biometric"}
    if step not in VALID_STEPS:
        raise HTTPException(400, f"step must be one of {VALID_STEPS}")

    file_bytes = await file.read()

    # Upload to OSS (or local fallback)
    try:
        from ..services.storage import upload_kyc_doc
        key = upload_kyc_doc(claim_id, step, file.filename or "doc", file_bytes)
    except Exception as exc:
        raise HTTPException(500, f"Storage upload failed: {exc}")

    if step == "id_upload":
        beneficiary.kyc_status = KycStatus.ID_VERIFIED
    elif step == "biometric":
        beneficiary.kyc_status = KycStatus.BIOMETRIC_CONFIRMED

    actor_ip = request.client.host if request and request.client else None
    log = AuditLog(
        id=str(uuid.uuid4()),
        estate_id=beneficiary.estate_id,
        actor_ip=actor_ip,
        action=f"KYC_{step.upper()}",
        payload_json=json.dumps({"claim_id": claim_id, "oss_key": key}),
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    return {"kyc_status": beneficiary.kyc_status, "oss_key": key}


@router.post("/{claim_id}/approve")
def approve_claim(claim_id: str, request: Request, db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, claim_id)
    if not beneficiary:
        raise HTTPException(404, "Claim not found")
    if beneficiary.kyc_status not in (KycStatus.BIOMETRIC_CONFIRMED, KycStatus.ID_VERIFIED):
        raise HTTPException(400, "KYC not ready for approval")

    beneficiary.kyc_status = KycStatus.APPROVED
    actor_ip = request.client.host if request.client else None
    log = AuditLog(
        id=str(uuid.uuid4()),
        estate_id=beneficiary.estate_id,
        actor_ip=actor_ip,
        action="KYC_APPROVED",
        payload_json=json.dumps({"claim_id": claim_id}),
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    return {"kyc_status": beneficiary.kyc_status}


@router.post("/{claim_id}/reject")
async def reject_claim(claim_id: str, request: Request, db: Session = Depends(get_db)):
    beneficiary = db.get(Beneficiary, claim_id)
    if not beneficiary:
        raise HTTPException(404, "Claim not found")

    body = await request.json()
    reason = body.get("reason", "")
    if len(reason) < 10:
        raise HTTPException(400, "reason must be at least 10 characters")

    beneficiary.kyc_status = KycStatus.REJECTED
    beneficiary.rejection_reason = reason
    actor_ip = request.client.host if request.client else None
    log = AuditLog(
        id=str(uuid.uuid4()),
        estate_id=beneficiary.estate_id,
        actor_ip=actor_ip,
        action="KYC_REJECTED",
        payload_json=json.dumps({"claim_id": claim_id, "reason": reason}),
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    return {"kyc_status": beneficiary.kyc_status}


@router.get("/{claim_id}/status")
def claim_status(claim_id: str, db: Session = Depends(get_db)):
    b = db.get(Beneficiary, claim_id)
    if not b:
        raise HTTPException(404, "Claim not found")

    transfer_status = None
    if b.share_instructions:
        latest = sorted(b.share_instructions, key=lambda s: s.created_at)[-1]
        transfer_status = latest.status

    return {
        "id": b.id,
        "kyc_status": b.kyc_status,
        "share_rm": float(b.share_rm) if b.share_rm else None,
        "transfer_status": transfer_status,
        "rejection_reason": b.rejection_reason,
    }
