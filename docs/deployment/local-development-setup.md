# Local Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.10.0 or higher
- **Git**: v2.30.0 or higher
- **Operating System**: macOS, Linux, or Windows with WSL2

### Required Tools
```bash
# Check Node.js version
node --version  # Should be >= 18.17.0

# Check npm version
npm --version   # Should be >= 9.0.0

# Check Docker version
docker --version  # Should be >= 20.10.0

# Check Git version
git --version   # Should be >= 2.30.0
```

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/taxomind/taxomind.git
cd taxomind

# Checkout the development branch
git checkout staging
```

## Step 2: Environment Configuration

### Create Environment File
```bash
# Copy the example environment file
cp .env.example .env.local
```

### Configure Environment Variables
Edit `.env.local` with your local configuration:

```env
# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration (Local Docker PostgreSQL on port 5433)
DATABASE_URL="postgresql://user:password@localhost:5433/taxomind_dev"

# Authentication Configuration (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_SECRET=your-32-character-secret-key-here

# Encryption Master Key for TOTP/MFA (64 hex characters)
ENCRYPTION_MASTER_KEY=your-64-character-hex-key-for-totp-encryption-here

# OAuth Providers (Optional for local development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Cloudinary Configuration (for file uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis Configuration (optional for local)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# AI Services (optional for local)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Development Specific
STRICT_ENV_MODE=false
ENABLE_DEBUG_LOGGING=true
DISABLE_RATE_LIMITING=true
```

## Step 3: Database Setup

### Start PostgreSQL Container
```bash
# Option 1: Use existing container
npm run dev:docker:start

# Option 2: Reset and create new container
npm run dev:docker:reset

# This will create a PostgreSQL 15 container:
# - Container name: taxomind-dev-db
# - Port: 5433 (avoids conflict with default 5432)
# - Database: taxomind_dev
# - Password: dev_password_123
# - Data persists between restarts
```

### Initialize Database
```bash
# Generate Prisma client
npx prisma generate

# Reset and setup database with seed data
npm run dev:setup

# Or manually:
npm run dev:db:reset    # Reset database schema
npm run dev:db:seed     # Seed with test data

# The seed script creates:
# - Admin, teacher, and student users
# - Sample courses with chapters and sections
# - Test enrollments and purchases
# - Demo content for AI features
```

### Verify Database Connection
```bash
# Open Prisma Studio to browse database
npm run dev:db:studio

# This will open http://localhost:5555
```

## Step 4: Install Dependencies

```bash
# Install all dependencies
npm install

# If you encounter issues, try:
npm ci  # Clean install from package-lock.json
```

## Step 5: Start Development Server

```bash
# Validate environment first
npm run validate:env

# Start the development server with environment loading
npm run dev

# Or with clean CSS fix (if style issues)
npm run dev:clean

# The application will be available at:
# http://localhost:3000

# Key routes:
# - Homepage: http://localhost:3000
# - Sign in: http://localhost:3000/auth/signin
# - Admin Dashboard: http://localhost:3000/admin (requires admin role)
# - Teacher Dashboard: http://localhost:3000/teacher
# - API Health: http://localhost:3000/api/health
```

## Step 6: Verify Installation

### Check Application Health
```bash
# In a new terminal, check the health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "environment": "development",
#   "timestamp": "2025-01-17T..."
# }
```

### Test User Accounts
After seeding, you can log in with these test accounts:

```
Admin User:
Email: admin@taxomind.com
Password: Admin123!

Regular User:
Email: user@taxomind.com
Password: User123!

Teacher:
Email: teacher@taxomind.com
Password: Teacher123!
```

## Development Workflow

### 1. Daily Development Commands

```bash
# Start your development environment
npm run dev:docker:start  # Start PostgreSQL container
npm run dev               # Start Next.js dev server

# Essential validation commands (MUST run before committing)
npm run lint             # Check ESLint rules - CRITICAL
npm run typecheck        # Run TypeScript compiler
npm run build            # Verify production build

# Run tests during development
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Check test coverage (70% threshold)

# Performance monitoring
npm run performance:check  # Check bundle sizes
npm run bundle:analyze    # Analyze bundle composition
```

### 2. Database Management

```bash
# Reset database (drops, migrates, seeds)
npm run dev:setup

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Update Prisma client after schema changes
npx prisma generate

# Pull database schema from existing database
npx prisma db pull

# Open database GUI
npm run dev:db:studio
```

### 3. Testing Commands

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test.test.ts

# Run e2e tests (requires running app)
npm run test:e2e
```

## Common Development Tasks

### Creating a New Feature

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**:
```bash
# Create/edit files
# Run lint frequently
npm run lint
```

3. **Test your changes**:
```bash
npm run test
npm run build  # Ensure build passes
```

4. **Commit with conventional commits**:
```bash
git add .
git commit -m "feat: add new feature description"
```

### Working with Prisma Schema

1. **Modify schema**:
```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. **Create migration**:
```bash
npx prisma migrate dev --name add_new_model
```

3. **Generate client**:
```bash
npx prisma generate
```

4. **Use in code**:
```typescript
import { db } from '@/lib/db';

const newRecord = await db.newModel.create({
  data: { name: 'Example' }
});
```

## Troubleshooting

### Port Conflicts

If port 5433 is already in use:
```bash
# Stop the container
npm run dev:docker:stop

# Reset and restart
npm run dev:docker:reset
```

### Database Connection Issues

```bash
# Check if container is running
docker ps | grep taxomind-postgres-dev

# Check container logs
docker logs taxomind-postgres-dev

# Restart container
docker restart taxomind-postgres-dev
```

### Prisma Client Issues

```bash
# Clear Prisma cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## IDE Setup

### VS Code Extensions

Install recommended extensions for optimal development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "github.copilot"
  ]
}
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

## Development Best Practices

### 1. Code Quality
- Always run `npm run lint` before committing
- Fix all TypeScript errors (`npm run type-check`)
- Write tests for new features
- Follow the existing code patterns

### 2. Database Changes
- Never modify production data from development
- Test migrations thoroughly before applying
- Keep migrations reversible when possible
- Document complex database changes

### 3. Environment Variables
- Never commit `.env.local` or any `.env` files
- Use different values for development vs production
- Document all new environment variables
- Validate environment on startup

### 4. Git Workflow
- Keep commits atomic and focused
- Use conventional commit messages
- Pull latest changes frequently
- Resolve conflicts promptly

## Performance Optimization

### Development Server Optimization

```bash
# Use turbo mode for faster builds
npm run dev -- --turbo

# Limit memory usage if needed
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### Database Query Optimization

```typescript
// Use select to limit data transfer
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});

// Use pagination for large datasets
const courses = await db.course.findMany({
  take: 20,
  skip: page * 20
});
```

## Security in Development

### 1. Secrets Management
- Use `.env.local` for local secrets
- Never use production secrets locally
- Rotate development secrets regularly

### 2. Database Security
- Use different passwords for each environment
- Don't expose database ports publicly
- Use read-only users when possible

### 3. API Security
- Test authentication flows thoroughly
- Verify authorization checks
- Test rate limiting (when enabled)

## Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Internal Guides
- Architecture Guide: `/docs/architecture.md`
- API Documentation: `/docs/api/`
- Component Library: `/docs/components/`

### Support
- Development Team Slack: #taxomind-dev
- GitHub Issues: github.com/taxomind/taxomind/issues
- Wiki: github.com/taxomind/taxomind/wiki

---

*Last Updated: January 2025*
*Version: 1.0.0*