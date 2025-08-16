#!/bin/bash

# Blue-Green Deployment Script for Taxomind LMS
# This script manages zero-downtime deployments using blue-green strategy

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-taxomind}"
HELM_RELEASE="${HELM_RELEASE:-taxomind}"
CHART_PATH="${CHART_PATH:-./infrastructure/helm/taxomind}"
DEPLOYMENT_TIMEOUT="${DEPLOYMENT_TIMEOUT:-600}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi
    
    # Check namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace $NAMESPACE does not exist"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Function to get current production slot
get_current_slot() {
    local current_slot
    current_slot=$(kubectl get service "${HELM_RELEASE}" -n "$NAMESPACE" -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo "blue")
    echo "$current_slot"
}

# Function to get target slot
get_target_slot() {
    local current_slot=$1
    if [ "$current_slot" = "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Function to deploy to staging slot
deploy_to_staging() {
    local target_slot=$1
    local image_tag=$2
    
    log_info "Deploying version $image_tag to $target_slot slot..."
    
    # Update Helm values for staging deployment
    helm upgrade --install "$HELM_RELEASE" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --set blueGreen.enabled=true \
        --set blueGreen.stagingSlot="$target_slot" \
        --set app.image.tag="$image_tag" \
        --wait \
        --timeout "${DEPLOYMENT_TIMEOUT}s" \
        --atomic
    
    if [ $? -eq 0 ]; then
        log_success "Successfully deployed to $target_slot slot"
        return 0
    else
        log_error "Failed to deploy to $target_slot slot"
        return 1
    fi
}

# Function to perform health checks
health_check() {
    local slot=$1
    local retries=$HEALTH_CHECK_RETRIES
    
    log_info "Running health checks for $slot slot..."
    
    while [ $retries -gt 0 ]; do
        # Get pod status
        local ready_pods
        ready_pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$HELM_RELEASE,slot=$slot" \
            -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
        
        local total_pods
        total_pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$HELM_RELEASE,slot=$slot" \
            -o jsonpath='{.items[*].metadata.name}' | wc -w)
        
        if [ "$ready_pods" -eq "$total_pods" ] && [ "$total_pods" -gt 0 ]; then
            log_success "All pods in $slot slot are healthy ($ready_pods/$total_pods)"
            
            # Additional application-level health check
            local pod_name
            pod_name=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$HELM_RELEASE,slot=$slot" \
                -o jsonpath='{.items[0].metadata.name}')
            
            if kubectl exec -n "$NAMESPACE" "$pod_name" -- curl -f -s http://localhost:3000/api/health > /dev/null; then
                log_success "Application health check passed"
                return 0
            else
                log_warning "Application health check failed, retrying..."
            fi
        else
            log_warning "Pods not ready yet ($ready_pods/$total_pods), retrying..."
        fi
        
        retries=$((retries - 1))
        sleep "$HEALTH_CHECK_INTERVAL"
    done
    
    log_error "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Function to run smoke tests
run_smoke_tests() {
    local slot=$1
    
    log_info "Running smoke tests on $slot slot..."
    
    # Get a pod from the target slot
    local pod_name
    pod_name=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$HELM_RELEASE,slot=$slot" \
        -o jsonpath='{.items[0].metadata.name}')
    
    # Run smoke test suite
    kubectl exec -n "$NAMESPACE" "$pod_name" -- npm run test:smoke
    
    if [ $? -eq 0 ]; then
        log_success "Smoke tests passed"
        return 0
    else
        log_error "Smoke tests failed"
        return 1
    fi
}

# Function to switch traffic to new slot
switch_traffic() {
    local target_slot=$1
    
    log_info "Switching production traffic to $target_slot slot..."
    
    # Update service selector to point to new slot
    kubectl patch service "$HELM_RELEASE" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"slot\":\"$target_slot\"}}}"
    
    if [ $? -eq 0 ]; then
        log_success "Traffic successfully switched to $target_slot slot"
        
        # Update Helm values to reflect new production slot
        helm upgrade "$HELM_RELEASE" "$CHART_PATH" \
            --namespace "$NAMESPACE" \
            --reuse-values \
            --set blueGreen.productionSlot="$target_slot"
        
        return 0
    else
        log_error "Failed to switch traffic"
        return 1
    fi
}

# Function to monitor deployment
monitor_deployment() {
    local slot=$1
    local duration=${2:-300}  # Default 5 minutes
    
    log_info "Monitoring $slot slot for $duration seconds..."
    
    local end_time=$(($(date +%s) + duration))
    local error_count=0
    local max_errors=10
    
    while [ $(date +%s) -lt $end_time ]; do
        # Check pod status
        local failed_pods
        failed_pods=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$HELM_RELEASE,slot=$slot" \
            --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)
        
        if [ "$failed_pods" -gt 0 ]; then
            error_count=$((error_count + failed_pods))
            log_warning "Found $failed_pods failed pods (total errors: $error_count)"
        fi
        
        if [ $error_count -gt $max_errors ]; then
            log_error "Too many errors detected, deployment may be unstable"
            return 1
        fi
        
        sleep 10
    done
    
    log_success "Monitoring completed successfully"
    return 0
}

# Function to rollback deployment
rollback() {
    local original_slot=$1
    
    log_warning "Initiating rollback to $original_slot slot..."
    
    # Switch traffic back to original slot
    kubectl patch service "$HELM_RELEASE" -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"slot\":\"$original_slot\"}}}"
    
    if [ $? -eq 0 ]; then
        log_success "Rollback completed successfully"
        
        # Update Helm values
        helm upgrade "$HELM_RELEASE" "$CHART_PATH" \
            --namespace "$NAMESPACE" \
            --reuse-values \
            --set blueGreen.productionSlot="$original_slot"
    else
        log_error "Rollback failed - manual intervention required!"
        exit 1
    fi
}

# Function to cleanup old slot
cleanup_old_slot() {
    local old_slot=$1
    
    log_info "Cleaning up $old_slot slot..."
    
    # Scale down old deployment
    kubectl scale deployment "${HELM_RELEASE}-${old_slot}" -n "$NAMESPACE" --replicas=0
    
    log_success "Cleanup completed"
}

# Function to generate deployment report
generate_report() {
    local deployment_id=$1
    local status=$2
    local start_time=$3
    local end_time=$4
    
    local duration=$((end_time - start_time))
    local report_file="/tmp/deployment-report-${deployment_id}.json"
    
    cat > "$report_file" <<EOF
{
    "deployment_id": "$deployment_id",
    "status": "$status",
    "start_time": "$start_time",
    "end_time": "$end_time",
    "duration_seconds": $duration,
    "namespace": "$NAMESPACE",
    "helm_release": "$HELM_RELEASE",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    log_info "Deployment report saved to $report_file"
    
    # Send report to monitoring system (example)
    # curl -X POST https://monitoring.taxomind.com/api/deployments \
    #     -H "Content-Type: application/json" \
    #     -d @"$report_file"
}

# Main deployment function
main() {
    local image_tag=${1:-latest}
    local skip_tests=${2:-false}
    local auto_rollback=${3:-true}
    
    # Generate deployment ID
    local deployment_id="deploy-$(date +%Y%m%d-%H%M%S)"
    local start_time=$(date +%s)
    
    log_info "Starting blue-green deployment (ID: $deployment_id)"
    log_info "Image tag: $image_tag"
    
    # Check prerequisites
    check_prerequisites
    
    # Get current state
    local current_slot=$(get_current_slot)
    local target_slot=$(get_target_slot "$current_slot")
    
    log_info "Current production slot: $current_slot"
    log_info "Target deployment slot: $target_slot"
    
    # Deploy to staging slot
    if ! deploy_to_staging "$target_slot" "$image_tag"; then
        log_error "Deployment failed"
        generate_report "$deployment_id" "failed" "$start_time" "$(date +%s)"
        exit 1
    fi
    
    # Health checks
    if ! health_check "$target_slot"; then
        log_error "Health checks failed"
        
        if [ "$auto_rollback" = "true" ]; then
            rollback "$current_slot"
        fi
        
        generate_report "$deployment_id" "failed" "$start_time" "$(date +%s)"
        exit 1
    fi
    
    # Run smoke tests
    if [ "$skip_tests" != "true" ]; then
        if ! run_smoke_tests "$target_slot"; then
            log_error "Smoke tests failed"
            
            if [ "$auto_rollback" = "true" ]; then
                rollback "$current_slot"
            fi
            
            generate_report "$deployment_id" "failed" "$start_time" "$(date +%s)"
            exit 1
        fi
    fi
    
    # Switch traffic
    if ! switch_traffic "$target_slot"; then
        log_error "Traffic switch failed"
        
        if [ "$auto_rollback" = "true" ]; then
            rollback "$current_slot"
        fi
        
        generate_report "$deployment_id" "failed" "$start_time" "$(date +%s)"
        exit 1
    fi
    
    # Monitor new deployment
    if ! monitor_deployment "$target_slot" 300; then
        log_warning "Issues detected during monitoring"
        
        if [ "$auto_rollback" = "true" ]; then
            log_warning "Triggering automatic rollback..."
            rollback "$current_slot"
            generate_report "$deployment_id" "rolled_back" "$start_time" "$(date +%s)"
            exit 1
        fi
    fi
    
    # Cleanup old slot (optional, can be delayed)
    read -p "Do you want to cleanup the $current_slot slot? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup_old_slot "$current_slot"
    fi
    
    # Generate success report
    generate_report "$deployment_id" "success" "$start_time" "$(date +%s)"
    
    log_success "Blue-green deployment completed successfully!"
    log_success "New production slot: $target_slot"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --image-tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --no-auto-rollback)
            AUTO_ROLLBACK=false
            shift
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --help)
            cat <<EOF
Usage: $0 [OPTIONS]

Options:
    --image-tag TAG          Docker image tag to deploy (default: latest)
    --skip-tests             Skip smoke tests
    --no-auto-rollback       Disable automatic rollback on failure
    --namespace NAMESPACE    Kubernetes namespace (default: taxomind)
    --help                   Show this help message

Example:
    $0 --image-tag v1.2.3 --namespace production
EOF
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main deployment
main "${IMAGE_TAG:-latest}" "${SKIP_TESTS:-false}" "${AUTO_ROLLBACK:-true}"