variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix/tag resources"
  type        = string
  default     = "sec-filings-assistant"
}

variable "my_ip" {
  description = "Your current public IP in CIDR form (e.g. 1.2.3.4/32), allowed to connect directly to RDS for migrations/ingestion"
  type        = string
}

variable "anthropic_api_key" {
  description = "Anthropic API key, stored into Secrets Manager for the app to read at boot"
  type        = string
  sensitive   = true
}

variable "voyage_api_key" {
  description = "Voyage API key, stored into Secrets Manager for the app to read at boot"
  type        = string
  sensitive   = true
}
