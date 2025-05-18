#!/bin/bash

# Script to test and validate the CI/CD pipeline
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging setup
LOG_FILE="pipeline-test-$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# Function to print status
print_status() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    if [ "$status" -eq 0 ]; then
        echo -e "${timestamp} ${GREEN}✓ $message${NC}"
    else
        echo -e "${timestamp} ${RED}✗ $message${NC}"
        echo -e "${RED}Error details: Check $LOG_FILE for more information${NC}"
        exit 1
    fi
}

# Function to validate environment variables
validate_env_vars() {
    echo -e "\n${YELLOW}Validating Environment Variables...${NC}"
    required_vars=(
        "AWS_REGION"
        "FRONTEND_BUCKET"
        "CLOUDFRONT_DISTRIBUTION_ID"
        "ECS_CLUSTER"
        "ECS_SERVICE"
        "ECR_REPOSITORY"
        "DB_HOST"
        "DB_PORT"
        "DB_NAME"
        "GITHUB_TOKEN"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_status 1 "Required environment variable $var is not set"
        fi
    done
    print_status 0 "All required environment variables are set"
}

# Function to test AWS credentials
test_aws_credentials() {
    echo -e "\n${YELLOW}Testing AWS Credentials...${NC}"
    aws sts get-caller-identity > /dev/null 2>&1
    print_status $? "AWS credentials are valid"
    
    # Test IAM permissions
    echo -e "${BLUE}Checking IAM permissions...${NC}"
    aws iam get-user > /dev/null 2>&1
    print_status $? "IAM permissions are valid"
}

# Function to test S3 bucket access
test_s3_bucket() {
    echo -e "\n${YELLOW}Testing S3 Bucket Access...${NC}"
    aws s3 ls s3://${FRONTEND_BUCKET} > /dev/null 2>&1
    print_status $? "S3 bucket is accessible"
    
    # Test write permissions
    echo "test" > test.txt
    aws s3 cp test.txt s3://${FRONTEND_BUCKET}/test.txt > /dev/null 2>&1
    print_status $? "S3 bucket write permissions are valid"
    aws s3 rm s3://${FRONTEND_BUCKET}/test.txt > /dev/null 2>&1
    rm test.txt
}

# Function to test CloudFront distribution
test_cloudfront() {
    echo -e "\n${YELLOW}Testing CloudFront Distribution...${NC}"
    aws cloudfront get-distribution --id ${CLOUDFRONT_DISTRIBUTION_ID} > /dev/null 2>&1
    print_status $? "CloudFront distribution is accessible"
    
    # Test SSL certificate
    echo -e "${BLUE}Checking SSL certificate...${NC}"
    distribution_domain=$(aws cloudfront get-distribution --id ${CLOUDFRONT_DISTRIBUTION_ID} --query 'Distribution.DomainName' --output text)
    ssl_check=$(curl -sI https://${distribution_domain} | grep "HTTP/2 200")
    if [ -n "$ssl_check" ]; then
        print_status 0 "SSL certificate is valid"
    else
        print_status 1 "SSL certificate validation failed"
    fi
}

# Function to test ECS cluster and service health
test_ecs_cluster() {
    echo -e "\n${YELLOW}Testing ECS Cluster...${NC}"
    aws ecs describe-clusters --clusters ${ECS_CLUSTER} > /dev/null 2>&1
    print_status $? "ECS cluster is accessible"
    
    # Check cluster capacity
    capacity=$(aws ecs describe-clusters --clusters ${ECS_CLUSTER} --query 'clusters[0].registeredContainerInstancesCount')
    if [ "$capacity" -gt 0 ]; then
        print_status 0 "ECS cluster has available capacity"
    else
        print_status 1 "ECS cluster has no available capacity"
    fi
}

# Function to test ECS service and load balancer health
test_ecs_service() {
    echo -e "\n${YELLOW}Testing ECS Service...${NC}"
    aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} > /dev/null 2>&1
    print_status $? "ECS service is accessible"
    
    # Check service health
    desired_count=$(aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --query 'services[0].desiredCount')
    running_count=$(aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --query 'services[0].runningCount')
    
    if [ "$desired_count" -eq "$running_count" ]; then
        print_status 0 "ECS service has desired number of tasks running"
    else
        print_status 1 "ECS service task count mismatch (desired: $desired_count, running: $running_count)"
    fi
    
    # Test load balancer health
    echo -e "${BLUE}Checking Load Balancer health...${NC}"
    target_group_arn=$(aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --query 'services[0].loadBalancers[0].targetGroupArn' --output text)
    healthy_targets=$(aws elbv2 describe-target-health --target-group-arn $target_group_arn --query 'TargetHealthDescriptions[?TargetHealth.State==`healthy`]' --output text)
    
    if [ -n "$healthy_targets" ]; then
        print_status 0 "Load balancer targets are healthy"
    else
        print_status 1 "No healthy targets found in load balancer"
    fi
}

# Function to test ECR repository
test_ecr_repository() {
    echo -e "\n${YELLOW}Testing ECR Repository...${NC}"
    aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} > /dev/null 2>&1
    print_status $? "ECR repository is accessible"
    
    # Test image pull
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com > /dev/null 2>&1
    print_status $? "ECR authentication successful"
}

