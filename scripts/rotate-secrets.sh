#!/bin/bash

# Script to help with secret rotation and management
# This script requires the AWS CLI and GitHub CLI to be installed and configured

set -e

# Function to generate a secure random string
generate_secret() {
    openssl rand -base64 32
}

# Function to update AWS Secrets Manager
update_aws_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local environment="$3"

    aws secretsmanager update-secret-value \
        --secret-id "ledgerly/${environment}/${secret_name}" \
        --secret-string "$secret_value"
}

# Function to update GitHub environment secret
update_github_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local environment="$3"

    echo "$secret_value" | gh secret set "$secret_name" --env "$environment"
}

# Function to rotate a specific secret
rotate_secret() {
    local secret_name="$1"
    local environment="$2"
    local new_value

    case "$secret_name" in
        "JWT_SECRET")
            new_value=$(generate_secret)
            ;;
        "DB_PASSWORD")
            new_value=$(generate_secret)
            ;;
        *)
            echo "Manual rotation required for $secret_name"
            echo "Please enter the new value:"
            read -s new_value
            echo
            ;;
    esac

    # Update AWS Secrets Manager
    update_aws_secret "$secret_name" "$new_value" "$environment"

    # Update GitHub Environment Secret
    update_github_secret "$secret_name" "$new_value" "$environment"

    echo "Successfully rotated $secret_name for $environment environment"
}

# Main script
main() {
    local environment="$1"
    local secret_name="$2"

    if [[ -z "$environment" || -z "$secret_name" ]]; then
        echo "Usage: $0 <environment> <secret_name>"
        echo "Environments: staging, production"
        echo "Secret names: JWT_SECRET, DB_PASSWORD, etc."
        exit 1
    fi

    if [[ "$environment" != "staging" && "$environment" != "production" ]]; then
        echo "Invalid environment. Must be 'staging' or 'production'"
        exit 1
    fi

    # Confirm before proceeding
    read -p "Are you sure you want to rotate $secret_name in $environment? (y/N) " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Operation cancelled"
        exit 0
    fi

    rotate_secret "$secret_name" "$environment"
}

main "$@" 