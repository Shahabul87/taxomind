---
argument-hint: [task-description] [--browser] [--skip-lint]
description: Execute tasks with enterprise standards, port management, and comprehensive testing
---

# Enterprise-Grade Task Execution Protocol

You are about to execute a task following strict enterprise and industry standards. Follow this protocol exactly:

## 📋 Task Parameters
- **Task**: $ARGUMENTS
- **Browser Testing**: Available (use Playwright MCP if needed)
- **Standards**: Enterprise-grade coding standards (CLAUDE.md rules)

---

## 🚀 PHASE 1: Pre-Execution Setup

### 1.1 Port 3000 Management (MANDATORY)
**Before starting ANY task:**

```bash
# Check if port 3000 is in use
lsof -ti:3000

# If in use, kill the process
echo "🔧 Killing port 3000 for testing..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 already free"

# Verify port is free
sleep 2
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "❌ ERROR: Port 3000 still in use!"
  exit 1
else
  echo "✅ Port 3000 is now available for testing"
fi
```

### 1.2 Review Enterprise Standards
**CRITICAL**: Before ANY coding, review these standards:
1. Read `/Users/mdshahabulalam/CLAUDE.md` (user-level standards)
2. Read `/Users/mdshahabulalam/myprojects/taxomind/taxomind/CLAUDE.md` (project standards)
3. Apply ALL mandatory rules from both files

Key standards to follow:
- ✅ NO `any` or `unknown` types in TypeScript
- ✅ Validate all inputs with Zod
- ✅ Check database schema BEFORE writing queries
- ✅ Proper error handling in all functions
- ✅ Follow Clean Architecture principles
- ✅ Write tests for new functionality

### 1.3 Clean Codebase Structure (MANDATORY)
**CRITICAL**: Maintain a clean, organized codebase structure:

**❌ DO NOT:**
- Create unnecessary test files that pollute the project root
- Generate temporary files outside of designated folders
- Create backup files with suffixes like `_backup`, `_old`, `_test`
- Leave debugging files in the codebase
- Create one-off utility files in random locations

**✅ DO:**
- Use existing folder structures for all files
- Create organized folders for test files: `__tests__/`, `tests/`, or `test/`
- Place temporary/debug files in: `.tmp/`, `temp/`, or `.debug/` (git-ignored)
- Group related files by feature/domain
- Follow the project's established file naming conventions

**Clean Folder Structure:**
```
project-root/
├── src/                    # Source code (organized by feature)
├── __tests__/             # Test files (mirrors src structure)
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── temp/                   # Temporary files (git-ignored)
│   └── .gitignore
├── scripts/                # Build/utility scripts
└── docs/                   # Documentation (only if essential)
```

**File Creation Rules:**
1. **Test Files**: ALWAYS place in `__tests__/` folder, mirroring source structure
   - Example: `src/lib/auth.ts` → `__tests__/lib/auth.test.ts`
2. **Temporary Files**: ALWAYS place in `temp/` or `.tmp/` (git-ignored)
3. **Documentation**: Only create if explicitly requested or essential
4. **Scripts**: Place in `scripts/` folder with descriptive names
5. **Analysis Reports**: Place in `docs/analysis/` or project root (if critical)

---

## 🛠️ PHASE 2: Task Execution

### 2.1 Execute the Task
**Task**: $ARGUMENTS

Follow these guidelines:
1. **Read before modifying**: Always read files before editing
2. **Small commits**: Make incremental changes
3. **Test as you go**: Don't wait until the end
4. **Document changes**: Add clear comments for complex logic
5. **Clean file creation**: Follow the structure rules from Phase 1.3

### 2.2 File Creation Protocol
**Before creating ANY new file:**

1. **Check if file already exists**:
   ```bash
   find . -name "filename.*" -type f
   ```

2. **Determine correct location**:
   - **Source code**: `app/`, `lib/`, `components/`, etc.
   - **Tests**: `__tests__/` (mirror source structure)
   - **Temporary/Debug**: `temp/` or `.tmp/` (git-ignored)
   - **Scripts**: `scripts/`
   - **Documentation**: `docs/` (only if critical)

