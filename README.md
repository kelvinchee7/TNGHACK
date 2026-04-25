# iwantmoney — Probate Platform

AI-powered deceased TNG eWallet estate settlement system.

---

## Quick Start (Local Dev)

### 1. Prerequisites
- Python 3.13 — `C:\Users\Joseph\AppData\Local\Programs\Python\Python313\python.exe`
- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Git

### 2. Start PostgreSQL
```bash
cd D:\laragon\www\probate-platform
docker-compose up -d postgres
```

Create the database (first time only):
```bash
docker exec -it probate-platform-postgres-1 psql -U postgres -c "CREATE DATABASE probate;"
```

### 3. Run Services (open 4 terminals)

**Terminal 1 — API Gateway (port 8000)**
```bash
cd D:\laragon\www\probate-platform\services\api-gateway
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Will Scanner (port 8001)**
```bash
cd D:\laragon\www\probate-platform\services\will-scanner
python -m uvicorn main:app --reload --port 8001
```

**Terminal 3 — Transfer Pipeline (port 8002)**
```bash
cd D:\laragon\www\probate-platform\services\transfer-pipeline
python -m uvicorn main:app --reload --port 8002
```

**Terminal 4 — Frontend (port 5173)**
```bash
cd D:\laragon\www\probate-platform\frontend
npm install   # first time only
npm run dev
```

Open: http://localhost:5173  
API Docs: http://localhost:8000/docs

---

## Full Workflow Walkthrough

### Step 1 — Create Estate
1. Go to **Estates → New Estate**
2. Fill in: Deceased Name, TNG Account ID, IC Number, Date of Death
3. Click **Create Estate** → system freezes account + captures asset inventory

### Step 2 — Scan Will Document
1. Open the estate → **Will Scan** tab
2. Drag-drop a PDF/JPG will document
3. Click **Scan Will Document** → ML extracts beneficiary clauses
4. Check extracted JSON — if `needs_human_review: true`, proceed manually

### Step 3 — Upload Legal Documents
1. Go to **Documents** tab
2. Upload: Death Certificate, Court Order, ID copies
3. Set document type (WILL / DEATH_CERTIFICATE / COURT_ORDER / ID_COPY)
4. Legal advisor clicks **Review** → Approve or Reject each document

### Step 4 — Add Beneficiary Claims
1. Go to **Beneficiaries** tab → **Add Claim**
2. Fill in: Name, IC, Email, TNG Wallet ID, Transfer Method
3. Each beneficiary submits KYC (ID upload + biometric) via `/api/claims/{id}/kyc`
4. Staff clicks **Approve** once KYC steps complete

### Step 5 — Calculate Share Distribution
1. Go to **Overview** tab
2. Click **Calculate Share Distribution**
   - Estate must be in `VERIFIED` status
   - At least one `APPROVED` beneficiary required
3. Go to **Distribution** tab to verify allocations

### Step 6 — Dispatch Legal Advisor
1. Go to **Legal** tab
2. Enter advisor email → **Send Approval Email**
3. Advisor receives email with a 72-hour JWT link (dev: URL printed in API terminal)
4. Advisor visits link → reviews distribution → clicks Approve or Reject
5. On Approve: estate moves to `DISTRIBUTING`, SHA-256 signature stored in DB

### Step 7 — Execute Transfers
1. Go to **Overview** tab
2. Click **Execute Transfers** (estate must be `DISTRIBUTING`)
3. Check **Transfers** tab for real-time leg status

### Step 8 — Close Estate
- Estate auto-closes to `CLOSED` when all transfers reach `SETTLED`

---

## AWS Setup (Production)

### Login
- URL: https://d-9667a99701.awsapps.com/start/
- Username / Password: stored in your password manager — never commit to git

### Services to Configure

#### A. Amazon RDS (PostgreSQL)
```
Region: ap-southeast-1
Engine: PostgreSQL 16
Instance: db.t3.micro (dev) / db.t3.medium (prod)
DB name: probate
Username: probate_admin
```
1. Console → RDS → Create Database → PostgreSQL
2. Enable **Multi-AZ** for prod
3. Set VPC Security Group to allow port 5432 from your EC2/ECS only
4. Copy the endpoint URL → set in `.env.local`:
```
DATABASE_URL=postgresql://probate_admin:<password>@<rds-endpoint>:5432/probate
```

#### B. Amazon S3 (Document Storage — fallback if OSS not used)
```
Bucket name: iwantmoney-docs-prod-<account-id>
Region: ap-southeast-1
Block all public access: ON
Versioning: ON
```
1. Console → S3 → Create Bucket
2. Add bucket policy allowing your IAM role read/write

#### C. Amazon SES (Email)
1. Console → SES → Verified Identities → Add domain or email
2. Verify `noreply@iwantmoney.com.my` (or your sending domain)
3. Request production access (exit sandbox) via Support case
4. Set in `.env.local`:
```
USE_REAL_SES=true
SES_SENDER=noreply@iwantmoney.com.my
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_root_access_key
AWS_SECRET_ACCESS_KEY=your_root_secret_key
```

#### D. Amazon Textract (Will OCR)

Textract requires S3 staging for document processing.

1. Ensure S3 bucket exists (see Step B above)
2. Set in `.env.local`:

   ```
   USE_REAL_TEXTRACT=true
   S3_BUCKET=iwantmoney-docs-prod-<account-id>
   AWS_REGION=ap-southeast-1
   ```

3. Ensure your IAM role has `textract:DetectDocumentText` permission.

**Note**: Textract automatically stages files to S3 and cleans up after processing.

#### E. AWS Credentials

Since you're using root account access keys, simply add them to `.env.local`:

```
AWS_ACCESS_KEY_ID=your_root_access_key
AWS_SECRET_ACCESS_KEY=your_root_secret_key
AWS_REGION=ap-southeast-1
```

⚠️ **Security Note**: Root account access has full permissions. Consider creating a dedicated IAM user with least-privilege access for production use.

---

## Alibaba Cloud Setup (Production)

### Login
- URL: https://signin-ap-southeast-1.alibabacloudsso.com/finhack/login
- Username / Password: stored in your password manager — never commit to git

### OSS (Object Storage — Primary Document Store)

1. Console → OSS → Create Bucket
   ```
   Bucket name: iwantmoney-docs-prod
   Region: ap-southeast-1 (Singapore)
   Storage class: Standard
   Access control: Private
   ```
2. Console → AccessKey Management → Create AccessKey
3. Set in `.env.local`:
```
USE_REAL_OSS=true
OSS_ACCESS_KEY_ID=<your-key>
OSS_ACCESS_KEY_SECRET=<your-secret>
OSS_BUCKET=iwantmoney-docs-prod
OSS_ENDPOINT=https://oss-ap-southeast-3.aliyuncs.com
```
4. Enable **Versioning** and **Server-Side Encryption** (AES-256) on the bucket
5. Set Lifecycle Rule: auto-delete temp files older than 90 days from `kyc/` prefix

### CORS (for signed URL downloads from browser)
In OSS bucket → CORS Rules → Add:
```
Allowed Origins: http://localhost:5173, https://your-prod-domain.com
Allowed Methods: GET, HEAD
Allowed Headers: *
```

---

## Environment Variables Reference

Copy `.env.local` and fill in production values:

```env
# Database
DATABASE_URL=postgresql://probate_admin:<pw>@<rds-endpoint>:5432/probate

