# Premium Subscription System - Taxomind

## Overview

This document outlines the premium subscription system for Taxomind LMS, designed to work with zero additional infrastructure costs by leveraging YouTube for video hosting and Stripe for payments.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PREMIUM SUBSCRIPTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  User    │───▶│   Stripe     │───▶│   Webhook    │───▶│  Database    │  │
│  │ Checkout │    │   Payment    │    │   Handler    │    │   Update     │  │
│  └──────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                              │
│                         User.isPremium = true                                │
│                         User.premiumExpiresAt = Date                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Content Access Levels

### 1. Course Videos (YouTube-based)

| Access Level | Who Can View | Implementation |
|--------------|--------------|----------------|
| **Free Preview** | Everyone | `Section.isFree = true` |
| **Paid Course** | Enrolled Users | Check `Enrollment` record exists |
| **Premium Only** | Premium Subscribers | Check `User.isPremium = true` |

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO ACCESS FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User requests video                                             │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is section   │───YES───▶ Return YouTube ID                    │
│  │ free?        │                                                │
│  └──────────────┘                                                │
│         │ NO                                                     │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is user      │───YES───▶ Return YouTube ID                    │
│  │ enrolled?    │                                                │
│  └──────────────┘                                                │
│         │ NO                                                     │
│         ▼                                                        │
│  Return "Purchase Required" message                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Blog Posts

| Access Level | Who Can View | Implementation |
|--------------|--------------|----------------|
| **Public** | Everyone | `Post.isPremium = false` |
| **Premium** | Premium Subscribers | `Post.isPremium = true` |
| **Preview** | Everyone (partial) | Show `Post.previewContent` only |

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOG ACCESS FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User requests blog post                                         │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is post      │───NO────▶ Return full content                  │
│  │ premium?     │                                                │
│  └──────────────┘                                                │
│         │ YES                                                    │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is user      │───YES───▶ Return full content                  │
│  │ premium?     │                                                │
│  └──────────────┘                                                │
│         │ NO                                                     │
│         ▼                                                        │
│  Return preview content + "Subscribe to read more"               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. SAM AI Tutor Features

| Feature | Free Users | Premium Users |
|---------|------------|---------------|
| Basic Q&A | ✅ Limited (5/day) | ✅ Unlimited |
| AI Course Creation | ❌ Not available | ✅ Full access |
| AI Content Generation | ❌ Not available | ✅ Full access |
| AI Quiz Generation | ❌ Not available | ✅ Full access |
| AI Explanations | ✅ Limited | ✅ Unlimited |
| Personalized Learning Path | ❌ Not available | ✅ Full access |

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAM AI ACCESS FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User requests SAM AI feature                                    │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is feature   │───YES───▶ Allow access                         │
│  │ free tier?   │                                                │
│  └──────────────┘                                                │
│         │ NO                                                     │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ Is user      │───YES───▶ Allow access                         │
│  │ premium?     │                                                │
│  └──────────────┘                                                │
│         │ NO                                                     │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────┐            │
│  │ Check daily limit (e.g., 5 free queries/day)     │            │
│  │                                                  │            │
│  │ Under limit ──▶ Allow access, increment counter  │            │
│  │ Over limit ───▶ Show "Upgrade to Premium"        │            │
│  └──────────────────────────────────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### User Model (Premium Fields)

```prisma
model User {
  // Existing fields...

  // Premium Subscription Fields
  isPremium           Boolean   @default(false)
  premiumPlan         String?   // "MONTHLY", "YEARLY", "LIFETIME"
  premiumStartedAt    DateTime?
  premiumExpiresAt    DateTime?
  stripeSubscriptionId String?  // For recurring billing management

  // SAM AI Usage Tracking (for free tier limits)
  dailyAiUsageCount   Int       @default(0)
  dailyAiUsageResetAt DateTime?
}
```

### Post Model (Premium Content)

