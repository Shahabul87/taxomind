import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { recordDatabaseQuery } from './metrics';
import { trace, context } from '@opentelemetry/api';
import * as Sentry from '@sentry/nextjs';

const tracer = trace.getTracer('taxomind-lms-db');

// Enhanced Prisma client with observability
export class ObservablePrismaClient {
  private client: typeof db;

  constructor() {
    this.client = db;
    this.setupMiddleware();
  }

  private setupMiddleware() {
    // Add Prisma middleware for automatic query tracking
    this.client.$use(async (params, next) => {
      const startTime = Date.now();
      const { model, action } = params;
      
      // Create OpenTelemetry span for database query
      const span = tracer.startSpan(`db.${model}.${action}`, {
        attributes: {
          'db.system': 'postgresql',
          'db.operation': action,
          'db.name': model || 'unknown',
        },
      });

      // Add Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'db.query',
        message: `${model}.${action}`,
        level: 'info',
        data: {
          model,
          action,
        },
      });

      try {
        const result = await context.with(
          trace.setSpan(context.active(), span),
          async () => next(params)
        );

        const duration = (Date.now() - startTime) / 1000;
        
        // Record metrics
        recordDatabaseQuery(action, model || 'unknown', duration);

        // Update span with success info
        span.setAttributes({
          'db.rows_affected': Array.isArray(result) ? result.length : 1,
          'db.duration': duration,
        });

        return result;
      } catch (error: any) {
        const duration = (Date.now() - startTime) / 1000;
        
        // Record error metrics
        recordDatabaseQuery(`${action}_error`, model || 'unknown', duration);

        // Record error in span
        span.recordException(error as Error);
        
        // Record error in Sentry
        Sentry.captureException(error, {
          tags: {
            operation: action,
            model: model || 'unknown',
          },
          contexts: {
            database: {
              operation: action,
              model: model || 'unknown',
              duration,
            },
          },
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }

  // Proxy all Prisma client methods - only include models that exist in schema
  get user() { return this.client.user; }
  get course() { return this.client.course; }
  get chapter() { return this.client.chapter; }
  get section() { return this.client.section; }
  get enrollment() { return this.client.enrollment; }
  get purchase() { return this.client.purchase; }
  get category() { return this.client.category; }
  get attachment() { return this.client.attachment; }
  get stripeCustomer() { return this.client.stripeCustomer; }
  get bill() { return this.client.bill; }
  get question() { return this.client.question; }
  get answer() { return this.client.answer; }
  get userAnswer() { return this.client.userAnswer; }
  get note() { return this.client.note; }
  get notification() { return this.client.notification; }
  get activity() { return this.client.activity; }
  get userAIPreferences() { return this.client.userAIPreferences; }
  get learningPath() { return this.client.learningPath; }
  get pathEnrollment() { return this.client.pathEnrollment; }
  get courseReview() { return this.client.courseReview; }
  get blog() { return this.client.blog; }
  get article() { return this.client.article; }
  get post() { return this.client.post; }
  get comment() { return this.client.comment; }
  get reply() { return this.client.reply; }
  get group() { return this.client.group; }
  get exam() { return this.client.exam; }
  get userExamAttempt() { return this.client.userExamAttempt; }
  get examAnalytics() { return this.client.examAnalytics; }
  get performance_metrics() { return this.client.performance_metrics; }
  get learning_metrics() { return this.client.learning_metrics; }
  get learning_sessions() { return this.client.learning_sessions; }
  get aIGeneratedContent() { return this.client.aIGeneratedContent; }
  get aIContentGeneration() { return this.client.aIContentGeneration; }
  get aIUsageMetrics() { return this.client.aIUsageMetrics; }
  get userAnalytics() { return this.client.userAnalytics; }
  get sAMInteraction() { return this.client.sAMInteraction; }

  // Proxy utility methods
  get $connect() { return this.client.$connect.bind(this.client); }
  get $disconnect() { return this.client.$disconnect.bind(this.client); }
  get $executeRaw() { return this.client.$executeRaw.bind(this.client); }
  get $queryRaw() { return this.client.$queryRaw.bind(this.client); }
  get $transaction() { return this.client.$transaction.bind(this.client); }
  get $use() { return this.client.$use.bind(this.client); }
  get $on() { return this.client.$on.bind(this.client); }
}

// Create and export the observable database client
export const observableDb = new ObservablePrismaClient();

// Helper functions for database observability
export async function withDatabaseTransaction<T>(
  name: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(`db.transaction.${name}`);
  
  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      () => db.$transaction(fn)
    );
    
    span.setAttributes({
      'db.transaction.success': true,
    });
    
    return result;
  } catch (error: any) {
    span.recordException(error as Error);
    span.setAttributes({
      'db.transaction.success': false,
    });
    
    Sentry.captureException(error, {
      tags: {
        transaction: name,
      },
    });
    
    throw error;
  } finally {
    span.end();
  }
}

// Helper to track slow queries
export function trackSlowQuery(
  model: string,
  action: string,
  duration: number,
  threshold: number = 1000 // 1 second
) {
  if (duration > threshold) {
    Sentry.captureMessage(`Slow database query detected: ${model}.${action}`, {
      level: 'warning',
      tags: {
        model,
        action,
        duration: `${duration}ms`,
        type: 'slow_query',
      },
    });
  }
}