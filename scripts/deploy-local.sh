#!/bin/bash

# Local Deployment Script (mirrors GitHub Actions)
set -e

echo "🚀 Starting local deployment..."

# Environment variables
export AWS_REGION="ap-southeast-1"
export ECR_REGISTRY="464817648724.dkr.ecr.ap-southeast-1.amazonaws.com"
export ECS_CLUSTER="probate-platform"

# Function to deploy service
deploy_service() {
    local service=$1
    echo "📦 Building and deploying $service..."
    
    # Build Docker image
    cd services/$service
    docker build -t $service:latest .
    
    # Tag and push to ECR
    docker tag $service:latest $ECR_REGISTRY/$service:latest
    docker push $ECR_REGISTRY/$service:latest
    
    # Update ECS service
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $service \
        --force-new-deployment
    
    cd ../..
    echo "✅ $service deployed!"
}

# Deploy frontend
deploy_frontend() {
    echo "🎨 Building and deploying frontend..."
    cd frontend
    npm install
    npm run build
    aws s3 sync dist/ s3://probate-frontend-prod-464817648724 --delete
    cd ..
    echo "✅ Frontend deployed!"
}

# Main deployment
if [ "$1" = "frontend" ]; then
    deploy_frontend
elif [ "$1" = "backend" ]; then
    deploy_service "api-gateway"
    deploy_service "will-scanner"
    deploy_service "transfer-pipeline"
elif [ "$1" = "all" ]; then
    deploy_service "api-gateway"
    deploy_service "will-scanner"
    deploy_service "transfer-pipeline"
    deploy_frontend
else
    echo "Usage: $0 [frontend|backend|all]"
    echo "  frontend - Deploy only frontend"
    echo "  backend  - Deploy only backend services"
    echo "  all      - Deploy everything"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
