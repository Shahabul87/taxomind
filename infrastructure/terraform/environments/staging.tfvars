# Staging Environment Configuration
environment = "staging"
aws_region  = "us-east-1"

# Network Configuration
vpc_cidr = "10.1.0.0/16"

# EKS Configuration
kubernetes_version      = "1.28"
node_group_desired_size = 2
node_group_min_size     = 1
node_group_max_size     = 5
node_instance_types     = ["t3.medium"]

# RDS Configuration
postgres_version         = "15.4"
db_instance_class        = "db.t3.small"
db_allocated_storage     = 20
db_max_allocated_storage = 100

# Redis Configuration
redis_version   = "7.0"
redis_node_type = "cache.t3.small"

# Domain Configuration
domain_name = "taxomind.com"

# Billing
cost_center = "staging-engineering"