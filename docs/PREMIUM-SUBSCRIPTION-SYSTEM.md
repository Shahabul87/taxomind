# Premium Subscription System

> Complete guide to Taxomind's premium subscription, course video protection, and SAM AI access control.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Subscription Plans](#subscription-plans)
4. [User Flow](#user-flow)
5. [Course Video Protection](#course-video-protection)
6. [SAM AI Access Control](#sam-ai-access-control)
7. [Stripe Integration](#stripe-integration)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

The Taxomind Premium Subscription System provides:

1. **Video Protection**: Only enrolled users can view course videos (hosted on YouTube as unlisted)
2. **SAM AI Premium Features**: Advanced AI features locked behind premium subscription
3. **Flexible Plans**: Monthly, Yearly, and Lifetime subscription options
4. **Stripe Integration**: Secure payment processing with webhooks

### Key Principles

- **Free users**: Basic Q&A (5 queries/day), can view free content
- **Enrolled users**: Access to enrolled course videos and content
- **Premium users**: Unlimited SAM AI access + all premium features

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUESTS                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ACCESS CONTROL LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  checkPremium   │  │ checkEnrollment │  │  canAccessSamFeature│  │
│  │   Access()      │  │      ()         │  │        ()           │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │
│           │                    │                       │             │
│           ▼                    ▼                       ▼             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    PRISMA DATABASE                               ││
│  │  • User.isPremium          • Enrollment          • dailyAiUsage ││
│  │  • User.premiumPlan        • Course              • premiumExpiry││
│  │  • User.premiumExpiresAt   • Section             • stripeSubId  ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STRIPE INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────┤
│  Checkout Session  ──▶  Payment  ──▶  Webhook  ──▶  Activate Premium│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Subscription Plans

| Plan | Price | Billing | Description |
|------|-------|---------|-------------|
| **Monthly** | $9.99/month | Recurring | Cancel anytime |
| **Yearly** | $79.99/year | Recurring | Save 33% |
| **Lifetime** | $199 | One-time | Never expires |

### What Premium Includes

| Feature | Free | Premium |
|---------|------|---------|
| Basic Q&A | 5/day | Unlimited |
| AI Course Creation | ❌ | ✅ |
| AI Content Generation | ❌ | ✅ |
| AI Quiz Generation | ❌ | ✅ |
| AI Learning Path | ❌ | ✅ |
| Advanced Analytics | ❌ | ✅ |
| AI Code Explanation | ❌ | ✅ |
| AI Math Explanation | ❌ | ✅ |
| AI Exam Creation | ❌ | ✅ |

---

## User Flow

### 1. Subscription Purchase Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Pricing    │────▶│   Checkout   │────▶│    Stripe    │────▶│   Webhook    │
│     Page     │     │     API      │     │   Payment    │     │   Handler    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
                                                              ┌──────────────┐
                                                              │   Activate   │
                                                              │   Premium    │
                                                              └──────────────┘
```

**Step-by-step:**

1. User visits `/pricing` page
2. User clicks on desired plan (Monthly/Yearly/Lifetime)
3. Frontend calls `POST /api/subscription/checkout` with plan type
4. Backend creates Stripe Checkout Session
5. User is redirected to Stripe payment page
6. After payment, Stripe sends webhook to `/api/subscription/webhook`
7. Webhook handler activates premium on user account
8. User is redirected to `/subscription/success`

### 2. Content Access Flow

```
User Request ──▶ Check Auth ──▶ Check Enrollment ──▶ Return Content
                     │                 │
                     │                 ├── Enrolled? ✅ Show Video
                     │                 ├── Free Content? ✅ Show Video
                     │                 ├── Instructor? ✅ Show Video
                     │                 └── None? ❌ Show Upgrade Prompt
                     │
                     └── Not Logged In? ❌ Show Login Prompt
```

### 3. SAM AI Access Flow

```
SAM AI Request ──▶ Check Premium ──┬──▶ Premium User? ──▶ ✅ Allow
                                   │
                                   └──▶ Free User? ──▶ Check Feature Type
                                                             │
                                                 ┌───────────┴───────────┐
                                                 │                       │
                                        Premium Feature?          Free Feature?
                                                 │                       │
                                                 ▼                       ▼
                                        ❌ Show Upgrade         Check Daily Limit
                                                                         │
                                                             ┌───────────┴───────────┐
                                                             │                       │
                                                     Under Limit?           Over Limit?
                                                             │                       │
                                                             ▼                       ▼
                                                        ✅ Allow              ❌ Show Limit
                                                     (Increment Counter)         Message
```

---

## Course Video Protection

### How It Works

1. **Videos are hosted on YouTube as UNLISTED**
   - Not searchable on YouTube
   - Can only be accessed with direct link

2. **Video URLs are stored in database**
   - `Section.videoUrl` contains YouTube URL or ID

3. **Access is checked server-side**
   - `getProtectedVideoUrl()` validates access before returning video ID

### Access Rules

| User Type | Free Section | Paid Section |
|-----------|--------------|--------------|
| Not logged in | ✅ View | ❌ Login required |
| Logged in, not enrolled | ✅ View | ❌ Enrollment required |
| Enrolled student | ✅ View | ✅ View |
| Course instructor | ✅ View | ✅ View |

### Code Example

```typescript
// In section page component
import { getProtectedVideoUrl } from "@/lib/premium";

async function SectionPage({ sectionId }: { sectionId: string }) {
  const user = await currentUser();

  const { videoUrl, youtubeId, accessResult } = await getProtectedVideoUrl(
    user.id,
    sectionId
  );

  if (!accessResult.canAccess) {
    return <UpgradePrompt reason={accessResult.reason} />;
  }

  return <YouTubePlayer videoId={youtubeId} />;
}
```

---

## SAM AI Access Control

### Feature Categories

**Free Tier Features** (with daily limit):
- `basic-qa` - Basic question and answer

**Premium Only Features:**
- `course-creation` - AI-powered course creation
- `content-generation` - AI content generation
- `quiz-generation` - AI quiz generation
- `learning-path` - AI learning path recommendations
- `advanced-analytics` - Advanced analytics
- `code-explanation` - AI code explanation
- `math-explanation` - AI math explanation
- `exam-creation` - AI exam creation

### Daily Limit System

```typescript
// Free users get 5 queries per day
const FREE_TIER_DAILY_LIMIT = 5;

// Counter resets at midnight (user's local time)
// Tracked via: User.dailyAiUsageCount and User.dailyAiUsageResetAt
```

### Usage in API Routes

```typescript
import { canAccessSamFeature, incrementSamUsage } from "@/lib/premium";

export async function POST(request: Request) {
  const user = await currentUser();

  // Check access BEFORE processing
  const access = await canAccessSamFeature(user.id, "course-creation");

  if (!access.allowed) {
    return NextResponse.json({
      error: access.reason,
      requiresUpgrade: access.requiresUpgrade,
      remainingFreeUsage: access.remainingFreeUsage,
    }, { status: 403 });
  }

  // Process the AI request...
  const result = await processAIRequest();

  // Increment usage AFTER successful processing
  await incrementSamUsage(user.id);

  return NextResponse.json({ result });
}
```

### Frontend Usage Indicator

```typescript
import { getRemainingFreeUsage } from "@/lib/premium";

// Get remaining usage for display
const remaining = await getRemainingFreeUsage(userId);

// Display: "5 free queries remaining today"
// Or for premium: Infinity (unlimited)
```

---

## Stripe Integration

### Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate premium subscription |
| `customer.subscription.updated` | Update expiration date |
| `customer.subscription.deleted` | Deactivate premium |
| `invoice.payment_succeeded` | Extend subscription period |
| `invoice.payment_failed` | Log failure (Stripe retries) |

### Setting Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

---

## Database Schema

### User Model (Premium Fields)

```prisma
model User {
  // ... existing fields ...

  // Premium Subscription
  isPremium                   Boolean       @default(false)
  premiumPlan                 PremiumPlan?
  premiumStartedAt            DateTime?
  premiumExpiresAt            DateTime?
  premiumStripeSubscriptionId String?

  // Daily AI Usage Tracking (for free tier)
  dailyAiUsageCount           Int           @default(0)
  dailyAiUsageResetAt         DateTime?
}

enum PremiumPlan {
  MONTHLY
  YEARLY
  LIFETIME
}
```

### Stripe Customer Model

```prisma
model StripeCustomer {
  id               String   @id @default(cuid())
  userId           String   @unique
  stripeCustomerId String   @unique
  user             User     @relation(fields: [userId], references: [id])
  createdAt        DateTime @default(now())
}
```

---

## API Reference

### Subscription Checkout

```http
POST /api/subscription/checkout
Content-Type: application/json

{
  "plan": "MONTHLY" | "YEARLY" | "LIFETIME"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/...",
    "sessionId": "cs_..."
  }
}
```

### Get Premium Status

```http
GET /api/subscription/status
```

**Response:**
```json
{
  "isPremium": true,
  "plan": "YEARLY",
  "expiresAt": "2025-12-19T00:00:00.000Z",
  "daysRemaining": 365
}
```

### Check SAM Feature Access

```http
GET /api/sam/access?feature=course-creation
```

**Response:**
```json
{
  "allowed": false,
  "reason": "AI Course Creation is a premium feature. Upgrade to access.",
  "remainingFreeUsage": null,
  "requiresUpgrade": true
}
```

### Get Protected Video

```http
GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/video
```

**Response (Access Granted):**
```json
{
  "success": true,
  "data": {
    "youtubeId": "dQw4w9WgXcQ",
    "videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

**Response (Access Denied):**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Please enroll in this course to access this content"
  }
}
```

---

## Implementation Checklist

### Backend Setup

- [x] Add premium fields to User model
- [x] Create `lib/premium/check-premium.ts` - Premium status checks
- [x] Create `lib/premium/check-enrollment.ts` - Enrollment checks
- [x] Create `lib/premium/sam-access.ts` - SAM AI access control
- [x] Create `/api/subscription/checkout` - Stripe checkout
- [x] Create `/api/subscription/webhook` - Stripe webhooks
- [x] Create StripeCustomer model

### Frontend Setup (TODO)

- [ ] Create Pricing page (`/pricing`)
- [ ] Create Subscription Success page (`/subscription/success`)
- [ ] Add upgrade prompts in SAM AI components
- [ ] Add premium badge/indicator in user profile
- [ ] Add "remaining usage" counter for free users
- [ ] Add subscription management page

### Testing Checklist

- [ ] Test free user daily limit reset
- [ ] Test premium feature blocking for free users
- [ ] Test video access for enrolled vs non-enrolled
- [ ] Test Stripe checkout flow (use test mode)
- [ ] Test webhook handling (subscription events)
- [ ] Test subscription expiration handling
- [ ] Test lifetime subscription (never expires)

### AI Button Premium Gate (48 files to update)

Files with AI "Generate with AI" buttons that need `PremiumAIGate` wrapper:

**Pattern to apply:**
```tsx
// 1. Add imports at top of file
import { PremiumAIGate } from "@/components/premium/premium-ai-gate";
import { useIsPremium } from "@/hooks/use-premium-status";

// 2. Add hook inside component
const isPremium = useIsPremium();

// 3. Wrap AI button with PremiumAIGate
<PremiumAIGate isPremium={isPremium} featureName="AI Content Generation">
  {/* existing AI button code */}
</PremiumAIGate>
```

**Files to update:**
- [x] `teacher/courses/[courseId]/_components/description-form.tsx`
- [ ] `teacher/courses/[courseId]/_components/chapters-form.tsx`
- [ ] `teacher/courses/[courseId]/_components/course-learning-outcome-form.tsx`
- [ ] `teacher/courses/[courseId]/_components/ai-course-assistant.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/_components/chapter-description-form.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/_components/chapter-learning-outcome-form.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/_components/ai-chapter-content-generator.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/section-description-form.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/section-learning-objectives-form.tsx`
- [ ] `teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/ai-exam-assistant.tsx`
- [ ] `teacher/create/ai-creator/page.tsx` (entire page should check premium)
- [ ] ... (see full list with: `grep -r "Generate with AI\|Sparkles" teacher/`)

### Production Deployment

- [ ] Switch Stripe keys to production
- [ ] Set up production webhook endpoint
- [ ] Configure cron job for `processExpiredSubscriptions()`
- [ ] Monitor webhook delivery in Stripe dashboard
- [ ] Set up alerts for failed payments
- [ ] Apply PremiumAIGate to all 48 teacher AI files

---

## Security Considerations

1. **Never expose video URLs client-side** for paid content
2. **Always check access server-side** before returning protected content
3. **Validate webhook signatures** to prevent spoofed events
4. **Use HTTPS** for all API endpoints
5. **Rate limit** API endpoints to prevent abuse
6. **Log access attempts** for security auditing

---

## Troubleshooting

### Common Issues

**Issue: Webhook not receiving events**
- Check Stripe dashboard for failed deliveries
- Verify webhook secret is correct
- Ensure endpoint is publicly accessible

**Issue: Premium not activating after payment**
- Check webhook logs for errors
- Verify `metadata.userId` is set correctly in checkout session
- Check database for user record

**Issue: Daily limit not resetting**
- Verify `dailyAiUsageResetAt` is being checked
- Check timezone handling in `isSameDay()` function

---

## Related Documentation

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

*Last updated: December 2024*
*Version: 1.0.0*
