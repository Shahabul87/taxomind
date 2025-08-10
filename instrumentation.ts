import { initializeTracing } from '@/lib/observability/tracing';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initializeTracing();
  }
}