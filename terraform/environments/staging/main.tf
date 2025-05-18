terraform {
  backend "s3" {
    bucket         = "ledgerly-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ledgerly-terraform-locks"
    encrypt        = true
  }
}

module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = "staging"
  availability_zones = var.availability_zones
}

module "frontend" {
  source = "../../modules/frontend"

  project_name    = var.project_name
  environment     = "staging"
  frontend_domain = var.frontend_domain

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}

module "backend" {
  source = "../../modules/backend"

  project_name    = var.project_name
  environment     = "staging"
  aws_region      = var.aws_region
  backend_domain  = var.backend_domain

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  container_image = var.backend_container_image
  container_port  = var.backend_container_port
  app_count       = var.backend_app_count

  container_environment = [
    {
      name  = "NODE_ENV"
      value = "staging"
    },
    {
      name  = "PORT"
      value = tostring(var.backend_container_port)
    }
  ]
}

module "rds" {
  source = "../../modules/rds"

  project_name         = var.project_name
  environment         = "staging"
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  ecs_security_group_id = module.backend.ecs_security_group_id
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
}

module "secrets" {
  source = "../../modules/secrets"

  project_name            = var.project_name
  environment            = "staging"
  db_credentials_secret_arn = module.rds.db_credentials_secret_arn
  ecs_task_role_name     = module.backend.ecs_task_role_name
  jwt_secret             = var.jwt_secret
  stripe_secret_key      = var.stripe_secret_key
  stripe_webhook_secret  = var.stripe_webhook_secret
}

module "monitoring" {
  source = "../../modules/monitoring"

  project_name       = var.project_name
  environment        = "staging"
  ecs_log_group_name = module.backend.ecs_log_group_name
  ecs_cluster_name   = module.backend.ecs_cluster_name
  ecs_service_name   = module.backend.ecs_service_name
  alb_arn_suffix     = module.backend.alb_arn_suffix
  slack_channel_id   = var.slack_channel_id
  slack_workspace_id = var.slack_workspace_id
  notification_email = var.notification_email
}

# VPC outputs
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr" {
  value = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

# Frontend outputs
output "frontend_s3_bucket" {
  value = module.frontend.s3_bucket_name
}

output "frontend_cloudfront_distribution_id" {
  value = module.frontend.cloudfront_distribution_id
}

output "frontend_cloudfront_domain" {
  value = module.frontend.cloudfront_domain_name
}

output "frontend_certificate_validation" {
  value     = module.frontend.certificate_validation_options
  sensitive = true
}

# Backend outputs
output "backend_ecs_cluster_id" {
  value = module.backend.ecs_cluster_id
}

output "backend_ecs_service_name" {
  value = module.backend.ecs_service_name
}

output "backend_alb_dns_name" {
  value = module.backend.alb_dns_name
}

output "backend_certificate_validation" {
  value     = module.backend.certificate_validation_options
  sensitive = true
}

output "backend_task_execution_role_arn" {
  value = module.backend.task_execution_role_arn
}

output "backend_task_role_arn" {
  value = module.backend.task_role_arn
}

# RDS outputs
output "db_instance_endpoint" {
  value     = module.rds.db_instance_endpoint
  sensitive = true
}

output "db_credentials_secret_arn" {
  value     = module.rds.db_credentials_secret_arn
  sensitive = true
} 