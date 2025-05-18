# SNS Topic for deployment notifications
resource "aws_sns_topic" "deployment_notifications" {
  name = "${var.project_name}-${var.environment}-deployment-notifications"

  tags = {
    Name        = "${var.project_name}-${var.environment}-deployment-notifications"
    Environment = var.environment
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name        = "${var.project_name}-${var.environment}-alerts"
    Environment = var.environment
  }
}

# CloudWatch Log Metric Filters
resource "aws_cloudwatch_log_metric_filter" "deployment_status" {
  name           = "${var.project_name}-${var.environment}-deployment-status"
  pattern        = "[timestamp, deployment_id, status, message]"
  log_group_name = var.ecs_log_group_name

  metric_transformation {
    name          = "DeploymentStatus"
    namespace     = "${var.project_name}/${var.environment}/deployments"
    value         = "1"
    default_value = "0"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "deployment_failure" {
  alarm_name          = "${var.project_name}-${var.environment}-deployment-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DeploymentStatus"
  namespace           = "${var.project_name}/${var.environment}/deployments"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "This metric monitors deployment failures"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    Environment = var.environment
    Status      = "FAILED"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period             = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "High error rate detected"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_utilization" {
  alarm_name          = "${var.project_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "High CPU utilization"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

# AWS Chatbot Slack configuration
resource "aws_chatbot_slack_channel_configuration" "notifications" {
  configuration_name = "${var.project_name}-${var.environment}-notifications"
  slack_channel_id  = var.slack_channel_id
  slack_workspace_id = var.slack_workspace_id

  iam_role_arn = aws_iam_role.chatbot_role.arn

  sns_topic_arns = [
    aws_sns_topic.deployment_notifications.arn,
    aws_sns_topic.alerts.arn
  ]

  guardrail_policies = ["arn:aws:iam::aws:policy/service-role/AWSChatbotServiceRole"]
}

# IAM role for AWS Chatbot
resource "aws_iam_role" "chatbot_role" {
  name = "${var.project_name}-${var.environment}-chatbot-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "chatbot.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for AWS Chatbot
resource "aws_iam_role_policy" "chatbot_policy" {
  name = "${var.project_name}-${var.environment}-chatbot-policy"
  role = aws_iam_role.chatbot_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*"
        ]
        Resource = "*"
      }
    ]
  })
} 