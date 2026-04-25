import json
import uuid
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class AuditMiddleware(BaseHTTPMiddleware):
    """Writes an audit_log row for every mutating request (non-GET, non-health)."""

    SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        if request.method in ("GET", "OPTIONS", "HEAD"):
            return response
        if request.url.path in self.SKIP_PATHS:
            return response

        try:
            from ..database import SessionLocal
            from ..models.audit_log import AuditLog

            actor_id = getattr(request.state, "actor_id", None)
            estate_id = getattr(request.state, "estate_id", None)
            client_ip = request.client.host if request.client else None

            log = AuditLog(
                id=str(uuid.uuid4()),
                estate_id=estate_id,
                actor_id=actor_id,
                actor_ip=client_ip,
                action=f"{request.method} {request.url.path}",
                payload_json=json.dumps({"status_code": response.status_code}),
                created_at=datetime.now(timezone.utc),
            )
            db = SessionLocal()
            try:
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass  # Audit failures must not break requests

        return response
