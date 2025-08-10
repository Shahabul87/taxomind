#!/bin/bash

# 🚂 Create Railway Staging Database with New Token

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
echo "  🚂 Railway Staging Database Creator"
echo "========================================="
echo ""

log_info "Please enter your NEW Railway token"
log_info "(Get it from: https://railway.app/account/tokens)"
echo ""
echo -n "Token: "
read -s NEW_TOKEN
echo ""
echo ""

if [[ -z "$NEW_TOKEN" ]]; then
    log_error "No token provided!"
    exit 1
fi

# Save the new token
echo "RAILWAY_TOKEN=$NEW_TOKEN" > .railway-token.env
log_success "Token saved to .railway-token.env"

# Export for current session
export RAILWAY_TOKEN="$NEW_TOKEN"

# Test authentication
log_info "Testing authentication..."
if railway whoami 2>/dev/null; then
    user=$(railway whoami)
    log_success "✅ Authenticated as: $user"
else
    log_error "Authentication failed. Please check your token."
    exit 1
fi

echo ""
log_info "🚀 Creating staging database..."
echo ""

# Initialize project
log_info "Creating project: taxomind-staging"
railway init -n taxomind-staging

log_success "Project created!"

# Add PostgreSQL
log_info "Adding PostgreSQL database..."
railway add

log_success "Database provisioned!"
log_info "Waiting for database to initialize..."
sleep 5

# Get database URL
log_info "Retrieving database URL..."
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")

if [[ -z "$DB_URL" ]]; then
    log_info "Trying alternative method..."
    
    # Get components
    PGHOST=$(railway variables get PGHOST 2>/dev/null || echo "")
    PGPORT=$(railway variables get PGPORT 2>/dev/null || echo "")
    PGUSER=$(railway variables get PGUSER 2>/dev/null || echo "")
    PGPASSWORD=$(railway variables get PGPASSWORD 2>/dev/null || echo "")
    PGDATABASE=$(railway variables get PGDATABASE 2>/dev/null || echo "")
    
    if [[ -n "$PGHOST" ]]; then
        DB_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
    else
        log_warning "Could not get database URL automatically"
        log_info "Please check Railway dashboard: https://railway.app/dashboard"
        log_info "Look for the PostgreSQL service and copy the DATABASE_URL from Variables tab"
        exit 1
    fi
fi

echo ""
echo "========================================="
echo "✅ STAGING DATABASE CREATED!"
echo "========================================="
echo ""
echo "DATABASE URL:"
echo "$DB_URL"
echo ""
echo "========================================="
echo ""

# Save URL
echo "$DB_URL" > .railway-staging-db-url.txt
log_info "Saved to: .railway-staging-db-url.txt"

# Add to GitHub secrets
echo ""
read -p "Add to GitHub secrets now? (y/n): " add_github
if [[ "$add_github" == "y" ]]; then
    if gh auth status &>/dev/null; then
        log_info "Adding secrets to GitHub..."
        
        # Database URL
        echo "$DB_URL" | gh secret set STAGING_DATABASE_URL
        log_success "STAGING_DATABASE_URL added!"
        
        # NextAuth Secret
        echo "p6bT9iYrb76QDCAG0nEZMntNlBhR0i54OafrnP45jo0=" | gh secret set STAGING_NEXTAUTH_SECRET
        log_success "STAGING_NEXTAUTH_SECRET added!"
        
        # NextAuth URL
        log_info "Enter your staging app URL"
        log_info "Example: https://taxomind-staging.vercel.app"
        read -p "URL: " staging_url
        if [[ -n "$staging_url" ]]; then
            echo "$staging_url" | gh secret set STAGING_NEXTAUTH_URL
            log_success "STAGING_NEXTAUTH_URL added!"
        fi
        
        log_success "✅ All GitHub secrets configured!"
    else
        log_warning "GitHub CLI not authenticated"
        log_info "Run: gh auth login"
        log_info "Then: ./scripts/setup-github-secrets.sh"
    fi
fi

echo ""
log_success "🎉 Complete Setup Successful!"
echo ""
log_info "Summary:"
echo "✅ Railway token saved"
echo "✅ Staging database created"
echo "✅ Database URL retrieved"
if [[ "$add_github" == "y" ]]; then
    echo "✅ GitHub secrets configured"
fi
echo ""
log_info "Next steps:"
echo "1. Push to staging branch: git push origin staging"
echo "2. Monitor CI/CD: https://github.com/Shahabul87/taxomind/actions"
echo "3. View database: https://railway.app/dashboard"