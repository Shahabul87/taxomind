#!/bin/bash

# Automated Rollback Manager for Taxomind LMS
# Monitors deployments and triggers automatic rollbacks based on health metrics

set -euo pipefail

# Configuration
NAMESPACE="${NAMESPACE:-taxomind}"
HELM_RELEASE="${HELM_RELEASE:-taxomind}"
MONITORING_DURATION="${MONITORING_DURATION:-300}"  # 5 minutes
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.05}"  # 5% error rate triggers rollback
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-2000}"  # 2 seconds
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-90}"  # 90% memory usage
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"  # 80% CPU usage
ROLLBACK_HISTORY_LIMIT="${ROLLBACK_HISTORY_LIMIT:-10}"

# Prometheus/Grafana endpoints
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus.monitoring.svc.cluster.local:9090}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to send alerts
send_alert() {
    local severity=$1
    local title=$2
    local message=$3
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"severity\": \"$severity\",
                \"title\": \"$title\",
                \"message\": \"$message\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"namespace\": \"$NAMESPACE\",
                \"release\": \"$HELM_RELEASE\"
            }" 2>/dev/null || true
    fi
}

# Function to get current deployment info
get_deployment_info() {
    kubectl get deployment -n "$NAMESPACE" \
        -l "app.kubernetes.io/instance=$HELM_RELEASE" \
        -o json | jq -r '.items[] | {
            name: .metadata.name,
            revision: .metadata.annotations."deployment.kubernetes.io/revision",
            replicas: .spec.replicas,
            ready: .status.readyReplicas,
            updated: .status.updatedReplicas
        }'
}

# Function to check error rate from Prometheus
check_error_rate() {
    local query='rate(http_requests_total{namespace="'$NAMESPACE'",status=~"5.."}[5m]) / rate(http_requests_total{namespace="'$NAMESPACE'"}[5m])'
    
    local error_rate
    error_rate=$(curl -s -G "$PROMETHEUS_URL/api/v1/query" \
        --data-urlencode "query=$query" | \
        jq -r '.data.result[0].value[1] // "0"')
    
    echo "$error_rate"
}

# Function to check response time from Prometheus
check_response_time() {
    local query='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{namespace="'$NAMESPACE'"}[5m]))'
    
    local response_time
    response_time=$(curl -s -G "$PROMETHEUS_URL/api/v1/query" \
        --data-urlencode "query=$query" | \
        jq -r '.data.result[0].value[1] // "0"')
    
    # Convert to milliseconds
    echo "$response_time" | awk '{print $1 * 1000}'
}

# Function to check resource usage
check_resource_usage() {
    local deployment=$1
    
    # Get pod metrics
    local metrics
    metrics=$(kubectl top pods -n "$NAMESPACE" \
        -l "app.kubernetes.io/instance=$HELM_RELEASE" \
        --no-headers 2>/dev/null || echo "")
    
    if [ -z "$metrics" ]; then
        echo "0 0"
        return
    fi
    
    # Calculate average CPU and memory usage
    local avg_cpu
    avg_cpu=$(echo "$metrics" | awk '{sum+=$2; count++} END {if(count>0) print sum/count; else print 0}' | sed 's/m$//')
    
    local avg_memory
    avg_memory=$(echo "$metrics" | awk '{sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' | sed 's/Mi$//')
    
    echo "$avg_cpu $avg_memory"
}

# Function to check pod health
check_pod_health() {
    local unhealthy_pods
    unhealthy_pods=$(kubectl get pods -n "$NAMESPACE" \
        -l "app.kubernetes.io/instance=$HELM_RELEASE" \
        --field-selector=status.phase!=Running \
        --no-headers 2>/dev/null | wc -l)
    
    local total_pods
    total_pods=$(kubectl get pods -n "$NAMESPACE" \
        -l "app.kubernetes.io/instance=$HELM_RELEASE" \
        --no-headers 2>/dev/null | wc -l)
    
    if [ "$total_pods" -eq 0 ]; then
        echo "1.0"  # 100% unhealthy if no pods
        return
    fi
    
    echo "$unhealthy_pods $total_pods" | awk '{print $1/$2}'
}

# Function to create rollback checkpoint
create_rollback_checkpoint() {
    local deployment=$1
    local revision=$2
    local checkpoint_file="/tmp/rollback-checkpoint-$(date +%s).json"
    
    kubectl get deployment "$deployment" -n "$NAMESPACE" -o json > "$checkpoint_file"
    
    # Store checkpoint in ConfigMap
    kubectl create configmap "rollback-checkpoint-$revision" \
        -n "$NAMESPACE" \
        --from-file=checkpoint="$checkpoint_file" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_info "Created rollback checkpoint for revision $revision"
    
    rm -f "$checkpoint_file"
}

