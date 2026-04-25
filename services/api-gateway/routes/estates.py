import uuid
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Estate, EstateStatus, AssetSnapshot, AssetType, AuditLog
from services.asset_discovery import AssetDiscoveryService
from services.notifications import notify

router = APIRouter(prefix="/estates", tags=["estates"])


class CreateEstateRequest(BaseModel):
    deceased_account_id: str
    deceased_name: str
    deceased_nic: str | None = None
    death_date: str


def _write_audit(db: Session, estate_id: str, actor_id: str | None,
                 actor_ip: str | None, action: str, payload: Any = None):
    log = AuditLog(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        actor_id=actor_id,
        actor_ip=actor_ip,
        action=action,
        payload_json=json.dumps(payload) if payload else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)


@router.post("", status_code=201)
def create_estate(body: CreateEstateRequest, request: Request, db: Session = Depends(get_db)):
    estate_id = str(uuid.uuid4())
    actor_ip = request.client.host if request.client else None

    estate = Estate(
        id=estate_id,
        deceased_account_id=body.deceased_account_id,
        deceased_name_enc=body.deceased_name,   # encrypt in prod via KMS helper
        deceased_nic_enc=body.deceased_nic or "",
        death_date=body.death_date,
        status=EstateStatus.PENDING,
    )
    db.add(estate)

    # Attempt account freeze
    try:
        AssetDiscoveryService.freeze_account(body.deceased_account_id)
        estate.account_frozen_at = datetime.now(timezone.utc)
    except Exception as exc:
        notify("ESTATE_FREEZE_FAILED", {"estate_id": estate_id, "error": str(exc)})

    # Capture asset inventory
    try:
        inventory = AssetDiscoveryService.fetch(body.deceased_account_id)
        total = 0.0
        for asset in inventory:
            snap = AssetSnapshot(
                id=str(uuid.uuid4()),
                estate_id=estate_id,
                asset_type=AssetType(asset["type"]),
                balance_rm=asset["balance_rm"],
                currency=asset.get("currency", "MYR"),
            )
            db.add(snap)
            total += asset["balance_rm"]
        estate.total_rm = round(total, 2)
        estate.status = EstateStatus.PENDING
    except Exception as exc:
        notify("ASSET_DISCOVERY_FAILED", {"estate_id": estate_id, "error": str(exc)})

    _write_audit(db, estate_id, None, actor_ip, "ESTATE_CREATED",
                 {"deceased_account_id": body.deceased_account_id})
    db.commit()
    db.refresh(estate)
    return _estate_to_dict(estate)


@router.get("")
def list_estates(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Estate)
    if status:
        q = q.filter(Estate.status == status)
    return [_estate_to_dict(e) for e in q.order_by(Estate.created_at.desc()).all()]


