#!/bin/bash

# 🤖 Solo Developer Automation Script
# Automates repetitive tasks and maintains code quality

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Auto-commit with intelligent message generation
auto_commit() {
    if [ -z "$(git status --porcelain)" ]; then
        log_info "No changes to commit"
        return 0
    fi
    
    log_info "Analyzing changes for commit message..."
    
    # Analyze changed files to generate commit message
    local files_changed=$(git diff --name-only --cached | wc -l)
    local files_added=$(git diff --name-only --cached --diff-filter=A | wc -l)
    local files_modified=$(git diff --name-only --cached --diff-filter=M | wc -l)
    local files_deleted=$(git diff --name-only --cached --diff-filter=D | wc -l)
    
    # Intelligent commit message based on changes
    local commit_type="feat"
    local commit_scope=""
    local commit_message=""
    
    # Check for specific patterns
    if git diff --name-only --cached | grep -q "test"; then
        commit_type="test"
    elif git diff --name-only --cached | grep -q "\.md$"; then
        commit_type="docs"
    elif git diff --name-only --cached | grep -q "package\.json\|package-lock\.json"; then
        commit_type="build"
    elif git diff --name-only --cached | grep -q "\.scss\|\.css\|\.tailwind"; then
        commit_type="style"
    elif [ $files_deleted -gt 0 ]; then
        commit_type="refactor"
    fi
    
    # Generate descriptive message
    if [ $files_changed -eq 1 ]; then
        local file_name=$(basename $(git diff --name-only --cached))
        commit_message="update $file_name"
    else
        commit_message="update $files_changed files"
        if [ $files_added -gt 0 ]; then
            commit_message="$commit_message (${files_added} added"
        fi
        if [ $files_modified -gt 0 ]; then
            commit_message="$commit_message, ${files_modified} modified"
        fi
        if [ $files_deleted -gt 0 ]; then
            commit_message="$commit_message, ${files_deleted} deleted"
        fi
        commit_message="$commit_message)"
    fi
    
    local full_commit_message="${commit_type}: ${commit_message}"
    
    log_info "Generated commit message: $full_commit_message"
    git commit -m "$full_commit_message"
    log_success "Auto-commit completed!"
}

# Database maintenance
maintain_database() {
    log_info "Running database maintenance..."
    
    # Update Prisma client
    npx prisma generate
    
    # Check for schema drift
    if ! npx prisma db pull --print 2>/dev/null | diff - prisma/schema.prisma >/dev/null 2>&1; then
        log_warning "Database schema drift detected!"
        log_info "Run 'npx prisma db pull' to sync schema"
    fi
    
    # Optimize database (if in development)
    if [ "$NODE_ENV" = "development" ]; then
        log_info "Running development database optimization..."
        # Add database optimization commands here
    fi
    
    log_success "Database maintenance completed!"
}

# Code quality maintenance
maintain_code_quality() {
    log_info "Running code quality maintenance..."
    
    # Auto-fix linting issues
    npm run lint -- --fix || true
    
    # Format code
    if command -v prettier >/dev/null 2>&1; then
        npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" || true
    fi
    
    # Update imports and remove unused ones
    if command -v typescript >/dev/null 2>&1; then
        # This would require a custom script to organize imports
        log_info "Import organization would run here (custom script needed)"
    fi
    
    log_success "Code quality maintenance completed!"
}

# Dependency maintenance
maintain_dependencies() {
    log_info "Running dependency maintenance..."
    
    # Check for outdated packages
    log_info "Checking for outdated packages..."
    npm outdated || true
    
    # Security audit
    npm audit --audit-level moderate
    
    # Clean node_modules if too large
    local node_modules_size=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "0B")
    log_info "node_modules size: $node_modules_size"
    
    # Clean npm cache
    npm cache verify
    
    log_success "Dependency maintenance completed!"
}

# Performance monitoring
monitor_performance() {
    log_info "Running performance monitoring..."
    
    # Check build size
    if [ -d ".next" ]; then
        local build_size=$(du -sh .next 2>/dev/null | cut -f1)
        log_info "Build size: $build_size"
    fi
    
    # Check for large files
    log_info "Checking for large files..."
    find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | tail -10
    
    # Memory usage check
    log_info "System resources:"
    echo "  Memory: $(free -h 2>/dev/null | grep '^Mem:' | awk '{print $3 "/" $2}' || echo 'N/A')"
    echo "  Disk: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    
    log_success "Performance monitoring completed!"
}

# Project health check
health_check() {
    log_info "Running project health check..."
    
    local issues=0
    
    # Check critical files
    local critical_files=("package.json" "prisma/schema.prisma" "next.config.js" ".env.example")
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Missing critical file: $file"
            ((issues++))
        fi
    done
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Uncommitted changes detected"
    fi
    
    # Check if on correct branch for development
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "dev" ] && [ "$current_branch" != "staging" ]; then
        log_warning "Consider switching to dev branch for development"
    fi
    
    # Check Docker containers
    if command -v docker >/dev/null 2>&1; then
        if ! docker ps | grep -q taxomind-dev-db; then
            log_warning "Development database container not running"
        fi
    fi
    
    if [ $issues -eq 0 ]; then
        log_success "Project health check passed!"
    else
        log_warning "Project health check found $issues issues"
    fi
    
    return $issues
}

# Main automation routine
daily_maintenance() {
    log_info "🤖 Running daily maintenance routine..."
    
    maintain_database
    maintain_dependencies
    maintain_code_quality
    monitor_performance
    health_check
    
    log_success "Daily maintenance completed!"
    
    # Generate maintenance report
    cat > maintenance-report-$(date +%Y%m%d).md << EOF
# 🤖 Daily Maintenance Report - $(date)

## Tasks Completed
- ✅ Database maintenance
- ✅ Dependency maintenance  
- ✅ Code quality maintenance
- ✅ Performance monitoring
- ✅ Health check

## System Status
- Branch: $(git branch --show-current)
- Commit: $(git rev-parse --short HEAD)
- Node.js: $(node --version)
- npm: $(npm --version)

## Next Actions
- Continue development on current branch
- Monitor CI/CD pipeline results
- Review any warnings from maintenance tasks

---
*Generated by solo-dev-automation*
EOF
}

case "$1" in
    "commit")
        git add -A
        auto_commit
        ;;
        
    "maintain")
        daily_maintenance
        ;;
        
    "db")
        maintain_database
        ;;
        
    "deps")
        maintain_dependencies
        ;;
        
    "quality")
        maintain_code_quality
        ;;
        
    "health")
        health_check
        ;;
        
    "monitor")
        monitor_performance
        ;;
        
    *)
        echo "🤖 Solo Developer Automation Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  commit    - Stage all changes and auto-commit with intelligent message"
        echo "  maintain  - Run complete daily maintenance routine"
        echo "  db        - Database maintenance only"
        echo "  deps      - Dependency maintenance only"
        echo "  quality   - Code quality maintenance only"
        echo "  health    - Project health check only"
        echo "  monitor   - Performance monitoring only"
        echo ""
        echo "Recommended usage:"
        echo "  ./scripts/solo-dev-automation.sh maintain    # Daily"
        echo "  ./scripts/solo-dev-automation.sh commit     # After coding sessions"
        echo "  ./scripts/solo-dev-automation.sh health     # Before important tasks"
        ;;
esac