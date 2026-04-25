#!/bin/bash

# ECR Login Helper Script
set -e

AWS_REGION="ap-southeast-1"
ACCOUNT_ID="464817648724"

echo "🔐 Logging into ECR..."

# Get ECR login password
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "✅ Successfully logged into ECR!"

# List repositories
echo "📋 Available ECR repositories:"
aws ecr describe-repositories --region $AWS_REGION --query 'repositories[].repositoryName' --output table
