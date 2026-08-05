# NAT Gateway + private subnet, for the ingestion Lambda only.
#
# The Lambda needs to reach BOTH RDS (private, inside the VPC) and the
# public internet (SEC EDGAR + Voyage AI — neither is an AWS service, so a
# VPC endpoint wouldn't help). Attaching a Lambda to a VPC subnet does NOT
# give it a public IP the way an EC2 instance gets one — without a NAT
# Gateway it would lose all internet access the moment it's VPC-attached.
# This is the only place in the project that needs one; the EC2 layer
# avoids it entirely by staying in public subnets.

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-nat-eip" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id

  tags = { Name = "${var.project_name}-nat" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block               = "10.0.3.0/24"
  availability_zone        = "${var.aws_region}a"
  map_public_ip_on_launch  = false

  tags = { Name = "${var.project_name}-private-a" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "${var.project_name}-private-rt" }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for the ingestion Lambda"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-lambda-sg" }
}

# The RDS-side ingress rule for this security group lives in networking.tf,
# as a third inline `ingress {}` block on aws_security_group.rds — not
# here as a standalone aws_security_group_rule. Terraform's AWS provider
# treats a security group's inline rules as the complete authoritative
# set; mixing in a separate aws_security_group_rule for the same SG causes
# a permanent plan/apply conflict where each run alternately adds and
# removes the rule.
