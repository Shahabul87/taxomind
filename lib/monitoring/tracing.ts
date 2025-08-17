/**
 * Distributed Tracing System
 * Request tracing across microservices and dependencies
 */

import { 
  trace, 
  context, 
  Context,
  SpanKind, 
  SpanStatusCode,
  Span,
  SpanContext,
  Tracer,
  Attributes,
  Link
} from '@opentelemetry/api';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

// Set up context manager
const contextManager = new AsyncHooksContextManager();
contextManager.enable();
context.setGlobalContextManager(contextManager);

// Tracer instance
const tracer = trace.getTracer('taxomind-tracing', '1.0.0');

/**
 * Span attributes for different operations
 */
export const SpanAttributes = {
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  DB_STATEMENT: 'db.statement',
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_ROUTE: 'http.route',
  CACHE_HIT: 'cache.hit',
  CACHE_KEY: 'cache.key',
  USER_ID: 'user.id',
  USER_ROLE: 'user.role',
  COURSE_ID: 'course.id',
  CHAPTER_ID: 'chapter.id',
  ERROR_TYPE: 'error.type',
  ERROR_MESSAGE: 'error.message',
  AI_MODEL: 'ai.model',
  AI_TOKENS: 'ai.tokens',
};

/**
 * Transaction tracer for complex operations
 */
export class TransactionTracer {
  private span: Span;
  private childSpans: Map<string, Span> = new Map();
  
  constructor(
    name: string,
    attributes?: Attributes,
    parentContext?: SpanContext
  ) {
    const options = {
      kind: SpanKind.INTERNAL,
      attributes,
      links: parentContext ? [{ context: parentContext }] : undefined,
    };
    
    this.span = tracer.startSpan(name, options);
  }
  
  /**
   * Start a child span within the transaction
   */
  public startChildSpan(
    name: string,
    attributes?: Attributes
  ): Span {
    const childSpan = tracer.startSpan(
      name,
      {
        kind: SpanKind.INTERNAL,
        attributes,
      },
      trace.setSpan(context.active(), this.span)
    );
    
    const spanId = crypto.randomUUID();
    this.childSpans.set(spanId, childSpan);
    
    return childSpan;
  }
  
  /**
   * Add event to the transaction
   */
  public addEvent(name: string, attributes?: Attributes): void {
    this.span.addEvent(name, attributes);
  }
  
  /**
   * Set attribute on the transaction
   */
  public setAttribute(key: string, value: any): void {
    this.span.setAttribute(key, value);
  }
  
  /**
   * Set multiple attributes
   */
  public setAttributes(attributes: Attributes): void {
    this.span.setAttributes(attributes);
  }
  
  /**
   * Record an exception
   */
  public recordException(error: Error): void {
    this.span.recordException(error);
    this.span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
  
  /**
   * End the transaction
   */
  public end(status?: { code: SpanStatusCode; message?: string }): void {
    // End all child spans
    this.childSpans.forEach(childSpan => {
      // Check if span is not ended (OpenTelemetry spans don't have 'ended' property)
      try {
        childSpan.end();
      } catch (error) {
        // Span might already be ended
      }
    });
    
    if (status) {
      this.span.setStatus(status);
    }
    
    this.span.end();
  }
  
  /**
   * Get span context for propagation
   */
  public getSpanContext(): SpanContext | undefined {
    return this.span.spanContext();
  }
}

/**
 * Database query tracer
 */
export class DatabaseTracer {
  /**
   * Trace a database query
   */
  public static async traceQuery<T>(
    operation: string,
    model: string,
    statement: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`db.${operation}.${model}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [SpanAttributes.DB_SYSTEM]: 'postgresql',
        [SpanAttributes.DB_NAME]: process.env.DATABASE_NAME || 'taxomind',
        [SpanAttributes.DB_OPERATION]: operation,
        [SpanAttributes.DB_STATEMENT]: this.sanitizeStatement(statement),
        'db.model': model,
      },
    });
    
    try {
      const startTime = performance.now();
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      span.setAttributes({
        'db.duration_ms': duration,
        'db.rows_affected': this.getRowCount(result),
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Trace a transaction
   */
  public static async traceTransaction<T>(
    name: string,
    transactionFn: (tx: any) => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`db.transaction.${name}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [SpanAttributes.DB_SYSTEM]: 'postgresql',
        'db.transaction.name': name,
      },
    });
    
    try {
      const result = await context.with(
        trace.setSpan(context.active(), span),
        async () => {
          return await transactionFn(span);
        }
      );
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Sanitize SQL statement for tracing
   */
  private static sanitizeStatement(statement: string): string {
    // Remove sensitive data from SQL statements
    return statement
      .replace(/VALUES\s*\([^)]+\)/gi, 'VALUES (...)')
      .replace(/WHERE\s+.*?(?:ORDER|GROUP|LIMIT|$)/gi, 'WHERE ...')
      .replace(/SET\s+.*?(?:WHERE|$)/gi, 'SET ...');
  }
  
  /**
   * Extract row count from query result
   */
  private static getRowCount(result: any): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (result && typeof result === 'object' && 'count' in result) {
      return result.count;
    }
    return 0;
  }
}

