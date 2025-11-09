# Payment & Enrollment System - Quick Start Guide

## 🚀 Quick Reference

### Current Issues Fixed

| Issue | Solution | Priority |
|-------|----------|----------|
| No free courses | Free enrollment API + dedicated flow | HIGH |
| Webhook delays | BullMQ job queue with 10 retries | CRITICAL |
| No error monitoring | Sentry + Custom alerts | CRITICAL |
| No email notifications | Nodemailer + email queue | HIGH |
| Payment failures | Reconciliation service runs hourly | HIGH |
| Single payment gateway | Multi-provider architecture | MEDIUM |
| No audit trail | Complete audit logging system | MEDIUM |

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ API Layer│
    └────┬─────┘
         │
    ┌────▼──────────┐
    │ Redis Queue   │ ← BullMQ (Reliable processing)
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Workers       │
    │ - Enrollment  │
    │ - Webhook     │
    │ - Email       │
    │ - Reconcile   │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Database      │
    │ + Audit Logs  │
    └───────────────┘
```

---

## 📁 File Structure

```
app/
├── api/
│   ├── courses/[courseId]/
│   │   ├── checkout/route.ts          ← Paid enrollment
│   │   └── enroll/route.ts            ← NEW: Free enrollment
│   ├── webhook/route.ts                ← Enhanced webhook
│   └── admin/
│       └── monitoring/
│           └── payments/route.ts       ← NEW: Dashboard API

lib/
├── queue/
│   ├── queue.ts                        ← NEW: Queue setup
│   └── workers/
│       ├── enrollment-worker.ts        ← NEW: Enrollment processor
│       ├── webhook-worker.ts           ← NEW: Webhook processor
│       └── email-worker.ts             ← NEW: Email sender
├── email/
│   └── email-service.ts                ← NEW: Email templates
├── security/
│   ├── rate-limit.ts                   ← NEW: Rate limiting
│   └── fraud-detection.ts              ← NEW: Fraud checks
├── monitoring/
│   └── alerts.ts                       ← NEW: Alert system
├── reconciliation/
│   └── payment-reconciliation.ts       ← NEW: Hourly reconciliation
└── audit/
    └── audit-service.ts                ← NEW: Audit logging
```

---

## 🔄 Payment Flows

### Free Course Enrollment
```
1. User clicks "Enroll Now" (free course)
2. POST /api/courses/{id}/enroll
3. Job queued → Enrollment worker
4. Enrollment created
5. Welcome email sent
6. Redirect to /courses/{id}/success?free=1
```

### Paid Course Enrollment
```
1. User clicks "Enroll Now" (paid course)
2. POST /api/courses/{id}/checkout
3. Redirect to Stripe
4. User pays
5. Stripe webhook → Queued
6. Webhook worker:
   - Creates PaymentTransaction
   - Queues enrollment job
7. Enrollment worker:
   - Creates Enrollment
   - Sends welcome email
8. Success page polls for enrollment
9. Redirect to /courses/{id}/learn
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install bullmq ioredis nodemailer @upstash/ratelimit @upstash/redis
npm install @types/nodemailer --save-dev
```

### 2. Set Up Redis
```bash
# Docker (Development)
docker run -d -p 6379:6379 redis:alpine

# Or use cloud Redis (Production)
# - Upstash
# - Redis Cloud
# - AWS ElastiCache
```

### 3. Environment Variables
```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME=TaxoMind
EMAIL_FROM_ADDRESS=noreply@taxomind.com

# Upstash (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 4. Database Migration
```bash
# Add new models to schema.prisma
# Run migration
npx prisma migrate dev --name payment_system_v2
```

### 5. Start Workers
```typescript
// server.ts or separate worker process
import { enrollmentWorker } from '@/lib/queue/workers/enrollment-worker';
import { webhookWorker } from '@/lib/queue/workers/webhook-worker';
import { emailWorker } from '@/lib/queue/workers/email-worker';

// Workers auto-start when imported
console.log('Workers started');
```

### 6. Start Background Jobs
```typescript
// app/api/cron/reconciliation/route.ts (Vercel Cron)
import { reconcilePayments } from '@/lib/reconciliation/payment-reconciliation';

export async function GET() {
  await reconcilePayments();
  return Response.json({ success: true });
}

// vercel.json
{
  "crons": [{
    "path": "/api/cron/reconciliation",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

---

## 🧪 Testing

### Test Free Enrollment
```bash
curl -X POST http://localhost:3000/api/courses/COURSE_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{}'
```

### Test Stripe Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# Trigger test payment
stripe trigger checkout.session.completed
```

