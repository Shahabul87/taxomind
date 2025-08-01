# Stripe Payment & Enrollment Testing Guide

## 🚨 Current Issue Diagnosis

Based on the logs, the issue is that the **Stripe webhook isn't creating the enrollment** before the success page loads. This causes the "enrollment_not_found" error.

## 🔧 Step-by-Step Debugging

### **Step 1: Check Your Environment Variables**

Verify these are set in your `.env.local`:

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### **Step 2: Debug Enrollment Status**

Visit this URL while logged in to check enrollment status:
```
http://localhost:3000/api/debug/enrollment/0ecee16f-bc29-4876-b226-fee46c765c5a
```

This will show you:
- If the user is authenticated
- If the course exists
- If enrollment exists
- Stripe customer status
- Recent enrollments

### **Step 3: Test Webhook Locally**

The main issue is likely that **Stripe webhooks aren't reaching your local server**. Here's how to fix it:

#### **Option A: Use Stripe CLI (Recommended)**

1. **Install Stripe CLI:**
   ```bash
   # Download from: https://stripe.com/docs/stripe-cli
   # Or if you have Homebrew (Mac):
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

4. **Copy the webhook secret** that appears (starts with `whsec_`) and add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
   ```

5. **Test the payment flow** - webhooks should now work!

#### **Option B: Use ngrok (Alternative)**

1. **Install ngrok:** https://ngrok.com/
2. **Expose your local server:**
   ```bash
   ngrok http 3000
   ```
3. **Add webhook endpoint in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://your-ngrok-url.ngrok.io/api/webhook`
   - Events: `checkout.session.completed`

### **Step 4: Test Free Course Enrollment**

If you have a free course (price = 0), test it first:

1. Set course price to `0`
2. Click "Enroll Now"
3. Should redirect directly to success page

### **Step 5: Manual Enrollment Testing**

If webhooks still don't work, manually create an enrollment:

```bash
# POST request to create enrollment
curl -X POST http://localhost:3000/api/debug/enrollment/0ecee16f-bc29-4876-b226-fee46c765c5a
```

## 🐛 Common Issues & Solutions

### **Issue 1: Webhook Not Receiving Events**
**Symptoms:** Success page shows "enrollment_not_found"
**Solution:** Set up Stripe CLI or ngrok (see Step 3)

### **Issue 2: Webhook Secret Mismatch**
**Symptoms:** Webhook returns 400 error
**Solution:** Copy the exact webhook secret from Stripe CLI or Dashboard

### **Issue 3: Database Connection Issues**
**Symptoms:** Database errors in webhook logs
**Solution:** Check your database connection and Prisma setup

### **Issue 4: User Not Authenticated**
**Symptoms:** Redirects to login page
**Solution:** Make sure you're logged in and session is valid

### **Issue 5: Course Not Found**
**Symptoms:** 404 or course not found errors
**Solution:** Verify the course ID exists and is published

## ✅ Testing Checklist

### **Free Course Test:**
- [ ] Set course price to 0
- [ ] Click "Enroll Now"
- [ ] Should redirect to success page immediately
- [ ] Check enrollment exists in debug endpoint

### **Paid Course Test (with Stripe CLI):**
- [ ] Stripe CLI running: `stripe listen --forward-to localhost:3000/api/webhook`
- [ ] Webhook secret updated in `.env.local`
- [ ] Development server restarted
- [ ] Click "Enroll Now" on paid course
- [ ] Complete Stripe test payment (use `4242 4242 4242 4242`)
- [ ] Should redirect to success page
- [ ] Check webhook logs in Stripe CLI
- [ ] Check enrollment exists in debug endpoint

### **Test Credit Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0000 0000 3220
```

## 🔍 Debug Commands

### **Check Current Enrollments:**
```bash
# GET enrollment status
curl http://localhost:3000/api/debug/enrollment/YOUR_COURSE_ID
```

### **Create Manual Enrollment:**
```bash
# POST to create enrollment (for testing)
curl -X POST http://localhost:3000/api/debug/enrollment/YOUR_COURSE_ID
```

### **Check Webhook Logs:**
- Look at your terminal where you're running `npm run dev`
- Check Stripe CLI output if using it
- Check Stripe Dashboard webhook logs

## 🚀 Quick Fix for Testing

If you just want to test the success page quickly:

1. **Create manual enrollment:**
   ```bash
   curl -X POST http://localhost:3000/api/debug/enrollment/0ecee16f-bc29-4876-b226-fee46c765c5a
   ```

2. **Visit success page:**
   ```
   http://localhost:3000/courses/0ecee16f-bc29-4876-b226-fee46c765c5a/success?success=1
   ```

## 📝 Production Deployment Notes

For production:

1. **Set up real Stripe webhook endpoint**
2. **Use production Stripe keys**
3. **Set proper NEXTAUTH_URL**
4. **Enable webhook signature verification**
5. **Add proper error handling and logging**
6. **Set up monitoring for failed webhooks**

## 🆘 Still Having Issues?

1. **Check browser network tab** - look for failed API calls
2. **Check server logs** - look for error messages
3. **Test with Stripe CLI** - this solves 90% of webhook issues
4. **Verify environment variables** - common cause of issues
5. **Check database** - make sure Prisma is working correctly

The most common issue is webhooks not working locally. Using Stripe CLI usually solves this immediately! 