# Auth
JWT_SECRET=<generate: openssl rand -hex 32>

# Feature flags — set true when credentials ready
USE_REAL_OSS=false
USE_REAL_TEXTRACT=false
USE_REAL_SNS=false
USE_REAL_SES=false
USE_MOCK_TRANSFERS=true

# AWS
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SNS_SECURITY_ALERTS_ARN=arn:aws:sns:ap-southeast-1:<account>:iwantmoney-security-alerts
SNS_ESTATE_EVENTS_ARN=arn:aws:sns:ap-southeast-1:<account>:iwantmoney-estate-events
SES_SENDER=noreply@iwantmoney.com.my

# Alibaba OSS
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=iwantmoney-docs-prod
OSS_ENDPOINT=https://oss-ap-southeast-3.aliyuncs.com

# TNG (mock locally, real in prod)
TNG_API_BASE=http://localhost:9001
TNG_API_KEY=

# Wise (FX transfers)
WISE_API_BASE=https://api.transferwise.com
WISE_API_KEY=
WISE_PROFILE_ID=
WISE_WEBHOOK_SECRET=
```

---

## Switching from Dev to Production

| Step | What to change |
|------|---------------|
| 1 | Point `DATABASE_URL` to RDS endpoint |
| 2 | Set `USE_REAL_OSS=true` + OSS credentials |
| 3 | Set `USE_REAL_SES=true` + verify SES domain |
| 4 | Set `USE_REAL_SNS=true` + paste SNS ARN |
| 5 | Set `USE_REAL_TEXTRACT=true` |
| 6 | Set `USE_MOCK_TRANSFERS=false` + real TNG/Wise keys |
| 7 | Generate strong `JWT_SECRET` (`openssl rand -hex 32`) |

---

## API Endpoints Reference

```
POST   /api/estates                              Create estate
GET    /api/estates                              List all estates
GET    /api/estates/{id}                         Get estate detail
POST   /api/estates/{id}/calculate              Calculate share distribution
POST   /api/estates/{id}/dispatch-advisor       Send advisor approval email
GET    /api/estates/{id}/beneficiaries          List beneficiary claims
GET    /api/estates/{id}/share-instructions     List computed shares
GET    /api/estates/{id}/transfers              List transfer legs
GET    /api/estates/{id}/legal-approvals        List approval queue
POST   /api/estates/{id}/documents              Upload legal document
GET    /api/estates/{id}/documents              List documents
POST   /api/estates/{id}/documents/{doc_id}/review  Approve/reject document

POST   /api/claims                              Submit beneficiary claim
POST   /api/claims/{id}/kyc                     Upload KYC document
POST   /api/claims/{id}/approve                 Approve KYC
POST   /api/claims/{id}/reject                  Reject KYC

GET    /api/legal/review/{token}                Advisor review page
POST   /api/legal/review/{token}/decision       Submit approve/reject

POST   http://localhost:8001/scan               Scan will document (ML)
POST   http://localhost:8002/execute            Execute transfers
```

Full interactive docs: http://localhost:8000/docs

---

## Security Notes

- **Never commit** `.env.local` or any file containing real credentials
- Rotate `JWT_SECRET` immediately if exposed
- RDS should never be publicly accessible — use VPC + Security Groups
- OSS bucket must be **Private** — access only via signed URLs
- SNS alert subscriber `kelvinchee37@gmail.com` must confirm the subscription email before alerts fire
