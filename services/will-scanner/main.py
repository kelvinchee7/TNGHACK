"""
Will Scanner Service — OCR + NLP extraction for Malaysian wills.
Local mode: returns mock WillData without calling Textract or OSS.
Prod mode: set USE_REAL_TEXTRACT=true and USE_REAL_OSS=true.
"""
import os
import re
import uuid
from typing import Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="iwantmoney Will Scanner", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_REAL_TEXTRACT = os.environ.get("USE_REAL_TEXTRACT", "false").lower() == "true"
USE_REAL_OSS      = os.environ.get("USE_REAL_OSS", "false").lower() == "true"
AWS_REGION        = os.environ.get("AWS_REGION", "ap-southeast-1")
S3_BUCKET         = os.environ.get("S3_BUCKET", "iwantmoney-docs-prod-464817648724")
OSS_BUCKET        = os.environ.get("OSS_BUCKET", "iwantmoney-docs-prod")
OSS_ENDPOINT      = os.environ.get("OSS_ENDPOINT", "https://oss-ap-southeast-1.aliyuncs.com")
OSS_AK            = os.environ.get("OSS_ACCESS_KEY_ID", "")
OSS_SK            = os.environ.get("OSS_ACCESS_KEY_SECRET", "")

MAX_FILE_MB = 20


@app.post("/scan")
async def scan_will(estate_id: str = Form(...), file: UploadFile = File(...)):
    data = await file.read()
    size_mb = len(data) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise HTTPException(413, {"error": "file_too_large", "max_mb": MAX_FILE_MB})

    # Store document
    oss_key = f"wills/{estate_id}/{uuid.uuid4()}_{file.filename}"
    if USE_REAL_OSS:
        oss_key = _upload_oss(oss_key, data)
    else:
        _save_local(oss_key, data)

    # OCR
    if USE_REAL_TEXTRACT:
        raw_text = _textract_ocr(oss_key, file.content_type or "")
    else:
        raw_text = _mock_ocr(data)

    # NER extraction
    will_data = extract_clauses(raw_text)
    will_data["oss_key"] = oss_key

    return {"estate_id": estate_id, "will_data": will_data, "needs_human_review": will_data["needs_human_review"]}


def extract_clauses(raw_text: str) -> dict:
    """
    Lightweight regex-based extraction for local dev.
    In production, replace with spaCy NER model inference.
    """
    beneficiaries = []
    needs_review = False

    # Pattern: "X% to <Name> (IC: <IC>)" or "give <RM> to <Name>"
    pct_pattern = re.compile(
        r"(\d+(?:\.\d+)?)\s*%\s+(?:to|of\s+\w+\s+to)\s+([A-Za-z][A-Za-z\s']+?)(?:\s+\(IC[:\s]+([0-9\-]+)\))?(?:[,\.]|$)",
        re.IGNORECASE,
    )
    fixed_pattern = re.compile(
        r"(?:give|bequeath|leave)\s+RM\s*([\d,]+(?:\.\d{2})?)\s+to\s+([A-Za-z][A-Za-z\s']+?)(?:\s+\(IC[:\s]+([0-9\-]+)\))?(?:[,\.]|$)",
        re.IGNORECASE,
    )
    residual_pattern = re.compile(
        r"(?:remainder|residue|rest\s+of\s+\w+\s+estate)\s+to\s+([A-Za-z][A-Za-z\s']+?)(?:\s+\(IC[:\s]+([0-9\-]+)\))?(?:[,\.]|$)",
        re.IGNORECASE,
    )

    total_pct = 0.0
    for m in pct_pattern.finditer(raw_text):
        pct = float(m.group(1)) / 100
        name = m.group(2).strip()
        ic = (m.group(3) or "").strip()
        total_pct += pct
        beneficiaries.append({
            "name": name, "nic": ic, "type": "percentage", "fraction": pct, "confidence": 0.85,
        })

    for m in fixed_pattern.finditer(raw_text):
        amount = float(m.group(1).replace(",", ""))
        name = m.group(2).strip()
        ic = (m.group(3) or "").strip()
        beneficiaries.append({
            "name": name, "nic": ic, "type": "fixed", "fixed_rm": amount, "confidence": 0.80,
        })

    for m in residual_pattern.finditer(raw_text):
        name = m.group(1).strip()
        ic = (m.group(2) or "").strip()
        beneficiaries.append({
            "name": name, "nic": ic, "type": "residual", "confidence": 0.75,
        })

    # Flag for human review if no clauses found or total pct > 1
    if not beneficiaries:
        needs_review = True
    if total_pct > 1.01:
        needs_review = True

    min_confidence = min((b["confidence"] for b in beneficiaries), default=0)
    if min_confidence < 0.70:
        needs_review = True

    return {
        "beneficiaries": beneficiaries,
        "total_pct": round(total_pct, 4),
        "needs_human_review": needs_review,
        "overallocation_warning": total_pct > 1.01,
    }


