# --- IAM role for the ingestion Lambda ---
# Separate identity from the EC2 app role (iam.tf) — different trust
# principal, and it only needs the two secrets it actually reads.

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ingest_lambda" {
  name               = "${var.project_name}-ingest-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# AWS-managed policy that bundles exactly what a VPC-attached Lambda needs:
# permission to create/describe/delete the ENI it uses to join our VPC,
# plus basic CloudWatch Logs write access.
resource "aws_iam_role_policy_attachment" "ingest_lambda_vpc" {
  role       = aws_iam_role.ingest_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "ingest_lambda_secrets" {
  name = "${var.project_name}-ingest-lambda-secrets"
  role = aws_iam_role.ingest_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = [
          aws_db_instance.main.master_user_secret[0].secret_arn,
          aws_secretsmanager_secret.app_keys.arn
        ]
      }
    ]
  })
}

# --- The function itself ---
# Zips the lambda/ folder on every apply. node_modules must already exist
# in there (run `npm install` inside lambda/ once) — this just packages
# whatever's on disk, it doesn't install anything.
data "archive_file" "ingest_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/ingest-lambda.zip"
}

resource "aws_lambda_function" "ingest" {
  function_name = "${var.project_name}-ingest"
  role          = aws_iam_role.ingest_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 600
  memory_size   = 512

  filename         = data.archive_file.ingest_lambda.output_path
  source_code_hash = data.archive_file.ingest_lambda.output_base64sha256

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ID  = aws_db_instance.main.master_user_secret[0].secret_arn
      APP_SECRET_ID = aws_secretsmanager_secret.app_keys.arn
      DB_HOST       = split(":", aws_db_instance.main.endpoint)[0]
    }
  }

  tags = { Name = "${var.project_name}-ingest" }
}

resource "aws_cloudwatch_log_group" "ingest_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.ingest.function_name}"
  retention_in_days = 14
}

# --- EventBridge schedule ---
# Daily at 06:00 UTC. Most runs will find every ticker already up to date
# (the Lambda skips anything already in filing_chunks) and finish in
# seconds — it only does real work the day an actual new 10-K appears.
resource "aws_cloudwatch_event_rule" "ingest_schedule" {
  name                = "${var.project_name}-ingest-schedule"
  schedule_expression = "cron(0 6 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ingest_lambda" {
  rule = aws_cloudwatch_event_rule.ingest_schedule.name
  arn  = aws_lambda_function.ingest.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingest.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingest_schedule.arn
}
