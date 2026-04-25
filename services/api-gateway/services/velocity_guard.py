"""
ClaimVelocityGuard — blocks a NIC that submits more than 3 estate claims in 30 days.
Uses a simple RDS query (no Redis needed for this volume).
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from models import Beneficiary


class ClaimVelocityGuard:

    WINDOW_DAYS = 30
    MAX_CLAIMS = 3

    @staticmethod
    def is_blocked(db: Session, nic: str) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(days=ClaimVelocityGuard.WINDOW_DAYS)
        count = db.query(Beneficiary).filter(
            Beneficiary.nic_enc == nic,
            Beneficiary.created_at >= cutoff,
        ).count()
        return count >= ClaimVelocityGuard.MAX_CLAIMS
