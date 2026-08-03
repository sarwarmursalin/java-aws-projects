#!/bin/bash
set -e

cd "$(dirname "$0")/../backend"
npm run build
zip -r ../infra/backend.zip dist package.json package-lock.json

cd ../infra
BUCKET=$(terraform output -raw s3_deploy_bucket)
aws s3 cp backend.zip "s3://$BUCKET/backend.zip" --profile sec-filings-terraform
rm backend.zip

echo "Deployed to s3://$BUCKET/backend.zip"
