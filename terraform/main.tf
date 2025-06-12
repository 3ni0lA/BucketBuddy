terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# Security Group
resource "aws_security_group" "app_sg" {
  name_prefix = "${var.app_name}-"
  vpc_id      = data.aws_vpc.default.id

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Application port
  ingress {
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PostgreSQL (if using local PostgreSQL)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-sg"
    Environment = var.environment
  }
}

# IAM role for CloudWatch
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-profile"
  role = aws_iam_role.ec2_role.name
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/ec2/${var.app_name}"
  retention_in_days = 7  # Free tier friendly

  tags = {
    Name        = var.app_name
    Environment = var.environment
  }
}

# S3 bucket for database backup storage (optional)
resource "aws_s3_bucket" "db_backups" {
  bucket = "${var.app_name}-db-backups-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.app_name}-db-backups"
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  rule {
    id     = "delete_old_backups"
    status = "Enabled"

    expiration {
      days = 30  # Keep backups for 30 days
    }
  }
}

# EC2 Instance
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t2.micro"  # Free tier
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    app_name             = var.app_name
    container_port       = var.container_port
    cloudwatch_log_group = aws_cloudwatch_log_group.app_logs.name
    # Database configuration
    use_external_db      = var.use_external_db
    db_host             = var.use_external_db ? var.external_db_host : "localhost"
    db_port             = var.use_external_db ? var.external_db_port : "5432"
    db_name             = var.db_name
    db_user             = var.db_username
    db_password         = var.db_password
    # Supabase configuration (if using)
    supabase_url        = var.supabase_url
    supabase_anon_key   = var.supabase_anon_key
    supabase_service_key = var.supabase_service_key
    # S3 backup bucket
    backup_bucket       = aws_s3_bucket.db_backups.bucket
  }))

  root_block_device {
    volume_type = "gp2"
    volume_size = 20  # Free tier: up to 30GB
    encrypted   = true
  }

  tags = {
    Name        = "${var.app_name}-server"
    Environment = var.environment
  }
}

# Elastic IP
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.app_name}-eip"
    Environment = var.environment
  }

  depends_on = [aws_instance.app_server]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.app_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "High CPU utilization alarm"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.app_server.id
  }
}

resource "aws_cloudwatch_metric_alarm" "log_usage" {
  alarm_name          = "${var.app_name}-log-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IncomingLogEvents"
  namespace           = "AWS/Logs"
  period              = "86400"
  statistic           = "Sum"
  threshold           = "4000000"  # Under 5GB free tier
  alarm_description   = "Log usage approaching free tier limit"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.app_logs.name
  }
}

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
