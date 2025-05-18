variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "ledgerly"
}

variable "frontend_domain" {
  description = "Frontend domain name for staging"
  type        = string
}

variable "backend_domain" {
  description = "Backend domain name for staging"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones to use for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "backend_container_image" {
  description = "Docker image for the backend application"
  type        = string
}

variable "backend_container_port" {
  description = "Port exposed by the backend container"
  type        = number
  default     = 3000
}

variable "backend_app_count" {
  description = "Number of backend containers to run"
  type        = number
  default     = 1
}

# Secrets Manager variables
variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe API secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

# Monitoring variables
variable "slack_channel_id" {
  description = "ID of the Slack channel for notifications"
  type        = string
}

variable "slack_workspace_id" {
  description = "ID of the Slack workspace"
  type        = string
}

variable "notification_email" {
  description = "Email address for notifications (optional)"
  type        = string
  default     = ""
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
} 