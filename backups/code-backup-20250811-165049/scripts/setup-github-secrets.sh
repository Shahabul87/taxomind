#!/bin/bash

# 🔐 GitHub Secrets Setup Script
# This script sets up all required GitHub secrets for CI/CD

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

# Check if gh CLI is authenticated
check_auth() {
    if ! gh auth status &>/dev/null; then
        log_error "You are not authenticated with GitHub CLI"
        log_info "Please run: gh auth login"
        log_info "Then run this script again"
        exit 1
    fi
    log_success "GitHub CLI authenticated"
}

# Set a GitHub secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    log_info "Setting secret: $secret_name - $description"
    echo "$secret_value" | gh secret set "$secret_name" --body -
    log_success "Secret $secret_name set successfully"
}

# Main setup
main() {
    log_info "🔐 Setting up GitHub Secrets for Taxomind CI/CD"
    
    # Check authentication
    check_auth
    
    # Check if we're in the right repository
    local repo_name=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [[ "$repo_name" != "Shahabul87/taxomind" ]]; then
        log_warning "Current repository: $repo_name"
        log_warning "Expected: Shahabul87/taxomind"
        read -p "Continue anyway? (y/n): " confirm
        if [[ "$confirm" != "y" ]]; then
            exit 0
        fi
    fi
    
    log_info "Setting up secrets for repository: Shahabul87/taxomind"
    echo ""
    
    # Staging Environment Setup
    log_info "📦 Setting up STAGING environment secrets..."
    
    # STAGING_DATABASE_URL
    log_info "Enter your staging database URL"
    log_info "Format: postgresql://username:password@host:port/database"
    log_info "Example: postgresql://staging_user:password@db.railway.app:5432/taxomind_staging"
    read -p "STAGING_DATABASE_URL: " staging_db_url
    if [[ -n "$staging_db_url" ]]; then
        set_secret "STAGING_DATABASE_URL" "$staging_db_url" "Staging database connection"
    fi
    
    # STAGING_NEXTAUTH_SECRET (use pre-generated)
    staging_nextauth_secret="p6bT9iYrb76QDCAG0nEZMntNlBhR0i54OafrnP45jo0="
    set_secret "STAGING_NEXTAUTH_SECRET" "$staging_nextauth_secret" "Staging NextAuth secret (pre-generated)"
    
    # STAGING_NEXTAUTH_URL
    log_info "Enter your staging application URL"
    log_info "Example: https://taxomind-staging.vercel.app"
    read -p "STAGING_NEXTAUTH_URL: " staging_url
    if [[ -n "$staging_url" ]]; then
        set_secret "STAGING_NEXTAUTH_URL" "$staging_url" "Staging application URL"
    fi
    
    echo ""
    log_info "🚀 Setting up PRODUCTION environment secrets..."
    
    # PROD_DATABASE_URL
    log_info "Enter your production database URL"
    log_info "Format: postgresql://username:password@host:port/database"
    log_info "Example: postgresql://prod_user:password@db.railway.app:5432/taxomind_production"
    read -p "PROD_DATABASE_URL: " prod_db_url
    if [[ -n "$prod_db_url" ]]; then
        set_secret "PROD_DATABASE_URL" "$prod_db_url" "Production database connection"
    fi
    
    # PROD_NEXTAUTH_SECRET (use pre-generated)
    prod_nextauth_secret="OqjFVGBAsDBsmowpdy6YGK3Fn5E2Mzy2riYk204tXQQ="
    set_secret "PROD_NEXTAUTH_SECRET" "$prod_nextauth_secret" "Production NextAuth secret (pre-generated)"
    
    # PROD_NEXTAUTH_URL
    log_info "Enter your production application URL"
    log_info "Example: https://taxomind.com or https://your-domain.com"
    read -p "PROD_NEXTAUTH_URL: " prod_url
    if [[ -n "$prod_url" ]]; then
        set_secret "PROD_NEXTAUTH_URL" "$prod_url" "Production application URL"
    fi
    
    echo ""
    log_info "🔧 Optional: Setting up deployment platform secrets..."
    
    # Optional: Vercel Token
    read -p "Do you want to set up Vercel deployment? (y/n): " setup_vercel
    if [[ "$setup_vercel" == "y" ]]; then
        log_info "Get your token from: https://vercel.com/account/tokens"
        read -p "VERCEL_TOKEN: " vercel_token
        if [[ -n "$vercel_token" ]]; then
            set_secret "VERCEL_TOKEN" "$vercel_token" "Vercel deployment token"
        fi
    fi
    
    # Optional: Railway Token
    read -p "Do you want to set up Railway deployment? (y/n): " setup_railway
    if [[ "$setup_railway" == "y" ]]; then
        log_info "Get your token from: https://railway.app/account/tokens"
        read -p "RAILWAY_TOKEN: " railway_token
        if [[ -n "$railway_token" ]]; then
            set_secret "RAILWAY_TOKEN" "$railway_token" "Railway deployment token"
        fi
    fi
    
    echo ""
    log_success "🎉 GitHub Secrets setup completed!"
    
    # List all secrets
    log_info "Current repository secrets:"
    gh secret list
    
    echo ""
    log_info "📋 Next steps:"
    echo "1. Push your changes to the staging branch to trigger CI/CD"
    echo "   git push origin staging"
    echo "2. Monitor the GitHub Actions tab for pipeline execution"
    echo "   https://github.com/Shahabul87/taxomind/actions"
    echo "3. Once staging tests pass, deploy to production"
    echo "   ./scripts/solo-dev-workflow.sh deploy-to-production"
}

# Run main function
main