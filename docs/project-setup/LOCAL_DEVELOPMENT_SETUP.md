# 🏠 **Local Development Setup Guide - Taxomind**

**Safe, Professional Development Environment for Solo Developers**

---

## 📋 **Overview**

This guide sets up a **100% safe local development environment** that mimics enterprise-level practices while keeping costs minimal. You'll never risk production data again!

**What You'll Achieve:**
- ✅ Local PostgreSQL database (completely isolated)
- ✅ Environment-based configuration
- ✅ Safe development workflow
- ✅ Enterprise-level data protection
- ✅ Zero production data risk

---

## 🛠 **Prerequisites**

- macOS, Windows, or Linux
- Node.js 18+ installed
- Your existing Taxomind project
- 30 minutes of setup time

---

## 📥 **Step 1: Install PostgreSQL Locally**

### **macOS (Homebrew)**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
psql --version
```

### **Windows**
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer (choose port 5432, remember password)
3. Add PostgreSQL bin to system PATH
4. Open Command Prompt and verify: `psql --version`

### **Linux (Ubuntu/Debian)**
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### **Docker Alternative (All Platforms)**
```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name taxomind-dev-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=taxomind_dev \
  -p 5432:5432 \
  -d postgres:15

# Verify container is running
docker ps
```

---

## 🗄️ **Step 2: Create Local Database**

### **Using PostgreSQL CLI**
```bash
# Connect to PostgreSQL (macOS/Linux)
psql postgres

# Create development database
CREATE DATABASE taxomind_dev;

# Create user for development
CREATE USER taxomind_dev_user WITH PASSWORD 'dev_password_123';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE taxomind_dev TO taxomind_dev_user;

# List databases to verify
\l

# Exit PostgreSQL
\q
```

### **Using Docker**
```bash
# Connect to Docker PostgreSQL
docker exec -it taxomind-dev-db psql -U postgres

# Database already created, just verify
\l

# Exit
\q
```

---

## ⚙️ **Step 3: Environment Configuration**

### **Create Environment Files**

**1. Create `.env.local`** (for local development):
```bash
# .env.local (LOCAL DEVELOPMENT ONLY)
NODE_ENV=development

# Local PostgreSQL Database
DATABASE_URL="postgresql://taxomind_dev_user:dev_password_123@localhost:5432/taxomind_dev"

# Local Development URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Development Auth Secret (different from production)
AUTH_SECRET=local_dev_secret_key_12345
NEXTAUTH_SECRET=local_dev_secret_key_12345

# Email Testing (optional - emails will be logged to console)
RESEND_API_KEY=re_test_key_or_leave_blank

# Redis (optional for local - can disable)
DISABLE_REDIS=true

# Stripe Test Keys (if you have them)
STRIPE_SECRET_KEY=sk_test_your_test_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key

# OAuth (use your existing keys or create test apps)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**2. Update `.env.example`** (for documentation):
```bash
# .env.example (TEMPLATE FILE)
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret
RESEND_API_KEY=your_resend_api_key
# ... other variables
```

**3. Update `.gitignore`**:
```bash
# Add these lines to .gitignore
.env.local
.env.development
.env.staging
.env.production
```

---

## 🔧 **Step 4: Update Database Configuration**

### **Create Database Environment Handler**

**Create `lib/db-environment.ts`:**
```typescript
// lib/db-environment.ts
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    
    // Database configuration
    database: {
      url: process.env.DATABASE_URL!,
      canReset: env === 'development', // Only allow DB reset in development
      canSeed: env !== 'production',   // Allow seeding in dev/staging
      migrations: {
        autoRun: env === 'development', // Auto-run migrations only in dev
        allowDrop: env === 'development' // Allow destructive operations only in dev
      }
    },
    
    // Email configuration
    email: {
      provider: env === 'development' ? 'console' : 'resend',
      from: `noreply@${env === 'development' ? 'localhost' : 'taxomind.com'}`,
      logToConsole: env === 'development'
    },
    
    // Feature flags
    features: {
      analytics: env !== 'development',
      realPayments: env === 'production',
      debugMode: env === 'development'
    }
  };
};

// Environment-safe database operations
export const safeDBOperation = async <T>(
  operation: () => Promise<T>,
  operationType: 'read' | 'write' | 'destructive' = 'read'
): Promise<T> => {
  const config = getEnvironmentConfig();
  
  if (operationType === 'destructive' && config.isProduction) {
    throw new Error('🚨 Destructive database operations are not allowed in production!');
  }
  
  if (operationType === 'destructive' && config.isDevelopment) {
    console.log('🛠️ Running destructive operation in development environment');
  }
  
  return await operation();
};
```