def _mock_ocr(data: bytes) -> str:
    # Returns a realistic will text for demo/testing
    return (
        "I, Ahmad bin Yusof, hereby declare this to be my last will. "
        "I give 60% to Siti binti Ahmad (IC: 950101-10-1234). "
        "I give 40% to Amir bin Hassan (IC: 980215-14-5678). "
        "The remainder of my estate to Siti binti Ahmad."
    )


def _save_local(key: str, data: bytes) -> str:
    from pathlib import Path
    path = Path(__file__).parent.parent.parent / "local_storage" / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"[LOCAL STORAGE] {path}")
    return key


def _upload_oss(key: str, data: bytes) -> str:
    import oss2
    auth = oss2.Auth(OSS_AK, OSS_SK)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    bucket.put_object(key, data)
    return key


def _download_from_oss(key: str) -> bytes:
    import oss2
    auth = oss2.Auth(OSS_AK, OSS_SK)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)
    return bucket.get_object(key).read()


def _textract_ocr(oss_key: str, content_type: str) -> str:
    import boto3
    import tempfile
    from pathlib import Path
    
    # Initialize clients with SSO profile
    session = boto3.Session(profile_name='finhack_IsbUsersPS-464817648724')
    textract_client = session.client("textract", region_name=AWS_REGION)
    s3_client = session.client("s3", region_name=AWS_REGION)
    
    staging_key = f"textract-staging/{oss_key.split('/')[-1]}"
    
    try:
        # Download file from OSS to temporary location
        if USE_REAL_OSS:
            file_data = _download_from_oss(oss_key)
        else:
            # Read from local storage
            local_path = Path(__file__).parent.parent.parent / "local_storage" / oss_key
            file_data = local_path.read_bytes()
        
        # Stage file to S3 for Textract
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=staging_key,
            Body=file_data,
            ContentType=content_type
        )
        
        # Start Textract asynchronous job
        response = textract_client.start_document_text_detection(
            DocumentLocation={
                'S3Object': {
                    'Bucket': S3_BUCKET,
                    'Name': staging_key
                }
            }
        )
        
        job_id = response['JobId']
        
        # Wait for job completion
        import time
        while True:
            result = textract_client.get_document_text_detection(JobId=job_id)
            status = result['JobStatus']
            
            if status == 'SUCCEEDED':
                break
            elif status == 'FAILED':
                raise Exception(f"Textract job failed: {result.get('StatusMessage', 'Unknown error')}")
            elif status in ['IN_PROGRESS', 'PARTIAL_SUCCESS']:
                time.sleep(2)
            else:
                raise Exception(f"Unexpected Textract job status: {status}")
        
        # Extract text from Textract results
        text_blocks = []
        for block in result['Blocks']:
            if block['BlockType'] == 'LINE':
                text_blocks.append(block['Text'])
        
        # Get additional pages if any
        next_token = result.get('NextToken')
        while next_token:
            result = textract_client.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
            for block in result['Blocks']:
                if block['BlockType'] == 'LINE':
                    text_blocks.append(block['Text'])
            next_token = result.get('NextToken')
        
        return '\n'.join(text_blocks)
        
    except Exception as e:
        print(f"[TEXTRACT ERROR] {str(e)}")
        raise
    finally:
        # Clean up staging file from S3
        try:
            s3_client.delete_object(Bucket=S3_BUCKET, Key=staging_key)
        except Exception as cleanup_error:
            print(f"[CLEANUP ERROR] Failed to delete staging file: {cleanup_error}")


@app.get("/health")
def health():
    return {"status": "ok", "mode": "real" if USE_REAL_TEXTRACT else "mock"}
