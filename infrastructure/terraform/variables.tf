# Terraform Variables for Taxomind LMS Infrastructure

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in EKS node group"
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in EKS node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in EKS node group"
  type        = number
  default     = 10
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "postgres_version" {
  description = "PostgreSQL version for RDS"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "redis_version" {
  description = "Redis version for ElastiCache"
  type        = string
  default     = "7.0"
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "taxomind.com"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "engineering"
}

variable "openai_api_key" {
  description = "OpenAI API key for AI features"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for AI features"
  type        = string
  sensitive   = true
}

# Environment-specific variable overrides
variable "production_overrides" {
  description = "Production environment overrides"
  type = object({
    node_instance_types      = list(string)
    node_group_desired_size  = number
    db_instance_class        = string
    redis_node_type          = string
  })
  default = {
    node_instance_types      = ["t3.large", "t3.xlarge"]
    node_group_desired_size  = 5
    db_instance_class        = "db.r6g.xlarge"
    redis_node_type          = "cache.r6g.large"
  }
}

variable "staging_overrides" {
  description = "Staging environment overrides"
  type = object({
    node_instance_types      = list(string)
    node_group_desired_size  = number
    db_instance_class        = string
    redis_node_type          = string
  })
  default = {
    node_instance_types      = ["t3.medium"]
    node_group_desired_size  = 2
    db_instance_class        = "db.t3.small"
    redis_node_type          = "cache.t3.small"
  }
}