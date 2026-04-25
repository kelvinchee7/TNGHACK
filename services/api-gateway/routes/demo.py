"""
Demo seed endpoint — creates a fully populated estate for showcase purposes.
Only available when USE_MOCK_TRANSFERS=true (dev/demo mode).
"""
import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import (
    Estate, EstateStatus, AssetSnapshot, AssetType,
    Beneficiary, KycStatus,
    ShareInstruction, TransferMethod, InstructionStatus,
    LegalApproval, ApprovalStatus,
    Transfer, TransferStatus,
    AuditLog,
)
from models.estate_document import EstateDocument, DocumentType, DocumentStatus

router = APIRouter(prefix="/demo", tags=["demo"])


def _now(offset_minutes: int = 0) -> datetime:
    return datetime.now(timezone.utc) - timedelta(minutes=offset_minutes)


def _log(db: Session, estate_id: str, action: str, minutes_ago: int, payload=None):
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        actor_id="demo-system",
        actor_ip="127.0.0.1",
        action=action,
        payload_json=json.dumps(payload) if payload else None,
        created_at=_now(minutes_ago),
    ))


@router.post("/seed", status_code=201)
def seed_demo(db: Session = Depends(get_db)):

    estate_id = str(uuid.uuid4())

    # ── Estate ────────────────────────────────────────────────────────────────
    will_extraction = {
        "beneficiaries": [
            {"name": "Siti Binti Ahmad",  "nic": "950101-10-1234", "type": "percentage", "fraction": 0.60, "confidence": 0.91},
            {"name": "Amir Bin Hassan",   "nic": "980215-14-5678", "type": "percentage", "fraction": 0.30, "confidence": 0.87},
            {"name": "Nur Ain Binti Zaki","nic": "001203-08-9012", "type": "residual",                    "confidence": 0.78},
        ],
        "total_pct": 0.90,
        "needs_human_review": False,
        "overallocation_warning": False,
        "oss_key": "wills/demo/sample_will.pdf",
        "ner_pipeline": {
            "ocr_engine": "AWS Textract",
            "ner_model": "spaCy ms_MY_legal_v2",
            "tokens_processed": 847,
            "entities_found": 9,
            "processing_ms": 1240,
        },
    }

    estate = Estate(
        id=estate_id,
        deceased_account_id="acc_deceased_demo_001",
        deceased_name_enc="Haji Yusof Bin Ibrahim",
        deceased_nic_enc="620314-08-5321",
        death_date="2024-11-03",
        status=EstateStatus.DISTRIBUTING,
        total_rm=48750.00,
        account_frozen_at=_now(180),
        will_extraction_json=json.dumps(will_extraction),
        created_at=_now(180),
        updated_at=_now(5),
    )
    db.add(estate)

    # ── Asset snapshots ───────────────────────────────────────────────────────
    assets = [
        (AssetType.EWALLET, 12400.00, "MYR"),
        (AssetType.GOPLUSINVEST, 31200.00, "MYR"),
    ]
    for atype, bal, cur in assets:
        db.add(AssetSnapshot(
            id=str(uuid.uuid4()), estate_id=estate_id,
            asset_type=atype, balance_rm=bal, currency=cur,
        ))

    # ── Documents ─────────────────────────────────────────────────────────────
    docs = [
        ("Death Certificate — Haji Yusof.pdf", DocumentType.DEATH_CERTIFICATE, DocumentStatus.APPROVED, "Dr. Lim KP"),
        ("Last Will & Testament.pdf",           DocumentType.WILL,              DocumentStatus.APPROVED, "Adv. Rashid"),
        ("Court Grant of Probate.pdf",          DocumentType.COURT_ORDER,       DocumentStatus.APPROVED, "Adv. Rashid"),
        ("Deceased IC Copy.jpg",                DocumentType.ID_COPY,           DocumentStatus.APPROVED, "Sarah (Ops)"),
    ]
    for fname, dtype, dstatus, reviewer in docs:
        db.add(EstateDocument(
            id=str(uuid.uuid4()), estate_id=estate_id,
            document_type=dtype, filename=fname,
            storage_key=f"legal/{estate_id}/{dtype.value}/{fname}",
            file_size_bytes=102400,
            uploaded_by="Legal Dept",
            status=dstatus,
            reviewed_by=reviewer,
            reviewer_notes="Verified and accepted.",
            reviewed_at=_now(120),
            created_at=_now(150),
        ))

    # ── Beneficiaries ─────────────────────────────────────────────────────────
    ben_data = [
        ("Siti Binti Ahmad",   "950101-10-1234", "siti@email.com",  "+60123456789", "acc_siti_001",  "TNG",  None,  29250.00, 0.60),
        ("Amir Bin Hassan",    "980215-14-5678", "amir@email.com",  "+60187654321", "acc_amir_001",  "TNG",  None,  14625.00, 0.30),
        ("Nur Ain Binti Zaki", "001203-08-9012", "nurain@email.com","+60111234567", "acc_nurain_001","WISE", "SGD",  4875.00, 0.10),
    ]
    ben_ids = []
    for name, nic, email, phone, wallet, method, fx, share, pct in ben_data:
        bid = str(uuid.uuid4())
        ben_ids.append((bid, name, share, method, fx))
        db.add(Beneficiary(
            id=bid, estate_id=estate_id,
            name_enc=name, nic_enc=nic, email_enc=email,
            contact_number=phone, wallet_id=wallet,
            transfer_method=method, fx_currency=fx,
            kyc_status=KycStatus.APPROVED,
            share_pct=pct, share_rm=share,
            created_at=_now(140),
        ))

    # ── Share instructions + transfers ────────────────────────────────────────
    for bid, bname, share_rm, method, fx in ben_ids:
        si_id = str(uuid.uuid4())
        fx_amount = round(share_rm * 3.28, 2) if fx == "SGD" else None
        db.add(ShareInstruction(
            id=si_id, estate_id=estate_id, beneficiary_id=bid,
            share_rm=share_rm, fx_currency=fx, fx_amount=fx_amount,
            transfer_method=TransferMethod(method),
            status=InstructionStatus.COMPLETED,
            created_at=_now(60),
        ))
        ext_ref = f"TNG-{uuid.uuid4().hex[:8].upper()}" if method == "TNG" else f"WISE-{uuid.uuid4().hex[:10].upper()}"
        db.add(Transfer(
            id=str(uuid.uuid4()), share_instruction_id=si_id,
            leg=1, method=method, external_ref=ext_ref,
            status=TransferStatus.SETTLED,
            executed_at=_now(30), settled_at=_now(15),
        ))

    # ── Legal approval ────────────────────────────────────────────────────────
    advisor_email = "advisor@lawfirm.com.my"
    signed_at = _now(45)
    sig_input = f"{estate_id}{advisor_email}{signed_at.isoformat()}{settings.jwt_secret}"
    sig_hash = hashlib.sha256(sig_input.encode()).hexdigest()
    db.add(LegalApproval(
        id=str(uuid.uuid4()), estate_id=estate_id,
        advisor_email=advisor_email,
        status=ApprovalStatus.SIGNED,
        signature_hash=sig_hash,
        signed_at=signed_at,
        created_at=_now(90),
    ))

    # ── Audit log timeline ────────────────────────────────────────────────────
    timeline = [
        (180, "ESTATE_CREATED",        {"deceased_account_id": "acc_deceased_demo_001"}),
        (178, "ACCOUNT_FROZEN",        {"account_id": "acc_deceased_demo_001"}),
        (175, "ASSET_DISCOVERY_DONE",  {"assets_found": 3, "total_rm": 48750}),
        (150, "DOCUMENT_UPLOADED",     {"filename": "Death Certificate — Haji Yusof.pdf", "type": "DEATH_CERTIFICATE"}),
        (148, "DOCUMENT_UPLOADED",     {"filename": "Last Will & Testament.pdf", "type": "WILL"}),
        (145, "DOCUMENT_UPLOADED",     {"filename": "Court Grant of Probate.pdf", "type": "COURT_ORDER"}),
        (140, "CLAIM_SUBMITTED",       {"name": "Siti Binti Ahmad"}),
        (138, "CLAIM_SUBMITTED",       {"name": "Amir Bin Hassan"}),
        (135, "CLAIM_SUBMITTED",       {"name": "Nur Ain Binti Zaki"}),
        (130, "WILL_SCANNED",          {"entities": 3, "confidence_avg": 0.853, "model": "spaCy ms_MY_legal_v2"}),
        (125, "KYC_APPROVED",          {"claim": "Siti Binti Ahmad"}),
        (122, "KYC_APPROVED",          {"claim": "Amir Bin Hassan"}),
        (120, "KYC_APPROVED",          {"claim": "Nur Ain Binti Zaki"}),
        (115, "DOCUMENT_APPROVD",      {"filename": "Death Certificate — Haji Yusof.pdf"}),
        (110, "DOCUMENT_APPROVD",      {"filename": "Last Will & Testament.pdf"}),
        (90,  "ADVISOR_DISPATCHED",    {"advisor_email": advisor_email}),
        (65,  "SHARES_CALCULATED",     {"instruction_count": 3, "total_rm": 48750}),
        (45,  "LEGAL_APPROVED",        {"advisor": advisor_email, "signature_hash": sig_hash[:16] + "…"}),
        (30,  "TRANSFER_INITIATED",    {"legs": 3, "total_rm": 48750}),
        (15,  "TRANSFER_SETTLED",      {"leg": "TNG — Siti Binti Ahmad", "rm": 29250}),
        (14,  "TRANSFER_SETTLED",      {"leg": "TNG — Amir Bin Hassan", "rm": 14625}),
        (12,  "TRANSFER_SETTLED",      {"leg": "WISE/SGD — Nur Ain Binti Zaki", "rm": 4875}),
        (5,   "ESTATE_CLOSED",         {"final_rm": 48750, "beneficiaries": 3}),
    ]
    for mins_ago, action, payload in timeline:
        _log(db, estate_id, action, mins_ago, payload)

    db.commit()
    return {
        "estate_id": estate_id,
        "message": "Demo estate seeded — all tabs populated",
        "deceased_name": "Haji Yusof Bin Ibrahim",
        "total_rm": 48750,
        "beneficiaries": 3,
        "documents": 4,
        "audit_events": len(timeline),
    }
