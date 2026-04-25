import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from .models.base import Base

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/probate")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

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
