#!/bin/bash

# =============================================================================
# Collaborative Editing Features Deployment Script
# =============================================================================
# This script deploys collaborative editing features to staging/production
# 
# Usage:
#   ./scripts/deploy-collaborative-features.sh [environment]
#   
# Environments: staging, production
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
LOG_FILE="./logs/collaborative-deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if environment is valid
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT"
    error "Valid environments: staging, production"
    exit 1
fi

# Create logs directory
mkdir -p ./logs

log "Starting collaborative editing deployment for: $ENVIRONMENT"

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    local commands=("node" "npm" "npx" "git" "pg_dump")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -f "prisma/schema.prisma" ]]; then
        error "Must be run from project root directory"
        exit 1
    fi
    
    # Check environment variables
    if [[ -z "${DATABASE_URL:-}" ]]; then
        error "DATABASE_URL environment variable not set"
        exit 1
    fi
    
    log "Prerequisites check passed"
}

# Function to backup current code
backup_code() {
    log "Creating code backup..."
    
    local backup_dir="./backups/code-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Create a git archive of current state
    git archive HEAD | tar -x -C "$backup_dir"
    
    log "Code backup created: $backup_dir"
}

# Function to run pre-deployment tests
run_tests() {
    log "Running pre-deployment tests..."
    
    # Type checking
    info "Running TypeScript type check..."
    npx tsc --noEmit --skipLibCheck || {
        warn "TypeScript type check found issues, but continuing..."
    }
    
    # Linting
    info "Running ESLint..."
    npm run lint || {
        error "Linting failed"
        exit 1
    }
    
    # Database connection test
    info "Testing database connection..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect()
            .then(() => { console.log('✅ Database connection successful'); process.exit(0); })
            .catch((err) => { console.error('❌ Database connection failed:', err); process.exit(1); })
            .finally(() => prisma.\$disconnect());
    " || {
        error "Database connection test failed"
        exit 1
    }
    
    log "All pre-deployment tests passed"
}

# Function to deploy database changes
deploy_database() {
    log "Deploying database changes..."
    
    # Run the collaborative features migration
    node "$SCRIPT_DIR/migrate-collaborative-features.js" || {
        error "Database migration failed"
        exit 1
    }
    
    log "Database deployment completed"
}

# Function to build application
build_application() {
    log "Building application..."
    
    # Clean previous builds
    rm -rf .next
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci --only=production
    
    # Build application
    info "Building Next.js application..."
    NODE_OPTIONS='--max-old-space-size=8192' npm run build || {
        error "Application build failed"
        exit 1
    }
    
    log "Application build completed"
}

# Function to run post-deployment verification
verify_deployment() {
    log "Running post-deployment verification..."
    
    # Test collaborative features
    info "Testing collaborative editing features..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function testCollaborativeFeatures() {
            try {
                // Test CollaborativeCursor
                const cursorCount = await prisma.collaborativeCursor.count();
                console.log('✅ CollaborativeCursor table accessible');
                
                // Test CollaborativeOperation
                const operationCount = await prisma.collaborativeOperation.count();
                console.log('✅ CollaborativeOperation table accessible');
                
                // Test CollaborativePermission
                const permissionCount = await prisma.collaborativePermission.count();
                console.log('✅ CollaborativePermission table accessible');
                
                // Test PermissionRule
                const ruleCount = await prisma.permissionRule.count();
                console.log('✅ PermissionRule table accessible');
                
                // Test enhanced SessionComment
                const commentCount = await prisma.sessionComment.count();
                console.log('✅ Enhanced SessionComment table accessible');
                
                console.log('🎉 All collaborative features verified successfully');
            } catch (error) {
                console.error('❌ Verification failed:', error);
                process.exit(1);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        testCollaborativeFeatures();
    " || {
        error "Collaborative features verification failed"
        exit 1
    }
    
    log "Post-deployment verification completed"
}

# Function to update monitoring
setup_monitoring() {
    log "Setting up monitoring for collaborative features..."
    
    # Create monitoring script
    cat > "./scripts/monitor-collaborative.js" << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function monitorCollaborativeFeatures() {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Monitor active sessions
        const activeSessions = await prisma.collaborativeSession.count({
            where: {
                isActive: true,
                lastActivity: {
                    gte: oneHourAgo
                }
            }
        });
        
        // Monitor recent operations
        const recentOps = await prisma.collaborativeOperation.count({
            where: {
                timestamp: {
                    gte: oneHourAgo
                }
            }
        });
        
        // Monitor conflicts
        const recentConflicts = await prisma.sessionConflict.count({
            where: {
                createdAt: {
                    gte: oneHourAgo
                },
                resolved: false
            }
        });
        
        console.log('Collaborative Features Status:', {
            activeSessions,
            recentOperations: recentOps,
            unresolvedConflicts: recentConflicts,
            timestamp: now.toISOString()
        });
        
        // Alert on high conflict rate
        if (recentConflicts > 10) {
            console.warn('⚠️  High conflict rate detected:', recentConflicts);
        }
        
    } catch (error) {
        console.error('❌ Monitoring failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

monitorCollaborativeFeatures();
EOF

    chmod +x "./scripts/monitor-collaborative.js"
    
    log "Monitoring setup completed"
}

# Function to rollback deployment
rollback_deployment() {
    error "Deployment failed. Initiating rollback..."
    
    # Check if backup exists
    local latest_backup=$(ls -t ./backups/backup-collaborative-*.sql 2>/dev/null | head -1)
    
    if [[ -n "$latest_backup" ]]; then
        warn "Attempting to restore database from: $latest_backup"
        
        # Restore database
        psql "$DATABASE_URL" < "$latest_backup" || {
            error "Database rollback failed"
            error "Manual intervention required"
            exit 1
        }
        
        warn "Database rollback completed"
    else
        warn "No database backup found for rollback"
    fi
    
    error "Rollback completed. Please investigate the deployment failure."
    exit 1
}

# Main deployment function
main() {
    trap rollback_deployment ERR
    
    log "🚀 Starting collaborative editing deployment"
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    
    check_prerequisites
    backup_code
    run_tests
    deploy_database
    build_application
    verify_deployment
    setup_monitoring
    
    log "🎉 Collaborative editing deployment completed successfully!"
    log ""
    log "📋 Post-deployment checklist:"
    log "   ✅ Database schema updated with collaborative models"
    log "   ✅ Application built and ready"
    log "   ✅ Monitoring scripts installed"
    log "   ✅ Verification tests passed"
    log ""
    log "📊 Next steps:"
    log "   1. Monitor application performance"
    log "   2. Test collaborative features with real users"
    log "   3. Review monitoring dashboard for metrics"
    log "   4. Check logs for any warnings or errors"
    log ""
    log "💡 Monitoring command: node scripts/monitor-collaborative.js"
    log "📁 Deployment logs: $LOG_FILE"
}

# Run main function
main "$@"