```prisma
model Post {
  // Existing fields...

  // Premium Content Fields
  isPremium       Boolean  @default(false)
  previewContent  String?  @db.Text  // Free preview excerpt
  premiumReason   String?  // Why this content is premium
}
```

---

## API Endpoints

### 1. Premium Subscription

```
POST   /api/subscription/checkout     - Create Stripe checkout for subscription
POST   /api/subscription/webhook      - Handle Stripe webhook events
GET    /api/subscription/status       - Get current subscription status
POST   /api/subscription/cancel       - Cancel subscription
```

### 2. Protected Video Access

```
GET    /api/courses/[courseId]/sections/[sectionId]/video

Response (if authorized):
{
  "success": true,
  "data": {
    "youtubeId": "dQw4w9WgXcQ",
    "title": "Lesson 1: Introduction"
  }
}

Response (if not authorized):
{
  "success": false,
  "error": {
    "code": "ENROLLMENT_REQUIRED",
    "message": "Please enroll in this course to watch this video"
  }
}
```

### 3. Protected Blog Content

```
GET    /api/posts/[postId]

Response (premium post, non-premium user):
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Advanced AI Techniques",
    "previewContent": "First 200 words...",
    "body": null,  // Hidden
    "isPremium": true,
    "requiresUpgrade": true
  }
}
```

### 4. SAM AI Access

```
POST   /api/sam/generate

Request includes feature type:
{
  "feature": "course-creation",
  "prompt": "Create a course about..."
}

Response (non-premium user, premium feature):
{
  "success": false,
  "error": {
    "code": "PREMIUM_REQUIRED",
    "message": "AI Course Creation is a premium feature",
    "upgradeUrl": "/pricing"
  }
}
```

---

## Subscription Plans

### Pricing Structure

| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| **Free** | $0 | Forever | Limited AI (5/day), free courses only |
| **Monthly** | $9.99/mo | 30 days | Unlimited AI, all courses, premium blogs |
| **Yearly** | $79.99/yr | 365 days | Same as monthly + 33% savings |
| **Lifetime** | $199 | Forever | Everything, forever |

### Feature Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE COMPARISON                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Feature                    │ Free    │ Premium                  │
│  ─────────────────────────────────────────────────────────────  │
│  Browse Courses             │ ✅      │ ✅                       │
│  Enroll in Free Courses     │ ✅      │ ✅                       │
│  Enroll in Paid Courses     │ ✅ (pay)│ ✅ (pay)                 │
│  Read Public Blog Posts     │ ✅      │ ✅                       │
│  Read Premium Blog Posts    │ ❌      │ ✅                       │
│  SAM AI Basic Q&A           │ 5/day   │ Unlimited                │
│  SAM AI Course Creation     │ ❌      │ ✅                       │
│  SAM AI Content Generation  │ ❌      │ ✅                       │
│  SAM AI Quiz Generation     │ ❌      │ ✅                       │
│  AI Learning Path           │ ❌      │ ✅                       │
│  Priority Support           │ ❌      │ ✅                       │
│  Early Access Features      │ ❌      │ ✅                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## YouTube Video Security

### Setup Instructions

1. **Upload videos as UNLISTED** (not public, not private)
   - Unlisted = Only accessible with direct link
   - Not searchable on YouTube

2. **Store only the video ID in database**
   - Example: For `https://youtube.com/watch?v=dQw4w9WgXcQ`
   - Store: `dQw4w9WgXcQ`

3. **Never expose video ID in frontend code**
   - Fetch via authenticated API call
   - Video ID sent only after access verification

