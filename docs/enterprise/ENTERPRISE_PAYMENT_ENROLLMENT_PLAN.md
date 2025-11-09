# Enterprise Payment & Enrollment System - Implementation Plan

## 🎯 Executive Summary

Transform the current payment and enrollment system into an **enterprise-grade, production-ready solution** with:
- 99.99% reliability
- Comprehensive error handling
- Real-time monitoring
- Audit compliance
- Multi-payment gateway support
- Free & paid course handling

---

## 📊 Current System Analysis

### ✅ What Works
1. Basic Stripe integration
2. Webhook signature verification
3. Duplicate enrollment prevention
4. Success page retry logic (30s)

### ❌ Critical Gaps
1. **No Free Course Support** - All courses require payment
2. **Webhook Reliability** - 30s timeout, no job queue
3. **No Error Monitoring** - Silent failures
4. **No Email Notifications** - Users unaware of enrollment status
5. **No Payment Reconciliation** - Manual intervention needed for failures
6. **Limited Security** - Missing rate limiting, fraud detection
7. **No Audit Trail** - Compliance issues
8. **Single Payment Gateway** - Stripe-only dependency

---

## 🏗️ Enterprise Architecture Design

### Phase 1: Core Infrastructure (Week 1-2)
**Priority: CRITICAL**

#### 1.1 Database Schema Enhancements

```prisma
// New Models

// Payment transactions audit trail
model PaymentTransaction {
  id                String    @id @default(uuid())
  userId            String
  courseId          String
  amount            Decimal   @db.Decimal(10, 2)
  currency          String    @default("USD")
  status            PaymentStatus
  provider          PaymentProvider // Stripe, PayPal, etc.
  providerSessionId String?   // Stripe session ID
  providerTxnId     String?   // Stripe payment intent ID
  metadata          Json?
  errorCode         String?
  errorMessage      String?
  retryCount        Int       @default(0)
  lastRetryAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course            Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([courseId])
  @@index([status])
  @@index([providerSessionId])
  @@index([createdAt])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum PaymentProvider {
  STRIPE
  PAYPAL
  FREE
  MANUAL
}

// Enrollment with enhanced tracking
model Enrollment {
  id                  String    @id @default(uuid())
  userId              String
  courseId            String
  status              EnrollmentStatus @default(ACTIVE)
  enrollmentType      EnrollmentType
  paymentTransactionId String?
  startedAt           DateTime  @default(now())
  completedAt         DateTime?
  lastAccessedAt      DateTime?
  progressPercentage  Int       @default(0)
  certificateIssued   Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  course              Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  paymentTransaction  PaymentTransaction? @relation(fields: [paymentTransactionId], references: [id])

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
  @@index([status])
}

enum EnrollmentStatus {
  ACTIVE
  SUSPENDED
  COMPLETED
  EXPIRED
  CANCELLED
}

enum EnrollmentType {
  FREE
  PAID
  SCHOLARSHIP
  TRIAL
  MANUAL
}

// Webhook event log for debugging and reconciliation
model WebhookEvent {
  id              String    @id @default(uuid())
  provider        String    // "stripe", "paypal"
  eventType       String    // "checkout.session.completed"
  eventId         String    // Provider's event ID
  payload         Json
  processed       Boolean   @default(false)
  processedAt     DateTime?
  errorMessage    String?
  retryCount      Int       @default(0)
  createdAt       DateTime  @default(now())

  @@unique([provider, eventId])
  @@index([processed])
  @@index([createdAt])
}

// Email notification queue
model EmailQueue {
  id          String        @id @default(uuid())
  to          String
  subject     String
  template    EmailTemplate
  data        Json
  status      EmailStatus   @default(PENDING)
  sentAt      DateTime?
  errorMessage String?
  retryCount  Int           @default(0)
  createdAt   DateTime      @default(now())

  @@index([status])
  @@index([createdAt])
}

enum EmailTemplate {
  ENROLLMENT_SUCCESS
  ENROLLMENT_FAILED
  PAYMENT_RECEIPT
  COURSE_WELCOME
  COURSE_COMPLETION
  REFUND_PROCESSED
}

enum EmailStatus {
  PENDING
  SENDING
  SENT
  FAILED
  CANCELLED
}

// Audit log for compliance
model AuditLog {
  id          String    @id @default(uuid())
  userId      String?
  action      String    // "ENROLLMENT_CREATED", "PAYMENT_COMPLETED"
  entity      String    // "Enrollment", "Payment"
  entityId    String
  oldData     Json?
  newData     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([createdAt])
}

// Course pricing and free course support
model Course {
  // ... existing fields
  price       Decimal?  @db.Decimal(10, 2)
  isFree      Boolean   @default(false)
  priceType   PriceType @default(ONE_TIME)
}

enum PriceType {
  FREE
  ONE_TIME
  SUBSCRIPTION_MONTHLY
  SUBSCRIPTION_YEARLY
}
```

