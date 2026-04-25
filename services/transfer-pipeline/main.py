"""
Transfer Pipeline — executes approved share instructions via TNG or Wise.
Subscribes to SQS (prod) or runs via direct HTTP POST /execute (dev).
"""
import os
import uuid
import json
import hmac
import hashlib
from datetime import datetime, timezone

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL   = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/probate")
TNG_API_BASE   = os.environ.get("TNG_API_BASE", "http://localhost:9001")
TNG_API_KEY    = os.environ.get("TNG_API_KEY", "mock-tng-key")
WISE_API_BASE  = os.environ.get("WISE_API_BASE", "https://api.sandbox.transferwise.tech")
WISE_API_KEY   = os.environ.get("WISE_API_KEY", "")
WISE_PROFILE   = os.environ.get("WISE_PROFILE_ID", "")
WISE_WH_SECRET = os.environ.get("WISE_WEBHOOK_SECRET", "")
USE_MOCK       = os.environ.get("USE_MOCK_TRANSFERS", "true").lower() == "true"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI(title="iwantmoney Transfer Pipeline", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ExecuteRequest(BaseModel):
    estate_id: str


@app.post("/execute")
def execute_estate_transfers(body: ExecuteRequest):
    db = SessionLocal()
    try:
        rows = db.execute(
            text("""
                SELECT si.id, si.beneficiary_id, si.share_rm, si.fx_currency,
                       si.transfer_method, b.wallet_id, b.bank_account_enc
                FROM share_instructions si
                JOIN beneficiaries b ON b.id = si.beneficiary_id
                WHERE si.estate_id = :eid AND si.status = 'PENDING'
                ORDER BY si.created_at
            """),
            {"eid": body.estate_id},
        ).fetchall()

        if not rows:
            return {"message": "No pending instructions found"}

        results = []
        for row in rows:
            instr_id, bene_id, share_rm, fx_currency, method, wallet_id, bank_enc = row

            if USE_MOCK:
                result = _mock_transfer(str(instr_id), float(share_rm), method)
            elif method == "TNG":
                result = _tng_transfer(str(instr_id), float(share_rm), wallet_id or "")
            else:
                result = _wise_transfer(str(instr_id), float(share_rm), fx_currency or "SGD", bank_enc or "")

            _record_transfer(db, str(instr_id), method, result)
            results.append({"instruction_id": str(instr_id), **result})

        _check_estate_closed(db, body.estate_id)
        db.commit()
        return {"estate_id": body.estate_id, "results": results}
    finally:
        db.close()


@app.post("/wise/webhook")
async def wise_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("X-Signature-SHA256", "")
    if WISE_WH_SECRET:
        expected = hmac.new(WISE_WH_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            _log_audit(None, None, "WISE_WEBHOOK_INVALID_SIGNATURE", {"sig": sig[:16]})
            raise HTTPException(401, "Invalid signature")

    event = json.loads(body)
    if event.get("event_type") == "transfer.state_changed":
        data = event.get("data", {})
        if data.get("current_state") == "outgoing_payment_sent":
            wise_id = str(data.get("id", ""))
            db = SessionLocal()
            try:
                db.execute(
                    text("""UPDATE transfers SET status='SETTLED', settled_at=now()
                             WHERE external_ref = :ref"""),
                    {"ref": wise_id},
                )
                db.execute(
                    text("""UPDATE share_instructions SET status='COMPLETED', updated_at=now()
                             WHERE id = (SELECT share_instruction_id FROM transfers WHERE external_ref=:ref LIMIT 1)"""),
                    {"ref": wise_id},
                )
                db.commit()
            finally:
                db.close()

    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok", "mode": "mock" if USE_MOCK else "live"}


def _mock_transfer(instr_id: str, amount_rm: float, method: str) -> dict:
    ext_ref = f"mock-{method.lower()}-{uuid.uuid4().hex[:8]}"
    print(f"[MOCK TRANSFER] {method} RM {amount_rm:.2f} → ref={ext_ref}")
    return {"status": "COMPLETED", "external_ref": ext_ref, "method": method}


def _tng_transfer(instr_id: str, amount_rm: float, wallet_id: str) -> dict:
    resp = requests.post(
        f"{TNG_API_BASE}/operator/wallet/transfer",
        json={"target_account": wallet_id, "amount_rm": amount_rm,
              "idempotency_key": instr_id},
        headers={"X-Api-Key": TNG_API_KEY},
        timeout=15,
    )
    if resp.status_code != 200:
        return {"status": "FAILED", "error": resp.text, "method": "TNG"}
    return {"status": "COMPLETED", "external_ref": resp.json().get("txn_id", ""), "method": "TNG"}


def _wise_transfer(instr_id: str, amount_rm: float, fx_currency: str, bank_enc: str) -> dict:
    headers = {"Authorization": f"Bearer {WISE_API_KEY}", "Content-Type": "application/json"}

    # Step 1: Quote
    q = requests.post(f"{WISE_API_BASE}/v1/quotes",
                      json={"sourceCurrency": "MYR", "targetCurrency": fx_currency, "sourceAmount": amount_rm},
                      headers=headers, timeout=15)
    if q.status_code != 200:
        return {"status": "FAILED", "error": f"Quote failed: {q.text}", "method": "WISE"}
    quote_id = q.json()["id"]

    # Step 2: Transfer
    t = requests.post(f"{WISE_API_BASE}/v1/transfers",
                      json={"quoteUuid": quote_id, "customerTransactionId": instr_id,
                            "details": {"reference": f"Estate settlement {instr_id[:8]}"}},
                      headers=headers, timeout=15)
    if t.status_code not in (200, 201):
        return {"status": "FAILED", "error": f"Transfer failed: {t.text}", "method": "WISE"}
    transfer_id = t.json()["id"]

    # Step 3: Fund
    f = requests.post(f"{WISE_API_BASE}/v1/transfers/{transfer_id}/payments",
                      json={"type": "BALANCE"}, headers=headers, timeout=15)
    if f.status_code not in (200, 201):
        return {"status": "FAILED", "error": f"Funding failed: {f.text}", "method": "WISE"}

    return {"status": "EXECUTING", "external_ref": str(transfer_id), "method": "WISE"}


def _record_transfer(db, instr_id: str, method: str, result: dict):
    db.execute(
        text("""INSERT INTO transfers (id, share_instruction_id, leg, method, external_ref, status, executed_at)
                VALUES (:id, :instr_id, 1, :method, :ref, :status, now())
                ON CONFLICT DO NOTHING"""),
        {
            "id": str(uuid.uuid4()),
            "instr_id": instr_id,
            "method": method,
            "ref": result.get("external_ref"),
            "status": result["status"],
        },
    )
    if result["status"] in ("COMPLETED", "SETTLED"):
        db.execute(
            text("UPDATE share_instructions SET status='COMPLETED', updated_at=now() WHERE id=:id"),
            {"id": instr_id},
        )
    elif result["status"] == "FAILED":
        db.execute(
            text("UPDATE share_instructions SET status='FAILED', updated_at=now() WHERE id=:id"),
            {"id": instr_id},
        )


def _check_estate_closed(db, estate_id: str):
    pending = db.execute(
        text("SELECT COUNT(*) FROM share_instructions WHERE estate_id=:eid AND status NOT IN ('COMPLETED','SETTLED')"),
        {"eid": estate_id},
    ).scalar()
    if pending == 0:
        db.execute(
            text("UPDATE estates SET status='CLOSED', updated_at=now() WHERE id=:eid"),
            {"eid": estate_id},
        )
        print(f"[ESTATE CLOSED] {estate_id}")
    else:
        failed = db.execute(
            text("SELECT COUNT(*) FROM share_instructions WHERE estate_id=:eid AND status='FAILED'"),
            {"eid": estate_id},
        ).scalar()
        if failed:
            print(f"[ALERT] Estate {estate_id} has {failed} failed instructions")


def _log_audit(estate_id, actor_ip, action, payload):
    db = SessionLocal()
    try:
        db.execute(
            text("""INSERT INTO audit_log (id, estate_id, actor_ip, action, payload_json, created_at)
                    VALUES (:id, :eid, :ip, :action, :payload, now())"""),
            {"id": str(uuid.uuid4()), "eid": estate_id, "ip": actor_ip,
             "action": action, "payload": json.dumps(payload)},
        )
        db.commit()
    finally:
        db.close()
