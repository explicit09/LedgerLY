aws_region     = "us-east-1"
project_name   = "ledgerly"
frontend_domain = "staging.ledgerly.app"
backend_domain  = "api.staging.ledgerly.app"

# These values will need to be updated with actual VPC and subnet IDs
vpc_id             = "vpc-12345678"
private_subnet_ids = ["subnet-private1", "subnet-private2"]
public_subnet_ids  = ["subnet-public1", "subnet-public2"]

backend_container_image = "ledgerly/backend:latest"
backend_container_port  = 3000
backend_app_count      = 1

# RDS Configuration
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_name             = "ledgerly"
# Note: db_username and db_password should be provided via environment variables
# export TF_VAR_db_username="admin"
# export TF_VAR_db_password="<secure-password>" 