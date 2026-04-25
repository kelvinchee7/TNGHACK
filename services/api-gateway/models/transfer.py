import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base


class TransferStatus(str, enum.Enum):
    PENDING   = "PENDING"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    SETTLED   = "SETTLED"
    FAILED    = "FAILED"


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    share_instruction_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("share_instructions.id"), nullable=False
    )
    leg: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    external_ref: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[TransferStatus] = mapped_column(
        Enum(TransferStatus), default=TransferStatus.PENDING, nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    instruction: Mapped["ShareInstruction"] = relationship(back_populates="transfers")