3. **Use descriptive, conventional names**:
   - ✅ `auth-helpers.ts`, `user-service.ts`, `validate-input.ts`
   - ❌ `test.ts`, `temp.ts`, `new-file.ts`, `backup.ts`

4. **Create parent folders if needed**:
   ```bash
   mkdir -p __tests__/lib/auth
   # Then create: __tests__/lib/auth/helpers.test.ts
   ```

5. **Add to .gitignore if temporary**:
   - Temporary analysis files → Add to .gitignore
   - Debug output files → Add to .gitignore
   - One-time scripts → Either delete or move to scripts/

### 2.3 Database Operations
**If task involves database:**
```bash
# ALWAYS verify schema first
cat prisma/schema.prisma | grep -A 10 "model [ModelName]"

# Check for field existence before using
npx prisma studio  # Visual verification if needed
```

---

## ✅ PHASE 3: Post-Execution Validation (MANDATORY)

### 3.1 TypeScript Error Check
**NEVER skip this step:**
```bash
echo "🔍 Checking TypeScript errors..."
npx tsc --noEmit 2>&1 | tee /tmp/ts-errors.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ No TypeScript errors found"
else
  echo "❌ TypeScript errors detected! Review /tmp/ts-errors.log"
  echo "Fix ALL errors before proceeding"
  exit 1
fi
```

### 3.2 ESLint Check
**MANDATORY for all code changes:**
```bash
echo "🔍 Running ESLint..."
npm run lint 2>&1 | tee /tmp/eslint-errors.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ No linting errors found"
else
  echo "⚠️ Linting errors detected! Review /tmp/eslint-errors.log"
  echo "Fix critical errors before proceeding"
fi
```

### 3.3 Test Suite Execution
**If tests exist for modified code:**
```bash
echo "🧪 Running relevant tests..."
npm test -- --bail --findRelatedTests [modified-files]
```

---

## 🌐 PHASE 4: Browser Testing (If Required)

**Use Playwright MCP for real browser testing if task involves UI/UX changes:**

### 4.1 When to Use Browser Testing:
- UI component changes
- Authentication flows
- Form submissions
- Redirect logic
- JavaScript-dependent features

### 4.2 Playwright Test Execution:
```bash
echo "🎭 Starting Playwright browser tests..."

# Playwright MCP is already configured
# Use browser navigation, screenshots, and interaction tools
# Test actual user experience in Chrome/Firefox
```

**Browser Test Checklist:**
- ✅ Page loads without errors
- ✅ No infinite loops or redirects
- ✅ Forms submit correctly
- ✅ Navigation works as expected
- ✅ No console errors (F12)

---

## 🔄 PHASE 5: Port Release & Handoff to User

### 5.1 Cleanup Operations (MANDATORY)
**Before releasing to user, clean up ALL temporary files:**

```bash
echo "🧹 Cleaning up temporary files and test artifacts..."

# Remove test files created in wrong locations
find . -maxdepth 1 -name "*test*.js" -o -name "*test*.ts" | while read file; do
  echo "⚠️  Found test file in root: $file"
  echo "   Should be in __tests__/ folder"
done

# Check for temporary/debug files
find . -maxdepth 1 -name "temp*" -o -name "test-*" -o -name "debug-*" | while read file; do
  echo "🗑️  Removing temporary file: $file"
  rm -f "$file"
done

# List files that should be moved to proper folders
echo "📋 Files that need organizing:"
ls -la *.md 2>/dev/null | grep -v "README\|CLAUDE\|package\|LICENSE" || echo "  No loose markdown files"

echo "✅ Cleanup complete"
```

### 5.2 Stop Testing Server (MANDATORY)
```bash
echo "🛑 Stopping test server and releasing port 3000..."

# Kill all node processes used for testing
killall node 2>/dev/null || echo "No node processes to kill"

# Kill any remaining processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 already released"

# Verify port is released
sleep 2
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️ WARNING: Port 3000 still in use. Manual cleanup may be needed."
else
  echo "✅ Port 3000 successfully released"
fi
```

### 5.3 User Instructions
**Provide CLEAR instructions to the user:**

