#!/bin/bash

###############################################################################
# Railway Build Simulation Script
#
# This script replicates the exact build process that Railway uses.
# It follows the same steps defined in railway.json
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}===================================================================${NC}"
}

# Start
clear
log_section "🚀 Railway Build Simulation"
log_info "This script replicates Railway's Nixpacks build process"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if [ ! -f package.json ]; then
    log_error "package.json not found. Are you in the project root?"
    exit 1
fi
log_success "package.json found"

if [ ! -f prisma/schema.prisma ]; then
    log_error "Prisma schema not found at prisma/schema.prisma"
    exit 1
fi
log_success "Prisma schema found"

# Check environment file
if [ -f .env.production ]; then
    log_success ".env.production found"
    log_warning "Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f .env ]; then
    log_warning ".env.production not found, using .env instead"
    export $(cat .env | grep -v '^#' | xargs)
else
    log_error "No environment file found (.env.production or .env)"
    exit 1
fi

# Verify critical environment variables
log_info "Verifying environment variables..."

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set"
    exit 1
fi
log_success "DATABASE_URL configured"

if [ -z "$NEXTAUTH_SECRET" ] && [ -z "$AUTH_SECRET" ]; then
    log_warning "NEXTAUTH_SECRET or AUTH_SECRET not set (may cause issues)"
else
    log_success "Auth secrets configured"
fi

# Node version check
NODE_VERSION=$(node -v)
log_info "Node version: $NODE_VERSION"
if [[ "$NODE_VERSION" < "v18" ]]; then
    log_warning "Node version is older than v18. Railway uses Node 20."
fi

# Railway Build Process Starts Here
log_section "📦 Phase 1: Installing Dependencies"
log_info "Running: npm ci"
echo ""

if npm ci; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi

log_section "🔧 Phase 2: Generating Prisma Client"
log_info "Running: npx prisma generate"
echo ""

if npx prisma generate; then
    log_success "Prisma Client generated successfully"
else
    log_error "Failed to generate Prisma Client"
    exit 1
fi

log_section "🗄️ Phase 3: Database Migrations"
log_info "Running: npx prisma migrate deploy || npx prisma db push"
echo ""

# Try migrate deploy first (Railway's approach)
if npx prisma migrate deploy 2>/dev/null; then
    log_success "Database migrations applied successfully"
else
    log_warning "Migrate deploy failed, trying db push..."
    if npx prisma db push --accept-data-loss; then
        log_success "Database schema pushed successfully"
    else
        log_error "Failed to apply database changes"
        log_warning "Continuing with build anyway (may fail)..."
    fi
fi

log_section "🏗️ Phase 4: Building Next.js Application"
log_info "Running: npm run build"
log_info "This may take 1-3 minutes..."
echo ""

# Set build environment (matching Railway)
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Build with memory optimization (like Railway)
if NODE_OPTIONS='--max-old-space-size=8192' npm run build; then
    log_success "Application built successfully"
else
    log_error "Build failed"
    exit 1
fi

log_section "✅ Build Completed Successfully!"
echo ""
log_info "Build artifacts created:"
if [ -d .next ]; then
    log_success ".next/ directory created"
    if [ -f .next/BUILD_ID ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        log_info "Build ID: $BUILD_ID"
    fi
else
    log_error ".next/ directory not found"
fi

echo ""
log_section "🚀 Next Steps"
echo ""
log_info "Your build completed successfully, matching Railway's process!"
echo ""
echo "To test the production server locally:"
echo -e "  ${GREEN}npm run start${NC}"
echo ""
echo "To deploy to Railway:"
echo -e "  ${GREEN}git add .${NC}"
echo -e "  ${GREEN}git commit -m \"your commit message\"${NC}"
echo -e "  ${GREEN}git push origin main${NC}"
echo ""
log_info "The Railway deployment should now succeed."
echo ""

# Build summary
log_section "📊 Build Summary"
echo ""
log_info "Node Modules: $(du -sh node_modules 2>/dev/null | cut -f1)"
log_info "Build Output: $(du -sh .next 2>/dev/null | cut -f1)"
log_info "Total Project: $(du -sh . 2>/dev/null | cut -f1)"
echo ""

# Optional: Run quick health check
log_section "🔍 Quick Health Check"
echo ""
log_info "Starting production server for 5 seconds to verify..."
echo ""

# Start server in background
npm run start > /tmp/railway-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    log_success "Server started successfully!"

    # Try health check if endpoint exists
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Server is responding to requests"
    else
        log_warning "Server started but not responding yet (may need more time)"
    fi

    # Kill test server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    log_info "Test server stopped"
else
    log_error "Server failed to start"
    log_info "Check logs: /tmp/railway-test.log"
fi

echo ""
log_success "Railway build simulation complete!"
echo ""
