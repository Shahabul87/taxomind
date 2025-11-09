# Local Payment Testing Guide

## 🎯 Overview

This guide will help you test the complete payment and enrollment flow locally using Stripe test mode.

---

## 📋 Prerequisites

1. **Stripe Account** (free): [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Stripe CLI** installed: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
3. **Redis** running (for queue system)
4. **PostgreSQL** running (for database)

---

## 🔧 Step 1: Set Up Stripe Test Keys

### 1.1 Get Your Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Click on "Developers" → "API Keys"
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 1.2 Update `.env.local`

```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Webhook secret (we'll add this in Step 2)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

---

## 🔌 Step 2: Set Up Stripe Webhooks (Optional for Testing)

Webhooks allow Stripe to notify your app when payment succeeds. For local testing:

### 2.1 Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from https://stripe.com/docs/stripe-cli
```

### 2.2 Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authorize the CLI.

### 2.3 Start Webhook Forwarding

In a **separate terminal**, run:

```bash
stripe listen --forward-to http://localhost:3000/api/webhook
```

**Important**: Keep this terminal running!

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 2.4 Update `.env.local` with Webhook Secret

Copy the webhook secret from the terminal and add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🚀 Step 3: Start Your Development Environment

### 3.1 Start PostgreSQL

```bash
npm run dev:docker:start
```

### 3.2 Initialize Queue Workers

In a **new terminal**:

```bash
curl -X POST http://localhost:3000/api/queue/init
```

Or visit: `http://localhost:3000/api/queue/init` in your browser

**Expected response:**
```json
{
  "success": true,
  "message": "Workers initialized successfully"
}
```

### 3.3 Start Next.js

```bash
npm run dev
```

Wait for:
```
✓ Ready on http://localhost:3000
```

---

## 🧪 Step 4: Test the Payment Flow

### 4.1 Create a Test Paid Course

1. Sign in to your app as an admin
2. Go to `/admin/courses/create` (or use Prisma Studio)
3. Create a course with:
   - `isFree: false`
   - `price: 29.99` (or any amount)
   - `isPublished: true`

**Using Prisma Studio:**
```bash
npm run dev:db:studio
```

Then update a course:
- Set `isFree` to `false`
- Set `price` to `29.99`
- Set `isPublished` to `true`

### 4.2 Test the Enrollment Flow

1. **Navigate to the course page**: `http://localhost:3000/courses/[courseId]`
2. **Click "Enroll Now"** button
3. **You should see**: Toast message "Redirecting to checkout..."
4. **You'll be redirected** to Stripe's hosted checkout page

### 4.3 Complete Test Payment

On Stripe's checkout page, use these **test card numbers**:

#### ✅ Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

#### ❌ Card Declined
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

#### ⏳ Requires Authentication (3D Secure)
```
Card Number: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
```

### 4.4 Verify Webhook Processing

**In your Stripe CLI terminal**, you should see:
```
[200 POST] checkout.session.completed
```

**In your Next.js terminal**, you should see:
```
[WEBHOOK] Received Stripe event: checkout.session.completed
[WEBHOOK] Queued webhook event evt_xxx for processing
```

### 4.5 Verify Success Page

After payment succeeds:
1. You'll be redirected to: `http://localhost:3000/courses/[courseId]/success?success=1`
2. The page will show a success message
3. The page has **retry logic** (waits up to 30 seconds for webhook to create enrollment)
4. You should see: "🎉 Enrollment Successful!"

### 4.6 Verify Enrollment in Database

**Using Prisma Studio:**
```bash
npm run dev:db:studio
```

Check:
- **Enrollment** table: New record with your `userId` and `courseId`
- **PaymentTransaction** table: New record with status `COMPLETED`
- **WebhookEvent** table: Webhook event logged

---

## 🐛 Troubleshooting

### Issue: "Failed to create checkout session"

**Check:**
1. Is `STRIPE_SECRET_KEY` set in `.env.local`?
2. Did you restart the dev server after updating `.env.local`?
3. Check browser console for errors
4. Check terminal for API errors

### Issue: "Enrollment not found" on success page

**Possible causes:**
1. Webhooks not working
2. Queue workers not initialized
3. Database connection issues

**Solutions:**
1. **Check webhook forwarding**: Is `stripe listen` running?
2. **Check worker initialization**:
   ```bash
   curl -X POST http://localhost:3000/api/queue/init
   ```
3. **Check Redis**: Is Redis running?
4. **Manual enrollment** (workaround):
   - Open Prisma Studio
   - Create enrollment manually in `Enrollment` table

### Issue: Webhook signature verification failed

**Solution:**
1. Make sure `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`
2. Restart `stripe listen`
3. Update the webhook secret in `.env.local`
4. Restart Next.js dev server

### Issue: Workers not processing jobs

**Check:**
1. Is Redis running?
   ```bash
   redis-cli ping
   # Should return: PONG
   ```
2. Initialize workers:
   ```bash
   curl -X POST http://localhost:3000/api/queue/init
   ```
3. Check logs in terminal

---

## 📊 Testing Checklist

- [ ] Stripe test keys configured in `.env.local`
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Next.js dev server running (`npm run dev`)
- [ ] Stripe CLI forwarding webhooks (`stripe listen --forward-to http://localhost:3000/api/webhook`)
- [ ] Queue workers initialized (`POST /api/queue/init`)
- [ ] Test course created with `price > 0` and `isPublished: true`
- [ ] Clicking "Enroll Now" redirects to Stripe checkout
- [ ] Test payment completes successfully
- [ ] Webhook received and processed
- [ ] Redirected to success page
- [ ] Enrollment created in database
- [ ] Can access course at `/courses/[courseId]/learn`

---

## 🎯 Complete Test Flow

```
1. User clicks "Enroll Now" on paid course
   ↓
2. hero-wrapper.tsx calls POST /api/courses/[courseId]/checkout
   ↓
3. API creates Stripe checkout session
   ↓
4. User redirected to Stripe checkout page
   ↓
5. User enters test card (4242 4242 4242 4242)
   ↓
6. Payment succeeds
   ↓
7. Stripe sends webhook to /api/webhook
   ↓
8. Webhook handler logs event to database
   ↓
9. Webhook queued for processing
   ↓
10. Webhook worker processes event
   ↓
11. Creates PaymentTransaction
   ↓
12. Queues enrollment job
   ↓
13. Enrollment worker creates enrollment
   ↓
14. User redirected to success page
   ↓
15. Success page verifies enrollment (retry logic)
   ↓
16. ✅ User enrolled! Can start learning
```

---

## 💡 Quick Test Without Webhooks

If you don't want to set up webhooks, you can manually create the enrollment:

1. Complete payment on Stripe
2. Open Prisma Studio: `npm run dev:db:studio`
3. In `Enrollment` table, create new record:
   - `userId`: Your user ID
   - `courseId`: The course ID
   - `enrollmentType`: "PAID"
   - `status`: "ACTIVE"
4. Refresh the course page
5. You should now be enrolled

---

## 🔒 Security Notes

- **Never commit real API keys** to git
- Test keys are safe to use locally
- Test keys start with `pk_test_` and `sk_test_`
- Production keys start with `pk_live_` and `sk_live_`
- Webhook secrets start with `whsec_`

---

## 📚 Additional Resources

- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [BullMQ Documentation](https://docs.bullmq.io/)

---

## ✅ Success Indicators

When everything works correctly, you'll see:

**Browser:**
- ✅ Toast: "Redirecting to checkout..."
- ✅ Stripe checkout page loads
- ✅ Payment succeeds
- ✅ Redirected to success page
- ✅ "🎉 Enrollment Successful!" message

**Terminal (Next.js):**
```
[WEBHOOK] Received Stripe event: checkout.session.completed
[WEBHOOK] Queued webhook event evt_xxx for processing
[ENROLLMENT] Processing enrollment for user xxx in course xxx
[ENROLLMENT] Enrollment created successfully
```

**Terminal (Stripe CLI):**
```
[200 POST] checkout.session.completed
```

**Database:**
- ✅ New record in `Enrollment` table
- ✅ New record in `PaymentTransaction` table
- ✅ New record in `WebhookEvent` table

---

**Happy Testing! 🚀**