#### 1.2 Job Queue System

**Install Dependencies**:
```bash
npm install bullmq ioredis
npm install @types/ioredis --save-dev
```

**File**: `lib/queue/queue.ts`
```typescript
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Queue definitions
export const enrollmentQueue = new Queue('enrollment', { connection });
export const emailQueue = new Queue('email', { connection });
export const webhookQueue = new Queue('webhook', { connection });
export const reconciliationQueue = new Queue('reconciliation', { connection });

// Job types
export interface EnrollmentJobData {
  userId: string;
  courseId: string;
  paymentTransactionId?: string;
  enrollmentType: 'FREE' | 'PAID' | 'MANUAL';
  metadata?: Record<string, any>;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface WebhookJobData {
  provider: string;
  eventType: string;
  eventId: string;
  payload: any;
}

// Add job to queue with retry configuration
export async function addEnrollmentJob(data: EnrollmentJobData) {
  return enrollmentQueue.add('create-enrollment', data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
  });
}

export async function addEmailJob(data: EmailJobData) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

export async function addWebhookJob(data: WebhookJobData) {
  return webhookQueue.add('process-webhook', data, {
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  });
}
```

**File**: `lib/queue/workers/enrollment-worker.ts`
```typescript
import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { EnrollmentJobData } from '../queue';
import { addEmailJob } from '../queue';
import { createAuditLog } from '@/lib/audit';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const enrollmentWorker = new Worker(
  'enrollment',
  async (job: Job<EnrollmentJobData>) => {
    const { userId, courseId, paymentTransactionId, enrollmentType, metadata } = job.data;

    logger.info('Processing enrollment job', { userId, courseId, jobId: job.id });

    try {
      // Check if enrollment already exists
      const existingEnrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (existingEnrollment) {
        logger.warn('Enrollment already exists', { userId, courseId });
        return { status: 'DUPLICATE', enrollmentId: existingEnrollment.id };
      }

      // Create enrollment
      const enrollment = await db.enrollment.create({
        data: {
          userId,
          courseId,
          enrollmentType,
          paymentTransactionId,
          status: 'ACTIVE',
        },
        include: {
          user: true,
          course: true,
        },
      });

      // Create audit log
      await createAuditLog({
        userId,
        action: 'ENROLLMENT_CREATED',
        entity: 'Enrollment',
        entityId: enrollment.id,
        newData: enrollment,
      });

      // Send welcome email
      await addEmailJob({
        to: enrollment.user.email!,
        subject: `Welcome to ${enrollment.course.title}!`,
        template: 'ENROLLMENT_SUCCESS',
        data: {
          userName: enrollment.user.name || 'Student',
          courseTitle: enrollment.course.title,
          courseId: enrollment.course.id,
        },
      });

      logger.info('Enrollment created successfully', {
        enrollmentId: enrollment.id,
        userId,
        courseId,
      });

      return { status: 'SUCCESS', enrollmentId: enrollment.id };
    } catch (error) {
      logger.error('Failed to create enrollment', {
        error,
        userId,
        courseId,
        jobId: job.id,
      });
      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 jobs concurrently
  }
);

// Event handlers
enrollmentWorker.on('completed', (job) => {
  logger.info('Enrollment job completed', { jobId: job.id });
});

enrollmentWorker.on('failed', (job, error) => {
  logger.error('Enrollment job failed', {
    jobId: job?.id,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});
```

---

### Phase 2: Free Course Enrollment (Week 1)
**Priority: HIGH**

#### 2.1 Free Course Enrollment API

