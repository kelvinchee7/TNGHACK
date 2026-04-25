from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables, health_check
from middleware.audit import AuditMiddleware
from routes import estates, beneficiaries, legal, documents, demo

app = FastAPI(
    title="iwantmoney Probate API",
    version="1.0.0",
    description="Automated probate platform for TNG eWallet deceased account settlement",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditMiddleware)

app.include_router(estates.router, prefix="/api")
app.include_router(beneficiaries.router, prefix="/api")
app.include_router(legal.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(demo.router, prefix="/api")


@app.on_event("startup")
def startup():
    create_tables()
    print("[iwantmoney] Tables ensured. API ready.")


@app.get("/health")
def health():
    db_status = health_check()
    return {"status": "ok", "db": db_status}
