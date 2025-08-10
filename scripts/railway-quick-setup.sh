#!/bin/bash

# 🚂 Railway Quick Database Setup
# Direct approach using environment variable

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

clear
echo ""
echo "========================================="
echo "  🚂 Railway Quick Database Setup"
echo "========================================="
echo ""

# Step 1: Get token if not set
if [[ -z "$RAILWAY_TOKEN" ]]; then
    log_info "Enter your Railway API token:"
    read -s RAILWAY_TOKEN
    export RAILWAY_TOKEN
    echo ""
fi

# Step 2: Verify authentication
log_info "Verifying Railway authentication..."
if railway whoami 2>/dev/null; then
    user=$(railway whoami)
    log_success "Authenticated as: $user"
else
    log_error "Authentication failed. Please check your token."
    exit 1
fi

echo ""
log_info "Choose an option:"
echo "1) Create NEW staging database"
echo "2) Link to EXISTING Railway project"
echo "3) Get database URL from current project"
read -p "Select (1/2/3): " choice

case $choice in
    1)
        log_info "Creating new Railway project: taxomind-staging"
        
        # Initialize new project
        railway init -n taxomind-staging
        
        log_success "Project created!"
        log_info "Provisioning PostgreSQL database..."
        
        # Add PostgreSQL
        railway add
        
        log_success "Database provisioned!"
        sleep 3
        
        # Get database URL
        log_info "Retrieving database URL..."
        DB_URL=$(railway variables get DATABASE_URL)
        
        if [[ -z "$DB_URL" ]]; then
            log_warning "DATABASE_URL not found, trying alternative method..."
            
            # Get individual components
            PGHOST=$(railway variables get PGHOST)
            PGPORT=$(railway variables get PGPORT)
            PGUSER=$(railway variables get PGUSER)
            PGPASSWORD=$(railway variables get PGPASSWORD)
            PGDATABASE=$(railway variables get PGDATABASE)
            
            if [[ -n "$PGHOST" ]]; then
                DB_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
            fi
        fi
        ;;
        
    2)
        log_info "Available Railway projects:"
        railway list
        
        log_info "Linking to existing project..."
        railway link
        
        log_info "Getting database URL..."
        DB_URL=$(railway variables get DATABASE_URL)
        ;;
        
    3)
        log_info "Getting database URL from current project..."
        DB_URL=$(railway variables get DATABASE_URL)
        
        if [[ -z "$DB_URL" ]]; then
            # Try individual components
            PGHOST=$(railway variables get PGHOST)
            PGPORT=$(railway variables get PGPORT)
            PGUSER=$(railway variables get PGUSER)
            PGPASSWORD=$(railway variables get PGPASSWORD)
            PGDATABASE=$(railway variables get PGDATABASE)
            
            if [[ -n "$PGHOST" ]]; then
                DB_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
            fi
        fi
        ;;
esac

echo ""
if [[ -n "$DB_URL" ]]; then
    log_success "✅ Database URL retrieved!"
    echo ""
    echo "========================================="
    echo "STAGING DATABASE URL:"
    echo "$DB_URL"
    echo "========================================="
    echo ""
    
    # Save to file
    echo "$DB_URL" > .railway-staging-db-url.txt
    log_info "Saved to: .railway-staging-db-url.txt"
    
    # Add to .gitignore
    grep -q ".railway-staging-db-url.txt" .gitignore 2>/dev/null || echo ".railway-staging-db-url.txt" >> .gitignore
    
    # Ask about GitHub secrets
    echo ""
    read -p "Add to GitHub secrets? (y/n): " add_github
    if [[ "$add_github" == "y" ]]; then
        if gh auth status &>/dev/null; then
            echo "$DB_URL" | gh secret set STAGING_DATABASE_URL
            log_success "Added to GitHub secrets!"
            
            # Also add the NextAuth secrets
            log_info "Adding NextAuth secrets..."
            echo "p6bT9iYrb76QDCAG0nEZMntNlBhR0i54OafrnP45jo0=" | gh secret set STAGING_NEXTAUTH_SECRET
            
            log_info "Enter staging app URL (e.g., https://taxomind-staging.vercel.app):"
            read staging_url
            if [[ -n "$staging_url" ]]; then
                echo "$staging_url" | gh secret set STAGING_NEXTAUTH_URL
            fi
            
            log_success "All staging secrets configured!"
        else
            log_warning "GitHub CLI not authenticated. Run: gh auth login"
        fi
    fi
    
    echo ""
    log_success "🎉 Setup complete!"
    echo ""
    log_info "Next steps:"
    echo "1. Your database is ready at Railway"
    echo "2. Push to staging branch to trigger CI/CD"
    echo "   git push origin staging"
    echo "3. Monitor at: https://railway.app/dashboard"
else
    log_error "Could not retrieve database URL"
    log_info "Please check your Railway dashboard: https://railway.app/dashboard"
fi

echo ""
log_info "Keep your Railway token for future use:"
echo "export RAILWAY_TOKEN='$RAILWAY_TOKEN'"