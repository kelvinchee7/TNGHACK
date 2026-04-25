import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Enum as PgEnum
from models.base import Base


class DocumentType(str, enum.Enum):
    WILL = "WILL"
    DEATH_CERTIFICATE = "DEATH_CERTIFICATE"
    COURT_ORDER = "COURT_ORDER"
    ID_COPY = "ID_COPY"
    OTHER = "OTHER"


class DocumentStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class EstateDocument(Base):
    __tablename__ = "estate_documents"

    id = Column(String, primary_key=True)
    estate_id = Column(String, nullable=False, index=True)
    document_type = Column(PgEnum(DocumentType, name="documenttype"), nullable=False)
    filename = Column(String, nullable=False)
    storage_key = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    uploaded_by = Column(String, nullable=True)
    status = Column(PgEnum(DocumentStatus, name="documentstatus"), nullable=False,
                    default=DocumentStatus.PENDING_REVIEW)
    reviewer_notes = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False,
                        default=lambda: datetime.now(timezone.utc))
