# Output values
output "application_url" {
  description = "URL to access the BucketBuddy application"
  value       = "http://${aws_eip.app_eip.public_ip}"
}

output "ssh_connection" {
  description = "SSH command to connect to the server"
  value       = "ssh ec2-user@${aws_eip.app_eip.public_ip}"
}

output "codepipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.pipeline.name
}

output "codepipeline_console_url" {
  description = "AWS Console URL for CodePipeline"
  value       = "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.pipeline.name}/view"
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app_server.id
}

output "cloudwatch_logs_url" {
  description = "CloudWatch Logs URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.app_logs.name, "/", "$252F")}"
}

output "s3_artifacts_bucket" {
  description = "S3 bucket for CodePipeline artifacts"
  value       = aws_s3_bucket.codepipeline_artifacts.bucket
}

output "s3_backups_bucket" {
  description = "S3 bucket for database backups"
  value       = aws_s3_bucket.db_backups.bucket
}

output "database_migration_command" {
  description = "Command to migrate your local database"
  value       = "scp /tmp/bucketbuddy_backup.sql ec2-user@${aws_eip.app_eip.public_ip}:/opt/${var.app_name}/ && ssh ec2-user@${aws_eip.app_eip.public_ip} 'cd /opt/${var.app_name} && ./restore_data.sh bucketbuddy_backup.sql'"
}

output "deployment_guide_location" {
  description = "Location of the deployment guide on the EC2 instance"
  value       = "/opt/${var.app_name}/DEPLOYMENT_GUIDE.md"
}

output "github_connection_arn" {
  description = "ARN of the CodeStar connection to GitHub (needs manual activation)"
  value       = aws_codestarconnections_connection.github.arn
}

output "github_connection_status" {
  description = "Status of the GitHub connection (needs to be activated manually)"
  value       = aws_codestarconnections_connection.github.connection_status
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "database_url" {
  description = "Full database connection URL"
  value       = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
  sensitive   = true
}

output "next_steps" {
  description = "Important next steps after deployment"
  sensitive   = true
  value = <<-EOT
    🚀 DEPLOYMENT COMPLETE! Next steps:
    
    1. ACTIVATE GITHUB CONNECTION:
       - Go to: https://console.aws.amazon.com/codesuite/settings/connections
       - Find connection: ${aws_codestarconnections_connection.github.name}
       - Click "Update pending connection" and authorize with GitHub
    
    2. UPDATE DATABASE_URL:
       - SSH into EC2: ssh -i ~/.ssh/your-key.pem ec2-user@${aws_eip.app_eip.public_ip}
       - Update DATABASE_URL in /opt/bucketbuddy/.env to use RDS endpoint
       - DATABASE_URL=postgres://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}
    
    3. TRIGGER FIRST DEPLOYMENT:
       - Push any change to your GitHub repository
       - Or manually start pipeline: ${aws_codepipeline.pipeline.name}
    
    4. ACCESS YOUR APPLICATION:
       - URL: http://${aws_eip.app_eip.public_ip}
       - SSH: ssh -i ~/.ssh/your-key.perm ec2-user@${aws_eip.app_eip.public_ip}
    
    5. MONITOR:
       - CodePipeline: ${aws_codepipeline.pipeline.name}
       - CloudWatch Logs: /aws/ec2/${var.app_name}
       - SNS Alerts: Configured for ${var.alert_email}
  EOT
}

