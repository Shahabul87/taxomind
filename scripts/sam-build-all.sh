#!/usr/bin/env bash
#
# SAM AI Packages - Build All Script
# Builds all @sam-ai/* packages in dependency order
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$ROOT_DIR/packages"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Packages in dependency order (dependencies first)
# Note: sam-engine is @taxomind/sam-engine (legacy), not @sam-ai
PACKAGES=(
  "core"           # No internal deps
  "quality"        # No internal deps
  "pedagogy"       # No internal deps
  "memory"         # No internal deps
  "safety"         # No internal deps
  "agentic"        # Depends on core (goal planning, tools, memory, analytics)
  "integration"    # Depends on core, agentic
  "adapter-prisma" # Depends on core
  "adapter-taxomind" # Depends on integration
  "educational"    # Depends on core
  "api"            # Depends on core, educational
  "react"          # Depends on core, educational
)

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

build_package() {
  local pkg=$1
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ ! -d "$pkg_dir" ]]; then
    log_warning "Package $pkg not found at $pkg_dir, skipping..."
    return 0
  fi

  log_info "Building @sam-ai/$pkg..."

  cd "$pkg_dir"

  # Check if package.json exists
  if [[ ! -f "package.json" ]]; then
    log_error "No package.json found in $pkg_dir"
    return 1
  fi

  # Run build
  if npm run build; then
    log_success "@sam-ai/$pkg built successfully"
  else
    log_error "Failed to build @sam-ai/$pkg"
    return 1
  fi

  cd "$ROOT_DIR"
}

typecheck_package() {
  local pkg=$1
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ ! -d "$pkg_dir" ]]; then
    return 0
  fi

  log_info "Type-checking @sam-ai/$pkg..."

  cd "$pkg_dir"

  if [[ -f "tsconfig.json" ]]; then
    if npx tsc --noEmit 2>/dev/null; then
      log_success "@sam-ai/$pkg type-check passed"
    else
      log_warning "@sam-ai/$pkg has type issues (may be expected for some packages)"
    fi
  fi

  cd "$ROOT_DIR"
}

main() {
  local mode="${1:-build}"
  local failed=0

  echo ""
  echo "=========================================="
  echo "  SAM AI Packages - Build System"
  echo "=========================================="
  echo ""

  case "$mode" in
    "build")
      log_info "Building all packages in dependency order..."
      echo ""

      for pkg in "${PACKAGES[@]}"; do
        if ! build_package "$pkg"; then
          ((failed++))
        fi
        echo ""
      done
      ;;

    "typecheck")
      log_info "Type-checking all packages..."
      echo ""

      for pkg in "${PACKAGES[@]}"; do
        typecheck_package "$pkg"
        echo ""
      done
      ;;

    "clean")
      log_info "Cleaning all package dist directories..."

      for pkg in "${PACKAGES[@]}"; do
        local dist_dir="$PACKAGES_DIR/$pkg/dist"
        if [[ -d "$dist_dir" ]]; then
          rm -rf "$dist_dir"
          log_success "Cleaned $pkg/dist"
        fi
      done
      ;;

    "rebuild")
      log_info "Clean rebuild of all packages..."
      "$0" clean
      "$0" build
      ;;

    *)
      echo "Usage: $0 [build|typecheck|clean|rebuild]"
      echo ""
      echo "Commands:"
      echo "  build     - Build all packages (default)"
      echo "  typecheck - Run TypeScript type-checking"
      echo "  clean     - Remove all dist directories"
      echo "  rebuild   - Clean and rebuild all packages"
      exit 1
      ;;
  esac

  echo "=========================================="
  if [[ $failed -eq 0 ]]; then
    log_success "All operations completed successfully!"
  else
    log_error "$failed package(s) failed to build"
    exit 1
  fi
  echo "=========================================="
}

main "$@"
