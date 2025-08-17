# AWS Deployment Guide

## Overview

This guide covers deploying Taxomind on AWS using various services including EC2, ECS, RDS, ElastiCache, and CloudFront for a scalable, enterprise-grade deployment.

## AWS Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                   Route 53 (DNS)                         │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                CloudFront (CDN)                          │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│            Application Load Balancer (ALB)               │
└─────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                            │
┌───────▼────────┐                       ┌──────────▼────────┐
│   ECS Fargate  │                       │   Lambda Functions│
│   (Next.js)    │                       │   (API Routes)    │
└────────────────┘                       └───────────────────┘
        │                                            │
        └─────────────────────┬─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                      │
┌───────▼────────┐    ┌───────▼────────┐   ┌───────▼────────┐
│   RDS Aurora   │    │  ElastiCache   │   │      S3        │
│  (PostgreSQL)  │    │    (Redis)     │   │   (Storage)    │
└────────────────┘    └────────────────┘   └────────────────┘
```

## Prerequisites

### AWS CLI Setup
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
AWS Access Key ID: YOUR_ACCESS_KEY
AWS Secret Access Key: YOUR_SECRET_KEY
Default region name: us-east-1
Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### Required IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "rds:*",
        "elasticache:*",
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "elasticloadbalancing:*",
        "logs:*",
        "iam:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Infrastructure as Code (Terraform)

### Main Configuration
```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "taxomind-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
  
  name = "taxomind-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  enable_dns_hostnames = true
  
  tags = {
    Environment = var.environment
    Project     = "taxomind"
  }
}
```

### ECS Cluster Configuration
```hcl
# ecs.tf
resource "aws_ecs_cluster" "main" {
  name = "taxomind-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "taxomind-app"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = var.fargate_cpu
  memory                  = var.fargate_memory
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "taxomind"
      image = "${aws_ecr_repository.main.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_url.arn
        },
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = aws_secretsmanager_secret.nextauth.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = "taxomind-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"
  
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets         = module.vpc.private_subnets
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "taxomind"
    container_port   = 3000
  }
  
  depends_on = [aws_alb_listener.front_end]
}
```

### RDS Aurora Configuration
```hcl
# rds.tf
resource "aws_rds_cluster" "postgresql" {
  cluster_identifier      = "taxomind-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.2"
  database_name          = "taxomind"
  master_username        = "taxomind_admin"
  master_password        = random_password.db_password.result
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  serverlessv2_scaling_configuration {
    max_capacity = 16
    min_capacity = 0.5
  }
}

