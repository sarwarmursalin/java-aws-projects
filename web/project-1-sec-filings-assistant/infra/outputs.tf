output "vpc_id" {
  value = aws_vpc.main.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "rds_secret_arn" {
  description = "Secrets Manager ARN holding the auto-generated DB master password"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "alb_dns_name" {
  description = "Public URL the app will be reachable at (once deployed)"
  value       = aws_lb.main.dns_name
}

output "s3_deploy_bucket" {
  value = aws_s3_bucket.deploy.bucket
}

output "cloudfront_domain_name" {
  description = "Public URL the frontend will be reachable at (once deployed)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "ingest_lambda_name" {
  description = "For manual test invokes: aws lambda invoke --function-name <this>"
  value       = aws_lambda_function.ingest.function_name
}

output "dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
