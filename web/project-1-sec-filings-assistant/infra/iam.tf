# The app's own runtime identity — separate from your terraform-admin
# provisioning user. Scoped narrowly: only the two secrets it needs and
# only the one S3 bucket it reads from.
data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${var.project_name}-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

# Lets you connect via SSM Session Manager for debugging, with no SSH key
# pairs and no port 22 open on the security group.
#
# Tried scoping this down to a custom policy with just the documented
# Session Manager actions (ssmmessages:*, ec2messages:*,
# ssm:UpdateInstanceInformation) instead of this managed policy. It broke
# SSM Agent registration entirely — a fresh instance under that policy
# never showed up in `aws ssm describe-instance-information` even after
# several minutes, so the agent needs more than the publicly documented
# minimum to complete its registration/heartbeat cycle. AWS doesn't
# document that full internal requirement, and guessing further against
# undocumented agent behavior isn't a good trade for the security upside
# on a personal project — reverted to the managed policy, which is what
# AWS itself recommends for this reason.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "secrets_access" {
  name = "${var.project_name}-secrets-access"
  role = aws_iam_role.app.id

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

resource "aws_iam_role_policy" "s3_deploy_read" {
  name = "${var.project_name}-s3-deploy-read"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.deploy.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project_name}-app-profile"
  role = aws_iam_role.app.name
}