### **Update Existing Mail Configuration**

**Update `lib/mail.ts`:**
```typescript
// Add this to the top of lib/mail.ts
import { getEnvironmentConfig } from './db-environment';

// Update the getDomain function
const getDomain = () => {
  const config = getEnvironmentConfig();
  
  if (config.isDevelopment) {
    return 'http://localhost:3000';
  }
  
  // Check for explicit URL environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Production fallback
  return 'https://taxomind.com';
};

// Update email sending to log in development
const sendEmailSafely = async (emailData: any) => {
  const config = getEnvironmentConfig();
  
  if (config.isDevelopment) {
    console.log('📧 [DEV] Email would be sent:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from
    });
    console.log('📧 [DEV] Email content:', emailData.html);
    return { success: true, dev: true };
  }
  
  // Send real email in staging/production
  return await resend!.emails.send(emailData);
};
```

---

## 🌱 **Step 5: Database Setup & Seeding**

### **Run Initial Database Setup**
```bash
# Navigate to your project
cd /path/to/taxomind

# Install dependencies (if not already done)
npm install

# Generate Prisma client for local database
npx prisma generate

# Push schema to local database (creates tables)
npx prisma db push

# Verify tables were created
npx prisma studio
# This opens a web interface to view your local database
```

### **Create Development Seed Script**

**Create `scripts/dev-seed.ts`:**
```typescript
// scripts/dev-seed.ts
const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient();

async function main() {
  try {
    console.log("🌱 Seeding development database...");

    // Clear existing data (safe in development only)
    await database.user.deleteMany({});
    await database.course.deleteMany({});
    await database.category.deleteMany({});

    console.log("🗑️ Cleared existing data");

    // Seed categories
    const categories = await database.category.createMany({
      data: [
        { name: "Computer Science" },
        { name: "Artificial Intelligence" },
        { name: "Data Science" },
        { name: "Machine Learning" },
        { name: "Web Development" },
        { name: "Mobile Development" },
        { name: "Cybersecurity" },
        { name: "Mathematics" },
        { name: "Physics" },
        { name: "Psychology" },
        { name: "Philosophy" },
        { name: "Business" },
        { name: "Design" },
        { name: "Photography" },
        { name: "Music" },
      ]
    });

    console.log(`✅ Created ${categories.count} categories`);

    // Create development users
    const devUsers = await database.user.createMany({
      data: [
        {
          name: "Dev Teacher",
          email: "teacher@dev.local",
          role: "TEACHER",
          emailVerified: new Date(),
        },
        {
          name: "Dev Student",
          email: "student@dev.local",
          role: "USER", 
          emailVerified: new Date(),
        },
        {
          name: "Dev Admin",
          email: "admin@dev.local",
          role: "ADMIN",
          emailVerified: new Date(),
        }
      ]
    });

    console.log(`✅ Created ${devUsers.count} development users`);

    // Get created teacher for course creation
    const teacher = await database.user.findFirst({
      where: { email: "teacher@dev.local" }
    });

    const aiCategory = await database.category.findFirst({
      where: { name: "Artificial Intelligence" }
    });

    // Create sample course
    if (teacher && aiCategory) {
      const course = await database.course.create({
        data: {
          userId: teacher.id,
          title: "Introduction to AI & Machine Learning",
          description: "Learn the fundamentals of AI and ML with hands-on projects",
          imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
          price: 99.99,
          isPublished: true,
          categoryId: aiCategory.id,
        }
      });

      console.log(`✅ Created sample course: ${course.title}`);
    }

    console.log("🎉 Development database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding development database:", error);
  } finally {
    await database.$disconnect();
  }
}

main();
```

### **Add Package.json Scripts**

**Update `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:db:reset": "npx prisma db push --force-reset && npm run dev:db:seed",
    "dev:db:seed": "node scripts/dev-seed.ts",
    "dev:db:studio": "npx prisma studio",
    "dev:setup": "npm run dev:db:reset && npm run dev:db:seed",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## 🚀 **Step 6: Development Workflow**

### **Daily Development Routine**

**Starting Development:**
```bash
# Start local development
npm run dev

