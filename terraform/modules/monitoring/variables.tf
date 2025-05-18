variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "ecs_log_group_name" {
  description = "Name of the ECS CloudWatch log group"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  type        = string
}

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