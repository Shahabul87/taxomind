/**
 * OpenTelemetry Configuration
 * Core telemetry setup for distributed tracing and metrics collection
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes, defaultResource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';

// Environment configuration
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'taxomind-app';
const OTEL_SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const OTEL_DEPLOYMENT_ENVIRONMENT = process.env.NODE_ENV || 'development';
const OTEL_PROMETHEUS_PORT = parseInt(process.env.OTEL_PROMETHEUS_PORT || '9464');

/**
 * Create resource with service information
 */
const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: OTEL_SERVICE_NAME,
  [SemanticResourceAttributes.SERVICE_VERSION]: OTEL_SERVICE_VERSION,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: OTEL_DEPLOYMENT_ENVIRONMENT,
  [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.HOSTNAME || 'local',
}).merge(defaultResource());

/**
 * Configure trace exporter
 */
const traceExporter = new OTLPTraceExporter({
  url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: {
    'X-Service-Name': OTEL_SERVICE_NAME,
  },
});

/**
 * Configure metric exporters
 */
const metricExporter = new OTLPMetricExporter({
  url: `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: {
    'X-Service-Name': OTEL_SERVICE_NAME,
  },
});

// Prometheus exporter for metrics scraping
const prometheusExporter = new PrometheusExporter({
  port: OTEL_PROMETHEUS_PORT,
  endpoint: '/metrics',
}, () => {
  console.log(`Prometheus metrics available at http://localhost:${OTEL_PROMETHEUS_PORT}/metrics`);
});

/**
 * Custom instrumentation configuration
 */
const instrumentations = [
  // HTTP instrumentation with custom configuration
  new HttpInstrumentation({
    requestHook: (span, request) => {
      const req = request as any;
      span.setAttributes({
        'http.request.body.size': req.headers?.['content-length'] || 0,
        'http.request.user_agent': req.headers?.['user-agent'] || 'unknown',
      });
    },
    responseHook: (span, response) => {
      const res = response as any;
      span.setAttributes({
        'http.response.body.size': res.headers?.['content-length'] || 0,
      });
    },
    // ignoreIncomingPaths: ['/health', '/metrics', '/favicon.ico'], // Not supported in this version
    // ignoreOutgoingUrls: [(url: string) => url.includes('telemetry')], // Not supported in this version
  }),
  
  // Prisma instrumentation for database queries
  new PrismaInstrumentation({
    middleware: true,
  }),
  
  // Redis instrumentation for cache operations
  new RedisInstrumentation({
    dbStatementSerializer: (cmdName, cmdArgs) => {
      // Sanitize sensitive data in Redis commands
      if (cmdName === 'auth') return 'AUTH [REDACTED]';
      return `${cmdName} ${cmdArgs.join(' ')}`;
    },
  }),
  
  // Express instrumentation
  new ExpressInstrumentation({
    requestHook: (span, info) => {
      span.setAttributes({
        'express.route': info.route,
        'express.layer_type': info.layerType,
      });
    },
  }),
];

/**
 * Initialize OpenTelemetry SDK
 */
export const initTelemetry = (): NodeSDK => {
  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000, // Export metrics every 10 seconds
    }),
    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation
      },
    }),
  });

  // Register custom instrumentations
  registerInstrumentations({
    instrumentations,
  });

  // Initialize the SDK
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Telemetry terminated'))
      .catch((error) => console.error('Error terminating telemetry', error))
      .finally(() => process.exit(0));
  });

  return sdk;
};

/**
 * Shutdown telemetry gracefully
 */
export const shutdownTelemetry = async (sdk: NodeSDK): Promise<void> => {
  try {
    await sdk.shutdown();
    console.log('Telemetry shut down successfully');
  } catch (error) {
    console.error('Error shutting down telemetry:', error);
  }
};

// Export Prometheus registry for custom metrics
export { prometheusExporter };