# Function to perform rollback
perform_rollback() {
    local deployment=$1
    local target_revision=${2:-0}  # 0 means previous revision
    
    log_warning "Initiating rollback for deployment $deployment"
    
    # Create pre-rollback snapshot
    local current_revision
    current_revision=$(kubectl get deployment "$deployment" -n "$NAMESPACE" \
        -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
    
    create_rollback_checkpoint "$deployment" "$current_revision"
    
    # Perform the rollback
    if [ "$target_revision" -eq 0 ]; then
        kubectl rollout undo deployment "$deployment" -n "$NAMESPACE"
    else
        kubectl rollout undo deployment "$deployment" -n "$NAMESPACE" --to-revision="$target_revision"
    fi
    
    # Wait for rollback to complete
    kubectl rollout status deployment "$deployment" -n "$NAMESPACE" --timeout=300s
    
    if [ $? -eq 0 ]; then
        log_success "Rollback completed successfully"
        send_alert "info" "Rollback Successful" "Deployment $deployment rolled back successfully"
        return 0
    else
        log_error "Rollback failed or timed out"
        send_alert "critical" "Rollback Failed" "Failed to rollback deployment $deployment"
        return 1
    fi
}

# Function to analyze metrics and decide on rollback
analyze_and_rollback() {
    local deployment=$1
    local rollback_reasons=()
    local should_rollback=false
    
    log_info "Analyzing metrics for potential rollback..."
    
    # Check error rate
    local error_rate
    error_rate=$(check_error_rate)
    if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
        should_rollback=true
        rollback_reasons+=("High error rate: ${error_rate}%")
        log_warning "Error rate (${error_rate}%) exceeds threshold (${ERROR_THRESHOLD}%)"
    fi
    
    # Check response time
    local response_time
    response_time=$(check_response_time)
    if (( $(echo "$response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
        should_rollback=true
        rollback_reasons+=("High response time: ${response_time}ms")
        log_warning "Response time (${response_time}ms) exceeds threshold (${RESPONSE_TIME_THRESHOLD}ms)"
    fi
    
    # Check resource usage
    local resource_usage
    resource_usage=$(check_resource_usage "$deployment")
    local cpu_usage=$(echo "$resource_usage" | awk '{print $1}')
    local memory_usage=$(echo "$resource_usage" | awk '{print $2}')
    
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        should_rollback=true
        rollback_reasons+=("High CPU usage: ${cpu_usage}%")
        log_warning "CPU usage (${cpu_usage}%) exceeds threshold (${CPU_THRESHOLD}%)"
    fi
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        should_rollback=true
        rollback_reasons+=("High memory usage: ${memory_usage}%")
        log_warning "Memory usage (${memory_usage}%) exceeds threshold (${MEMORY_THRESHOLD}%)"
    fi
    
    # Check pod health
    local unhealthy_ratio
    unhealthy_ratio=$(check_pod_health)
    if (( $(echo "$unhealthy_ratio > 0.2" | bc -l) )); then
        should_rollback=true
        rollback_reasons+=("Too many unhealthy pods: ${unhealthy_ratio}%")
        log_warning "Unhealthy pod ratio (${unhealthy_ratio}%) is too high"
    fi
    
    # Decision to rollback
    if [ "$should_rollback" = true ]; then
        local reason_list=$(IFS=", "; echo "${rollback_reasons[*]}")
        log_error "Rollback triggered due to: $reason_list"
        send_alert "critical" "Automatic Rollback Triggered" "Reasons: $reason_list"
        perform_rollback "$deployment"
        return $?
    else
        log_success "All metrics within acceptable thresholds"
        return 0
    fi
}

# Function to monitor deployment continuously
monitor_deployment() {
    local deployment=$1
    local duration=$2
    local check_interval=10
    
    log_info "Starting continuous monitoring for $duration seconds..."
    
    local end_time=$(($(date +%s) + duration))
    local check_count=0
    local failure_count=0
    
    while [ $(date +%s) -lt $end_time ]; do
        check_count=$((check_count + 1))
        
        # Run analysis
        if ! analyze_and_rollback "$deployment"; then
            failure_count=$((failure_count + 1))
            
            # If rollback was performed, exit monitoring
            if [ $? -eq 2 ]; then
                log_info "Exiting monitoring after rollback"
                return 2
            fi
        fi
        
        # Sleep before next check
        sleep $check_interval
    done
    
    log_success "Monitoring completed. Checks: $check_count, Failures: $failure_count"
    return 0
}

# Function to cleanup old rollback checkpoints
cleanup_old_checkpoints() {
    log_info "Cleaning up old rollback checkpoints..."
    
    local checkpoints
    checkpoints=$(kubectl get configmap -n "$NAMESPACE" \
        -l "type=rollback-checkpoint" \
        --sort-by=.metadata.creationTimestamp \
        -o jsonpath='{.items[*].metadata.name}')
    
    local count=$(echo "$checkpoints" | wc -w)
    
    if [ "$count" -gt "$ROLLBACK_HISTORY_LIMIT" ]; then
        local to_delete=$((count - ROLLBACK_HISTORY_LIMIT))
        echo "$checkpoints" | tr ' ' '\n' | head -n "$to_delete" | while read -r cm; do
            kubectl delete configmap "$cm" -n "$NAMESPACE"
            log_info "Deleted old checkpoint: $cm"
        done
    fi
}

# Function to list rollback history
list_rollback_history() {
    log_info "Rollback history for $HELM_RELEASE:"
    
    kubectl rollout history deployment -n "$NAMESPACE" \
        -l "app.kubernetes.io/instance=$HELM_RELEASE"
}

# Function to validate rollback capability
validate_rollback_capability() {
    local deployment=$1
    
    log_info "Validating rollback capability..."
    
    # Check if deployment exists
    if ! kubectl get deployment "$deployment" -n "$NAMESPACE" &>/dev/null; then
        log_error "Deployment $deployment not found"
        return 1
    fi
    
    # Check rollout history
    local history_count
    history_count=$(kubectl rollout history deployment "$deployment" -n "$NAMESPACE" \
        --no-headers 2>/dev/null | wc -l)
    
    if [ "$history_count" -lt 2 ]; then
        log_warning "Insufficient rollout history for rollback (only $history_count revisions)"
        return 1
    fi
    
    # Check if a rollout is in progress
    if ! kubectl rollout status deployment "$deployment" -n "$NAMESPACE" --timeout=1s &>/dev/null; then
        log_warning "Rollout is currently in progress"
        return 1
    fi
    
    log_success "Rollback capability validated"
    return 0
}

# Main function
main() {
    local action=${1:-monitor}
    local deployment=${2:-$HELM_RELEASE}
    
    case "$action" in
        monitor)
            log_info "Starting rollback manager in monitoring mode"
            
            # Validate before starting
            if ! validate_rollback_capability "$deployment"; then
                log_error "Rollback capability validation failed"
                exit 1
            fi
            
            # Start monitoring
            monitor_deployment "$deployment" "$MONITORING_DURATION"
            
            # Cleanup old checkpoints
            cleanup_old_checkpoints
            ;;
            
        rollback)
            local target_revision=${3:-0}
            log_info "Manual rollback requested"
            
            if ! validate_rollback_capability "$deployment"; then
                log_error "Rollback capability validation failed"
                exit 1
            fi
            
            perform_rollback "$deployment" "$target_revision"
            ;;
            
        history)
            list_rollback_history
            ;;
            
        validate)
            validate_rollback_capability "$deployment"
            ;;
            
        analyze)
            analyze_and_rollback "$deployment"
            ;;
            
        cleanup)
            cleanup_old_checkpoints
            ;;
            
        *)
            cat <<EOF
Usage: $0 [ACTION] [DEPLOYMENT] [OPTIONS]

Actions:
    monitor [deployment]              Monitor deployment and auto-rollback if needed
    rollback [deployment] [revision]  Manually trigger rollback
    history                           Show rollback history
    validate [deployment]             Validate rollback capability
    analyze [deployment]              Analyze metrics once
    cleanup                           Clean up old checkpoints

Environment Variables:
    NAMESPACE                   Kubernetes namespace (default: taxomind)
    MONITORING_DURATION         Monitoring duration in seconds (default: 300)
    ERROR_THRESHOLD            Error rate threshold (default: 0.05)
    RESPONSE_TIME_THRESHOLD    Response time threshold in ms (default: 2000)
    CPU_THRESHOLD              CPU usage threshold percentage (default: 80)
    MEMORY_THRESHOLD           Memory usage threshold percentage (default: 90)

Examples:
    $0 monitor taxomind-app
    $0 rollback taxomind-app 5
    $0 history
EOF
            exit 0
            ;;
    esac
}

# Run main function
main "$@"