#!/bin/bash
set -e

dnf install -y nodejs unzip jq awscli

REGION="${region}"
DB_SECRET_ID="${db_secret_id}"
APP_SECRET_ID="${app_secret_id}"
S3_BUCKET="${s3_bucket}"
S3_KEY="${s3_key}"
DB_HOST="${db_host}"
FRONTEND_ORIGIN="${frontend_origin}"

DB_SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ID" --region "$REGION" --query SecretString --output text)
DB_USER=$(echo "$DB_SECRET_JSON" | jq -r .username)
# Passed as a plain env var (PGPASSWORD), not embedded in a URL — the
# auto-generated password can contain characters (? $ ( ! :) that a URL
# parser mishandles even when correctly percent-encoded.
DB_PASS=$(echo "$DB_SECRET_JSON" | jq -r .password)

APP_SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$APP_SECRET_ID" --region "$REGION" --query SecretString --output text)
ANTHROPIC_API_KEY=$(echo "$APP_SECRET_JSON" | jq -r .anthropic_api_key)
VOYAGE_API_KEY=$(echo "$APP_SECRET_JSON" | jq -r .voyage_api_key)

mkdir -p /opt/sec-filings-assistant
cd /opt/sec-filings-assistant
aws s3 cp "s3://$S3_BUCKET/$S3_KEY" backend.zip --region "$REGION"
unzip -o backend.zip
npm ci --omit=dev

cat > /etc/systemd/system/sec-filings-assistant.service <<UNIT
[Unit]
Description=SEC Filings Assistant Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/sec-filings-assistant
ExecStart=/usr/bin/node dist/index.js
Environment=PGHOST=$DB_HOST
Environment=PGPORT=5432
Environment=PGDATABASE=secfilings
Environment=PGUSER=$DB_USER
Environment=PGPASSWORD=$DB_PASS
Environment=ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
Environment=VOYAGE_API_KEY=$VOYAGE_API_KEY
Environment=FRONTEND_ORIGIN=$FRONTEND_ORIGIN
StandardOutput=append:/var/log/sec-filings-assistant.log
StandardError=append:/var/log/sec-filings-assistant.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable sec-filings-assistant
systemctl start sec-filings-assistant
