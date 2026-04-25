#!/bin/bash

# React Frontend Production Deployment to S3 + CloudFront

set -e

FRONTEND_BUCKET="probate-frontend-prod-464817648724"
DISTRIBUTION_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"
AWS_REGION="ap-southeast-1"

echo "🚀 Building and deploying React frontend..."

# Build the frontend
echo "📦 Building React app..."
cd frontend
npm install
npm run build

# Create S3 bucket if it doesn't exist
echo "🪣 Creating S3 bucket..."
aws s3api create-bucket --bucket $FRONTEND_BUCKET --region $AWS_REGION --create-bucket-configuration LocationConstraint=$AWS_REGION || echo "Bucket already exists"

# Enable static website hosting
aws s3 website s3://$FRONTEND_BUCKET --index-document index.html --error-document index.html

# Set bucket policy for public access
aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$FRONTEND_BUCKET'/*"
        }
    ]
}'

# Deploy to S3
echo "📤 Uploading to S3..."
aws s3 sync build/ s3://$FRONTEND_BUCKET --delete

# Create CloudFront distribution (if not exists)
if [ "$DISTRIBUTION_ID" = "YOUR_CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "🌐 Creating CloudFront distribution..."
    DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config '{
        "CallerReference": "probate-frontend-'$(date +%s)'",
        "Comment": "Probate Platform Frontend",
        "DefaultRootObject": "index.html",
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "S3-'$FRONTEND_BUCKET'",
                    "DomainName": "'$FRONTEND_BUCKET'.s3.'$AWS_REGION'.amazonaws.com",
                    "S3OriginConfig": {
                        "OriginAccessIdentity": ""
                    }
                }
            ]
        },
        "DefaultCacheBehavior": {
            "TargetOriginId": "S3-'$FRONTEND_BUCKET'",
            "ViewerProtocolPolicy": "redirect-to-https",
            "TrustedSigners": {
                "Enabled": false,
                "Quantity": 0
            },
            "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                    "Forward": "none"
                }
            },
            "MinTTL": 0
        },
        "Enabled": true,
        "PriceClass": "PriceClass_100"
    }' --query 'Distribution.Id' --output text)
    
    echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
fi

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "✅ Frontend deployed successfully!"
echo "🌐 URL: https://$DISTRIBUTION_ID.cloudfront.net"
echo "🪣 S3 URL: http://$FRONTEND_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
