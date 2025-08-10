# Production Environment Configuration
environment = "production"
aws_region  = "us-east-1"

# Network Configuration
vpc_cidr = "10.0.0.0/16"

# EKS Configuration
kubernetes_version      = "1.28"
node_group_desired_size = 5
node_group_min_size     = 3
node_group_max_size     = 15
node_instance_types     = ["t3.large", "t3.xlarge"]

# RDS Configuration
postgres_version         = "15.4"
db_instance_class        = "db.r6g.xlarge"
db_allocated_storage     = 100
db_max_allocated_storage = 500

# Redis Configuration
redis_version   = "7.0"
redis_node_type = "cache.r6g.large"

# Domain Configuration
domain_name = "taxomind.com"

# Billing
cost_center = "production-engineering"