### Monitor Queue
```typescript
// GET /api/admin/monitoring/queue
import { enrollmentQueue } from '@/lib/queue/queue';

const waiting = await enrollmentQueue.getWaitingCount();
const active = await enrollmentQueue.getActiveCount();
const failed = await enrollmentQueue.getFailedCount();
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Track

```typescript
// GET /api/admin/monitoring/payments
{
  "payments": {
    "total24h": 150,
    "failed24h": 3,
    "successRate": "98.00%"
  },
  "revenue": {
    "last24h": 12500.00,
    "last7d": 85000.00
  },
  "webhooks": {
    "processed": 148,
    "pending": 2
  },
  "enrollments": [
    { "enrollmentType": "FREE", "_count": 45 },
    { "enrollmentType": "PAID", "_count": 105 }
  ]
}
```

---

## 🚨 Alert Configuration

### Critical Alerts
- Payment failure rate > 10%
- Webhook delay > 5 minutes
- Queue backlog > 100 jobs
- Redis connection lost

### Setup Alerts
```typescript
// lib/monitoring/alerts.ts
import { checkAlerts, startAlertMonitoring } from '@/lib/monitoring/alerts';

// Start in production
if (process.env.NODE_ENV === 'production') {
  startAlertMonitoring();
}
```

---

## 🔧 Common Operations

### Manual Enrollment
```typescript
// For customer support
await addEnrollmentJob({
  userId: 'user_123',
  courseId: 'course_456',
  enrollmentType: 'MANUAL',
  metadata: { reason: 'Customer support ticket #1234' }
});
```

### Refund Processing
```typescript
// 1. Process Stripe refund
const refund = await stripe.refunds.create({
  payment_intent: 'pi_123',
});

// 2. Update payment transaction
await db.paymentTransaction.update({
  where: { providerTxnId: 'pi_123' },
  data: { status: 'REFUNDED' }
});

// 3. Optionally suspend enrollment
await db.enrollment.update({
  where: { id: 'enroll_123' },
  data: { status: 'SUSPENDED' }
});
```

### Manual Reconciliation
```typescript
// Run reconciliation manually
import { reconcilePayments } from '@/lib/reconciliation/payment-reconciliation';

await reconcilePayments();
```

---

## 🐛 Troubleshooting

### Issue: Enrollment not created
```bash
# Check webhook events
SELECT * FROM "WebhookEvent"
WHERE processed = false
ORDER BY "createdAt" DESC
LIMIT 10;

# Check job queue
const jobs = await enrollmentQueue.getFailed();
console.log(jobs);

# Retry failed jobs
const job = await enrollmentQueue.getJob(jobId);
await job.retry();
```

### Issue: Emails not sending
```bash
# Check email queue status
SELECT status, COUNT(*)
FROM "EmailQueue"
GROUP BY status;

# Check email worker logs
# View worker console output

# Test SMTP connection
node scripts/test-email.js
```

### Issue: Redis connection errors
```bash
# Check Redis status
redis-cli ping

# Check connection in code
import { enrollmentQueue } from '@/lib/queue/queue';
const health = await enrollmentQueue.client.ping();
console.log('Redis health:', health);
```

---

## 📈 Performance Optimization

### Queue Optimization
- Set appropriate concurrency (10 for enrollments, 3 for emails)
- Use `removeOnComplete` and `removeOnFail` to limit memory
- Monitor queue metrics

### Database Optimization
- Add indexes on frequently queried fields
- Use connection pooling
- Enable query logging in development

### Rate Limiting
- Enrollment: 5 per minute per user
- Checkout: 3 per minute per user
- Webhooks: 100 per minute total

---

## 🔐 Security Checklist

- [x] Webhook signature verification
- [x] Rate limiting on all endpoints
- [x] Input validation with Zod
- [x] SQL injection prevention (Prisma ORM)
- [x] Fraud detection
- [x] Audit logging
- [x] HTTPS only
- [x] Environment variable protection

---

## 📚 Additional Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)

---

**Quick Start Checklist**:
1. ✅ Install dependencies
2. ✅ Set up Redis
3. ✅ Configure environment variables
4. ✅ Run database migrations
5. ✅ Start workers
6. ✅ Configure cron jobs
7. ✅ Test free enrollment
8. ✅ Test paid enrollment
9. ✅ Set up monitoring
10. ✅ Configure alerts

---

**Status**: Ready for Implementation
**Last Updated**: 2025-01-05
