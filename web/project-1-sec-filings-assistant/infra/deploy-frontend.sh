#!/bin/bash
set -e

cd "$(dirname "$0")/../frontend"
npm run build

cd ../infra
BUCKET=$(terraform output -raw s3_frontend_bucket)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

aws s3 sync ../frontend/dist "s3://$BUCKET" --delete --profile sec-filings-terraform

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --profile sec-filings-terraform

echo "Deployed to https://$(terraform output -raw cloudfront_domain_name)"
