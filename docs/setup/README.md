# Setup Documentation

This directory contains setup guides for configuring third-party services and development environment.

## 📋 Available Setup Guides

### OAuth Authentication Setup

#### `SETUP_GITHUB_OAUTH.md`
**Purpose:** Configure GitHub OAuth for user authentication

**What you&apos;ll learn:**
- Creating GitHub OAuth App
- Configuring callback URLs
- Setting environment variables
- Testing GitHub login

**Prerequisites:**
- GitHub account
- Access to repository settings

---

#### `SETUP_GOOGLE_OAUTH.md`
**Purpose:** Configure Google OAuth for user authentication

**What you&apos;ll learn:**
- Creating Google Cloud Project
- Configuring OAuth consent screen
- Setting up OAuth 2.0 credentials
- Environment variable configuration

**Prerequisites:**
- Google Cloud account
- Project creation permissions

---

### Email Service Setup

#### `SMTP_SETUP_GUIDE.md`
**Purpose:** Configure email service for transactional emails

**What you&apos;ll learn:**
- SMTP provider selection
- Email template configuration
- Testing email delivery
- Production email setup

**Prerequisites:**
- SMTP service account (Gmail, SendGrid, etc.)
- Domain for email sender

---

## 🚀 Quick Start

### 1. Development Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd taxomind

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Configure OAuth Providers

Follow these guides in order:
1. `SETUP_GOOGLE_OAUTH.md` - Primary OAuth provider
2. `SETUP_GITHUB_OAUTH.md` - Secondary OAuth provider

### 3. Configure Email Service

Follow `SMTP_SETUP_GUIDE.md` to enable email functionality.

### 4. Verify Setup

```bash
# Run development server
npm run dev

# Test authentication
# Navigate to http://localhost:3000
# Try Google and GitHub login
```

## 🔒 Environment Variables

After completing setup guides, your `.env` file should include:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret
```

## 🔗 Related Documentation

- [Architecture](../architecture/) - System architecture
- [Troubleshooting](../troubleshooting/) - Common setup issues
- [Deployment](../deployment/) - Production deployment
- [Features](../features/) - Feature documentation

## 📝 Notes

- **Security**: Never commit `.env` files to version control
- **Production**: Use different credentials for production environment
- **Testing**: Test each OAuth provider independently
- **Email**: Use test mode for development email testing

---

*Last updated: January 2025*