### Security Level

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ASSESSMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Protection Level: MODERATE                                      │
│                                                                  │
│  ✅ Protects against:                                            │
│     • Casual link sharing                                        │
│     • Search engine indexing                                     │
│     • Non-authenticated users                                    │
│     • 95% of users who just want free content                   │
│                                                                  │
│  ⚠️  Cannot prevent:                                             │
│     • Tech-savvy users inspecting network requests               │
│     • Browser developer tools extraction                         │
│     • Screen recording                                           │
│                                                                  │
│  Mitigation:                                                     │
│     • Video IDs are dynamic (fetched per session)                │
│     • Users must be logged in                                    │
│     • Most pirates target easier sources                         │
│     • Your content value is in the learning experience           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Database Schema
- [ ] Add premium fields to User model
- [ ] Add premium fields to Post model
- [ ] Create SAM usage tracking fields
- [ ] Run Prisma migration

### Phase 2: Core APIs
- [ ] Create subscription checkout API
- [ ] Create Stripe webhook handler
- [ ] Create subscription status API
- [ ] Create premium check utility

### Phase 3: Content Protection
- [ ] Create protected video API
- [ ] Create protected blog API
- [ ] Add SAM AI access control

### Phase 4: Frontend Updates
- [ ] Add subscription UI components
- [ ] Update video player with access check
- [ ] Update blog pages with premium badges
- [ ] Add SAM AI upgrade prompts

### Phase 5: Testing
- [ ] Test subscription flow
- [ ] Test video protection
- [ ] Test blog protection
- [ ] Test SAM AI limits

---

## Stripe Webhook Events

Handle these events for subscription management:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate premium, set expiry |
| `customer.subscription.updated` | Update expiry date |
| `customer.subscription.deleted` | Set `isPremium = false` |
| `invoice.payment_succeeded` | Extend subscription |
| `invoice.payment_failed` | Send warning email |

---

## Cost Analysis

### Zero Infrastructure Cost Model

| Service | Cost | Notes |
|---------|------|-------|
| YouTube Hosting | $0 | Unlimited storage & bandwidth |
| Vercel Hosting | $0 | Hobby plan sufficient |
| Railway Database | $0-5/mo | Free tier or minimal |
| Stripe | 2.9% + $0.30 | Only when you earn money |

### Revenue Projection

```
Example: 100 Premium Subscribers at $9.99/mo

Revenue:        $999/mo
Stripe Fees:    ~$32/mo (3.2%)
Net Revenue:    $967/mo

Annual:         $11,604 net revenue
```

---

## File Structure

```
lib/
├── premium/
│   ├── check-premium.ts      # Premium status checker
│   ├── check-enrollment.ts   # Enrollment checker
│   └── sam-access.ts         # SAM AI access control

app/api/
├── subscription/
│   ├── checkout/route.ts     # Create checkout session
│   ├── webhook/route.ts      # Handle Stripe webhooks
│   ├── status/route.ts       # Get subscription status
│   └── cancel/route.ts       # Cancel subscription
├── courses/[courseId]/
│   └── sections/[sectionId]/
│       └── video/route.ts    # Protected video access
└── posts/[postId]/
    └── route.ts              # Protected blog access (update)

components/
├── premium/
│   ├── upgrade-prompt.tsx    # Upgrade CTA component
│   ├── premium-badge.tsx     # Premium content badge
│   └── subscription-card.tsx # Subscription plan card
└── sam/
    └── premium-gate.tsx      # SAM feature gate
```

---

## Quick Reference

### Check if user is premium (Server)

```typescript
import { checkPremiumAccess } from "@/lib/premium/check-premium";

const { isPremium, plan, expiresAt } = await checkPremiumAccess(userId);
```

### Check if user can access SAM feature (Server)

```typescript
import { canAccessSamFeature } from "@/lib/premium/sam-access";

const { allowed, reason, remainingFreeUsage } = await canAccessSamFeature(
  userId,
  "course-creation"
);
```

### Protect API route

```typescript
// In API route
const access = await checkPremiumAccess(userId);
if (!access.isPremium) {
  return NextResponse.json({
    success: false,
    error: { code: "PREMIUM_REQUIRED", message: "..." }
  }, { status: 403 });
}
```

---

*Last Updated: December 2024*
*Version: 1.0.0*
