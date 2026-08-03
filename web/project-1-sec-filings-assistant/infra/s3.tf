data "aws_caller_identity" "current" {}

# Holds the built backend (zipped dist/ + package.json) — EC2 instances pull
# from here on boot instead of git-cloning source onto the instance.
resource "aws_s3_bucket" "deploy" {
  bucket = "${var.project_name}-deploy-${data.aws_caller_identity.current.account_id}"
  # Lets `terraform destroy` delete this bucket even with files still in
  # it — this bucket only ever holds a disposable build artifact.
  force_destroy = true

  tags = { Name = "${var.project_name}-deploy" }
}

resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket                  = aws_s3_bucket.deploy.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
