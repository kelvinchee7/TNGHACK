import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class AssetType(str, enum.Enum):
    EWALLET      = "EWALLET"
    GOPLUSINVEST = "GOPLUSINVEST"
    LINKED_BANK  = "LINKED_BANK"


class AssetSnapshot(Base):
    __tablename__ = "asset_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estate_id: Mapped[str] = mapped_column(String(36), ForeignKey("estates.id"), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False)
    balance_rm: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="MYR", nullable=False)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    estate: Mapped["Estate"] = relationship(back_populates="asset_snapshots")
