# Probate Platform Architecture

## Overview
Automated probate platform for TNG eWallet deceased account settlement. Built on AWS with a microservices architecture deployed on ECS Fargate.

---

## System Architecture

```
                        ┌─────────────────────────────────────┐
                        │           GitHub Actions             │
                        │         (CI/CD via OIDC)            │
                        └──────────────┬──────────────────────┘
                                       │ push to ECR + deploy ECS
                                       ▼
┌──────────────┐        ┌─────────────────────────────────────┐
│   React SPA  │        │     Application Load Balancer        │
│  (S3 Static  │───────▶│  probate-platform-alb               │
│   Hosting)   │  HTTP  │  port 80                            │
└──────────────┘        └──────────┬──────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
           ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
           │ api-gateway  │ │will-scan │ │transfer-pipeline │
           │   :8000      │ │  :8001   │ │     :8002        │
           │  (FastAPI)   │ │(FastAPI) │ │   (FastAPI)      │
           └──────┬───────┘ └────┬─────┘ └───────┬──────────┘
                  │              │                │
                  └──────────────┼────────────────┘
                                 │
              ┌──────────────────┼───────────────────┐
              ▼                  ▼                   ▼
     ┌────────────────┐ ┌──────────────┐  ┌──────────────────┐
     │ RDS PostgreSQL │ │ Alibaba OSS  │  │   AWS Services   │
     │   (Database)   │ │  (Document   │  │ - Textract (OCR) │
     │                │ │   Storage)   │  │                  │
     └────────────────┘ └──────────────┘  └──────────────────┘
```

---

## Services

### Frontend
| Component | Technology | Hosting |
|-----------|-----------|---------|
| UI Framework | React + Vite | AWS S3 Static Website |
| HTTP Client | Axios | - |
| Styling | - | - |
| Build | TypeScript + Vite | - |
| URL | http://probate-frontend-prod-464817648724.s3-website-ap-southeast-1.amazonaws.com | - |

### Backend Microservices
| Service | Port | Role | Framework |
|---------|------|------|-----------|
| api-gateway | 8000 | Main API — estates, beneficiaries, documents, KYC, legal | FastAPI (Python) |
| will-scanner | 8001 | Will PDF upload + OCR via AWS Textract | FastAPI (Python) |
| transfer-pipeline | 8002 | Asset transfer execution via TNG/Wise | FastAPI (Python) |

---

## AWS Infrastructure

| Service | Usage |
|---------|-------|
| ECS Fargate | Container orchestration for all 3 backend services |
| ECR | Container image registry (`probate-api-gateway`, `probate-will-scanner`, `probate-transfer-pipeline`) |
| ALB | Load balancer routing HTTP traffic to ECS services |
| RDS PostgreSQL | Primary relational database |
| S3 | Frontend static hosting + document storage backup |
| Textract | OCR processing of will documents |
| SES | Email notifications (`noreply@iwantmoney.com.my`) |
| Secrets Manager | Secure storage of credentials (JWT, OSS, TNG, Wise keys) |
| IAM (OIDC) | GitHub Actions authentication via OIDC (no stored credentials) |
| CloudWatch Logs | Container log aggregation (`/ecs/probate-platform`) |

---

## Third-Party Services

| Service | Usage |
|---------|-------|
| Alibaba OSS (Singapore) | Primary document storage for wills, legal docs, KYC files |
| TNG eWallet API | Transfer execution to beneficiaries |
| Wise API | International transfer support |

---

## Document Storage Structure (Alibaba OSS)

```
iwantmoney-docs-prod/
├── wills/{estate_id}/{uuid}_{filename}
├── legal/{estate_id}/{doc_type}/{uuid}_{filename}
└── kyc/{claim_id}/{step}_{filename}
```

---

## CI/CD Pipeline

```
git push → GitHub Actions → Build Docker images → Push to ECR → Update ECS services
```

- Authentication: AWS OIDC (no stored AWS credentials)
- Trigger: Push to `main` branch
- Services deployed in parallel via matrix strategy

---

## Feature Flags

| Flag | Production Value | Purpose |
|------|-----------------|---------|
| USE_REAL_OSS | true | Use Alibaba OSS vs local filesystem |
| USE_REAL_TEXTRACT | true | Use AWS Textract vs mock |
| USE_REAL_SES | true | Send real emails via SES |
| USE_MOCK_TRANSFERS | true | Mock TNG transfers (demo safe) |

---

## Network

- **VPC:** vpc-0e3e9569424fddb26
- **Region:** ap-southeast-1 (Singapore)
- **ALB Security Group:** sg-03f58c02dd0786eab
- **Subnets:** ap-southeast-1a, ap-southeast-1b