```
╔══════════════════════════════════════════════════════════════╗
║  ✅ TASK COMPLETED - Ready for User Testing                 ║
╚══════════════════════════════════════════════════════════════╝

📊 Validation Results:
  - TypeScript: [PASS/FAIL]
  - ESLint: [PASS/FAIL]
  - Tests: [PASS/FAIL/SKIPPED]
  - Browser Test: [COMPLETED/SKIPPED]

🚀 To run the application:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser:
   http://localhost:3000

3. Test the changes:
   [Provide specific testing instructions based on the task]

⚠️ Important Notes:
  - Port 3000 has been released and is ready for your use
  - All test servers have been stopped
  - Review the changes and test thoroughly

📝 Files Modified:
  [List all modified files]

🔧 Next Steps (if any):
  [Any follow-up tasks or recommendations]
```

---

## 🎯 Quality Gates (Must Pass All)

Before marking task as complete, verify:

### Code Quality:
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes without critical errors (`npm run lint`)
- [ ] All modified code follows CLAUDE.md standards
- [ ] Database schema matches code expectations
- [ ] Error handling is comprehensive
- [ ] No `any` or `unknown` types used

### File Organization:
- [ ] No test files in project root (should be in `__tests__/`)
- [ ] No temporary files left behind (`temp-*`, `test-*`, `debug-*`)
- [ ] No backup files with suffixes (`_old`, `_backup`, `_new`)
- [ ] All new files in appropriate folders
- [ ] Temporary files added to `.gitignore` (if kept)
- [ ] Test files mirror source structure

### Testing & Deployment:
- [ ] Browser testing completed (if UI changes)
- [ ] Port 3000 released to user
- [ ] All test servers stopped
- [ ] Clear user instructions provided
- [ ] Tests written/updated (if applicable)
- [ ] Files Modified list is accurate

---

## 🚨 Emergency Procedures

### If Port 3000 Won't Release:
```bash
# Nuclear option - force kill everything
sudo lsof -ti:3000 | xargs sudo kill -9
sudo killall -9 node

# Verify
lsof -ti:3000 && echo "Still stuck" || echo "Port freed"
```

### If TypeScript Errors Persist:
1. Clear cache: `rm -rf .next node_modules/.cache`
2. Reinstall: `npm install`
3. Regenerate Prisma: `npx prisma generate`

### If Tests Fail:
1. Check if database schema matches code
2. Review test mocks and fixtures
3. Run tests in isolation: `npm test -- --testNamePattern="specific test"`

### If Codebase is Polluted:
```bash
# Comprehensive cleanup script
echo "🧹 Deep cleaning codebase..."

# Find and list all misplaced files
echo "📋 Misplaced files:"
find . -maxdepth 1 \( -name "*test*" -o -name "*temp*" -o -name "*backup*" -o -name "*old*" -o -name "*debug*" \) -type f

# Create proper folders if they don't exist
mkdir -p __tests__/temp
mkdir -p temp
mkdir -p .tmp

# Move test files to proper location (manual review recommended)
echo "⚠️  Please manually move test files to __tests__/ folder"

# Remove obvious temporary files
find . -maxdepth 1 -name "temp-*.js" -delete
find . -maxdepth 1 -name "test-*.js" -delete
find . -maxdepth 1 -name "debug-*.log" -delete

echo "✅ Deep clean complete - review changes before committing"
```

---

## 📖 Additional Resources

- **Enterprise Standards**: `/Users/mdshahabulalam/CLAUDE.md`
- **Project Standards**: `CLAUDE.md` (project root)
- **Testing Guide**: Use Playwright MCP for browser automation
- **Database Schema**: `prisma/schema.prisma`

---

## 🎬 Execution Summary

**Remember**: This protocol ensures:
✅ Enterprise-grade code quality
✅ Proper port management
✅ Comprehensive testing
✅ Clean, organized codebase structure
✅ No unnecessary files polluting the project
✅ Proper folder organization for all artifacts
✅ Clean handoff to user
✅ No interference with user's development environment

**Clean Codebase Principles Summary:**
- 🗂️ All test files in `__tests__/` folder
- 🧹 No temporary files in project root
- 📁 Organized folder structure
- 🚫 No backup/old/temp file suffixes
- ✨ Clean, professional codebase

**Execute task now following all phases above.**
