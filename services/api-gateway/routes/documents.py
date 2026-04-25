import uuid
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Estate, AuditLog
from models.estate_document import EstateDocument, DocumentType, DocumentStatus
from services.storage import upload_legal_doc, get_signed_url

router = APIRouter(prefix="/estates", tags=["documents"])

MAX_BYTES = 20 * 1024 * 1024  # 20 MB


def _doc_to_dict(doc: EstateDocument, include_url: bool = False) -> dict:
    out: dict = {
        "id": doc.id,
        "estate_id": doc.estate_id,
        "document_type": doc.document_type,
        "filename": doc.filename,
        "storage_key": doc.storage_key,
        "file_size_bytes": doc.file_size_bytes,
        "uploaded_by": doc.uploaded_by,
        "status": doc.status,
        "reviewer_notes": doc.reviewer_notes,
        "reviewed_by": doc.reviewed_by,
        "reviewed_at": doc.reviewed_at.isoformat() if doc.reviewed_at else None,
        "created_at": doc.created_at.isoformat(),
    }
    if include_url:
        out["download_url"] = get_signed_url(doc.storage_key)
    return out


def _write_audit(db: Session, estate_id: str, actor_ip: str | None, action: str, payload=None):
    db.add(AuditLog(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        actor_ip=actor_ip,
        action=action,
        payload_json=json.dumps(payload) if payload else None,
        created_at=datetime.now(timezone.utc),
    ))


@router.post("/{estate_id}/documents", status_code=201)
async def upload_document(
    estate_id: str,
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form("OTHER"),
    uploaded_by: str = Form(None),
    db: Session = Depends(get_db),
):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")

    try:
        doc_type = DocumentType(document_type.upper())
    except ValueError:
        valid = [d.value for d in DocumentType]
        raise HTTPException(400, f"Invalid document_type. Must be one of: {valid}")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File exceeds 20 MB limit")
    if not data:
        raise HTTPException(400, "Empty file")

    filename = file.filename or f"document_{uuid.uuid4()}"
    key = upload_legal_doc(estate_id, doc_type.value, filename, data)
    actor_ip = request.client.host if request.client else None

    doc = EstateDocument(
        id=str(uuid.uuid4()),
        estate_id=estate_id,
        document_type=doc_type,
        filename=filename,
        storage_key=key,
        file_size_bytes=len(data),
        uploaded_by=uploaded_by,
        status=DocumentStatus.PENDING_REVIEW,
    )
    db.add(doc)
    _write_audit(db, estate_id, actor_ip, "DOCUMENT_UPLOADED", {
        "doc_id": doc.id, "filename": filename, "type": doc_type.value,
    })
    db.commit()
    db.refresh(doc)
    return _doc_to_dict(doc, include_url=True)


@router.get("/{estate_id}/documents")
def list_documents(estate_id: str, db: Session = Depends(get_db)):
    estate = db.get(Estate, estate_id)
    if not estate:
        raise HTTPException(404, "Estate not found")
    docs = (db.query(EstateDocument)
            .filter(EstateDocument.estate_id == estate_id)
            .order_by(EstateDocument.created_at.desc())
            .all())
    return [_doc_to_dict(d, include_url=True) for d in docs]


@router.get("/{estate_id}/documents/{doc_id}")
def get_document(estate_id: str, doc_id: str, db: Session = Depends(get_db)):
    doc = db.get(EstateDocument, doc_id)
    if not doc or doc.estate_id != estate_id:
        raise HTTPException(404, "Document not found")
    return _doc_to_dict(doc, include_url=True)


class ReviewBody(BaseModel):
    action: str          # "approve" | "reject"
    reviewed_by: str
    reviewer_notes: str | None = None


@router.post("/{estate_id}/documents/{doc_id}/review")
def review_document(
    estate_id: str,
    doc_id: str,
    body: ReviewBody,
    request: Request,
    db: Session = Depends(get_db),
):
    doc = db.get(EstateDocument, doc_id)
    if not doc or doc.estate_id != estate_id:
        raise HTTPException(404, "Document not found")
    if doc.status != DocumentStatus.PENDING_REVIEW:
        raise HTTPException(400, f"Document already reviewed (status: {doc.status})")
    if body.action not in ("approve", "reject"):
        raise HTTPException(400, "action must be 'approve' or 'reject'")

    doc.status = DocumentStatus.APPROVED if body.action == "approve" else DocumentStatus.REJECTED
    doc.reviewed_by = body.reviewed_by
    doc.reviewer_notes = body.reviewer_notes
    doc.reviewed_at = datetime.now(timezone.utc)

    actor_ip = request.client.host if request.client else None
    _write_audit(db, estate_id, actor_ip, f"DOCUMENT_{body.action.upper()}D", {
        "doc_id": doc_id, "reviewed_by": body.reviewed_by,
    })
    db.commit()
    db.refresh(doc)
    return _doc_to_dict(doc)
