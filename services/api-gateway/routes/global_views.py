"""
Global cross-estate views used by sidebar pages.
"""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import (
    Beneficiary, KycStatus,
    LegalApproval,
    ShareInstruction, Transfer,
    AuditLog, Estate,
)

router = APIRouter(tags=["global"])


@router.get("/beneficiaries")
def all_beneficiaries(db: Session = Depends(get_db)):
    rows = (db.query(Beneficiary)
            .order_by(Beneficiary.created_at.desc())
            .limit(200).all())
    # Group by estate
    grouped: dict = {}
    for b in rows:
        estate = db.get(Estate, b.estate_id)
        eid = b.estate_id
        if eid not in grouped:
            grouped[eid] = {
                "estate_id": eid,
                "deceased_name": estate.deceased_name_enc if estate else "Unknown",
                "estate_status": estate.status if estate else "—",
                "beneficiaries": [],
            }
        grouped[eid]["beneficiaries"].append({
            "id": b.id,
            "name": b.name_enc,
            "nic": b.nic_enc[:4] + "****" + b.nic_enc[-2:] if len(b.nic_enc) > 6 else "****",
            "email": b.email_enc,
            "kyc_status": b.kyc_status,
            "transfer_method": b.transfer_method,
            "fx_currency": b.fx_currency,
            "share_rm": float(b.share_rm) if b.share_rm else None,
            "rejection_reason": b.rejection_reason,
            "created_at": b.created_at.isoformat(),
        })
    return list(grouped.values())


@router.get("/legal-queue")
def legal_queue(db: Session = Depends(get_db)):
    rows = (db.query(LegalApproval)
            .order_by(LegalApproval.created_at.desc())
            .limit(200).all())
    grouped: dict = {}
    for a in rows:
        estate = db.get(Estate, a.estate_id)
        eid = a.estate_id
        if eid not in grouped:
            grouped[eid] = {
                "estate_id": eid,
                "deceased_name": estate.deceased_name_enc if estate else "Unknown",
                "estate_status": estate.status if estate else "—",
                "total_rm": float(estate.total_rm or 0) if estate else 0,
                "approvals": [],
            }
        grouped[eid]["approvals"].append({
            "id": a.id,
            "advisor_email": a.advisor_email,
            "status": a.status,
            "signature_hash": a.signature_hash,
            "rejection_reason": a.rejection_reason,
            "signed_at": a.signed_at.isoformat() if a.signed_at else None,
            "created_at": a.created_at.isoformat(),
        })
    return list(grouped.values())


@router.get("/transfers")
def all_transfers(db: Session = Depends(get_db)):
    instructions = (db.query(ShareInstruction)
                    .order_by(ShareInstruction.created_at.desc())
                    .limit(500).all())
    result = []
    for si in instructions:
        estate = db.get(Estate, si.estate_id)
        for t in si.transfers:
            result.append({
                "id": t.id,
                "estate_id": si.estate_id,
                "deceased_name": estate.deceased_name_enc if estate else "Unknown",
                "beneficiary_name": si.beneficiary.name_enc if si.beneficiary else "—",
                "share_rm": float(si.share_rm),
                "fx_currency": si.fx_currency,
                "leg": t.leg,
                "method": t.method,
                "external_ref": t.external_ref,
                "status": t.status,
                "error_message": t.error_message,
                "executed_at": t.executed_at.isoformat() if t.executed_at else None,
                "settled_at": t.settled_at.isoformat() if t.settled_at else None,
            })
    result.sort(key=lambda x: x["executed_at"] or "0", reverse=True)
    return result


@router.get("/audit")
def system_audit(limit: int = 200, db: Session = Depends(get_db)):
    rows = (db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit).all())
    return [
        {
            "id": r.id,
            "estate_id": r.estate_id,
            "action": r.action,
            "actor_id": r.actor_id,
            "actor_ip": r.actor_ip,
            "payload": json.loads(r.payload_json) if r.payload_json else None,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
