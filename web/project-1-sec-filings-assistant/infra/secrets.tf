# Holds the app's own API keys (not the DB password — RDS manages that one
# itself). EC2 reads this at boot instead of the app ever seeing a hardcoded
# key in a config file.
resource "aws_secretsmanager_secret" "app_keys" {
  name = "${var.project_name}-app-keys"
}

resource "aws_secretsmanager_secret_version" "app_keys" {
  secret_id = aws_secretsmanager_secret.app_keys.id
  secret_string = jsonencode({
    anthropic_api_key = var.anthropic_api_key
    voyage_api_key    = var.voyage_api_key
  })
}
