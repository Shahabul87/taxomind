#!/bin/bash

# 🚀 Solo Developer Workflow Management Script
# Usage: ./scripts/solo-dev-workflow.sh [command]

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

case "$1" in
    "daily-start")
        log_info "Starting daily development workflow..."
        
        # Switch to dev branch
        git checkout dev
        
        # Pull latest changes
        git pull origin dev
        
        # Install any new dependencies
        npm install
        
        # Run Prisma generate
        npx prisma generate
        
        # Start development environment
        npm run dev:docker:start
        npm run dev:setup
        
        log_success "Development environment ready!"
        log_info "You can now start coding on the dev branch"
        ;;
        
    "feature-complete")
        log_info "Completing feature development..."
        
        # Ensure we're on dev branch
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "dev" ]; then
            log_error "You must be on the dev branch to complete a feature"
            exit 1
        fi
        
        # Run comprehensive checks
        log_info "Running lint checks..."
        npm run lint
        
        log_info "Running type checks..."
        npx tsc --noEmit
        
        log_info "Running tests..."
        npm run test
        
        log_info "Building application..."
        npm run build
        
        log_success "All checks passed! Ready to merge to staging"
        log_info "Run 'solo-dev-workflow.sh merge-to-staging' to proceed"
        ;;
        
    "merge-to-staging")
        log_info "Merging dev to staging for integration testing..."
        
        # Ensure we're on dev and everything is committed
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "dev" ]; then
            log_error "You must be on the dev branch"
            exit 1
        fi
        
        if [ -n "$(git status --porcelain)" ]; then
            log_error "You have uncommitted changes. Please commit or stash them first."
            exit 1
        fi
        
        # Push dev changes
        git push origin dev
        
        # Switch to staging and merge
        git checkout staging
        git pull origin staging
        git merge dev --no-ff -m "feat: merge development changes to staging"
        git push origin staging
        
        log_success "Successfully merged to staging!"
        log_info "CI/CD pipeline will now run on staging branch"
        log_info "Monitor the GitHub Actions for test results"
        ;;
        
    "deploy-to-production")
        log_info "Preparing production deployment..."
        
        # Ensure staging is clean and tested
        git checkout staging
        git pull origin staging
        
        log_warning "⚠️  PRODUCTION DEPLOYMENT"
        log_warning "This will deploy to production. Are you sure?"
        read -p "Type 'DEPLOY' to confirm: " confirm
        
        if [ "$confirm" != "DEPLOY" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
        
        # Merge staging to main
        git checkout main
        git pull origin main
        git merge staging --no-ff -m "release: deploy to production"
        git push origin main
        
        log_success "Production deployment initiated!"
        log_info "Monitor GitHub Actions for deployment progress"
        ;;
        
    "emergency-rollback")
        log_error "🚨 EMERGENCY ROLLBACK PROCEDURE"
        log_info "This will revert the last commit on main branch"
        
        read -p "Type 'EMERGENCY' to confirm rollback: " confirm
        if [ "$confirm" != "EMERGENCY" ]; then
            log_info "Rollback cancelled"
            exit 0
        fi
        
        git checkout main
        git pull origin main
        git revert HEAD --no-edit
        git push origin main
        
        log_success "Emergency rollback completed!"
        ;;
        
    "status")
        log_info "=== SOLO DEV PROJECT STATUS ==="
        echo ""
        
        log_info "Current branch: $(git branch --show-current)"
        log_info "Git status:"
        git status --short
        echo ""
        
        log_info "Recent commits:"
        git log --oneline -5
        echo ""
        
        log_info "Branch comparison:"
        echo "  dev -> staging: $(git rev-list --count staging..dev) commits ahead"
        echo "  staging -> main: $(git rev-list --count main..staging) commits ahead"
        echo ""
        
        log_info "Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
        ;;
        
    "cleanup")
        log_info "Cleaning up development environment..."
        
        # Stop Docker containers
        npm run dev:docker:stop
        
        # Clean build artifacts
        rm -rf .next
        rm -rf node_modules/.cache
        
        # Clean test artifacts
        rm -rf coverage
        rm -rf lighthouse-results
        
        log_success "Cleanup completed!"
        ;;
        
    *)
        echo "🚀 Solo Developer Workflow Manager"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  daily-start         - Start daily development (setup dev branch & environment)"
        echo "  feature-complete    - Run all checks after completing a feature"
        echo "  merge-to-staging    - Merge dev to staging for integration testing"
        echo "  deploy-to-production - Deploy staging to production"
        echo "  emergency-rollback  - Emergency rollback of production"
        echo "  status              - Show project status and branch information"
        echo "  cleanup             - Clean up development environment"
        echo ""
        echo "Typical workflow:"
        echo "  1. ./scripts/solo-dev-workflow.sh daily-start"
        echo "  2. [Develop features on dev branch]"
        echo "  3. ./scripts/solo-dev-workflow.sh feature-complete"
        echo "  4. ./scripts/solo-dev-workflow.sh merge-to-staging"
        echo "  5. [Wait for CI/CD to pass on staging]"
        echo "  6. ./scripts/solo-dev-workflow.sh deploy-to-production"
        ;;
esac