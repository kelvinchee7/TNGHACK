"""
AssetDiscoveryService — queries TNG operator API for asset inventory.
In local/dev mode, returns deterministic mock data so no TNG API key is needed.
"""
import os
import requests
from ..config import settings


class AssetDiscoveryService:

    @staticmethod
    def fetch(account_id: str) -> list[dict]:
        if not settings.tng_api_key or settings.tng_api_base.startswith("http://localhost"):
            return _mock_inventory(account_id)

        resp = requests.get(
            f"{settings.tng_api_base}/operator/accounts/{account_id}/assets",
            headers={"X-Api-Key": settings.tng_api_key},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()["assets"]

    @staticmethod
    def freeze_account(account_id: str) -> None:
        if settings.tng_api_base.startswith("http://localhost"):
            print(f"[MOCK] Account {account_id} frozen")
            return

        resp = requests.post(
            f"{settings.tng_api_base}/operator/accounts/{account_id}/freeze",
            headers={"X-Api-Key": settings.tng_api_key},
            timeout=10,
        )
        resp.raise_for_status()


def _mock_inventory(account_id: str) -> list[dict]:
    seed = sum(ord(c) for c in account_id)
    wallet_balance = round(800 + (seed % 5000) * 0.37, 2)
    goplus_units = round(200 + (seed % 1000) * 0.5, 2)
    goplus_nav = 1.05
    bank_balance = round(1500 + (seed % 8000) * 0.22, 2)

    return [
        {"type": "EWALLET",      "balance_rm": wallet_balance, "currency": "MYR"},
        {"type": "GOPLUSINVEST", "balance_rm": round(goplus_units * goplus_nav, 2), "currency": "MYR"},
        {"type": "LINKED_BANK",  "balance_rm": bank_balance,   "currency": "MYR"},
    ]
