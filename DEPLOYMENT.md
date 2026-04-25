# Production Deployment Guide

## Prerequisites

1. **AWS Account** with:
   - ECR repository created
   - ECS cluster or App Runner services
   - IAM roles for task execution
   - Secrets Manager for credentials

2. **Domain & SSL** (for production)
3. **Monitoring & Logging** setup

## Option 1: AWS App Runner (Recommended for Start)

### 1. Create ECR Repositories

```bash
aws ecr create-repository --repository-name probate-api-gateway --region ap-southeast-1
aws ecr create-repository --repository-name probate-will-scanner --region ap-southeast-1
aws ecr create-repository --repository-name probate-transfer-pipeline --region ap-southeast-1
```

### 2. Store Secrets in AWS Secrets Manager

```bash
# AWS Credentials
aws secretsmanager create-secret --name probate-aws-credentials \
  --secret-string '{"AWS_ACCESS_KEY_ID":"your_key","AWS_SECRET_ACCESS_KEY":"your_secret"}'

# JWT Secret
aws secretsmanager create-secret --name probate-jwt-secret \
  --secret-string '{"JWT_SECRET":"your_jwt_secret"}'

# TNG Credentials
aws secretsmanager create-secret --name probate-tng-credentials \
  --secret-string '{"TNG_API_KEY":"your_tng_key"}'

# Wise Credentials
aws secretsmanager create-secret --name probate-wise-credentials \
  --secret-string '{"WISE_API_KEY":"your_wise_key","WISE_PROFILE_ID":"your_profile_id"}'
```

### 3. Build and Deploy

```bash
# Make script executable
chmod +x deploy/scripts/build-and-push.sh

# Deploy to App Runner
./deploy/scripts/build-and-push.sh apprunner
```

### 4. Create App Runner Services

```bash
# API Gateway
aws apprunner create-service \
  --service-name probate-api-gateway \
  --source-configuration ImageRepository={ImageIdentifier=464817648724.dkr.ecr.ap-southeast-1.amazonaws.com/probate-api-gateway:latest,ImageRepositoryType=ECR} \
  --instance-configuration Cpu=1,Memory=2 \
  --auto-deployments-configuration Enabled=true

# Will Scanner
aws apprunner create-service \
  --service-name probate-will-scanner \
  --source-configuration ImageRepository={ImageIdentifier=464817648724.dkr.ecr.ap-southeast-1.amazonaws.com/probate-will-scanner:latest,ImageRepositoryType=ECR} \
  --instance-configuration Cpu=1,Memory=2

# Transfer Pipeline
aws apprunner create-service \
  --service-name probate-transfer-pipeline \
  --source-configuration ImageRepository={ImageIdentifier=464817648724.dkr.ecr.ap-southeast-1.amazonaws.com/probate-transfer-pipeline:latest,ImageRepositoryType=ECR} \
  --instance-configuration Cpu=1,Memory=2
```

## Option 2: AWS ECS (Production Grade)

### 1. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name probate-platform
```

### 2. Create Task Definitions
```bash
aws ecs register-task-definition --cli-input-json file://deploy/aws/ecs-task-definition.json
```

### 3. Create Services
```bash
aws ecs create-service \
  --cluster probate-platform \
  --service-name api-gateway \
  --task-definition probate-platform \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## Option 3: EC2 with Docker Compose

### 1. Launch EC2 Instance
```bash
# Ubuntu 22.04 LTS with Docker installed
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-12345 \
  --subnet-id subnet-12345
```

### 2. Deploy to EC2
```bash
# Copy files to EC2
scp -r . ec2-user@your-ec2-ip:/home/ec2-user/

# SSH into EC2
ssh ec2-user@your-ec2-ip

# Deploy
cd /home/ec2-user
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Production Environment Variables
Create `.env.production`:

```bash
DATABASE_URL=postgresql://postgres@database-probate.cluster-c3cgiqqsiqbk.ap-southeast-1.rds.amazonaws.com:5432/postgres?sslmode=require
JWT_SECRET=your_strong_jwt_secret_here
AWS_REGION=ap-southeast-1
USE_REAL_TEXTRACT=true
USE_REAL_SES=true
USE_REAL_OSS=true
USE_MOCK_TRANSFERS=false
SES_SENDER=noreply@iwantmoney.com.my
S3_BUCKET=iwantmoney-docs-prod-464817648724
OSS_ACCESS_KEY_ID=your_oss_key
OSS_ACCESS_KEY_SECRET=your_oss_secret
OSS_BUCKET=iwantmoney-docs-prod
OSS_ENDPOINT=oss-ap-southeast-1.aliyuncs.com
TNG_API_BASE=https://api.tng.com.my
TNG_API_KEY=your_tng_key
WISE_API_BASE=https://api.transferwise.com
WISE_API_KEY=your_wise_key
WISE_PROFILE_ID=your_wise_profile_id
```

## Monitoring & Logging

### 1. CloudWatch Logs
- All services configured to send logs to CloudWatch
- Set up log groups: `/ecs/probate-platform`

### 2. Health Checks
- `/health` endpoint on all services
- ECS/App Runner health checks configured

### 3. Monitoring
- CloudWatch metrics for CPU, memory, requests
- Set up alarms for error rates

## Security

### 1. Network Security
- VPC with private subnets
- Security groups limiting access
- NLB/ALB for external access

### 2. Secrets Management
- All credentials in AWS Secrets Manager
- No hardcoded secrets in code/images

### 3. SSL/TLS
- Certificate via AWS Certificate Manager
- HTTPS enforced in production

## Deployment Commands

### Quick Deploy (App Runner)
```bash
./deploy/scripts/build-and-push.sh apprunner
```

### Production Deploy (ECS)
```bash
./deploy/scripts/build-and-push.sh production
```

### Rollback
```bash
# App Runner
aws apprunner update-service --service-id probate-api-gateway --image-configuration ImageUri=464817648724.dkr.ecr.ap-southeast-1.amazonaws.com/probate-api-gateway:previous-tag

# ECS
aws ecs update-service --cluster probate-platform --service api-gateway --task-definition probate-platform:previous-revision
```

## Testing Production

1. **Health Checks**: `GET /health` on all services
2. **API Tests**: Test key endpoints via API docs
3. **Integration Tests**: Test full workflow
4. **Load Tests**: Test with realistic load

## Support

- Monitor CloudWatch logs for errors
- Set up alerts for critical failures
- Backup strategy for RDS and document storage
