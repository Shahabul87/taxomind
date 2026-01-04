#!/usr/bin/env bash
#
# SAM AI Packages - Publish Script
# Builds and publishes all @sam-ai/* packages to npm
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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Packages in dependency order
# Note: sam-engine is @taxomind/sam-engine (legacy), not @sam-ai
PACKAGES=(
  "core"
  "quality"
  "pedagogy"
  "memory"
  "safety"
  "agentic"
  "adapter-prisma"
  "educational"
  "api"
  "react"
)

# Parse arguments
DRY_RUN=false
SKIP_BUILD=false
VERSION_BUMP=""
TAG="latest"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --version)
      VERSION_BUMP="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --dry-run      Show what would be published without publishing"
      echo "  --skip-build   Skip the build step (use existing dist)"
      echo "  --version X    Bump version (patch, minor, major, or semver)"
      echo "  --tag TAG      Publish with npm tag (default: latest)"
      echo "  -h, --help     Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                      # Build and publish all packages"
      echo "  $0 --dry-run            # Show what would be published"
      echo "  $0 --version patch      # Bump patch version and publish"
      echo "  $0 --tag beta           # Publish with @beta tag"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

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

log_dry() {
  echo -e "${CYAN}[DRY-RUN]${NC} $1"
}

check_npm_auth() {
  if ! npm whoami &>/dev/null; then
    log_error "Not logged in to npm. Run 'npm login' first."
    exit 1
  fi
  log_success "Authenticated as: $(npm whoami)"
}

bump_version() {
  local pkg=$1
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ -z "$VERSION_BUMP" ]]; then
    return 0
  fi

  cd "$pkg_dir"

  if $DRY_RUN; then
    log_dry "Would bump @sam-ai/$pkg version: $VERSION_BUMP"
  else
    log_info "Bumping @sam-ai/$pkg version: $VERSION_BUMP"
    npm version "$VERSION_BUMP" --no-git-tag-version
  fi

  cd "$ROOT_DIR"
}

build_package() {
  local pkg=$1
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ ! -d "$pkg_dir" ]]; then
    log_warning "Package $pkg not found, skipping..."
    return 0
  fi

  log_info "Building @sam-ai/$pkg..."

  cd "$pkg_dir"
  npm run build
  cd "$ROOT_DIR"

  log_success "@sam-ai/$pkg built successfully"
}

publish_package() {
  local pkg=$1
  local pkg_dir="$PACKAGES_DIR/$pkg"

  if [[ ! -d "$pkg_dir" ]]; then
    return 0
  fi

  cd "$pkg_dir"

  local version=$(node -p "require('./package.json').version")
  local name=$(node -p "require('./package.json').name")

  if $DRY_RUN; then
    log_dry "Would publish $name@$version with tag '$TAG'"
    npm publish --dry-run --access public --tag "$TAG" 2>/dev/null || true
  else
    log_info "Publishing $name@$version..."
    if npm publish --access public --tag "$TAG"; then
      log_success "Published $name@$version"
    else
      log_error "Failed to publish $name"
      cd "$ROOT_DIR"
      return 1
    fi
  fi

  cd "$ROOT_DIR"
}

main() {
  echo ""
  echo "=========================================="
  echo "  SAM AI Packages - Publish System"
  echo "=========================================="
  echo ""

  if $DRY_RUN; then
    log_warning "DRY RUN MODE - No changes will be made"
    echo ""
  fi

  # Check npm authentication
  if ! $DRY_RUN; then
    check_npm_auth
  fi
  echo ""

  # Bump versions if requested
  if [[ -n "$VERSION_BUMP" ]]; then
    log_info "Bumping versions: $VERSION_BUMP"
    for pkg in "${PACKAGES[@]}"; do
      bump_version "$pkg"
    done
    echo ""
  fi

  # Build packages
  if ! $SKIP_BUILD; then
    log_info "Building all packages..."
    for pkg in "${PACKAGES[@]}"; do
      build_package "$pkg"
    done
    echo ""
  else
    log_warning "Skipping build step (--skip-build)"
    echo ""
  fi

  # Publish packages
  log_info "Publishing packages with tag: $TAG"
  echo ""

  local failed=0
  for pkg in "${PACKAGES[@]}"; do
    if ! publish_package "$pkg"; then
      ((failed++))
    fi
  done

  echo ""
  echo "=========================================="
  if [[ $failed -eq 0 ]]; then
    if $DRY_RUN; then
      log_success "Dry run completed - no packages were published"
    else
      log_success "All packages published successfully!"
    fi
  else
    log_error "$failed package(s) failed to publish"
    exit 1
  fi
  echo "=========================================="
}

main
