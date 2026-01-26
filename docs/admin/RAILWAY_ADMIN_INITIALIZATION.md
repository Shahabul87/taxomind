# Railway Admin Initialization Guide

This guide explains how to initialize the superadmin account in production using Railway CLI.

## Prerequisites

1. **Railway CLI installed**: Install using `npm i -g @railway/cli`
2. **Railway CLI authenticated**: Run `railway login`
3. **Project linked**: Run `railway link` in the project directory

## Step 1: Initialize Superadmin Account

The AdminAccount table in production is empty. You need to run the seed script to create the initial superadmin.

### Option A: Using npm script (Recommended)

```bash
# Link to your Railway project first
railway link

# Run the admin seed script via npm
npm run admin:seed:railway
```

This runs the dedicated `scripts/seed-admin.ts` script which:
- Checks if superadmin already exists
- Creates the superadmin account if not exists
- Logs the action to audit log

### Option B: Direct Railway Command

```bash
# Link to your Railway project
railway link

# Run the admin seed script directly
railway run npx tsx scripts/seed-admin.ts
```

### Option C: Using Railway Shell

If the above methods don't work, you can run a direct database command:

```bash
# Open Railway shell
railway shell

# Run the seed command
npx tsx scripts/seed-admin.ts
```

## Step 2: Verify Superadmin Creation

After running the seed, verify the superadmin was created:

```bash
# Check admin accounts
railway run npx prisma studio
```

Or query directly:
```bash
railway run npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.adminAccount.findMany().then(console.log).finally(() => prisma.\$disconnect());
"
```

## Default Superadmin Credentials

The seed script creates a superadmin with these credentials:

- **Email**: `sham251087@gmail.com`
- **Password**: `ShaM2510*##&*` (hashed in database)
- **Role**: `SUPERADMIN`

## Step 3: Login to Admin Panel

1. Navigate to: `https://taxomind.com/admin/auth/login`
2. Enter the superadmin credentials
3. You should now have access to the admin dashboard

## Admin Features Available

Once logged in as superadmin, you can:

### 1. Manage Admin Accounts
- Navigate to `/dashboard/admin/settings/admins`
- Create new admin accounts (ADMIN or SUPERADMIN role)
- Delete existing admin accounts (cannot delete self)

### 2. Access AI Features Without Subscription
- All AI course creation features work without subscription checks
- AI usage is not tracked for admin accounts
- Full access to: course planner, chapter generator, lesson generator, exam generator, etc.

### 3. Manage Users
- View all users
- Edit user subscription tiers
- View user analytics

## Security Notes

1. **Password Requirements**:
   - Change the default password after first login
   - Use a strong password (12+ characters, mixed case, numbers, symbols)

2. **Two-Factor Authentication**:
   - Enable 2FA for admin accounts in production
   - Stored in `twoFactorEnabled` and `twoFactorSecret` fields

3. **Audit Logging**:
   - All admin actions are logged in the `AuditLog` table
   - Monitor for suspicious activity

## Troubleshooting

### "Invalid credentials" error

1. Verify the AdminAccount exists in the database
2. Check if the password hash is correct
3. Verify the `ADMIN_JWT_SECRET` environment variable is set

### "Session expired" error

Admin sessions expire after 4 hours. You'll need to login again.

### "Access denied" error

Ensure your admin role is `SUPERADMIN` for management features.

## Environment Variables Required

Make sure these are set in Railway:

```env
ADMIN_JWT_SECRET=your-secure-secret-here
NEXT_PUBLIC_APP_URL=https://taxomind.com
```

## Related Documentation

- [Admin Authentication Architecture](./ADMIN_AUTH_FIX_SUMMARY.md)
- [Admin/User Separation](./ADMIN_USER_SEPARATION_ANALYSIS.md)
- [Admin JWT Fix](./ADMIN_JWT_SECRET_MISMATCH_FIX.md)
