/**
 * OpenTelemetry tracing initialization.
 * Opt-in via ENABLE_OTEL=true environment variable.
 *
 * This is a placeholder stub. To enable full tracing:
 * 1. Install @opentelemetry/sdk-node, @opentelemetry/auto-instrumentations-node
 * 2. Replace initializeTracing() with actual SDK setup
 */

import { logger } from '@/lib/logger';

export function initializeTracing(): void {
  logger.info('[OTEL] Tracing stub loaded — install @opentelemetry/sdk-node for full instrumentation');
}
