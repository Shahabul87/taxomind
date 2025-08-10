#!/bin/bash

# 🚂 Railway Staging Database Setup Script
# Sets up PostgreSQL database on Railway for staging environment

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

# Step 1: Check Railway CLI
check_railway() {
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI not found"
        log_info "Install with: brew install railway"
        exit 1
    fi
    log_success "Railway CLI found"
}

# Step 2: Login to Railway
railway_login() {
    log_info "Checking Railway authentication..."
    
    if ! railway whoami &>/dev/null; then
        log_warning "Not logged in to Railway"
        log_info "Opening browser for authentication..."
        railway login
    else
        local user=$(railway whoami)
        log_success "Logged in as: $user"
    fi
}

# Step 3: Create or select project
setup_project() {
    log_info "Setting up Railway project for staging..."
    
    # Check if we're in a linked project
    if railway status &>/dev/null; then
        log_info "Found existing Railway project"
        read -p "Use existing project? (y/n): " use_existing
        if [[ "$use_existing" != "y" ]]; then
            railway unlink
        else
            return 0
        fi
    fi
    
    log_info "Creating new Railway project..."
    log_info "Project name: taxomind-staging"
    
    # Create new project
    railway init -n taxomind-staging
    log_success "Project created: taxomind-staging"
}

# Step 4: Provision PostgreSQL
provision_postgres() {
    log_info "Provisioning PostgreSQL database..."
    
    # Create PostgreSQL service
    railway add -d postgresql
    
    log_success "PostgreSQL database provisioned!"
    log_info "Waiting for database to be ready..."
    sleep 5
}

# Step 5: Get database URL
get_database_url() {
    log_info "Retrieving database connection details..."
    
    # Get the database URL
    local db_url=$(railway variables get DATABASE_URL)
    
    if [[ -z "$db_url" ]]; then
        log_error "Could not retrieve DATABASE_URL"
        log_info "Trying alternative method..."
        
        # Try to get individual components
        local pghost=$(railway variables get PGHOST)
        local pgport=$(railway variables get PGPORT)
        local pguser=$(railway variables get PGUSER)
        local pgpassword=$(railway variables get PGPASSWORD)
        local pgdatabase=$(railway variables get PGDATABASE)
        
        if [[ -n "$pghost" ]]; then
            db_url="postgresql://${pguser}:${pgpassword}@${pghost}:${pgport}/${pgdatabase}"
        fi
    fi
    
    if [[ -z "$db_url" ]]; then
        log_error "Failed to get database URL"
        log_info "Please check Railway dashboard: https://railway.app/dashboard"
        exit 1
    fi
    
    log_success "Database URL retrieved!"
    echo ""
    echo "========================================="
    echo "STAGING DATABASE URL:"
    echo "$db_url"
    echo "========================================="
    echo ""
    
    # Save to file for reference
    echo "$db_url" > .railway-staging-db-url.txt
    log_info "URL saved to: .railway-staging-db-url.txt"
    
    # Add to .gitignore if not already there
    if ! grep -q ".railway-staging-db-url.txt" .gitignore 2>/dev/null; then
        echo ".railway-staging-db-url.txt" >> .gitignore
        log_info "Added to .gitignore"
    fi
    
    # Export for use in other scripts
    export STAGING_DATABASE_URL="$db_url"
}

# Step 6: Test connection
test_connection() {
    log_info "Testing database connection..."
    
    # Try to connect using psql if available
    if command -v psql &> /dev/null; then
        if psql "$STAGING_DATABASE_URL" -c "SELECT version();" &>/dev/null; then
            log_success "Database connection successful!"
        else
            log_warning "Could not connect with psql, but database may still be initializing"
        fi
    else
        log_info "psql not found, skipping connection test"
    fi
}

# Step 7: Run Prisma migrations
setup_prisma() {
    log_info "Would you like to run Prisma migrations on the staging database?"
    read -p "Run migrations? (y/n): " run_migrations
    
    if [[ "$run_migrations" == "y" ]]; then
        log_info "Running Prisma migrations..."
        
        # Temporarily set DATABASE_URL
        export DATABASE_URL="$STAGING_DATABASE_URL"
        
        # Generate Prisma client
        npx prisma generate
        
        # Push schema to database
        npx prisma db push
        
        log_success "Migrations completed!"
        
        # Restore original DATABASE_URL
        unset DATABASE_URL
    fi
}

# Step 8: Configure GitHub secrets
configure_github() {
    log_info "Would you like to add this to GitHub secrets?"
    read -p "Configure GitHub secrets? (y/n): " setup_github
    
    if [[ "$setup_github" == "y" ]]; then
        if ! gh auth status &>/dev/null; then
            log_warning "GitHub CLI not authenticated"
            log_info "Run: gh auth login"
            log_info "Then run: ./scripts/setup-github-secrets.sh"
        else
            log_info "Adding STAGING_DATABASE_URL to GitHub secrets..."
            echo "$STAGING_DATABASE_URL" | gh secret set STAGING_DATABASE_URL
            log_success "GitHub secret configured!"
        fi
    fi
}

# Main execution
main() {
    log_info "🚂 Railway Staging Database Setup"
    echo ""
    
    check_railway
    railway_login
    
    log_info "Choose setup option:"
    echo "1) Create NEW staging project and database"
    echo "2) Get URL from EXISTING Railway project"
    echo "3) Just test the connection"
    read -p "Option (1/2/3): " option
    
    case $option in
        1)
            setup_project
            provision_postgres
            get_database_url
            test_connection
            setup_prisma
            configure_github
            ;;
        2)
            log_info "Linking to existing project..."
            railway link
            get_database_url
            test_connection
            ;;
        3)
            if [[ -f .railway-staging-db-url.txt ]]; then
                STAGING_DATABASE_URL=$(cat .railway-staging-db-url.txt)
                test_connection
            else
                log_error "No saved database URL found"
            fi
            ;;
        *)
            log_error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    log_success "🎉 Railway staging setup complete!"
    echo ""
    log_info "📋 Next steps:"
    echo "1. Your staging database URL is saved in: .railway-staging-db-url.txt"
    echo "2. Add other GitHub secrets by running: ./scripts/setup-github-secrets.sh"
    echo "3. Push to staging branch to trigger CI/CD: git push origin staging"
    echo "4. Monitor your database at: https://railway.app/dashboard"
    echo ""
    log_info "💰 Railway Pricing:"
    echo "- First \$5 free each month"
    echo "- PostgreSQL typically costs ~\$5-10/month for staging"
    echo "- Perfect for solo developers!"
}

# Run main function
main