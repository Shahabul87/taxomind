# 🚀 Safe Migrations Quick Guide

## The 3 Golden Rules

### 1️⃣ New Fields = Optional or Default
```prisma
// ✅ ALWAYS DO THIS
model User {
  newField String?           // Optional
  // OR
  newField String @default("") // Has default
}

// ❌ NEVER DO THIS
model User {
  newField String  // Required - will fail!
}
```

### 2️⃣ Local Test → Push → Auto-Deploy
```bash
# Step 1: Create migration locally
npx prisma migrate dev --name add_user_bio

# Step 2: Test it works
npm run dev

# Step 3: Commit and push
git add prisma/
git commit -m "feat: add user bio field"
git push

# ✨ Railway automatically runs migration!
```

### 3️⃣ Breaking Changes = Two Phases

**Renaming a field? Changing type? Follow this:**

```bash
# Phase 1: Add new field (keep old)
model User {
  age_old Int?
  age_new String?  // New format
}
# Deploy → Backfill data → Test

# Phase 2: Remove old field
model User {
  age_new String
}
# Deploy again
```

---

## Common Scenarios

### ✅ Safe: Adding a New Table
```bash
npx prisma migrate dev --name add_analytics_table
git add prisma/ && git commit -m "feat: add analytics" && git push
# ✅ Zero data loss
```

### ✅ Safe: Adding Optional Field
```prisma
model Course {
  id    String @id
  bio   String?  // ✅ Safe
}
```

### ✅ Safe: Adding Field with Default
```prisma
model Course {
  id     String @id
  views  Int @default(0)  // ✅ Safe
}
```

### ⚠️ Needs Care: Removing a Field
```bash
# 1. Remove from code first
# 2. Deploy code
# 3. Then remove from schema
# 4. Create migration
```

### ❌ Unsafe: Making Field Required
```prisma
// DON'T do this directly!
model User {
  phone String  // ❌ Existing users have no phone
}

// DO this instead (two phases):
// Phase 1:
phone String?
// Backfill data
// Phase 2:
phone String  // Now safe
```

---

## How It Works on Railway

1. **You push code** → Railway detects changes
2. **Railway builds** → Runs `Dockerfile.railway`
3. **Before starting** → Runs `npm run migrate:production`
4. **Migration script**:
   - Validates schema
   - Checks for pending migrations
   - Runs `prisma migrate deploy` (SAFE - never loses data)
   - Generates Prisma client
5. **App starts** → With updated database

**You don't need to do anything manually!** 🎉

---

## Emergency Commands

```bash
# Check migration status
npm run migrate:check

# Run migration manually (if needed)
npm run migrate:production

# See what's in database
npx prisma studio
```

---

## Quick Checklist Before Push

- [ ] Migration tested locally
- [ ] New fields are optional or have defaults
- [ ] No type changes (use two-phase if needed)
- [ ] No renaming (use two-phase if needed)
- [ ] Code works with migration
- [ ] Committed to git

---

## That's It!

Railway handles migrations automatically. Just follow the golden rules and you'll never lose data! 🛡️

For detailed guide, see: `MIGRATION_GUIDE.md`
