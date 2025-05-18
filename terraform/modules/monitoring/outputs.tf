output "deployment_notifications_topic_arn" {
  description = "ARN of the SNS topic for deployment notifications"
  value       = aws_sns_topic.deployment_notifications.arn
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "chatbot_role_arn" {
  description = "ARN of the IAM role for AWS Chatbot"
  value       = aws_iam_role.chatbot_role.arn
}

output "deployment_failure_alarm_arn" {
  description = "ARN of the deployment failure CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.deployment_failure.arn
}

output "high_error_rate_alarm_arn" {
  description = "ARN of the high error rate CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_error_rate.arn
}

output "high_cpu_utilization_alarm_arn" {
  description = "ARN of the high CPU utilization CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu_utilization.arn
} 