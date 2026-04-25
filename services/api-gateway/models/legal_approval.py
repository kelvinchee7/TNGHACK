import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class ApprovalStatus(str, enum.Enum):
    SENT     = "SENT"
    REVIEWED = "REVIEWED"
    SIGNED   = "SIGNED"
    REJECTED = "REJECTED"


class LegalApproval(Base):
    __tablename__ = "legal_approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estate_id: Mapped[str] = mapped_column(String(36), ForeignKey("estates.id"), nullable=False)
    advisor_email: Mapped[str] = mapped_column(String(254), nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus), default=ApprovalStatus.SENT, nullable=False
    )
    signature_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    estate: Mapped["Estate"] = relationship(back_populates="legal_approvals")
