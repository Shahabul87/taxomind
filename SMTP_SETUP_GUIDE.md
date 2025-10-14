# SMTP Email Configuration Guide

This guide will help you configure SMTP email service for Taxomind. SMTP works with any email provider (Gmail, Outlook, SendGrid, Mailgun, etc.).

---

## 🚀 Quick Start

Add these environment variables to your `.env` file or Railway environment variables:

```bash
# SMTP Configuration (REQUIRED for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com  # Optional: defaults to SMTP_USER
```

---

## 📧 Provider-Specific Configuration

### Option 1: Gmail (Recommended for Development)

**Prerequisites**:
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password (not your regular Gmail password)

**Steps to Get Gmail App Password**:
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Taxomind" and click "Generate"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

**Environment Variables**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here  # 16-character app password
SMTP_FROM=your-email@gmail.com
```

**Note**: Gmail has a sending limit of 500 emails/day for free accounts.

---

### Option 2: Outlook/Hotmail

**Environment Variables**:
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
SMTP_FROM=your-email@outlook.com
```

**Note**: Use your regular Outlook password (no app password needed).

---

### Option 3: SendGrid (Recommended for Production)

**Prerequisites**:
1. Sign up at https://sendgrid.com (Free tier: 100 emails/day)
2. Create an API Key in the SendGrid dashboard

**Environment Variables**:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey  # Literal string "apikey"
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=verified-sender@yourdomain.com
```

**Important**:
- You must verify your sender email in SendGrid dashboard
- For production, verify your domain for better deliverability

**Sending Limits**:
- Free: 100 emails/day
- Essentials: 40,000 emails/month ($19.95/month)

---

### Option 4: Mailgun (Great for Production)

**Prerequisites**:
1. Sign up at https://www.mailgun.com (Free tier: 5,000 emails/month)
2. Add and verify your domain

**Environment Variables**:
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
SMTP_FROM=no-reply@yourdomain.com
```

**Sending Limits**:
- Free: 5,000 emails/month (first 3 months)
- Foundation: 50,000 emails/month ($35/month)

---

### Option 5: AWS SES (Best for High Volume)

**Prerequisites**:
1. AWS Account with SES enabled
2. Verify your domain or email addresses
3. Request production access (starts in sandbox mode)

**Environment Variables**:
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Change region as needed
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=verified-email@yourdomain.com
```

**Sending Limits**:
- Free tier: 62,000 emails/month (first 12 months)
- After: $0.10 per 1,000 emails

---

## 🔧 Railway Deployment Setup

### Step 1: Add Environment Variables

1. Go to **Railway Dashboard**
2. Select your **Taxomind project**
3. Click on your **service**
4. Go to **Variables** tab
5. Add these variables:

```bash
SMTP_HOST=smtp.gmail.com  # Your SMTP host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Step 2: Verify Configuration

After deployment, test the SMTP connection:

```bash
# Test via diagnostic endpoint
curl https://your-domain.com/api/debug/check-auth-env | jq

# Try registering a test account
# Email should be received within 1-2 minutes
```

---

## 🧪 Testing SMTP Locally

### Step 1: Create `.env` File

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env

# Add SMTP configuration
nano .env
```

### Step 2: Test Registration

```bash
# Start development server
npm run dev

# Register a new account at http://localhost:3000/auth/register
# Check your email inbox (and spam folder)
```

### Step 3: Check Logs

Watch the console for email sending logs:

```
✅ [Email Queue] Verification email sent successfully to: user@example.com
```

Or for errors:

```
❌ [Email Queue] Failed to send verification email to: user@example.com
⚠️ [Email Queue] SMTP not configured - email not sent
```

---

## 🔒 Security Best Practices

### 1. Never Commit Credentials
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Use App Passwords
- **Gmail**: Use App Passwords, not your main password
- **Outlook**: Can use main password, but App Password is safer
- **SendGrid/Mailgun**: Use API keys with minimal permissions

### 3. Rotate Credentials Regularly
- Change SMTP passwords every 90 days
- Revoke and regenerate API keys if compromised

### 4. Monitor Email Sending
- Set up alerts for failed email deliveries
- Monitor bounce rates and spam complaints
- Keep sender reputation high

---

## 📊 Email Sending Limits Comparison

| Provider    | Free Tier              | Best For          | Monthly Cost |
|-------------|------------------------|-------------------|--------------|
| Gmail       | 500/day                | Development       | Free         |
| Outlook     | ~300/day               | Development       | Free         |
| SendGrid    | 100/day                | Small Production  | $0-20        |
| Mailgun     | 5,000/month            | Production        | $0-35        |
| AWS SES     | 62,000/month (1 year)  | High Volume       | $0-100       |

---

## 🐛 Troubleshooting

### Issue 1: "SMTP not configured" Warning

**Symptom**: Emails not sending, log shows warning message

**Solution**:
```bash
# Verify environment variables are set
echo $SMTP_USER
echo $SMTP_HOST

# In Railway: Check Variables tab
# Ensure SMTP_USER and SMTP_PASSWORD are set
```

---

### Issue 2: "Authentication Failed"

**Symptom**: `Error: Invalid login: 535 Authentication failed`

**Solutions**:
- **Gmail**: Make sure you're using an App Password, not your Gmail password
- **All**: Double-check username and password have no extra spaces
- **Gmail**: Enable "Less secure app access" (not recommended) or use App Password

---

### Issue 3: "Connection Timeout"

**Symptom**: `Error: Connection timeout`

**Solutions**:
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify your network allows outbound SMTP connections
- Try port 465 with `SMTP_SECURE=true` if 587 fails
- Check if your hosting provider blocks SMTP ports

---

### Issue 4: Emails Go to Spam

**Solutions**:
1. **Verify Your Domain**: Use SPF, DKIM, and DMARC records
2. **Use a Custom Domain**: Avoid sending from `@gmail.com` in production
3. **Warm Up Your IP**: Start with low volume, gradually increase
4. **Monitor Reputation**: Check sender score at https://www.senderscore.org

---

### Issue 5: Testing in Development

**Use MailHog or Mailtrap for development**:

```bash
# Option 1: MailHog (catches all emails locally)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Then in .env:
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=test
SMTP_PASSWORD=test

# View emails at: http://localhost:8025
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Environment variables set correctly
- [ ] SMTP credentials are valid
- [ ] Port 587 (or 465) is accessible
- [ ] Test email received successfully
- [ ] Email not in spam folder
- [ ] Verification links work correctly
- [ ] Email templates display properly
- [ ] No errors in application logs

---

## 📚 Additional Resources

- **Nodemailer Documentation**: https://nodemailer.com/
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **SendGrid Setup**: https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp
- **Mailgun SMTP**: https://documentation.mailgun.com/en/latest/user_manual.html#smtp
- **AWS SES Guide**: https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html

---

**Need Help?**

If you encounter issues:
1. Check Railway/application logs for detailed error messages
2. Verify SMTP credentials with your provider
3. Test with a simple SMTP test tool first
4. Contact your SMTP provider's support

---

**Last Updated**: January 2025
**Taxomind Version**: 1.0.0
