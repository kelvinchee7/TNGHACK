#!/bin/bash

# Production Build and Deploy Script
# Usage: ./deploy/scripts/build-and-push.sh [environment]

set -e

ENVIRONMENT=${1:-production}
AWS_REGION="ap-southeast-1"
ACCOUNT_ID="464817648724"

echo "🚀 Building and deploying to $ENVIRONMENT..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push API Gateway
echo "📦 Building API Gateway..."
cd services/api-gateway
docker build -t probate-api-gateway:$ENVIRONMENT .
docker tag probate-api-gateway:$ENVIRONMENT $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-api-gateway:$ENVIRONMENT
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-api-gateway:$ENVIRONMENT
cd ../..

# Build and push Will Scanner
echo "📦 Building Will Scanner..."
cd services/will-scanner
docker build -t probate-will-scanner:$ENVIRONMENT .
docker tag probate-will-scanner:$ENVIRONMENT $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-will-scanner:$ENVIRONMENT
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-will-scanner:$ENVIRONMENT
cd ../..

# Build and push Transfer Pipeline
echo "📦 Building Transfer Pipeline..."
cd services/transfer-pipeline
docker build -t probate-transfer-pipeline:$ENVIRONMENT .
docker tag probate-transfer-pipeline:$ENVIRONMENT $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-transfer-pipeline:$ENVIRONMENT
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-transfer-pipeline:$ENVIRONMENT
cd ../..

echo "✅ All images built and pushed successfully!"

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Deploying to production..."
    # Update ECS service
    aws ecs update-service --cluster probate-platform --service api-gateway --force-new-deployment
    aws ecs update-service --cluster probate-platform --service will-scanner --force-new-deployment
    aws ecs update-service --cluster probate-platform --service transfer-pipeline --force-new-deployment
elif [ "$ENVIRONMENT" = "apprunner" ]; then
    echo "🌐 Deploying to App Runner..."
    # Update App Runner services
    aws apprunner update-service --service-id probate-api-gateway --image-configuration ImageUri=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-api-gateway:$ENVIRONMENT
    aws apprunner update-service --service-id probate-will-scanner --image-configuration ImageUri=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-will-scanner:$ENVIRONMENT
    aws apprunner update-service --service-id probate-transfer-pipeline --image-configuration ImageUri=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/probate-transfer-pipeline:$ENVIRONMENT
fi

echo "🎉 Deployment complete!"