**File**: `app/api/courses/[courseId]/enroll/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { addEnrollmentJob } from '@/lib/queue/queue';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const EnrollSchema = z.object({
  couponCode: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const user = await currentUser();

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validatedData = EnrollSchema.parse(body);

    // Fetch course
    const course = await db.course.findUnique({
      where: { id: courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        price: true,
        isFree: true,
      },
    });

    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return Response.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Check if course is free
    if (!course.isFree) {
      return Response.json(
        { error: 'This course requires payment. Please use the checkout endpoint.' },
        { status: 400 }
      );
    }

    // Add enrollment job to queue
    const job = await addEnrollmentJob({
      userId: user.id,
      courseId: course.id,
      enrollmentType: 'FREE',
      metadata: {
        couponCode: validatedData.couponCode,
        enrolledAt: new Date().toISOString(),
      },
    });

    logger.info('Free enrollment job created', {
      jobId: job.id,
      userId: user.id,
      courseId: course.id,
    });

    return Response.json({
      success: true,
      message: 'Enrollment is being processed',
      jobId: job.id,
      redirectUrl: `/courses/${course.id}/success?free=1`,
    });
  } catch (error) {
    logger.error('Free enrollment error', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.2 Update Hero Wrapper for Free Courses

**File**: `app/(course)/courses/[courseId]/_components/hero-wrapper.tsx`
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

// ... existing imports

interface HeroWrapperProps {
  variant: CategoryLayoutVariant;
  course: {
    id: string;
    price: number | null;
    isFree: boolean;
    // ... other fields
  };
  isEnrolled: boolean;
  userId?: string;
  categorySpecificProps?: {
    techStack?: string[];
    models?: string[];
    tools?: string[];
  };
}

export function HeroWrapper({
  variant,
  course,
  isEnrolled,
  userId,
  categorySpecificProps = {}
}: HeroWrapperProps) {
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!userId) {
      toast.error('Please sign in to enroll');
      router.push('/auth/login');
      return;
    }

    setIsEnrolling(true);

    try {
      // Check if course is free
      if (course.isFree) {
        // Free course enrollment
        const response = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Enrollment failed');
        }

        toast.success('Enrolling you in the course...');
        router.push(data.redirectUrl);
      } else {
        // Paid course - redirect to checkout
        router.push(`/courses/${course.id}/checkout`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enrollment failed');
    } finally {
      setIsEnrolling(false);
    }
  };

  const commonProps = {
    course,
    isEnrolled,
    onEnroll: handleEnroll,
    isEnrolling,
  };

  // ... rest of component
}
```

---

### Phase 3: Webhook Reliability & Job Queue (Week 2)
**Priority: CRITICAL**

#### 3.1 Enhanced Webhook Handler

