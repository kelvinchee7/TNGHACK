import hashlib
import json
import uuid
from datetime import datetime, timezone

import jwt as pyjwt
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Estate, EstateStatus, LegalApproval, ApprovalStatus, AuditLog
from ..services.notifications import notify

router = APIRouter(prefix="/legal", tags=["legal"])


@router.get("/review/{token}")
def review_page(token: str, db: Session = Depends(get_db)):
    payload = _decode_token(token)
    estate = db.get(Estate, payload["estate_id"])
    if not estate:
        raise HTTPException(404, "Estate not found")

    instructions = []
    for si in estate.share_instructions:
        b = si.beneficiary
        instructions.append({
            "beneficiary_name": b.name_enc,
            "share_rm": float(si.share_rm),
            "transfer_method": si.transfer_method,
            "fx_currency": si.fx_currency,
        })

    return {
        "estate_id": estate.id,
        "deceased_name": estate.deceased_name_enc,
        "total_rm": float(estate.total_rm),
        "death_date": estate.death_date,
        "instructions": instructions,
        "advisor_email": payload["advisor_email"],
    }


@router.post("/review/{token}/decision")
async def submit_decision(token: str, request: Request, db: Session = Depends(get_db)):
    payload = _decode_token(token)
    estate = db.get(Estate, payload["estate_id"])
    if not estate:
        raise HTTPException(404, "Estate not found")

    body = await request.json()
    decision = body.get("decision")  # "approve" or "reject"
    reason = body.get("reason", "")

    if decision not in ("approve", "reject"):
        raise HTTPException(400, "decision must be 'approve' or 'reject'")
    if decision == "reject" and len(reason) < 10:
        raise HTTPException(400, "reason must be at least 10 characters")

    approval = db.query(LegalApproval).filter(
        LegalApproval.estate_id == estate.id,
        LegalApproval.advisor_email == payload["advisor_email"],
        LegalApproval.status == ApprovalStatus.SENT,
    ).first()
    if not approval:
        raise HTTPException(404, "No pending approval found for this estate and advisor")

    now = datetime.now(timezone.utc)
    actor_ip = request.client.host if request.client else None

    if decision == "approve":
        sig_input = f"{estate.id}{payload['advisor_email']}{now.isoformat()}{settings.jwt_secret}"
        approval.signature_hash = hashlib.sha256(sig_input.encode()).hexdigest()
        approval.status = ApprovalStatus.SIGNED
        approval.signed_at = now
        estate.status = EstateStatus.DISTRIBUTING

        log = AuditLog(
            id=str(uuid.uuid4()),
            estate_id=estate.id,
            actor_id=payload["advisor_email"],
            actor_ip=actor_ip,
            action="LEGAL_APPROVED",
            payload_json=json.dumps({"signature_hash": approval.signature_hash}),
            created_at=now,
        )
        db.add(log)
        db.commit()
        notify("estate.approved", {"estate_id": estate.id})
        return {"status": "approved", "signature_hash": approval.signature_hash}

    else:
        approval.status = ApprovalStatus.REJECTED
        approval.rejection_reason = reason
        estate.status = EstateStatus.DISPUTED

        log = AuditLog(
            id=str(uuid.uuid4()),
            estate_id=estate.id,
            actor_id=payload["advisor_email"],
            actor_ip=actor_ip,
            action="LEGAL_REJECTED",
            payload_json=json.dumps({"reason": reason}),
            created_at=now,
        )
        db.add(log)
        db.commit()
        notify("ADVISOR_REJECTED", {"estate_id": estate.id, "reason": reason})
        return {"status": "rejected"}


def _decode_token(token: str) -> dict:
    try:
        payload = pyjwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "token_expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "invalid_token")
