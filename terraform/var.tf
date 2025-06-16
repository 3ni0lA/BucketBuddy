# Variables
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "bucketbuddy"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 5000
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "devprecious@gmail.com"
}

# Database Configuration
variable "use_external_db" {
  description = "Whether to use external database service (Supabase) vs local PostgreSQL"
  type        = bool
  default     = false
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "bucketbuddy"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "buddyuser"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = "securepassword"
}

# External Database Configuration (Supabase)
variable "external_db_host" {
  description = "External database host (e.g., Supabase)"
  type        = string
  default     = ""
}

variable "external_db_port" {
  description = "External database port"
  type        = string
  default     = "5432"
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  default     = ""
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "supabase_service_key" {
  description = "Supabase service role key"
  type        = string
  default     = ""
  sensitive   = true
}

# GitHub Configuration for CodePipeline
variable "github_owner" {
  description = "GitHub repository owner (username or organization)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to deploy from"
  type        = string
  default     = "main"
}