/**
 * Cache operation tracer
 */
export class CacheTracer {
  /**
   * Trace a cache operation
   */
  public static async traceOperation<T>(
    operation: 'get' | 'set' | 'delete',
    key: string,
    operationFn: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`cache.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'cache.operation': operation,
        [SpanAttributes.CACHE_KEY]: this.sanitizeKey(key),
        'cache.backend': 'redis',
      },
    });
    
    try {
      const startTime = performance.now();
      const result = await operationFn();
      const duration = performance.now() - startTime;
      
      const hit = operation === 'get' && result !== null && result !== undefined;
      
      span.setAttributes({
        'cache.duration_ms': duration,
        [SpanAttributes.CACHE_HIT]: hit,
        'cache.size': this.getSize(result),
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Sanitize cache key for tracing
   */
  private static sanitizeKey(key: string): string {
    // Replace user-specific parts with placeholders
    return key.replace(/user:\d+/g, 'user:*')
              .replace(/session:[a-z0-9]+/gi, 'session:*');
  }
  
  /**
   * Get size of cached value
   */
  private static getSize(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'string') {
      return value.length;
    }
    if (Buffer.isBuffer(value)) {
      return value.length;
    }
    return JSON.stringify(value).length;
  }
}

/**
 * HTTP request tracer
 */
export class HttpTracer {
  /**
   * Trace an HTTP request
   */
  public static async traceRequest<T>(
    method: string,
    url: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`http.${method.toLowerCase()}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        [SpanAttributes.HTTP_METHOD]: method,
        [SpanAttributes.HTTP_URL]: this.sanitizeUrl(url),
        'http.scheme': new URL(url).protocol.replace(':', ''),
        'http.host': new URL(url).hostname,
      },
    });
    
    try {
      const startTime = performance.now();
      const result = await requestFn();
      const duration = performance.now() - startTime;
      
      span.setAttributes({
        'http.duration_ms': duration,
        [SpanAttributes.HTTP_STATUS_CODE]: this.extractStatusCode(result),
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Sanitize URL for tracing
   */
  private static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove sensitive query parameters
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      const searchParams = new URLSearchParams(urlObj.search);
      
      sensitiveParams.forEach(param => {
        if (searchParams.has(param)) {
          searchParams.set(param, '[REDACTED]');
        }
      });
      
      urlObj.search = searchParams.toString();
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  /**
   * Extract status code from response
   */
  private static extractStatusCode(response: any): number {
    if (response && typeof response === 'object') {
      return response.status || response.statusCode || 200;
    }
    return 200;
  }
}

/**
 * AI operation tracer
 */
export class AITracer {
  /**
   * Trace an AI/LLM operation
   */
  public static async traceOperation<T>(
    operation: string,
    model: string,
    operationFn: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`ai.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'ai.operation': operation,
        [SpanAttributes.AI_MODEL]: model,
        'ai.provider': this.getProvider(model),
      },
    });
    
    try {
      const startTime = performance.now();
      const result = await operationFn();
      const duration = performance.now() - startTime;
      
      span.setAttributes({
        'ai.duration_ms': duration,
        [SpanAttributes.AI_TOKENS]: this.extractTokenCount(result),
        'ai.success': true,
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Get AI provider from model name
   */
  private static getProvider(model: string): string {
    if (model.includes('gpt')) return 'openai';
    if (model.includes('claude')) return 'anthropic';
    if (model.includes('gemini')) return 'google';
    return 'unknown';
  }
  
  /**
   * Extract token count from AI response
   */
  private static extractTokenCount(response: any): number {
    if (response && typeof response === 'object') {
      return response.usage?.total_tokens || 
             response.tokens || 
             response.token_count || 
             0;
    }
    return 0;
  }
}

/**
 * Trace context propagation utilities
 */
export class TracePropagation {
  private static propagator = new W3CTraceContextPropagator();
  
  /**
   * Inject trace context into headers
   */
  public static inject(headers: Record<string, string>): Record<string, string> {
    const carrier = { ...headers };
    this.propagator.inject(context.active(), carrier, {
      set: (carrier: any, key: string, value: string) => {
        carrier[key] = value;
      },
    });
    return carrier;
  }
  
  /**
   * Extract trace context from headers
   */
  public static extract(headers: Record<string, string>): Context {
    return this.propagator.extract(context.active(), headers, {
      get: (carrier, key) => {
        const value = carrier[key];
        return Array.isArray(value) ? value[0] : value;
      },
      keys: (carrier) => Object.keys(carrier),
    });
  }
}

/**
 * Decorator for automatic span creation
 */
export function Trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const name = spanName || `${target.constructor.name}.${propertyKey}`;
      const span = tracer.startSpan(name, {
        kind: SpanKind.INTERNAL,
      });
      
      try {
        const result = await context.with(
          trace.setSpan(context.active(), span),
          () => originalMethod.apply(this, args)
        );
        
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        throw error;
      } finally {
        span.end();
      }
    };
    
    return descriptor;
  };
}