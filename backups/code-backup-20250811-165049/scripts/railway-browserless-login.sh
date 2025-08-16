#!/bin/bash

# 🚂 Railway Browserless Login Helper
# Fixes the browser login issue by using token-based authentication

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
echo "  🚂 Railway Browserless Login Setup"
echo "========================================="
echo ""

log_warning "Since browser login is failing, we'll use token authentication"
echo ""

# Step 1: Instructions for getting token
log_info "📋 Step 1: Get your Railway API Token"
echo ""
echo "Since the browser isn't opening automatically, please:"
echo ""
echo "1. Manually open this URL in your browser:"
echo "   👉 https://railway.app/account/tokens"
echo ""
echo "2. Login to Railway if needed"
echo ""
echo "3. Click the '+ New Token' button"
echo ""
echo "4. Give it a name like: taxomind-cli"
echo ""
echo "5. Copy the token (it's shown only once!)"
echo ""
echo "========================================="
echo ""

# Step 2: Get token from user
log_info "📝 Step 2: Enter your token"
echo ""
echo "Paste your Railway token here:"
read -s railway_token
echo ""

if [[ -z "$railway_token" ]]; then
    log_error "No token provided!"
    exit 1
fi

log_info "Token received (hidden for security)"
echo ""

# Step 3: Try to login with token
log_info "🔐 Step 3: Logging in with token..."
echo ""

# Method 1: Using echo to pipe token
echo "$railway_token" | railway login --browserless

# Check if login succeeded
if railway whoami &>/dev/null; then
    user=$(railway whoami)
    log_success "✅ Successfully logged in as: $user"
    echo ""
    
    # Save token for future use
    log_info "💾 Saving configuration..."
    
    # Create Railway config directory if it doesn't exist
    mkdir -p ~/.railway
    
    # Save token to config file
    echo "{\"token\":\"$railway_token\"}" > ~/.railway/config.json
    chmod 600 ~/.railway/config.json
    
    # Also save to local .env file for reference
    echo "RAILWAY_TOKEN=$railway_token" > .railway-token.env
    echo ".railway-token.env" >> .gitignore 2>/dev/null || true
    
    log_success "Configuration saved!"
    echo ""
    echo "========================================="
    echo ""
    log_success "🎉 Railway CLI is now configured!"
    echo ""
    log_info "You can now run:"
    echo "  ./scripts/setup-railway-staging.sh"
    echo ""
    echo "To create your staging database!"
    echo ""
else
    log_error "❌ Login failed!"
    echo ""
    log_info "Troubleshooting:"
    echo "1. Make sure you copied the entire token"
    echo "2. The token should look like: rw_xxxxxxxxxxxxxx"
    echo "3. Try creating a new token if this one doesn't work"
    echo ""
    log_info "Alternative method:"
    echo "Set the token as environment variable and try again:"
    echo ""
    echo "export RAILWAY_TOKEN='your-token-here'"
    echo "railway whoami"
    echo ""
fi