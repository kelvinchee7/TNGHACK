import os
import boto3
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from models.base import Base

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/probate")
AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-1")
USE_IAM_AUTH = os.environ.get("USE_IAM_AUTH", "false").lower() == "true"


def get_iam_token(host, port, user, region):
    client = boto3.client("rds", region_name=region)
    return client.generate_db_auth_token(DBHostname=host, Port=port, DBUsername=user, Region=region)


def build_engine():
    if not USE_IAM_AUTH:
        return create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)

    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    host = parsed.hostname
    port = parsed.port or 5432
    user = parsed.username
    dbname = parsed.path.lstrip("/")

    def creator():
        import psycopg2
        token = get_iam_token(host, port, user, AWS_REGION)
        return psycopg2.connect(
            host=host, port=port, user=user, password=token,
            dbname=dbname, sslmode="require"
        )

    return create_engine("postgresql+psycopg2://", creator=creator, pool_pre_ping=True, pool_size=5, max_overflow=10)


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)


def health_check() -> dict:
    try:
        with engine.connect() as conn:
            start = __import__("time").monotonic()
            conn.execute(text("SELECT 1"))
            lag_ms = round((__import__("time").monotonic() - start) * 1000, 1)
        return {"status": "ok", "lag_ms": lag_ms}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
