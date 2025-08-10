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
      } catch (error) {
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

  // Proxy all Prisma client methods
  get user() { return this.client.user; }
  get course() { return this.client.course; }
  get chapter() { return this.client.chapter; }
  get section() { return this.client.section; }
  get enrollment() { return this.client.enrollment; }
  get purchase() { return this.client.purchase; }
  get category() { return this.client.category; }
  get attachment() { return this.client.attachment; }
  get userProgress() { return this.client.userProgress; }
  get muxData() { return this.client.muxData; }
  get stripeCustomer() { return this.client.stripeCustomer; }
  get bill() { return this.client.bill; }
  get payment() { return this.client.payment; }
  get audit() { return this.client.audit; }
  get news() { return this.client.news; }
  get aiTutor() { return this.client.aiTutor; }
  get aiTutorSession() { return this.client.aiTutorSession; }
  get aiTutorMessage() { return this.client.aiTutorMessage; }
  get performanceMetrics() { return this.client.performanceMetrics; }
  get reviewRating() { return this.client.reviewRating; }
  get badge() { return this.client.badge; }
  get achievement() { return this.client.achievement; }
  get learningPath() { return this.client.learningPath; }
  get learningPathCourse() { return this.client.learningPathCourse; }
  get userLearningPath() { return this.client.userLearningPath; }
  get certificate() { return this.client.certificate; }
  get quiz() { return this.client.quiz; }
  get question() { return this.client.question; }
  get answer() { return this.client.answer; }
  get userAnswer() { return this.client.userAnswer; }
  get userQuizResult() { return this.client.userQuizResult; }
  get forum() { return this.client.forum; }
  get forumPost() { return this.client.forumPost; }
  get forumReply() { return this.client.forumReply; }
  get note() { return this.client.note; }
  get reminder() { return this.client.reminder; }
  get notification() { return this.client.notification; }
  get activityLog() { return this.client.activityLog; }
  get courseViewHistory() { return this.client.courseViewHistory; }
  get searchHistory() { return this.client.searchHistory; }
  get bookmark() { return this.client.bookmark; }
  get courseFavorite() { return this.client.courseFavorite; }
  get userPreference() { return this.client.userPreference; }
  get courseCompletionCertificate() { return this.client.courseCompletionCertificate; }
  get samAI() { return this.client.samAI; }

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
  } catch (error) {
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