# In another terminal, view database (optional)
npm run dev:db:studio
```

**When You Need Fresh Data:**
```bash
# Reset and reseed local database (safe!)
npm run dev:setup
```

**Testing Features:**
```bash
# All testing happens locally first
npm run dev

# Test registration: http://localhost:3000/auth/register
# Test login: http://localhost:3000/auth/login
# Create courses, etc.
```

**Before Pushing to Production:**
```bash
# Make sure everything works locally
npm run build

# Then push to Railway (production)
git add .
git commit -m "Feature: description"
git push origin main
```

---

## 🛡️ **Step 7: Safety Measures**

### **Environment Validation**

**Create `lib/env-validation.ts`:**
```typescript
// lib/env-validation.ts
export const validateEnvironment = () => {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'AUTH_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn if using production database in development
  if (process.env.NODE_ENV === 'development' && 
      process.env.DATABASE_URL?.includes('railway.app')) {
    console.warn('⚠️  WARNING: Using production database in development!');
    console.warn('   Consider using local PostgreSQL for safety.');
  }

  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Database: ${process.env.DATABASE_URL?.includes('localhost') ? 'Local' : 'Remote'}`);
};
```

**Add to `app/layout.tsx`:**
```typescript
// Add this to the top of layout.tsx
import { validateEnvironment } from '@/lib/env-validation';

// Add this inside the RootLayout function
if (process.env.NODE_ENV === 'development') {
  validateEnvironment();
}
```

---

## 📋 **Step 8: Verification Checklist**

### **Test Your Setup**

- [ ] **PostgreSQL installed and running**
  ```bash
  psql --version
  # Should show version 15.x or later
  ```

- [ ] **Local database created**
  ```bash
  psql postgresql://taxomind_dev_user:dev_password_123@localhost:5432/taxomind_dev -c "\l"
  # Should show taxomind_dev database
  ```

- [ ] **Environment variables configured**
  ```bash
  cat .env.local
  # Should show all required variables
  ```

- [ ] **Database schema applied**
  ```bash
  npm run dev:db:studio
  # Should open Prisma Studio with your tables
  ```

- [ ] **Development seeded**
  ```bash
  npm run dev:setup
  # Should create categories and test users
  ```

- [ ] **Application running locally**
  ```bash
  npm run dev
  # Should start on http://localhost:3000
  ```

- [ ] **Registration/Login working**
  - Visit http://localhost:3000/auth/register
  - Create test account
  - Verify email logs to console
  - Login successfully

---

## 🔄 **Daily Development Workflow**

### **Morning Routine**
```bash
# Start development
npm run dev

# Check database (if needed)
npm run dev:db:studio
```

### **Feature Development**
```bash
# 1. Develop locally (safe)
# 2. Test thoroughly
# 3. Only then push to production

git add .
git commit -m "Feature: description"
git push origin main  # This deploys to Railway
```

### **Database Changes**
```bash
# 1. Update Prisma schema
# 2. Test locally first
npx prisma db push

# 3. If everything works, deploy
git push origin main
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

**PostgreSQL Connection Error:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if stopped
brew services start postgresql@15
```

**Permission Denied:**
```bash
# Reset PostgreSQL permissions
psql postgres -c "ALTER USER taxomind_dev_user CREATEDB;"
```

**Port Already in Use:**
```bash
# Check what's using port 5432
lsof -i :5432

# Kill if necessary
sudo kill -9 <PID>
```

**Environment Variables Not Loading:**
```bash
# Make sure you're using .env.local (not .env)
ls -la | grep env

# Restart Next.js
npm run dev
```

---

## 🎯 **Benefits Achieved**

✅ **100% Safe Development** - Never risk production data  
✅ **Enterprise-Level Workflow** - Proper environment separation  
✅ **Fast Development** - No network latency, instant feedback  
✅ **Offline Development** - Work without internet connection  
✅ **Cost Effective** - Local development is free  
✅ **Professional Practice** - Industry-standard development setup  

---

## 📚 **Next Steps**

1. **Complete this setup**
2. **Test all features locally**
3. **Consider adding staging environment** (optional)
4. **Implement CI/CD pipeline** (future enhancement)

---

**Generated on**: July 12, 2025  
**Project**: Taxomind Intelligent Learning Platform  
**Environment**: Local Development Setup  
**Status**: ✅ Production-Ready Development Environment

---

*Remember: With this setup, you can break anything locally without affecting production. Develop fearlessly!* 🚀