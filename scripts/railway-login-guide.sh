#!/bin/bash

# 🚂 Railway Login Guide & Helper Script

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

echo ""
log_info "🚂 Railway Login Options"
echo ""

# Check if already logged in
if railway whoami &>/dev/null; then
    local user=$(railway whoami)
    log_success "Already logged in as: $user"
    exit 0
fi

echo "Choose your login method:"
echo ""
echo "1) Browser Login (Recommended - Opens browser)"
echo "2) Token Login (Browserless - Requires API token)"
echo "3) Get help creating an API token"
echo ""
read -p "Select option (1/2/3): " option

case $option in
    1)
        log_info "Opening browser for authentication..."
        log_info "A browser window will open. Please login to Railway."
        echo ""
        railway login
        
        if railway whoami &>/dev/null; then
            log_success "Successfully logged in!"
            user=$(railway whoami)
            log_info "Logged in as: $user"
        else
            log_error "Login failed. Please try again."
        fi
        ;;
        
    2)
        log_info "Token-based login (browserless)"
        echo ""
        log_warning "You need a Railway API token for browserless login"
        log_info "Get your token from: https://railway.app/account/tokens"
        echo ""
        read -p "Enter your Railway API token: " token
        
        if [[ -z "$token" ]]; then
            log_error "No token provided"
            exit 1
        fi
        
        # Login with token
        railway login --browserless <<< "$token"
        
        if railway whoami &>/dev/null; then
            log_success "Successfully logged in!"
            user=$(railway whoami)
            log_info "Logged in as: $user"
            
            # Save token to environment file for future use
            echo "RAILWAY_TOKEN=$token" > .railway.env
            log_info "Token saved to .railway.env (added to .gitignore)"
            
            # Add to .gitignore
            if ! grep -q ".railway.env" .gitignore 2>/dev/null; then
                echo ".railway.env" >> .gitignore
            fi
        else
            log_error "Login failed. Please check your token."
        fi
        ;;
        
    3)
        log_info "📋 How to get a Railway API Token:"
        echo ""
        echo "1. Go to: https://railway.app/account/tokens"
        echo "2. Click 'Login' if not already logged in"
        echo "3. Click 'Create Token'"
        echo "4. Give it a name (e.g., 'taxomind-cli')"
        echo "5. Copy the token (it won't be shown again!)"
        echo "6. Run this script again and choose option 2"
        echo ""
        log_info "Opening Railway tokens page in browser..."
        
        # Try to open the URL
        if command -v open &>/dev/null; then
            open "https://railway.app/account/tokens"
        elif command -v xdg-open &>/dev/null; then
            xdg-open "https://railway.app/account/tokens"
        else
            log_info "Please manually open: https://railway.app/account/tokens"
        fi
        ;;
        
    *)
        log_error "Invalid option"
        exit 1
        ;;
esac

echo ""
log_info "After successful login, run:"
echo "  ./scripts/setup-railway-staging.sh"
echo ""