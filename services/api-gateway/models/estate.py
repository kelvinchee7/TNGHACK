import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base


class EstateStatus(str, enum.Enum):
    PENDING      = "PENDING"
    SCANNING     = "SCANNING"
    VERIFIED     = "VERIFIED"
    DISTRIBUTING = "DISTRIBUTING"
    CLOSED       = "CLOSED"
    DISPUTED     = "DISPUTED"
    SCAN_FAILED  = "SCAN_FAILED"


class Estate(Base):
    __tablename__ = "estates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    deceased_account_id: Mapped[str] = mapped_column(String(100), nullable=False)
    deceased_name_enc: Mapped[str] = mapped_column(Text, nullable=False)
    deceased_nic_enc:  Mapped[str] = mapped_column(Text, nullable=True)
    death_date: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[EstateStatus] = mapped_column(
        Enum(EstateStatus), default=EstateStatus.PENDING, nullable=False
    )
    total_rm: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    account_frozen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    will_extraction_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    beneficiaries:   Mapped[list["Beneficiary"]]    = relationship(back_populates="estate", cascade="all, delete-orphan")
    asset_snapshots: Mapped[list["AssetSnapshot"]]  = relationship(back_populates="estate", cascade="all, delete-orphan")
    share_instructions: Mapped[list["ShareInstruction"]] = relationship(back_populates="estate", cascade="all, delete-orphan")
    legal_approvals: Mapped[list["LegalApproval"]]  = relationship(back_populates="estate", cascade="all, delete-orphan")
    audit_logs:      Mapped[list["AuditLog"]]       = relationship(back_populates="estate", cascade="all, delete-orphan")
