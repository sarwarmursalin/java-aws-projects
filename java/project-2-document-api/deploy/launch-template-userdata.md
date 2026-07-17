# Launch Template User Data — Project 2

Copy the block below directly from this file (not from chat) into the Launch Template's User data field, to avoid trailing-whitespace paste issues.

```bash
#!/bin/bash
set -e

dnf install -y java-21-amazon-corretto jq postgresql15

REGION="us-east-2"
DB_HOST="document-api-db.c5eyiamyiii0.us-east-2.rds.amazonaws.com"
DB_PORT=5432
DB_NAME="golam"

SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id document-api-db-credentials --region "$REGION" --query SecretString --output text)
DB_USER=$(echo "$SECRET_JSON" | jq -r .username)
DB_PASS=$(echo "$SECRET_JSON" | jq -r .password)

DB_EXISTS=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")
if [ "$DB_EXISTS" != "1" ]; then
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME}"
fi

mkdir -p /opt/document-api
aws s3 cp s3://document-api-deploy-091756093469/document-api.jar /opt/document-api/document-api.jar

cat > /etc/systemd/system/document-api.service <<UNIT
[Unit]
Description=Document API Spring Boot Service
After=network.target

[Service]
Type=simple
User=ec2-user
ExecStart=/usr/bin/java -jar /opt/document-api/document-api.jar
Environment=SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
Environment=SPRING_DATASOURCE_USERNAME=${DB_USER}
Environment=SPRING_DATASOURCE_PASSWORD=${DB_PASS}
StandardOutput=append:/var/log/document-api.log
StandardError=append:/var/log/document-api.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable document-api
systemctl start document-api
```

## Steps to apply
1. Terminate the broken test instance (EC2 console → select it → Terminate).
2. Launch Templates → `document-api-lt` → Actions → Modify template (Create new version) → clear the User data box completely → paste the block above.
3. Launch a fresh test instance from the new version: private subnet, "Proceed without a key pair."
4. Verify via SSM Session Manager:
   ```bash
   sudo systemctl status document-api
   sudo cat /var/log/cloud-init-output.log | tail -60
   ```