resource "aws_rds_cluster_instance" "postgresql" {
  count              = 2
  identifier         = "taxomind-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.postgresql.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.postgresql.engine
  engine_version     = aws_rds_cluster.postgresql.engine_version
  
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
}
```

## Container Registry (ECR)

### ECR Setup
```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name taxomind \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t taxomind .
docker tag taxomind:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/taxomind:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/taxomind:latest
```

### ECR Lifecycle Policy
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

## Load Balancer Configuration

### Application Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name taxomind-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-12345 \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
  --name taxomind-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345 \
  --target-type ip \
  --health-check-path /api/health \
  --health-check-interval-seconds 30

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

## Auto Scaling

### ECS Auto Scaling
```hcl
# autoscaling.tf
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_policy" "memory" {
  name               = "memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
  }
}
```

## CloudFront CDN

### CloudFront Distribution
```hcl
# cloudfront.tf
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled    = true
  comment            = "Taxomind CDN"
  default_root_object = "index.html"
  aliases            = ["app.taxomind.com"]
  price_class        = "PriceClass_All"
  
  origin {
    domain_name = aws_alb.main.dns_name
    origin_id   = "ALB-${aws_alb.main.id}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_alb.main.id}"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "CloudFront-Forwarded-Proto", "CloudFront-Is-Desktop-Viewer", "CloudFront-Is-Mobile-Viewer"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }
  
  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = aws_wafv2_web_acl.main.arn
}
```

## ElastiCache Redis

### Redis Cluster
```hcl
# elasticache.tf
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "taxomind-redis"
  replication_group_description = "Redis cluster for Taxomind"
  engine                     = "redis"
  node_type                  = "cache.r6g.large"
  number_cache_clusters      = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = random_password.redis_auth.result
  
  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type        = "slow-log"
  }
}
```

## S3 Storage

### S3 Bucket Configuration
```hcl
# s3.tf
resource "aws_s3_bucket" "uploads" {
  bucket = "taxomind-uploads-${var.environment}"
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["https://app.taxomind.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
```

## Secrets Management

### AWS Secrets Manager
```bash
# Create secrets
aws secretsmanager create-secret \
  --name taxomind/production/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

aws secretsmanager create-secret \
  --name taxomind/production/nextauth-secret \
  --secret-string "$(openssl rand -base64 32)"

# Retrieve secrets in application
const { SecretsManager } = require('@aws-sdk/client-secrets-manager');
const client = new SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName) {
  const response = await client.getSecretValue({ SecretId: secretName });
  return response.SecretString;
}
```

## Monitoring and Logging

### CloudWatch Configuration
```hcl
# cloudwatch.tf
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "taxomind-production"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections"],
            [".", "CPUUtilization"],
            [".", "FreeableMemory"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "taxomind-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/ECS"
  period             = "120"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors ECS CPU utilization"
  alarm_actions      = [aws_sns_topic.alerts.arn]
}
```

## CI/CD Pipeline

### CodePipeline Configuration
```yaml
# buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/taxomind
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      
  build:
    commands:
      - echo Build started on `date`
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
      
  post_build:
    commands:
      - echo Build completed on `date`
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - printf '[{"name":"taxomind","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files: imagedefinitions.json
```

## Security Configuration

### WAF Rules
```hcl
# waf.tf
resource "aws_wafv2_web_acl" "main" {
  name  = "taxomind-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    action {
      block {}
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
}
```

## Cost Optimization

### Resource Tagging
```hcl
# tags.tf
locals {
  common_tags = {
    Environment = var.environment
    Project     = "taxomind"
    ManagedBy   = "terraform"
    CostCenter  = "engineering"
    Owner       = "devops@taxomind.com"
  }
}

# Apply tags to all resources
resource "aws_instance" "example" {
  # ... other configuration ...
  tags = merge(local.common_tags, {
    Name = "taxomind-instance"
    Type = "application"
  })
}
```

### Savings Plans
```bash
# Purchase Compute Savings Plan
aws savingsplans purchase-savings-plan \
  --savings-plan-offering-id <offering-id> \
  --commitment 100 \
  --purchase-term All_Upfront
```

## Disaster Recovery

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

# RDS backup
aws rds create-db-snapshot \
  --db-instance-identifier taxomind-production \
  --db-snapshot-identifier taxomind-snapshot-$(date +%Y%m%d-%H%M%S)

# S3 cross-region replication
aws s3api put-bucket-replication \
  --bucket taxomind-uploads \
  --replication-configuration file://replication.json

# EBS snapshots
aws ec2 create-snapshot \
  --volume-id vol-12345 \
  --description "Taxomind backup $(date)"
```

### Multi-Region Failover
```hcl
# dr.tf
resource "aws_route53_health_check" "primary" {
  fqdn              = "app.taxomind.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = "3"
  request_interval  = "30"
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.taxomind.com"
  type    = "A"
  
  set_identifier = "Primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}
```

## Deployment Commands

### Deploy Infrastructure
```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Deploy application
./scripts/deploy-to-aws.sh
```

### Update Application
```bash
# Build and push new image
docker build -t taxomind:v2.0.0 .
docker tag taxomind:v2.0.0 $ECR_URI:v2.0.0
docker push $ECR_URI:v2.0.0

# Update ECS service
aws ecs update-service \
  --cluster taxomind-cluster \
  --service taxomind-service \
  --force-new-deployment
```

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Cloud Provider: AWS*