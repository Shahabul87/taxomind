#!/bin/bash

# Database Migration Manager for Taxomind LMS
# Handles automated database migrations with safety checks and rollback capability

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-taxomind}"
MIGRATION_IMAGE="${MIGRATION_IMAGE:-taxomind/migrations:latest}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-600}"
DRY_RUN="${DRY_RUN:-false}"
PARALLEL_EXECUTION="${PARALLEL_EXECUTION:-false}"

# Database configuration
DB_SECRET_NAME="${DB_SECRET_NAME:-taxomind-db-secret}"
DB_BACKUP_BUCKET="${DB_BACKUP_BUCKET:-taxomind-db-backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ]; then
        echo -e "${CYAN}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
    fi
}

# Function to get database connection info
get_db_connection() {
    local db_url
    db_url=$(kubectl get secret "$DB_SECRET_NAME" -n "$NAMESPACE" \
        -o jsonpath='{.data.database-url}' | base64 -d)
    
    # Parse connection string
    local regex='postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)'
    if [[ $db_url =~ $regex ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        log_error "Failed to parse database connection string"
        return 1
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
}

# Function to check database connectivity
check_db_connectivity() {
    log_info "Checking database connectivity..."
    
    kubectl run db-connectivity-test -n "$NAMESPACE" \
        --image=postgres:15 \
        --rm -i --restart=Never \
        --env="PGPASSWORD=$DB_PASSWORD" \
        -- psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Failed to connect to database"
        return 1
    fi
}

# Function to create database backup
create_backup() {
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Creating database backup: $backup_name"
    
    # Create backup job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-backup-$backup_name
  namespace: $NAMESPACE
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: backup
        image: postgres:15
        env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: $DB_SECRET_NAME
              key: password
        command:
        - /bin/bash
        - -c
        - |
          set -e
          echo "Starting backup..."
          
          # Create backup
          pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
            --format=custom \
            --verbose \
            --no-owner \
            --no-acl \
            > /tmp/$backup_name.dump
          
          # Upload to S3
          apt-get update && apt-get install -y awscli
          aws s3 cp /tmp/$backup_name.dump s3://$DB_BACKUP_BUCKET/
          
          echo "Backup completed: $backup_name"
EOF
    
    # Wait for backup to complete
    kubectl wait --for=condition=complete \
        job/db-backup-$backup_name \
        -n "$NAMESPACE" \
        --timeout="${MIGRATION_TIMEOUT}s"
    
    if [ $? -eq 0 ]; then
        log_success "Backup created successfully: $backup_name"
        echo "$backup_name"
        return 0
    else
        log_error "Backup failed"
        return 1
    fi
}

# Function to restore database from backup
restore_backup() {
    local backup_name=$1
    
    log_warning "Restoring database from backup: $backup_name"
    
    # Create restore job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-restore-$(date +%s)
  namespace: $NAMESPACE
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 3600
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: restore
        image: postgres:15
        env:
        - name: PGPASSWORD
          valueFrom:
            secretKeyRef:
              name: $DB_SECRET_NAME
              key: password
        command:
        - /bin/bash
        - -c
        - |
          set -e
          echo "Starting restore..."
          
          # Download backup from S3
          apt-get update && apt-get install -y awscli
          aws s3 cp s3://$DB_BACKUP_BUCKET/$backup_name.dump /tmp/
          
          # Restore backup
          pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
            --clean \
            --if-exists \
            --verbose \
            --no-owner \
            --no-acl \
            /tmp/$backup_name.dump
          
          echo "Restore completed"
EOF
    
    # Wait for restore to complete
    kubectl wait --for=condition=complete \
        job/db-restore-* \
        -n "$NAMESPACE" \
        --timeout="${MIGRATION_TIMEOUT}s"
    
    if [ $? -eq 0 ]; then
        log_success "Database restored successfully"
        return 0
    else
        log_error "Restore failed"
        return 1
    fi
}

# Function to get pending migrations
get_pending_migrations() {
    log_info "Checking for pending migrations..."
    
    local pending
    pending=$(kubectl run migration-check -n "$NAMESPACE" \
        --image="$MIGRATION_IMAGE" \
        --rm -i --restart=Never \
        --env="DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
        -- npx prisma migrate status --schema=/app/prisma/schema.prisma 2>&1 | \
        grep -c "Database schema is not up to date" || echo "0")
    
    if [ "$pending" -gt 0 ]; then
        log_info "Found pending migrations"
        return 0
    else
        log_info "No pending migrations"
        return 1
    fi
}

# Function to validate migration
validate_migration() {
    local migration_name=$1
    
    log_info "Validating migration: $migration_name"
    
    # Run migration in dry-run mode
    kubectl run migration-validate -n "$NAMESPACE" \
        --image="$MIGRATION_IMAGE" \
        --rm -i --restart=Never \
        --env="DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
        -- npx prisma migrate dev --name "$migration_name" --dry-run
    
    if [ $? -eq 0 ]; then
        log_success "Migration validation passed"
        return 0
    else
        log_error "Migration validation failed"
        return 1
    fi
}

# Function to run migration
run_migration() {
    local migration_name=${1:-"auto_migration_$(date +%Y%m%d_%H%M%S)"}
    local backup_name=""
    
    log_info "Starting migration: $migration_name"
    
    # Create backup if enabled
    if [ "$BACKUP_ENABLED" = "true" ]; then
        backup_name=$(create_backup)
        if [ $? -ne 0 ]; then
            log_error "Failed to create backup, aborting migration"
            return 1
        fi
    fi
    
    # Validate migration if not in dry-run mode
    if [ "$DRY_RUN" = "false" ]; then
        if ! validate_migration "$migration_name"; then
            log_error "Migration validation failed"
            return 1
        fi
    fi
    
    # Create migration job
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration-$(date +%s)
  namespace: $NAMESPACE
  labels:
    app: taxomind
    component: migration
    migration-name: $migration_name
spec:
  backoffLimit: 3
  activeDeadlineSeconds: $MIGRATION_TIMEOUT
  template:
    metadata:
      labels:
        app: taxomind
        component: migration
    spec:
      restartPolicy: Never
      initContainers:
      - name: wait-for-db
        image: busybox:1.35
        command: ['sh', '-c', 'until nc -z $DB_HOST $DB_PORT; do echo waiting for database; sleep 2; done']
      containers:
      - name: migration
        image: $MIGRATION_IMAGE
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: $DB_SECRET_NAME
              key: database-url
        - name: NODE_ENV
          value: production
        command:
        - /bin/bash
        - -c
        - |
          set -e
          echo "Running migration: $migration_name"
          
          # Generate migration if needed
          if [ ! -f "/app/prisma/migrations/*/$migration_name/migration.sql" ]; then
            npx prisma migrate dev --name "$migration_name" --create-only
          fi
          
          # Apply migration
          npx prisma migrate deploy
          
          # Verify migration
          npx prisma migrate status
          
          echo "Migration completed successfully"
        volumeMounts:
        - name: migration-scripts
          mountPath: /app/prisma/migrations
      volumes:
      - name: migration-scripts
        configMap:
          name: migration-scripts
EOF
    
    # Wait for migration to complete
    log_info "Waiting for migration to complete..."
    kubectl wait --for=condition=complete \
        job/db-migration-* \
        -n "$NAMESPACE" \
        --timeout="${MIGRATION_TIMEOUT}s"
    
    if [ $? -eq 0 ]; then
        log_success "Migration completed successfully"
        
        # Clean up old backups
        if [ "$BACKUP_ENABLED" = "true" ]; then
            cleanup_old_backups
        fi
        
        return 0
    else
        log_error "Migration failed"
        
        # Attempt rollback if backup exists
        if [ -n "$backup_name" ] && [ "$BACKUP_ENABLED" = "true" ]; then
            log_warning "Attempting to restore from backup..."
            restore_backup "$backup_name"
        fi
        
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # List backups older than retention period
    local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y%m%d)
    
    kubectl run backup-cleanup -n "$NAMESPACE" \
        --image=amazon/aws-cli:latest \
        --rm -i --restart=Never \
        -- s3 ls "s3://$DB_BACKUP_BUCKET/" | \
        while read -r line; do
            local backup_date=$(echo "$line" | grep -oP 'backup-\K[0-9]{8}')
            if [ "$backup_date" -lt "$cutoff_date" ]; then
                local backup_file=$(echo "$line" | awk '{print $4}')
                log_info "Deleting old backup: $backup_file"
                kubectl run backup-delete-$(date +%s) -n "$NAMESPACE" \
                    --image=amazon/aws-cli:latest \
                    --rm -i --restart=Never \
                    -- s3 rm "s3://$DB_BACKUP_BUCKET/$backup_file"
            fi
        done
    
    log_success "Backup cleanup completed"
}

# Function to list migration history
list_migration_history() {
    log_info "Migration history:"
    
    kubectl get jobs -n "$NAMESPACE" \
        -l "component=migration" \
        --sort-by=.metadata.creationTimestamp \
        -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[0].type,TIME:.metadata.creationTimestamp,MIGRATION:.metadata.labels.migration-name
}

# Function to create migration schedule
create_migration_schedule() {
    local schedule=${1:-"0 2 * * *"}  # Default: 2 AM daily
    
    log_info "Creating migration schedule: $schedule"
    
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduled-migration
  namespace: $NAMESPACE
spec:
  schedule: "$schedule"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 3
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: migration-scheduler
            image: $MIGRATION_IMAGE
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: $DB_SECRET_NAME
                  key: database-url
            command:
            - /bin/bash
            - -c
            - |
              # Check for pending migrations
              if npx prisma migrate status | grep -q "Database schema is not up to date"; then
                echo "Pending migrations found, applying..."
                npx prisma migrate deploy
              else
                echo "No pending migrations"
              fi
EOF
    
    log_success "Migration schedule created"
}

# Function to monitor migration progress
monitor_migration() {
    local job_name=$1
    
    log_info "Monitoring migration job: $job_name"
    
    # Stream logs
    kubectl logs -f job/"$job_name" -n "$NAMESPACE" &
    local log_pid=$!
    
    # Wait for completion
    kubectl wait --for=condition=complete \
        job/"$job_name" \
        -n "$NAMESPACE" \
        --timeout="${MIGRATION_TIMEOUT}s"
    
    local exit_code=$?
    
    # Stop log streaming
    kill $log_pid 2>/dev/null
    
    return $exit_code
}

# Main function
main() {
    local action=${1:-help}
    
    # Get database connection info
    get_db_connection
    
    case "$action" in
        migrate)
            local migration_name=${2:-""}
            
            # Check connectivity
            if ! check_db_connectivity; then
                log_error "Cannot connect to database"
                exit 1
            fi
            
            # Check for pending migrations
            if ! get_pending_migrations && [ -z "$migration_name" ]; then
                log_info "No pending migrations to apply"
                exit 0
            fi
            
            # Run migration
            run_migration "$migration_name"
            ;;
            
        backup)
            create_backup
            ;;
            
        restore)
            local backup_name=${2:-}
            if [ -z "$backup_name" ]; then
                log_error "Backup name required"
                exit 1
            fi
            restore_backup "$backup_name"
            ;;
            
        validate)
            local migration_name=${2:-"validation_test"}
            validate_migration "$migration_name"
            ;;
            
        history)
            list_migration_history
            ;;
            
        schedule)
            local cron_schedule=${2:-"0 2 * * *"}
            create_migration_schedule "$cron_schedule"
            ;;
            
        cleanup)
            cleanup_old_backups
            ;;
            
        status)
            kubectl run migration-status -n "$NAMESPACE" \
                --image="$MIGRATION_IMAGE" \
                --rm -i --restart=Never \
                --env="DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
                -- npx prisma migrate status
            ;;
            
        *)
            cat <<EOF
Database Migration Manager for Taxomind LMS

Usage: $0 [ACTION] [OPTIONS]

Actions:
    migrate [name]        Run database migrations
    backup               Create database backup
    restore <backup>     Restore database from backup
    validate [name]      Validate migration without applying
    history              Show migration history
    schedule [cron]      Create scheduled migration job
    cleanup              Clean up old backups
    status               Show current migration status

Environment Variables:
    NAMESPACE            Kubernetes namespace (default: taxomind)
    MIGRATION_IMAGE      Migration container image
    BACKUP_ENABLED       Enable automatic backups (default: true)
    BACKUP_RETENTION_DAYS  Backup retention period (default: 30)
    MIGRATION_TIMEOUT    Migration timeout in seconds (default: 600)
    DRY_RUN             Run in dry-run mode (default: false)

Examples:
    $0 migrate                          # Run pending migrations
    $0 migrate "add_user_roles"         # Run specific migration
    $0 backup                           # Create manual backup
    $0 restore backup-20240115-120000   # Restore from backup
    $0 schedule "0 3 * * *"             # Schedule daily at 3 AM
    $0 history                          # View migration history
EOF
            exit 0
            ;;
    esac
}

# Run main function
main "$@"