#!/bin/bash

###############################################################################
# Railway PostgreSQL Setup Script
#
# This script helps you set up and verify PostgreSQL database on Railway
#
# Usage:
#   bash scripts/railway-db-setup.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Icons
INFO="ℹ️ "
SUCCESS="✅"
WARNING="⚠️ "
ERROR="❌"
ROCKET="🚀"

echo ""
echo "============================================================"
echo "🗄️  Railway PostgreSQL Database Setup"
echo "============================================================"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

print_success() {
    echo -e "${GREEN}${SUCCESS}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${WARNING}${NC} $1"
}

print_error() {
    echo -e "${RED}${ERROR}${NC} $1"
}

# Check if Railway CLI is installed
print_info "Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not found!"
    echo ""
    echo "Install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo "  or"
    echo "  brew install railway"
    echo ""
    exit 1
fi
print_success "Railway CLI is installed"
echo ""

# Check if logged in to Railway
print_info "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway"
    echo ""
    print_info "Logging in to Railway..."
    railway login
    echo ""
fi
print_success "Authenticated with Railway"
echo ""

# Check if linked to a project
print_info "Checking project link..."
if ! railway status &> /dev/null; then
    print_warning "Not linked to a Railway project"
    echo ""
    print_info "Linking to Railway project..."
    railway link
    echo ""
fi
print_success "Linked to Railway project"
echo ""

# Show project status
print_info "Getting project status..."
railway status
echo ""

# Check for PostgreSQL service
print_info "Checking for PostgreSQL service..."
if railway variables | grep -q "DATABASE_URL"; then
    print_success "PostgreSQL service found!"
    echo ""

    # Get database URL (masked)
    DB_URL=$(railway variables | grep "DATABASE_URL" | head -1 | cut -d'=' -f2-)
    MASKED_URL=$(echo "$DB_URL" | sed -E 's/(:\/\/[^:]+:)([^@]+)(@)/\1***\3/')
    echo "   Database URL: $MASKED_URL"
    echo ""
else
    print_warning "PostgreSQL service not found"
    echo ""
    read -p "Do you want to add a PostgreSQL service? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Adding PostgreSQL service..."
        railway add
        echo ""
        print_success "PostgreSQL service added!"
        echo ""
        print_info "Waiting for service to start (30 seconds)..."
        sleep 30
        echo ""
    else
        print_error "PostgreSQL service required. Exiting."
        exit 1
    fi
fi

# Test database connection
print_info "Testing database connection..."
if railway run node scripts/test-railway-db.js; then
    print_success "Database connection test passed!"
else
    print_error "Database connection test failed!"
    echo ""
    print_info "Troubleshooting tips:"
    echo "   1. Wait a few minutes for database to fully start"
    echo "   2. Check Railway dashboard for service status"
    echo "   3. Verify DATABASE_URL is set correctly"
    echo "   4. Check Railway logs: railway logs"
    echo ""
    exit 1
fi
echo ""

# Check migration status
print_info "Checking Prisma migration status..."
if railway run npx prisma migrate status; then
    print_success "Migrations are up to date"
else
    print_warning "Migrations need to be applied"
    echo ""
    read -p "Do you want to apply migrations now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Applying migrations..."
        railway run npx prisma migrate deploy
        echo ""
        print_success "Migrations applied successfully!"
    else
        print_warning "Remember to run migrations before deploying:"
        echo "   railway run npx prisma migrate deploy"
    fi
fi
echo ""

# Summary
echo "============================================================"
echo "${ROCKET} Setup Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Review your database configuration"
echo "  2. Deploy your app: railway up"
echo "  3. Monitor logs: railway logs"
echo "  4. Test your app: https://your-app.railway.app"
echo ""
echo "Useful commands:"
echo "  railway variables              - View all environment variables"
echo "  railway logs                   - View application logs"
echo "  railway run psql \$DATABASE_URL - Connect to database"
echo "  railway run npx prisma studio  - Open Prisma Studio"
echo ""
echo "For more help, see: RAILWAY_POSTGRES_DEPLOYMENT.md"
echo ""