**File**: `app/api/webhook/route.ts`
```typescript
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addWebhookJob } from '@/lib/queue/queue';

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    // Log webhook event to database for reconciliation
    const webhookEvent = await db.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventType: event.type,
        eventId: event.id,
        payload: event as any,
        processed: false,
      },
    });

    // Add to job queue for async processing
    await addWebhookJob({
      provider: 'stripe',
      eventType: event.type,
      eventId: event.id,
      payload: event.data.object,
    });

    logger.info('Webhook event queued', {
      eventId: event.id,
      eventType: event.type,
      webhookEventId: webhookEvent.id,
    });

    // Return 200 immediately to Stripe
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    return new Response(
      `Webhook Error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 400 }
    );
  }
}
```

#### 3.2 Webhook Worker

**File**: `lib/queue/workers/webhook-worker.ts`
```typescript
import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { WebhookJobData, addEnrollmentJob } from '../queue';
import { createAuditLog } from '@/lib/audit';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const webhookWorker = new Worker(
  'webhook',
  async (job: Job<WebhookJobData>) => {
    const { provider, eventType, eventId, payload } = job.data;

    logger.info('Processing webhook job', { provider, eventType, eventId });

    try {
      if (provider === 'stripe' && eventType === 'checkout.session.completed') {
        const session = payload as any;
        const userId = session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        if (!userId || !courseId) {
          throw new Error('Missing metadata: userId or courseId');
        }

        // Create payment transaction record
        const paymentTransaction = await db.paymentTransaction.create({
          data: {
            userId,
            courseId,
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            status: 'COMPLETED',
            provider: 'STRIPE',
            providerSessionId: session.id,
            providerTxnId: session.payment_intent,
            metadata: session.metadata,
          },
        });

        // Create audit log
        await createAuditLog({
          userId,
          action: 'PAYMENT_COMPLETED',
          entity: 'PaymentTransaction',
          entityId: paymentTransaction.id,
          newData: paymentTransaction,
        });

        // Add enrollment job
        await addEnrollmentJob({
          userId,
          courseId,
          paymentTransactionId: paymentTransaction.id,
          enrollmentType: 'PAID',
          metadata: {
            sessionId: session.id,
            amount: paymentTransaction.amount,
          },
        });

        // Mark webhook as processed
        await db.webhookEvent.updateMany({
          where: { provider, eventId },
          data: { processed: true, processedAt: new Date() },
        });

        logger.info('Webhook processed successfully', {
          eventId,
          paymentTransactionId: paymentTransaction.id,
        });

        return { status: 'SUCCESS', paymentTransactionId: paymentTransaction.id };
      }

      // Handle other event types
      logger.warn('Unhandled webhook event type', { provider, eventType });
      return { status: 'UNHANDLED' };
    } catch (error) {
      logger.error('Webhook processing failed', {
        error,
        provider,
        eventType,
        eventId,
      });

      // Update webhook event with error
      await db.webhookEvent.updateMany({
        where: { provider, eventId },
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
          retryCount: { increment: 1 },
        },
      });

      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

webhookWorker.on('completed', (job) => {
  logger.info('Webhook job completed', { jobId: job.id });
});

webhookWorker.on('failed', (job, error) => {
  logger.error('Webhook job failed', {
    jobId: job?.id,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});
```

---

### Phase 4: Email Notification System (Week 2)
**Priority: HIGH**

#### 4.1 Email Service

**Install Dependencies**:
```bash
npm install nodemailer @react-email/components
npm install @types/nodemailer --save-dev
```

**File**: `lib/email/email-service.ts`
```typescript
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
export const emailTemplates = {
  ENROLLMENT_SUCCESS: {
    subject: (data: any) => `Welcome to ${data.courseTitle}!`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">🎉 Enrollment Successful!</h1>
        <p>Hi ${data.userName},</p>
        <p>You've successfully enrolled in <strong>${data.courseTitle}</strong>!</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses/${data.courseId}/learn"
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Learning
          </a>
        </p>
        <p>Happy learning!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 12px;">
          If you didn't enroll in this course, please contact support immediately.
        </p>
      </div>
    `,
  },
  PAYMENT_RECEIPT: {
    subject: (data: any) => `Payment Receipt - ${data.courseTitle}`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Payment Received</h1>
        <p>Hi ${data.userName},</p>
        <p>Thank you for your payment!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #F3F4F6;">
            <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Course</strong></td>
            <td style="padding: 12px; border: 1px solid #E5E7EB;">${data.courseTitle}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Amount</strong></td>
            <td style="padding: 12px; border: 1px solid #E5E7EB;">$${data.amount}</td>
          </tr>
          <tr style="background: #F3F4F6;">
            <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Transaction ID</strong></td>
            <td style="padding: 12px; border: 1px solid #E5E7EB;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #E5E7EB;"><strong>Date</strong></td>
            <td style="padding: 12px; border: 1px solid #E5E7EB;">${new Date(data.date).toLocaleDateString()}</td>
          </tr>
        </table>
        <p style="color: #6B7280; font-size: 12px;">
          Keep this receipt for your records.
        </p>
      </div>
    `,
  },
};

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully', { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to, subject });
    return false;
  }
}
```

#### 4.2 Email Worker

**File**: `lib/queue/workers/email-worker.ts`
```typescript
import { Worker, Job } from 'bullmq';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { EmailJobData } from '../queue';
import { sendEmail, emailTemplates } from '@/lib/email/email-service';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJobData>) => {
    const { to, subject, template, data } = job.data;

    logger.info('Processing email job', { to, template, jobId: job.id });

    try {
      // Get template
      const emailTemplate = emailTemplates[template as keyof typeof emailTemplates];

      if (!emailTemplate) {
        throw new Error(`Unknown email template: ${template}`);
      }

      // Generate email content
      const emailSubject = emailTemplate.subject(data);
      const emailHtml = emailTemplate.html(data);

      // Send email
      const sent = await sendEmail(to, emailSubject, emailHtml);

      if (!sent) {
        throw new Error('Failed to send email');
      }

      // Log to database
      await db.emailQueue.create({
        data: {
          to,
          subject: emailSubject,
          template: template as any,
          data: data as any,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info('Email sent successfully', { to, template });
      return { status: 'SUCCESS' };
    } catch (error) {
      logger.error('Email sending failed', {
        error,
        to,
        template,
        jobId: job.id,
      });

      // Log failed email
      await db.emailQueue.create({
        data: {
          to,
          subject,
          template: template as any,
          data: data as any,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          retryCount: job.attemptsMade,
        },
      });

      throw error; // Will trigger retry
    }
  },
  {
    connection,
    concurrency: 3, // Send 3 emails concurrently
  }
);

emailWorker.on('completed', (job) => {
  logger.info('Email job completed', { jobId: job.id });
});

emailWorker.on('failed', (job, error) => {
  logger.error('Email job failed', {
    jobId: job?.id,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});
```

---

### Phase 5: Monitoring & Alerting (Week 3)
**Priority: CRITICAL**

#### 5.1 Monitoring Dashboard API

**File**: `app/api/admin/monitoring/payments/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await currentUser();

  if (!user || user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Payment metrics
  const [
    totalPayments24h,
    failedPayments24h,
    pendingPayments,
    totalRevenue24h,
    totalRevenue7d,
    webhookStats,
    enrollmentStats,
  ] = await Promise.all([
    // Total payments in last 24h
    db.paymentTransaction.count({
      where: {
        createdAt: { gte: last24Hours },
        status: 'COMPLETED',
      },
    }),
    // Failed payments in last 24h
    db.paymentTransaction.count({
      where: {
        createdAt: { gte: last24Hours },
        status: 'FAILED',
      },
    }),
    // Pending payments
    db.paymentTransaction.count({
      where: { status: 'PENDING' },
    }),
    // Revenue last 24h
    db.paymentTransaction.aggregate({
      where: {
        createdAt: { gte: last24Hours },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    // Revenue last 7 days
    db.paymentTransaction.aggregate({
      where: {
        createdAt: { gte: last7Days },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    // Webhook stats
    db.webhookEvent.groupBy({
      by: ['processed'],
      _count: true,
      where: {
        createdAt: { gte: last24Hours },
      },
    }),
    // Enrollment stats
    db.enrollment.groupBy({
      by: ['enrollmentType'],
      _count: true,
      where: {
        createdAt: { gte: last24Hours },
      },
    }),
  ]);

  return Response.json({
    payments: {
      total24h: totalPayments24h,
      failed24h: failedPayments24h,
      pending: pendingPayments,
      successRate: totalPayments24h > 0
        ? ((totalPayments24h - failedPayments24h) / totalPayments24h * 100).toFixed(2)
        : 100,
    },
    revenue: {
      last24h: totalRevenue24h._sum.amount || 0,
      last7d: totalRevenue7d._sum.amount || 0,
    },
    webhooks: {
      processed: webhookStats.find((s) => s.processed)?._count || 0,
      pending: webhookStats.find((s) => !s.processed)?._count || 0,
    },
    enrollments: enrollmentStats,
  });
}
```

#### 5.2 Alert System

**File**: `lib/monitoring/alerts.ts`
```typescript
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addEmailJob } from '@/lib/queue/queue';

export interface AlertConfig {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  recipients: string[];
}

export const alertConfigs: AlertConfig[] = [
  {
    name: 'HIGH_PAYMENT_FAILURE_RATE',
    severity: 'CRITICAL',
    message: 'Payment failure rate exceeded 10% in the last hour',
    recipients: ['admin@example.com', 'finance@example.com'],
    condition: async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [total, failed] = await Promise.all([
        db.paymentTransaction.count({
          where: { createdAt: { gte: oneHourAgo } },
        }),
        db.paymentTransaction.count({
          where: {
            createdAt: { gte: oneHourAgo },
            status: 'FAILED',
          },
        }),
      ]);

      return total > 0 && (failed / total) > 0.1;
    },
  },
  {
    name: 'WEBHOOK_PROCESSING_DELAY',
    severity: 'HIGH',
    message: 'Unprocessed webhooks older than 5 minutes detected',
    recipients: ['tech@example.com'],
    condition: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const count = await db.webhookEvent.count({
        where: {
          processed: false,
          createdAt: { lt: fiveMinutesAgo },
        },
      });

      return count > 0;
    },
  },
  {
    name: 'ENROLLMENT_QUEUE_BACKLOG',
    severity: 'MEDIUM',
    message: 'Enrollment queue has more than 100 pending jobs',
    recipients: ['tech@example.com'],
    condition: async () => {
      // Check queue length (requires BullMQ admin)
      // For now, return false
      return false;
    },
  },
];

export async function checkAlerts() {
  for (const alert of alertConfigs) {
    try {
      const triggered = await alert.condition();

      if (triggered) {
        logger.warn('Alert triggered', {
          name: alert.name,
          severity: alert.severity,
        });

        // Send alert emails
        for (const recipient of alert.recipients) {
          await addEmailJob({
            to: recipient,
            subject: `🚨 Alert: ${alert.name}`,
            template: 'SYSTEM_ALERT',
            data: {
              alertName: alert.name,
              severity: alert.severity,
              message: alert.message,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Log to database
        await db.systemAlert.create({
          data: {
            name: alert.name,
            severity: alert.severity,
            message: alert.message,
            triggeredAt: new Date(),
          },
        });
      }
    } catch (error) {
      logger.error('Alert check failed', { alert: alert.name, error });
    }
  }
}

// Run alert checks every 5 minutes
export function startAlertMonitoring() {
  setInterval(checkAlerts, 5 * 60 * 1000);
  logger.info('Alert monitoring started');
}
```

---

### Phase 6: Payment Reconciliation (Week 3)
**Priority: HIGH**

#### 6.1 Reconciliation Service

**File**: `lib/reconciliation/payment-reconciliation.ts`
```typescript
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { addEnrollmentJob } from '@/lib/queue/queue';

export async function reconcilePayments() {
  logger.info('Starting payment reconciliation');

  // Find pending payments older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pendingPayments = await db.paymentTransaction.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: oneHourAgo },
    },
    include: {
      user: true,
      course: true,
    },
  });

  logger.info(`Found ${pendingPayments.length} pending payments to reconcile`);

  for (const payment of pendingPayments) {
    try {
      if (!payment.providerSessionId) {
        logger.warn('Payment missing provider session ID', {
          paymentId: payment.id,
        });
        continue;
      }

      // Fetch session from Stripe
      const session = await stripe.checkout.sessions.retrieve(
        payment.providerSessionId
      );

      if (session.payment_status === 'paid') {
        // Payment was successful but webhook failed
        logger.warn('Found paid session without enrollment', {
          paymentId: payment.id,
          sessionId: session.id,
        });

        // Update payment status
        await db.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            providerTxnId: session.payment_intent as string,
          },
        });

        // Check if enrollment exists
        const enrollment = await db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: payment.courseId,
            },
          },
        });

        if (!enrollment) {
          // Create enrollment via job queue
          await addEnrollmentJob({
            userId: payment.userId,
            courseId: payment.courseId,
            paymentTransactionId: payment.id,
            enrollmentType: 'PAID',
            metadata: {
              reconciled: true,
              reconciledAt: new Date().toISOString(),
            },
          });

          logger.info('Reconciliation enrollment job created', {
            paymentId: payment.id,
            userId: payment.userId,
            courseId: payment.courseId,
          });
        }
      } else if (session.payment_status === 'unpaid') {
        // Mark as failed
        await db.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        logger.info('Marked unpaid session as failed', {
          paymentId: payment.id,
          sessionId: session.id,
        });
      }
    } catch (error) {
      logger.error('Reconciliation failed for payment', {
        paymentId: payment.id,
        error,
      });
    }
  }

  logger.info('Payment reconciliation completed');
}

// Run reconciliation every hour
export function startReconciliation() {
  setInterval(reconcilePayments, 60 * 60 * 1000);
  logger.info('Reconciliation service started');
}
```

---

### Phase 7: Security Enhancements (Week 4)
**Priority: HIGH**

#### 7.1 Rate Limiting

**Install Dependencies**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**File**: `lib/security/rate-limit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different operations
export const enrollmentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 enrollments per minute per user
  analytics: true,
  prefix: 'ratelimit:enrollment',
});

