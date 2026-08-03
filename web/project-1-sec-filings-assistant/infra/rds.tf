resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16.4"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "secfilings"
  username = "secfilings"

  # Lets RDS generate and manage the master password itself, stored in
  # Secrets Manager — we never see or handle the plaintext.
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = true

  # Learning project, torn down between sessions — skip the final snapshot
  # step that production databases would want.
  skip_final_snapshot = true

  tags = { Name = "${var.project_name}-db" }
}