@router.get("/{estate_id}")
def get_estate(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    return _estate_to_dict(estate)


@router.post("/{estate_id}/calculate")
def calculate_shares(estate_id: str, request: Request, db: Session = Depends(get_db)):
    from services.share_calculator import ShareCalculationEngine
    from models import Beneficiary, ShareInstruction, TransferMethod, InstructionStatus

    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    if estate.status not in (EstateStatus.VERIFIED,):
        raise HTTPException(400, "Estate must be in VERIFIED status to calculate shares")
    if not estate.will_extraction_json:
        raise HTTPException(400, "Will extraction data missing")

    will_data = json.loads(estate.will_extraction_json)
    beneficiaries = db.query(Beneficiary).filter(
        Beneficiary.estate_id == estate_id,
        Beneficiary.kyc_status == "APPROVED",
    ).all()

    try:
        instructions = ShareCalculationEngine.calculate(will_data, float(estate.total_rm), beneficiaries)
    except ValueError as exc:
        raise HTTPException(422, str(exc))

    for instr in instructions:
        si = ShareInstruction(
            id=str(uuid.uuid4()),
            estate_id=estate_id,
            beneficiary_id=instr["beneficiary_id"],
            share_rm=instr["share_rm"],
            fx_currency=instr.get("fx_currency"),
            transfer_method=TransferMethod(instr.get("transfer_method", "TNG")),
            status=InstructionStatus.PENDING,
        )
        db.add(si)

    actor_ip = request.client.host if request.client else None
    _write_audit(db, estate_id, None, actor_ip, "SHARES_CALCULATED",
                 {"instruction_count": len(instructions)})
    db.commit()
    return {"instructions_created": len(instructions)}


@router.post("/{estate_id}/dispatch-advisor")
def dispatch_advisor(estate_id: str, request: Request, db: Session = Depends(get_db)):
    from services.legal_workflow import LegalAdvisorWorkflow
    from models import LegalApproval, ApprovalStatus

    body = request.json() if hasattr(request, "json") else {}
    # Parse body manually for FastAPI
    import asyncio
    body_bytes = asyncio.get_event_loop().run_until_complete(request.body())
    body = json.loads(body_bytes) if body_bytes else {}
    advisor_email = body.get("advisor_email", "")
    if not advisor_email:
        raise HTTPException(400, "advisor_email required")

    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    if estate.status not in (EstateStatus.VERIFIED,):
        raise HTTPException(400, "estate_not_ready")

    token = LegalAdvisorWorkflow.dispatch(estate, advisor_email)

    approval = LegalApproval(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        advisor_email=advisor_email,
        status=ApprovalStatus.SENT,
    )
    db.add(approval)
    actor_ip = request.client.host if request.client else None
    _write_audit(db, estate_id, None, actor_ip, "ADVISOR_DISPATCHED",
                 {"advisor_email": advisor_email})
    db.commit()
    return {"status": "dispatched", "token_preview": token[:8] + "..."}


@router.get("/{estate_id}/beneficiaries")
def list_beneficiaries(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    from models import Beneficiary
    rows = db.query(Beneficiary).filter(Beneficiary.estate_id == estate_id).order_by(Beneficiary.created_at).all()
    return [
        {
            "id": b.id,
            "name": b.name_enc,
            "nic": b.nic_enc[:4] + "****" + b.nic_enc[-2:] if len(b.nic_enc) > 6 else "****",
            "email": b.email_enc,
            "contact_number": b.contact_number,
            "kyc_status": b.kyc_status,
            "wallet_id": b.wallet_id,
            "transfer_method": b.transfer_method,
            "fx_currency": b.fx_currency,
            "share_rm": float(b.share_rm) if b.share_rm else None,
            "rejection_reason": b.rejection_reason,
            "created_at": b.created_at.isoformat(),
        }
        for b in rows
    ]


@router.get("/{estate_id}/share-instructions")
def list_share_instructions(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    from models import ShareInstruction, Beneficiary
    rows = (db.query(ShareInstruction)
            .filter(ShareInstruction.estate_id == estate_id)
            .order_by(ShareInstruction.created_at)
            .all())
    return [
        {
            "id": si.id,
            "beneficiary_id": si.beneficiary_id,
            "beneficiary_name": si.beneficiary.name_enc if si.beneficiary else "—",
            "share_rm": float(si.share_rm),
            "fx_currency": si.fx_currency,
            "fx_amount": float(si.fx_amount) if si.fx_amount else None,
            "transfer_method": si.transfer_method,
            "status": si.status,
            "created_at": si.created_at.isoformat(),
        }
        for si in rows
    ]


@router.get("/{estate_id}/transfers")
def list_transfers(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    from models import ShareInstruction, Transfer
    instructions = (db.query(ShareInstruction)
                    .filter(ShareInstruction.estate_id == estate_id)
                    .all())
    result = []
    for si in instructions:
        for t in si.transfers:
            result.append({
                "id": t.id,
                "share_instruction_id": t.share_instruction_id,
                "beneficiary_name": si.beneficiary.name_enc if si.beneficiary else "—",
                "share_rm": float(si.share_rm),
                "leg": t.leg,
                "method": t.method,
                "external_ref": t.external_ref,
                "status": t.status,
                "error_message": t.error_message,
                "executed_at": t.executed_at.isoformat() if t.executed_at else None,
                "settled_at": t.settled_at.isoformat() if t.settled_at else None,
            })
    result.sort(key=lambda x: x["executed_at"] or "", reverse=True)
    return result


@router.get("/{estate_id}/audit-log")
def list_audit_log(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    rows = (db.query(AuditLog)
            .filter(AuditLog.estate_id == estate_id)
            .order_by(AuditLog.created_at.desc())
            .limit(100)
            .all())
    return [
        {
            "id": r.id,
            "action": r.action,
            "actor_id": r.actor_id,
            "actor_ip": r.actor_ip,
            "payload": json.loads(r.payload_json) if r.payload_json else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/{estate_id}/legal-approvals")
def list_legal_approvals(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    from models import LegalApproval
    rows = (db.query(LegalApproval)
            .filter(LegalApproval.estate_id == estate_id)
            .order_by(LegalApproval.created_at.desc())
            .all())
    return [
        {
            "id": a.id,
            "advisor_email": a.advisor_email,
            "status": a.status,
            "signature_hash": a.signature_hash,
            "rejection_reason": a.rejection_reason,
            "signed_at": a.signed_at.isoformat() if a.signed_at else None,
            "created_at": a.created_at.isoformat(),
        }
        for a in rows
    ]


def _estate_to_dict(e: Estate) -> dict:
    return {
        "id": e.id,
        "deceased_name": e.deceased_name_enc,
        "deceased_account_id": e.deceased_account_id,
        "death_date": e.death_date,
        "status": e.status,
        "total_rm": float(e.total_rm or 0),
        "account_frozen_at": e.account_frozen_at.isoformat() if e.account_frozen_at else None,
        "created_at": e.created_at.isoformat(),
        "updated_at": e.updated_at.isoformat(),
        "beneficiary_count": len(e.beneficiaries) if e.beneficiaries else 0,
    }
