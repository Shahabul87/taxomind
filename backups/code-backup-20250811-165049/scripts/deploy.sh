#!/bin/bash

# Production Deployment Script for Alam LMS
# This script handles the complete deployment process

set -e

# Configuration
APP_NAME="alam-lms"
DEPLOY_USER=${DEPLOY_USER:-"deploy"}
DEPLOY_HOST=${DEPLOY_HOST:-"your-server.com"}
DEPLOY_PATH=${DEPLOY_PATH:-"/var/www/alam-lms"}
BACKUP_DIR=${BACKUP_DIR:-"/var/backups/alam-lms"}
LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    for cmd in git npm node docker docker-compose; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is not installed or not in PATH"
        fi
    done
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found. Please create it from .env.production.example"
    fi
    
    # Check if SSH key exists for deployment
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
        error "No SSH key found. Please generate an SSH key for deployment."
    fi
    
    success "Prerequisites check passed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Install dependencies
    npm ci
    
    # Run linting
    npm run lint || warn "Linting failed"
    
    # Run type checking
    npm run type-check || warn "Type checking failed"
    
    # Run unit tests
    npm run test:unit || error "Unit tests failed"
    
    # Run integration tests
    npm run test:integration || error "Integration tests failed"
    
    success "All tests passed"
}

# Build application
build_application() {
    log "Building application..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Build Next.js application
    npm run build
    
    # Build Docker images
    docker build -f Dockerfile.production -t $APP_NAME:latest .
    
    success "Application built successfully"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Create backup before migration
    create_database_backup
    
    # Run Prisma migrations
    npx prisma migrate deploy
    
    # Seed database if needed
    if [ "$SEED_DATABASE" = "true" ]; then
        npm run db:seed:production
    fi
    
    success "Database migrations completed"
}

# Create database backup
create_database_backup() {
    log "Creating database backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamp
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP.sql"
    
    # Create database backup
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        success "Database backup created: $BACKUP_FILE.gz"
    else
        warn "DATABASE_URL not set, skipping database backup"
    fi
}

# Deploy using Docker Compose
deploy_docker() {
    log "Deploying with Docker Compose..."
    
    # Stop existing services
    docker-compose -f docker-compose.production.yml down
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    wait_for_health_check
    
    success "Docker deployment completed"
}

# Deploy using PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    # Stop existing PM2 processes
    pm2 delete ecosystem.config.js || true
    
    # Start PM2 processes
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 process list
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    success "PM2 deployment completed"
}

# Wait for health check
wait_for_health_check() {
    log "Waiting for application to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            success "Application is healthy"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, waiting 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Application failed to become healthy after $max_attempts attempts"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Start monitoring services if using Docker
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        docker-compose -f docker-compose.production.yml up -d prometheus grafana
    fi
    
    # Setup log rotation
    setup_log_rotation
    
    success "Monitoring setup completed"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/alam-lms << EOF
/var/www/alam-lms/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    success "Log rotation configured"
}

# Run security checks
run_security_checks() {
    log "Running security checks..."
    
    # Check for security vulnerabilities in dependencies
    npm audit --audit-level high
    
    # Check for secrets in code
    if command -v truffleHog &> /dev/null; then
        truffleHog --regex --entropy=False .
    fi
    
    # Check Docker image for vulnerabilities
    if command -v trivy &> /dev/null; then
        trivy image $APP_NAME:latest
    fi
    
    success "Security checks completed"
}

# Rollback function
rollback() {
    log "Starting rollback process..."
    
    # Stop current deployment
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        docker-compose -f docker-compose.production.yml down
    else
        pm2 stop ecosystem.config.js
    fi
    
    # Restore database backup
    if [ -n "$ROLLBACK_BACKUP" ]; then
        log "Restoring database from backup: $ROLLBACK_BACKUP"
        gunzip -c "$ROLLBACK_BACKUP" | psql "$DATABASE_URL"
    fi
    
    # Revert to previous version
    git checkout HEAD~1
    build_application
    
    # Redeploy
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        deploy_docker
    else
        deploy_pm2
    fi
    
    success "Rollback completed"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove old Docker images
    docker image prune -f
    
    # Remove old log files
    find ./logs -name "*.log" -mtime +7 -delete
    
    # Remove old backup files
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment of $APP_NAME..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --method)
                DEPLOYMENT_METHOD="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                ROLLBACK_BACKUP="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --method [docker|pm2]  Deployment method (default: docker)"
                echo "  --skip-tests           Skip running tests"
                echo "  --skip-backup          Skip database backup"
                echo "  --rollback [backup]    Rollback to previous version"
                echo "  --help                 Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Set default deployment method
    DEPLOYMENT_METHOD=${DEPLOYMENT_METHOD:-"docker"}
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        rollback
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    
    if [ "$SKIP_TESTS" != true ]; then
        run_tests
    fi
    
    run_security_checks
    build_application
    
    if [ "$SKIP_BACKUP" != true ]; then
        create_database_backup
    fi
    
    run_migrations
    
    if [ "$DEPLOYMENT_METHOD" = "docker" ]; then
        deploy_docker
    else
        deploy_pm2
    fi
    
    setup_monitoring
    cleanup
    
    success "Deployment completed successfully!"
    log "Deployment log saved to: $LOG_FILE"
}

# Trap errors and cleanup
trap 'error "Deployment failed! Check log file: $LOG_FILE"' ERR

# Run main function
main "$@"