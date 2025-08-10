#!/bin/bash

# 🚂 Railway Authentication Debugger

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
echo "  🚂 Railway Authentication Debugger"
echo "========================================="
echo ""

log_info "Let's fix your Railway authentication..."
echo ""

# Method 1: Try regular browser login
log_info "Method 1: Browser Login (Recommended)"
echo ""
echo "This will open a browser window for authentication."
read -p "Try browser login? (y/n): " try_browser

if [[ "$try_browser" == "y" ]]; then
    log_info "Opening browser..."
    railway login
    
    if railway whoami &>/dev/null; then
        user=$(railway whoami)
        log_success "✅ Success! Logged in as: $user"
        exit 0
    else
        log_warning "Browser login didn't work. Let's try another method."
    fi
fi

echo ""
log_info "Method 2: Manual Token Setup"
echo ""

# Check for existing token
if [[ -f .railway-token.env ]]; then
    source .railway-token.env
    log_info "Found saved token: ${RAILWAY_TOKEN:0:10}..."
fi

log_info "To use token authentication, we need to set it up properly."
echo ""
echo "Please follow these steps EXACTLY:"
echo ""
echo "1. Open a NEW terminal window"
echo "2. Navigate to this directory:"
echo "   cd $(pwd)"
echo "3. Run these commands:"
echo ""
echo "   export RAILWAY_TOKEN=\"4eb2541a-b52f-4b90-9703-ad45a7a28278\""
echo "   railway whoami"
echo ""
echo "If that works, continue with:"
echo "   railway init -n taxomind-staging"
echo "   railway add"
echo "   railway variables"
echo ""

log_info "Alternative: Use Railway Dashboard"
echo ""
echo "Since CLI authentication is having issues, you can:"
echo ""
echo "1. Go to: https://railway.app/new"
echo "2. Click 'Deploy a Database'"
echo "3. Choose 'PostgreSQL'"
echo "4. Name it: taxomind-staging"
echo "5. Once created, go to the Variables tab"
echo "6. Copy the DATABASE_URL"
echo "7. Save it to a file: .railway-staging-db-url.txt"
echo ""

log_info "Then run this to add to GitHub:"
echo "   ./scripts/setup-github-secrets.sh"
echo ""

log_warning "Note: Railway tokens are session-based."
echo "If your token isn't working, it might be because:"
echo "- The token expired"
echo "- You're using it from a different IP"
echo "- Railway's API is having issues"
echo ""

log_info "Quick Web Setup Link:"
echo "👉 https://railway.app/new/postgresql"
echo ""
echo "This will create a PostgreSQL database directly in the browser!"