export const checkoutRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 checkouts per minute per user
  analytics: true,
  prefix: 'ratelimit:checkout',
});

export const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 webhooks per minute
  analytics: true,
  prefix: 'ratelimit:webhook',
});
```

#### 7.2 Fraud Detection

**File**: `lib/security/fraud-detection.ts`
```typescript
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
}

export async function checkFraud(
  userId: string,
  courseId: string,
  ipAddress?: string
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check 1: Multiple failed payments in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const failedPayments = await db.paymentTransaction.count({
    where: {
      userId,
      status: 'FAILED',
      createdAt: { gte: oneHourAgo },
    },
  });

  if (failedPayments > 3) {
    riskScore += 40;
    reasons.push('Multiple failed payments in last hour');
  }

  // Check 2: Rapid enrollment attempts
  const enrollmentAttempts = await db.paymentTransaction.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (enrollmentAttempts > 5) {
    riskScore += 30;
    reasons.push('Rapid enrollment attempts');
  }

  // Check 3: New user with high-value purchase
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: { Enrollment: true },
      },
    },
  });

  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (user?._count.Enrollment === 0 && course && course.price && course.price > 100) {
    riskScore += 20;
    reasons.push('New user with high-value purchase');
  }

  // Check 4: Suspicious IP patterns (implement with IP geolocation service)
  // TODO: Add IP reputation check

  const isFraudulent = riskScore >= 60;

  if (isFraudulent) {
    logger.warn('Potential fraud detected', {
      userId,
      courseId,
      riskScore,
      reasons,
    });
  }

  return { isFraudulent, riskScore, reasons };
}
```

---

### Phase 8: Audit & Compliance (Week 4)
**Priority: MEDIUM**

#### 8.1 Audit Service

**File**: `lib/audit/audit-service.ts`
```typescript
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const auditLog = await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
    // Don't throw - audit logging should not break main flow
  }
}