# Function to test RDS instance and database migrations
test_rds_instance() {
    echo -e "\n${YELLOW}Testing RDS Instance...${NC}"
    aws rds describe-db-instances --db-instance-identifier ${project_name}-${environment} > /dev/null 2>&1
    print_status $? "RDS instance is accessible"
    
    # Test database connection
    echo -e "${BLUE}Testing database connection...${NC}"
    PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;" > /dev/null 2>&1
    print_status $? "Database connection successful"
    
    # Test migrations
    echo -e "${BLUE}Testing database migrations...${NC}"
    cd backend
    npm run migrate:status > /dev/null 2>&1
    print_status $? "Migration check successful"
    cd ..
}

# Function to test Secrets Manager
test_secrets_manager() {
    echo -e "\n${YELLOW}Testing Secrets Manager...${NC}"
    aws secretsmanager list-secrets | grep ${project_name}/${environment} > /dev/null 2>&1
    print_status $? "Secrets Manager is accessible"
    
    # Test secret retrieval
    aws secretsmanager get-secret-value --secret-id ${project_name}/${environment}/database > /dev/null 2>&1
    print_status $? "Secret retrieval successful"
}

# Function to test SNS topics and notifications
test_sns_topics() {
    echo -e "\n${YELLOW}Testing SNS Topics...${NC}"
    aws sns list-topics | grep ${project_name}-${environment} > /dev/null 2>&1
    print_status $? "SNS topics are accessible"
    
    # Test notification delivery
    topic_arn=$(aws sns list-topics --query 'Topics[?contains(TopicArn, `'${project_name}-${environment}'`)].TopicArn' --output text)
    aws sns publish --topic-arn $topic_arn --message "Pipeline test notification" > /dev/null 2>&1
    print_status $? "Test notification sent successfully"
}

