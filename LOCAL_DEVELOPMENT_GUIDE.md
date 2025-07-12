# 🛠️ **Taxomind Local Development Guide**

**Last Updated**: July 12, 2025  
**Environment**: Local Development with Docker PostgreSQL  
**Production URL**: https://taxomind.com  

---

## 📋 **Overview**

This guide provides complete setup instructions for running Taxomind locally for development purposes. The local environment is completely isolated from production to prevent data loss and allow safe feature development.

### **Architecture**
- **Frontend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL 15 (Docker) on port 5433
- **Authentication**: NextAuth.js with local secrets
- **File Storage**: Cloudinary (shared with production)
- **Email**: Console logging (no real emails sent)
- **AI Services**: Anthropic Claude API
- **Redis**: Disabled for local development

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ installed
- Docker Desktop installed and running
- Git installed

### **1. Clone and Install**
```bash
git clone <your-repo-url>
cd alam-lms
npm install
```

### **2. Start Local Database**
```bash
# Start PostgreSQL container on port 5433
npm run dev:docker:start

# If container doesn't exist, create it:
npm run dev:docker:reset
```

### **3. Setup Database Schema and Data**
```bash
# Push schema to local database and seed with test data
npm run dev:setup
```

### **4. Start Development Server**
```bash
npm run dev
```

### **5. Access Application**
- **Local App**: http://localhost:3000
- **Database Studio**: `npx prisma studio` (optional)

---

## 🗄️ **Database Configuration**

### **Local PostgreSQL Setup**
- **Container Name**: `taxomind-dev-db`
- **Port**: `5433` (to avoid conflicts with system PostgreSQL)
- **Database**: `taxomind_dev`
- **Username**: `postgres`
- **Password**: `dev_password_123`
- **Connection String**: `postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev`

### **Available Commands**
```bash
# Container Management
npm run dev:docker:start     # Start existing container
npm run dev:docker:stop      # Stop container
npm run dev:docker:reset     # Delete and recreate container

# Database Management
npm run dev:db:reset         # Reset database schema
npm run dev:db:seed          # Seed with test data
npm run dev:setup            # Reset and seed (full setup)
npm run dev:db:studio        # Open Prisma Studio
```

---

## 👥 **Test Users**

The development database comes pre-seeded with test users:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `teacher@dev.local` | `password123` | USER | Course creator |
| `student@dev.local` | `password123` | USER | Course learner |
| `admin@dev.local` | `password123` | ADMIN | Admin functions |
| `john@dev.local` | `password123` | USER | Additional test user |
| `jane@dev.local` | `password123` | USER | Additional test user |

### **Sample Data Included**
- **30 Course Categories**: AI, Web Development, Data Science, etc.
- **3 Sample Courses**: 
  - "Introduction to AI & Machine Learning" (Published)
  - "Full Stack Web Development with Next.js" (Published)
  - "Advanced Neural Networks" (Draft)

---

## ⚙️ **Environment Configuration**

### **Local Environment Variables**
The local development uses `.env` file with the following key settings:

```bash
# Development Mode
NODE_ENV=development

# Local Database
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev"

# Local URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Local Auth Secrets
AUTH_SECRET=local_dev_secret_key_12345_taxomind_development
NEXTAUTH_SECRET=local_dev_secret_key_12345_taxomind_development

# Disable Redis for local development
DISABLE_REDIS=true

# Email (logs to console instead of sending)
EMAIL_FROM="mail@bdgenai.com"

# Your existing API keys (OAuth, Stripe, Cloudinary, AI)
# (These are shared between local and production)
```

### **Production vs Development**
- **Production config**: Stored in `.env.production`
- **Local config**: Stored in `.env`
- **Database**: Completely separate (local vs Railway)
- **Emails**: Console logging vs real email sending
- **Redis**: Disabled locally, enabled in production

---

## 🔧 **Development Workflow**

### **Daily Development**
1. **Start Development**:
   ```bash
   npm run dev:docker:start  # Start database
   npm run dev               # Start Next.js
   ```

2. **Work on Features**:
   - All changes are made locally
   - Database changes don't affect production
   - Emails are logged to console

3. **Reset Data When Needed**:
   ```bash
   npm run dev:setup  # Reset and reseed database
   ```

### **Database Changes**
```bash
# After modifying schema in prisma/schema.prisma
npx prisma db push          # Apply schema changes
npx prisma generate         # Regenerate Prisma client
npm run dev:db:seed         # Reseed if needed
```

### **Testing Email Features**
- Emails are logged to console with full HTML content
- Check terminal output for email preview
- No real emails are sent in development

