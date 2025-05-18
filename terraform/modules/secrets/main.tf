# AWS Secrets Manager resources for application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.project_name}/${var.environment}/app-secrets"
  description = "Application secrets for ${var.project_name} ${var.environment}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-secrets"
    Environment = var.environment
  }
}

# Initial version of the secret with empty values (to be updated manually or via CI/CD)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET            = var.jwt_secret
    STRIPE_SECRET_KEY     = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
    # Add other application secrets as needed
  })
}

# IAM policy for ECS tasks to read secrets
data "aws_iam_policy_document" "secrets_policy" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      aws_secretsmanager_secret.app_secrets.arn,
      var.db_credentials_secret_arn
    ]
  }
}

resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-${var.environment}-secrets-access"
  description = "Policy for accessing secrets in ${var.environment}"
  policy      = data.aws_iam_policy_document.secrets_policy.json
}

# Attach the secrets policy to the ECS task role
resource "aws_iam_role_policy_attachment" "ecs_task_secrets" {
  role       = var.ecs_task_role_name
  policy_arn = aws_iam_policy.secrets_access.arn
}

# CloudWatch log group for Secrets Manager audit logs
resource "aws_cloudwatch_log_group" "secrets_audit" {
  name              = "/aws/secretsmanager/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "production" ? 365 : 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-secrets-audit"
    Environment = var.environment
  }
} 