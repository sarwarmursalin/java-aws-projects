resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project_name}-igw" }
}

# Two public subnets in different Availability Zones — required for the
# Application Load Balancer we'll add in the next step, which needs at
# least 2 AZs for its own resilience.
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block               = "10.0.1.0/24"
  availability_zone        = "${var.aws_region}a"
  map_public_ip_on_launch  = true

  tags = { Name = "${var.project_name}-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block               = "10.0.2.0/24"
  availability_zone        = "${var.aws_region}b"
  map_public_ip_on_launch  = true

  tags = { Name = "${var.project_name}-public-b" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Attached to the app's compute (EC2 instances) once that exists in the
# next step. Defined here because the RDS security group below needs to
# reference it to allow the app to reach the database.
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for app compute instances"
  vpc_id      = aws_vpc.main.id

  # AWS auto-creates an "allow all outbound" rule for new security groups,
  # but Terraform removes it unless declared explicitly here — without
  # this, instances have no outbound internet access at all (can't reach
  # Secrets Manager, S3, SSM, or even RDS).
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-app-sg" }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allows Postgres access from the app and from your laptop for migrations"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres from app instances"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    security_groups  = [aws_security_group.app.id]
  }

  ingress {
    description = "Postgres from your laptop (migrations/ingestion)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }
}
