import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class TransferMethod(str, enum.Enum):
    TNG  = "TNG"
    WISE = "WISE"


class InstructionStatus(str, enum.Enum):
    PENDING   = "PENDING"
    APPROVED  = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED    = "FAILED"


class ShareInstruction(Base):
    __tablename__ = "share_instructions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estate_id: Mapped[str] = mapped_column(String(36), ForeignKey("estates.id"), nullable=False)
    beneficiary_id: Mapped[str] = mapped_column(String(36), ForeignKey("beneficiaries.id"), nullable=False)
    share_rm: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    fx_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    fx_amount: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    transfer_method: Mapped[TransferMethod] = mapped_column(Enum(TransferMethod), nullable=False)
    status: Mapped[InstructionStatus] = mapped_column(
        Enum(InstructionStatus), default=InstructionStatus.PENDING, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    estate: Mapped["Estate"] = relationship(back_populates="share_instructions")
    beneficiary: Mapped["Beneficiary"] = relationship(back_populates="share_instructions")
    transfers: Mapped[list["Transfer"]] = relationship(back_populates="instruction", cascade="all, delete-orphan")
