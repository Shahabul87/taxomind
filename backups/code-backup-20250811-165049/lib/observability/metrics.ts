import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry to register the metrics
export const metricsRegistry = register;

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// Custom metrics for LMS
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  labelNames: ['user_type'],
});

export const courseEnrollments = new Counter({
  name: 'course_enrollments_total',
  help: 'Total number of course enrollments',
  labelNames: ['course_id', 'course_name'],
});

export const coursePurchases = new Counter({
  name: 'course_purchases_total',
  help: 'Total number of course purchases',
  labelNames: ['course_id', 'course_name', 'payment_method'],
});

export const lessonCompletions = new Counter({
  name: 'lesson_completions_total',
  help: 'Total number of lesson completions',
  labelNames: ['course_id', 'lesson_id'],
});

export const quizAttempts = new Counter({
  name: 'quiz_attempts_total',
  help: 'Total number of quiz attempts',
  labelNames: ['course_id', 'quiz_id', 'result'],
});

export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['endpoint', 'error_type', 'status_code'],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const authenticationAttempts = new Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['provider', 'result'],
});

export const aiGenerationRequests = new Counter({
  name: 'ai_generation_requests_total',
  help: 'Total number of AI content generation requests',
  labelNames: ['type', 'model'],
});

export const aiGenerationDuration = new Histogram({
  name: 'ai_generation_duration_seconds',
  help: 'Duration of AI content generation in seconds',
  labelNames: ['type', 'model'],
  buckets: [1, 5, 10, 30, 60, 120],
});

// Helper functions for updating metrics
export function recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
  httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
}

export function recordDatabaseQuery(operation: string, model: string, duration: number) {
  databaseQueryDuration.labels(operation, model).observe(duration);
}

export function recordApiError(endpoint: string, errorType: string, statusCode: number) {
  apiErrors.labels(endpoint, errorType, statusCode.toString()).inc();
}

export function recordAuthentication(provider: string, success: boolean) {
  authenticationAttempts.labels(provider, success ? 'success' : 'failure').inc();
}

export function recordCourseEnrollment(courseId: string, courseName: string) {
  courseEnrollments.labels(courseId, courseName).inc();
}

export function recordCoursePurchase(courseId: string, courseName: string, paymentMethod: string) {
  coursePurchases.labels(courseId, courseName, paymentMethod).inc();
}

export function recordLessonCompletion(courseId: string, lessonId: string) {
  lessonCompletions.labels(courseId, lessonId).inc();
}

export function recordQuizAttempt(courseId: string, quizId: string, passed: boolean) {
  quizAttempts.labels(courseId, quizId, passed ? 'pass' : 'fail').inc();
}

export function recordAiGeneration(type: string, model: string, duration: number) {
  aiGenerationRequests.labels(type, model).inc();
  aiGenerationDuration.labels(type, model).observe(duration);
}

export function updateActiveUsers(userType: string, count: number) {
  activeUsers.labels(userType).set(count);
}