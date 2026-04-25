"""
Storage — Alibaba OSS in prod, local filesystem fallback in dev.
"""
import os
import uuid
from pathlib import Path
from config import settings

LOCAL_STORAGE = Path(__file__).parent.parent.parent.parent / "local_storage"


def upload_will_doc(estate_id: str, filename: str, data: bytes) -> str:
    key = f"wills/{estate_id}/{uuid.uuid4()}_{filename}"
    if settings.use_real_oss:
        return _oss_put(key, data)
    return _local_put(key, data)


def upload_legal_doc(estate_id: str, doc_type: str, filename: str, data: bytes) -> str:
    key = f"legal/{estate_id}/{doc_type}/{uuid.uuid4()}_{filename}"
    if settings.use_real_oss:
        return _oss_put(key, data)
    return _local_put(key, data)


def upload_kyc_doc(claim_id: str, step: str, filename: str, data: bytes) -> str:
    key = f"kyc/{claim_id}/{step}_{filename}"
    if settings.use_real_oss:
        return _oss_put(key, data)
    return _local_put(key, data)


def get_signed_url(key: str, expiry_seconds: int = 900) -> str:
    if settings.use_real_oss:
        return _oss_signed_url(key, expiry_seconds)
    local_path = LOCAL_STORAGE / key
    return f"file://{local_path}"


def _local_put(key: str, data: bytes) -> str:
    path = LOCAL_STORAGE / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"[LOCAL STORAGE] Written: {path}")
    return key


def _oss_put(key: str, data: bytes) -> str:
    import oss2
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket)
    bucket.put_object(key, data)
    return key


def _oss_signed_url(key: str, expiry_seconds: int) -> str:
    import oss2
    auth = oss2.Auth(settings.oss_access_key_id, settings.oss_access_key_secret)
    bucket = oss2.Bucket(auth, settings.oss_endpoint, settings.oss_bucket)
    return bucket.sign_url("GET", key, expiry_seconds)
