from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    estate_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("estates.id"), nullable=True)
    actor_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    actor_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    estate: Mapped["Estate | None"] = relationship(back_populates="audit_logs")
