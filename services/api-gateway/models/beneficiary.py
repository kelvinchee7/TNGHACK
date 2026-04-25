import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base


class KycStatus(str, enum.Enum):
    PENDING             = "PENDING"
    ID_VERIFIED         = "ID_VERIFIED"
    BIOMETRIC_CONFIRMED = "BIOMETRIC_CONFIRMED"
    APPROVED            = "APPROVED"
    REJECTED            = "REJECTED"


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estate_id: Mapped[str] = mapped_column(String(36), ForeignKey("estates.id"), nullable=False)
    name_enc:  Mapped[str] = mapped_column(Text, nullable=False)
    nic_enc:   Mapped[str] = mapped_column(Text, nullable=False)
    email_enc: Mapped[str] = mapped_column(Text, nullable=False)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    kyc_status: Mapped[KycStatus] = mapped_column(
        Enum(KycStatus), default=KycStatus.PENDING, nullable=False
    )
    share_pct: Mapped[float | None] = mapped_column(Numeric(6, 4), nullable=True)
    share_rm:  Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    wallet_id: Mapped[str | None]   = mapped_column(String(100), nullable=True)
    bank_account_enc: Mapped[str | None] = mapped_column(Text, nullable=True)
    transfer_method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    fx_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    estate: Mapped["Estate"] = relationship(back_populates="beneficiaries")
    share_instructions: Mapped[list["ShareInstruction"]] = relationship(back_populates="beneficiary")
