# Explicitly the "minimal" variant, not just whatever "al2023-ami-*"
# happens to match most recently — that pattern matches both the minimal
# and standard AMI names, so most_recent silently picks whichever AWS
# published last. Minimal doesn't come with SSM Agent preinstalled
# (unlike standard), so user_data.sh.tpl installs it explicitly.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-minimal-*-x86_64"]
  }
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Allows public HTTP access to the load balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# The app security group was created empty in networking.tf (RDS's SG
# needed to reference it before it had any rules of its own). Now that the
# ALB exists, allow it through to the app's port.
resource "aws_security_group_rule" "app_from_alb" {
  type                     = "ingress"
  from_port                = 3001
  to_port                  = 3001
  protocol                 = "tcp"
  security_group_id        = aws_security_group.app.id
  source_security_group_id = aws_security_group.alb.id
  description               = "App port from the ALB"
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.al2023.id
  instance_type = "t3.micro"

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  # The minimal AMI's default root volume is too small once Node.js, the
  # app's node_modules, and the CloudWatch Agent package (~69MB download,
  # ~578MB installed with its deps) are all on it — dnf failed with
  # "needs 127MB more space on the / filesystem" until this was added.
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      volume_type = "gp3"
    }
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    region         = var.aws_region
    db_secret_id   = aws_db_instance.main.master_user_secret[0].secret_arn
    app_secret_id  = aws_secretsmanager_secret.app_keys.arn
    s3_bucket      = aws_s3_bucket.deploy.bucket
    s3_key         = "backend.zip"
    db_host        = aws_db_instance.main.address
    frontend_origin = "https://${aws_cloudfront_distribution.frontend.domain_name}"
    log_group_name = aws_cloudwatch_log_group.app.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${var.project_name}-app" }
  }
}

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = { Name = "${var.project_name}-alb" }
}

resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }

  tags = { Name = "${var.project_name}-tg" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${var.project_name}-asg"
  min_size                  = 1
  max_size                  = 2
  desired_capacity          = 1
  vpc_zone_identifier       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg"
    propagate_at_launch = true
  }
}