---

## 🔒 **Safety Features**

### **Production Data Protection**
- **Separate Databases**: Local and production databases are completely isolated
- **Environment Detection**: Database operations check for development mode
- **Destructive Operation Protection**: Prevents accidental data loss in production

### **Database Safety Checks**
The codebase includes safety mechanisms:

```typescript
// lib/db-environment.ts prevents destructive operations in production
export const safeDBOperation = async <T>(
  operation: () => Promise<T>,
  operationType: 'read' | 'write' | 'destructive' = 'read'
): Promise<T> => {
  const config = getEnvironmentConfig();
  
  if (operationType === 'destructive' && config.isProduction) {
    throw new Error('🚨 Destructive database operations are not allowed in production!');
  }
  
  return await operation();
};
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Port 5432 Already in Use**
```bash
# Error: Port 5432 is already in use
# Solution: The setup uses port 5433 to avoid conflicts
npm run dev:docker:reset  # This creates container on 5433
```

#### **Database Connection Failed**
```bash
# Check if container is running
docker ps

# Start container if stopped
npm run dev:docker:start

# Recreate if corrupted
npm run dev:docker:reset
```

#### **Prisma Client Issues**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database if needed
npm run dev:setup
```

#### **Environment Variables Not Loading**
```bash
# Check if .env file exists and has correct values
cat .env

# Restart development server
npm run dev
```

### **Database Issues**
```bash
# View database logs
docker logs taxomind-dev-db

# Connect to database directly
docker exec -it taxomind-dev-db psql -U postgres -d taxomind_dev

# Reset everything
npm run dev:docker:reset && npm run dev:setup
```

---

## 📊 **Monitoring Development**

### **Useful Commands**
```bash
# Check container status
docker ps

# View application logs
npm run dev  # (check terminal output)

# Monitor database
npx prisma studio  # Visual database browser

# Check environment
node -e "console.log(process.env.NODE_ENV, process.env.DATABASE_URL)"
```

### **Development URLs**
- **Application**: http://localhost:3000
- **Database Studio**: http://localhost:5555 (after running `npx prisma studio`)
- **API Routes**: http://localhost:3000/api/*

---

## 🚀 **Deployment Preparation**

### **Before Deploying to Production**
1. **Test Locally**: Ensure all features work in development
2. **Run Linting**: `npm run lint`
3. **Check Types**: `npm run typecheck` (if available)
4. **Build Test**: `npm run build`
5. **Environment Check**: Verify production environment variables

### **Production Deployment**
- **Production runs on**: Railway with PostgreSQL and Redis
- **Domain**: https://taxomind.com
- **Environment**: Uses `.env.production` settings
- **Database**: Railway PostgreSQL (separate from local)

---

## 📁 **File Structure**

### **Key Development Files**
```
alam-lms/
├── .env                           # Local development config
├── .env.production               # Production config (backup)
├── LOCAL_DEVELOPMENT_GUIDE.md    # This guide
├── scripts/dev-seed.ts           # Development database seeding
├── lib/db-environment.ts         # Environment safety checks
├── package.json                  # Development scripts
└── docker-compose.yml            # Docker configuration (if using)
```

### **Environment Files Priority**
1. `.env.local` (highest priority, not used currently)
2. `.env` (local development)
3. `.env.production` (production backup)

---

## ✅ **Verification Checklist**

Before starting development, verify:

- [ ] Docker Desktop is running
- [ ] PostgreSQL container starts successfully (`npm run dev:docker:start`)
- [ ] Database connection works (`npm run dev:setup`)
- [ ] Development server starts (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login with test users
- [ ] Database contains seeded data

---

## 🆘 **Getting Help**

### **If You Need Support**
1. **Check this guide** for common solutions
2. **Check logs**: Terminal output and Docker logs
3. **Reset environment**: `npm run dev:docker:reset && npm run dev:setup`
4. **Contact team** with specific error messages

### **Useful Debug Commands**
```bash
# Check all environment variables
env | grep -E "(DATABASE_URL|NODE_ENV|NEXT_PUBLIC)"

# Test database connection
npx prisma db pull

# Check container logs
docker logs taxomind-dev-db

# Verify seed data
npx prisma studio
```

---

## 🎯 **Next Steps**

Once your local environment is running:

1. **Explore the codebase** and understand the architecture
2. **Test existing features** using the test accounts
3. **Start development** on new features safely
4. **Use production testing guide** for validating changes

**Happy coding!** 🚀

---

*This guide ensures you can develop Taxomind features safely without affecting production data or users.*