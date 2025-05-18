output "app_secrets_arn" {
  description = "ARN of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_policy_arn" {
  description = "ARN of the IAM policy for accessing secrets"
  value       = aws_iam_policy.secrets_access.arn
}

output "secrets_audit_log_group" {
  description = "Name of the CloudWatch log group for secrets audit"
  value       = aws_cloudwatch_log_group.secrets_audit.name
} 