export async function getAuditTrail(
  entity: string,
  entityId: string
): Promise<any[]> {
  return db.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
```

---

## 📦 Implementation Checklist

### Week 1: Foundation
- [ ] Create database migrations for new models
- [ ] Set up Redis for job queue
- [ ] Implement free course enrollment API
- [ ] Update hero wrapper for free courses
- [ ] Add basic audit logging

### Week 2: Core Features
- [ ] Implement job queue system (BullMQ)
- [ ] Create enrollment worker
- [ ] Create webhook worker
- [ ] Set up email service
- [ ] Create email worker
- [ ] Update webhook handler to use queue

### Week 3: Monitoring & Reliability
- [ ] Build monitoring dashboard API
- [ ] Implement alert system
- [ ] Create payment reconciliation service
- [ ] Set up automated reconciliation job
- [ ] Add system health checks

### Week 4: Security & Compliance
- [ ] Implement rate limiting
- [ ] Add fraud detection
- [ ] Complete audit trail system
- [ ] Add GDPR compliance features
- [ ] Security testing

### Week 5: Testing & Deployment
- [ ] Unit tests for all services
- [ ] Integration tests
- [ ] Load testing
- [ ] Deploy to staging
- [ ] Production deployment

---

## 🔧 Environment Variables Required

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM_NAME=TaxoMind
EMAIL_FROM_ADDRESS=noreply@taxomind.com

# Stripe
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=

# Upstash (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
SENTRY_DSN=
MONITORING_EMAIL=admin@taxomind.com
```

---

## 📊 Success Metrics

### Reliability
- **Uptime**: 99.99% (< 4.38 minutes downtime/month)
- **Webhook Processing**: 100% within 60 seconds
- **Enrollment Success Rate**: > 99.9%

### Performance
- **API Response Time**: < 200ms (p95)
- **Payment Processing**: < 3 seconds end-to-end
- **Email Delivery**: < 30 seconds

### Business
- **Payment Failure Rate**: < 2%
- **Chargeback Rate**: < 0.1%
- **Customer Satisfaction**: > 95%

---

## 🎯 Next Steps

1. **Review & Approve Plan** - Get stakeholder sign-off
2. **Set Up Infrastructure** - Redis, monitoring tools
3. **Begin Phase 1** - Start with database migrations
4. **Iterative Development** - Weekly sprints with demos
5. **Continuous Testing** - Test each phase before moving forward

---

**Last Updated**: 2025-01-05
**Status**: READY FOR IMPLEMENTATION
**Estimated Timeline**: 5 weeks
**Team Required**: 2-3 developers + 1 DevOps engineer
