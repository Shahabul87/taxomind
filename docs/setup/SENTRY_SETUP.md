# Sentry Setup Guide for Taxomind LMS

## Overview
Sentry is integrated into Taxomind LMS for comprehensive Application Performance Monitoring (APM), error tracking, and user session replay capabilities.

## Quick Setup

### 1. Create a Sentry Account
1. Go to [Sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project with type "Next.js"
3. Note your DSN from the project settings

### 2. Configure Environment Variables
Add these to your `.env.local` file:

```bash
# Required
SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/YOUR_PROJECT_ID
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/YOUR_PROJECT_ID

# Optional (for source maps in production)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=sntrys_YOUR_AUTH_TOKEN
```

### 3. Test the Integration
Visit `/sentry-test` in your development environment to test various Sentry features.

## Features Implemented

### 1. Error Tracking
- **Client-side errors**: Automatically captured via error boundaries
- **Server-side errors**: Captured in API routes and server components
- **Custom error reporting**: Use `reportError()` from `lib/sentry.ts`

### 2. Performance Monitoring
- **Automatic transaction tracking**: Page loads and API calls
- **Custom transactions**: Track specific operations
- **Web Vitals**: Core Web Vitals automatically tracked

### 3. Session Replay
- Records user sessions when errors occur
- Helps debug issues by seeing exactly what users experienced
- Privacy-compliant with automatic PII masking

### 4. User Context
- Automatically associates errors with logged-in users
- Track user-specific issues and patterns

## Usage Examples

### Basic Error Reporting
```typescript
import { reportError } from '@/lib/sentry';

try {
  // Your code
} catch (error) {
  reportError(error, {
    userId: user.id,
    action: 'course_creation',
    metadata: { courseId: course.id }
  });
}
```

### Custom Events
```typescript
import { AppEvents } from '@/lib/sentry';

// Track successful login
AppEvents.loginSuccess(user.id, 'google');

// Track course purchase
AppEvents.coursePurchased(courseId, userId, amount);

// Track payment failure
AppEvents.paymentFailed(userId, error.message, amount);
```

### Performance Monitoring
```typescript
import { monitorApiCall } from '@/lib/sentry';

const data = await monitorApiCall(
  () => fetch('/api/courses').then(r => r.json()),
  '/api/courses',
  'GET'
);
```

### Manual Breadcrumbs
```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb(
  'User clicked submit button',
  'user-action',
  { formId: 'course-form' }
);
```

## Environment-Specific Configuration

### Development
- 100% transaction sampling for debugging
- Debug mode enabled in console
- Session replay at 50% rate

### Production
- 10% transaction sampling to manage costs
- Session replay only on errors
- Source maps uploaded for better stack traces

## Cost Management

Sentry's free tier includes:
- 5,000 errors/month
- 10,000 performance units/month
- 500 session replays/month

To stay within limits:
- Use sampling rates (configured in sentry.*.config.ts)
- Filter out non-critical errors
- Use `beforeSend` to drop specific error types

## Monitoring Dashboard

After setup, monitor your application at:
- **Issues**: Track and resolve errors
- **Performance**: Monitor transaction times
- **Releases**: Track deployments and regressions
- **User Feedback**: Collect user reports on errors
- **Dashboards**: Custom metrics and KPIs

## Troubleshooting

### Sentry not receiving events
1. Check if DSN is correctly set in environment variables
2. Verify Sentry is initialized in `instrumentation.ts`
3. Check browser console for Sentry initialization messages
4. Visit `/sentry-test` to test the connection

### Source maps not working
1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Verify `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account
3. Check build logs for source map upload confirmation

### Performance impact
If you notice performance degradation:
1. Reduce `tracesSampleRate` in production
2. Disable session replay or reduce sample rate
3. Use `beforeSend` to filter unnecessary events

## Security Considerations

- Never commit Sentry DSN to public repositories (use environment variables)
- Use `maskAllText: true` in replay configuration for sensitive applications
- Implement PII scrubbing in `beforeSend` hook
- Review Sentry's data retention policies for compliance

## Support

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Integration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Test page: `/sentry-test` in your application