# Function to test CloudWatch alarms
test_cloudwatch_alarms() {
    echo -e "\n${YELLOW}Testing CloudWatch Alarms...${NC}"
    aws cloudwatch describe-alarms | grep ${project_name}-${environment} > /dev/null 2>&1
    print_status $? "CloudWatch alarms are accessible"
    
    # Check alarm status
    alarm_status=$(aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[?contains(AlarmName, `'${project_name}-${environment}'`)]')
    if [ "$alarm_status" == "[]" ]; then
        print_status 0 "No alarms are currently triggered"
    else
        print_status 1 "There are active alarms that need attention"
    fi
}

# Function to test GitHub Actions workflow
test_github_workflow() {
    echo -e "\n${YELLOW}Testing GitHub Actions Workflow...${NC}"
    if [ -f ".github/workflows/deploy.yml" ]; then
        print_status 0 "GitHub Actions workflow file exists"
        
        # Validate workflow file
        gh workflow view deploy.yml > /dev/null 2>&1
        print_status $? "Workflow file is valid"
        
        # Check recent workflow runs
        gh run list --workflow=deploy.yml --limit 1 --json conclusion --jq '.[0].conclusion' | grep -q "success"
        print_status $? "Recent workflow run was successful"
    else
        print_status 1 "GitHub Actions workflow file not found"
    fi
}

# Function to test Plaid integration in sandbox
test_plaid_integration() {
    echo -e "\n${YELLOW}Testing Plaid Integration...${NC}"
    local api_base="${REACT_APP_API_URL:-http://localhost:3001/api}"
    local response=$(curl -s -X POST "$api_base/plaid/link-token" -H "Authorization: Bearer test")
    echo "$response" > logs/plaid-test.log
    echo "$response" | grep -q "linkToken"
    print_status $? "Plaid link token generated"
}

# Function to test rollback procedure
test_rollback() {
    echo -e "\n${YELLOW}Testing Rollback Procedure...${NC}"
    
    # Save current state
    current_task_def=$(aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --query 'services[0].taskDefinition' --output text)
    
    # Simulate deployment
    echo -e "${BLUE}Simulating deployment for rollback test...${NC}"
    aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --force-new-deployment > /dev/null 2>&1
    sleep 30
    
    # Perform rollback
    echo -e "${BLUE}Testing rollback to previous version...${NC}"
    aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --task-definition $current_task_def > /dev/null 2>&1
    print_status $? "Rollback procedure successful"
}

# Function to simulate a test deployment
test_deployment() {
    echo -e "\n${YELLOW}Simulating Test Deployment...${NC}"
    
    # Create a test commit
    git checkout -b test-deployment
    echo "# Test deployment $(date)" >> README.md
    git add README.md
    git commit -m "test: validate deployment pipeline"
    
    # Push the branch
    git push origin test-deployment
    
    # Create a pull request
    gh pr create --title "test: validate deployment pipeline" --body "Testing CI/CD pipeline" --base main
    
    # Wait for checks to complete
    echo "Waiting for GitHub Actions to complete..."
    gh pr checks test-deployment --watch
    
    # Test rollback if deployment was successful
    if [ $? -eq 0 ]; then
        test_rollback
    fi
    
    # Clean up
    git checkout main
    git branch -D test-deployment
    git push origin --delete test-deployment
}

# Function to clean up test resources
cleanup_resources() {
    echo -e "\n${YELLOW}Cleaning up test resources...${NC}"
    
    # Remove test files
    rm -f test.txt
    
    # Clean up any test containers
    docker system prune -f > /dev/null 2>&1
    
    # Archive log file
    if [ -d "logs" ]; then
        mv "$LOG_FILE" "logs/"
    else
        mkdir logs
        mv "$LOG_FILE" "logs/"
    fi
    
    print_status 0 "Cleanup completed successfully"
}

# Main execution
echo -e "${YELLOW}Starting CI/CD Pipeline Validation${NC}"

# Load environment variables
if [ -z "$1" ]; then
    echo "Usage: $0 <environment>"
    echo "Environment can be 'staging' or 'production'"
    exit 1
fi

environment=$1
project_name="ledgerly"

# Source environment variables
if [ -f ".env.${environment}" ]; then
    source ".env.${environment}"
else
    echo -e "${RED}Environment file .env.${environment} not found${NC}"
    exit 1
fi

# Run tests
validate_env_vars
test_aws_credentials
test_s3_bucket
test_cloudfront
test_ecs_cluster
test_ecs_service
test_ecr_repository
test_rds_instance
test_secrets_manager
test_sns_topics
test_cloudwatch_alarms
test_github_workflow
test_plaid_integration

# Ask for deployment test
read -p "Do you want to simulate a test deployment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_deployment
fi

# Clean up
cleanup_resources

echo -e "\n${GREEN}CI/CD Pipeline Validation Complete!${NC}"
echo -e "${BLUE}Log file: logs/$LOG_FILE${NC}" 