variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "frontend_domain" {
  description = "Frontend domain name"
  type        = string
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
} 