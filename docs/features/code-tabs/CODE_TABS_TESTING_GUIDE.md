# Code Tabs Redesign - Comprehensive Testing Guide

## 🧪 Testing Checklist

**Date**: October 16, 2025
**Status**: Ready for Testing
**Tester**: [Your Name]

---

## 📋 Pre-Test Setup

### 1. Start Development Environment
```bash
# Terminal 1: Start database
npm run dev:docker:start

# Terminal 2: Start development server
npm run dev

# Terminal 3: Watch for errors
npm run lint -- --watch
```

### 2. Access Testing URL
```
http://localhost:3000/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]
```
Navigate to the **Code** tab.

---

## ✅ Functional Testing

### Test 1: Add Code Block
**Expected Result**: ✅ Code block created successfully

**Steps**:
1. Click "Add Block" tab
2. Fill in:
   - Title: "Import Dependencies"
   - Language: TypeScript
   - Code:
     ```typescript
     import { User } from './models';
     import { Database } from './db';
     ```
3. Click "Add Code Block"

**Validation**:
- [ ] Success toast appears
- [ ] Block appears in "View Code" tab
- [ ] Title displays correctly
- [ ] Language badge shows "typescript"
- [ ] Syntax highlighting applied
- [ ] Line numbers start at 1

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Test 2: Add Multiple Code Blocks
**Expected Result**: ✅ Multiple blocks group into unified view

**Steps**:
1. Add Block 1: "Import Dependencies" (from Test 1)
2. Add Block 2:
   - Title: "Define User Class"
   - Language: TypeScript
   - Code:
     ```typescript
     class UserService {
       private db: Database;

       constructor(db: Database) {
         this.db = db;
       }
     }
     ```
3. Add Block 3:
   - Title: "Create Instance"
   - Language: TypeScript
   - Code:
     ```typescript
     const db = new Database();
     const userService = new UserService(db);
     ```

**Validation**:
- [ ] All 3 blocks display in order
- [ ] Line numbers are continuous (1-3, gap, 5-11, gap, 13-14)
- [ ] Visual separation between blocks
- [ ] Block headers show titles
- [ ] Badge shows "3 Blocks"

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Test 3: Add Explanation
**Expected Result**: ✅ Explanation added and visible on hover

**Steps**:
1. Click "Add Explanation" tab
2. Select code block: "Import Dependencies"
3. Write explanation:
   ```
   This block imports the essential dependencies needed for our user service:
   - User model for type safety
   - Database client for data operations
   ```
4. Click "Add Explanation"

**Validation**:
- [ ] Success toast appears
- [ ] Block shows "💡 Hover for explanation" badge
- [ ] Other blocks show "No explanation yet"

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Test 4: Hover Tooltip (Desktop)
**Expected Result**: ✅ Tooltip appears with smooth animation

**Steps**:
1. Go to "View Code" tab
2. Hover over "Import Dependencies" block
3. Wait for tooltip to appear

**Validation**:
- [ ] Tooltip appears within 200ms
- [ ] Positioned to the right of the block
- [ ] Shows block title "Import Dependencies"
- [ ] Shows explanation text
- [ ] Has blue gradient header
- [ ] Has "Esc to close" hint in footer
- [ ] Animation is smooth (fade + scale)

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Test 5: Keyboard Shortcuts
**Expected Result**: ✅ Esc key closes tooltip

**Steps**:
1. Hover over block to show tooltip
2. Press `Esc` key

**Validation**:
- [ ] Tooltip closes immediately
- [ ] Smooth exit animation
- [ ] No console errors

---

### Test 6: Copy Individual Block
**Expected Result**: ✅ Code copied to clipboard

**Steps**:
1. In "View Code" tab
2. Click "Copy" button on "Import Dependencies" block
3. Open text editor and paste (`Cmd+V` / `Ctrl+V`)

**Validation**:
- [ ] Success toast: "Import Dependencies copied!"
- [ ] Button shows "✓ Copied" briefly
- [ ] Clipboard contains exact code
- [ ] No extra whitespace or formatting issues

**Pasted Code**:
```
[Paste here to verify]
```

---

### Test 7: Copy All Code
**Expected Result**: ✅ All blocks copied as unified program

**Steps**:
1. Click "Copy All" button in header
2. Paste into text editor

**Validation**:
- [ ] Success toast appears
- [ ] Contains all 3 blocks
- [ ] Includes block titles as comments
- [ ] Proper spacing between blocks
- [ ] Syntax is valid TypeScript

**Pasted Code**:
```
[Paste here to verify]
```

---

### Test 8: Download Code
**Expected Result**: ✅ File downloaded with correct content

**Steps**:
1. Click "Download" button
2. Check Downloads folder

**Validation**:
- [ ] File named `code-complete.typescript` (or .ts)
- [ ] Contains all blocks with comments
- [ ] Proper line breaks
- [ ] Can be opened in VS Code

**File Content Preview**:
```
[Screenshot or snippet]
```

---

### Test 9: Toggle Explanations
**Expected Result**: ✅ Explanations hide/show smoothly

**Steps**:
1. Click "Hide Explanations" button
2. Hover over block
3. Click "Show Explanations" button
4. Hover over block again

**Validation**:
- [ ] Button toggles between "Hide" and "Show"
- [ ] Icon changes (Eye ↔ EyeOff)
- [ ] Hover does nothing when hidden
- [ ] Badge "💡 Hover" disappears when hidden
- [ ] Tooltip reappears when shown

---

### Test 10: Delete Code Block
**Expected Result**: ✅ Block deleted, line numbers recalculated

**Steps**:
1. Click "Edit" button on Block 2 ("Define User Class")
2. Find delete option
3. Confirm deletion

**Validation**:
- [ ] Confirmation dialog appears
- [ ] Success toast after deletion
- [ ] Block removed from view
- [ ] Remaining blocks re-numbered
- [ ] Line numbers recalculated (1-3, gap, 5-6)
- [ ] Badge shows "2 Blocks"

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

## 📱 Responsive Testing

### Breakpoint: 320px (Small Phone)
**Device**: iPhone SE

**Test Steps**:
1. Resize browser to 320px width
2. Add code block
3. Hover/tap on block with explanation

**Validation**:
- [ ] Layout doesn't break
- [ ] Buttons are tappable
- [ ] Code scrolls horizontally if needed
- [ ] Tooltip shows as **bottom sheet** (not side tooltip)
- [ ] Bottom sheet slides up from bottom
- [ ] "Swipe down to close" message appears
- [ ] Header is responsive

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Breakpoint: 640px (Phone)
**Device**: iPhone 12

**Validation**:
- [ ] Bottom sheet tooltip
- [ ] Tabs stack vertically if needed
- [ ] All features accessible
- [ ] Touch targets ≥ 44px

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Breakpoint: 768px (Tablet)
**Device**: iPad

**Validation**:
- [ ] Switches to **desktop tooltip** (not bottom sheet)
- [ ] Tooltip positioned to the right
- [ ] Code blocks display full width
- [ ] No horizontal scrolling

**Screenshot**: \_\_\_\_\_\_\_\_\_\_\_\_

---

### Breakpoint: 1024px (Small Laptop)
**Device**: MacBook Air

**Validation**:
- [ ] Desktop tooltip
- [ ] Optimal spacing
- [ ] All features visible

---

### Breakpoint: 1280px (Laptop)
**Device**: MacBook Pro

**Validation**:
- [ ] Full desktop experience
- [ ] Tooltip has max-width
- [ ] Code centered with padding

---

### Breakpoint: 1920px (Desktop)
**Device**: 24" Monitor

**Validation**:
- [ ] Layout doesn't stretch too wide
- [ ] Centered with max-width
- [ ] All elements proportional

---

## ♿ Accessibility Testing

### Keyboard Navigation
**Steps**:
1. Navigate page using only `Tab` key
2. Try all interactions

**Validation**:
- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] Logical tab order (header → tabs → content)
- [ ] `Tab` to buttons
- [ ] `Enter` / `Space` activates buttons
- [ ] `Esc` closes tooltip
- [ ] Focus returns after closing tooltip

---

### Screen Reader Testing
**Tool**: VoiceOver (Mac) / NVDA (Windows)

**Steps**:
1. Enable screen reader
2. Navigate through Code tab

**Validation**:
- [ ] Tab name announced: "Code"
- [ ] Buttons have labels
- [ ] Code blocks announced with title
- [ ] Tooltip content readable
- [ ] ARIA labels present
- [ ] Role attributes correct

**Announcements**:
```
[Record what screen reader says]
```

---

### Color Contrast
**Tool**: Chrome DevTools → Lighthouse

**Validation**:
- [ ] Text has ≥ 4.5:1 ratio (normal text)
- [ ] Headings have ≥ 4.5:1 ratio
- [ ] Buttons have ≥ 3:1 ratio
- [ ] Focus indicators have ≥ 3:1 ratio
- [ ] Dark mode also passes

**Lighthouse Score**: \_\_\_\_/100

---

### Focus Management
**Validation**:
- [ ] Focus trapped in tooltip when open
- [ ] Focus returns to trigger after close
- [ ] No focus loss
- [ ] Skip links available

---

## 🔒 Security Testing

### Input Validation
**Test**: XSS Prevention

**Steps**:
1. Try to add code with script tags:
   ```html
   <script>alert('XSS')</script>
   ```

**Validation**:
- [ ] Script is escaped or sanitized
- [ ] No alert popup
- [ ] Code displays as text
- [ ] No console errors

---

### SQL Injection
**Test**: Malicious Input

**Steps**:
1. Try title with SQL: `'; DROP TABLE users; --`

**Validation**:
- [ ] Input validation rejects or escapes
- [ ] Database unaffected
- [ ] Error message doesn't leak info

---

### Authentication
**Test**: Unauthorized Access

**Steps**:
1. Log out
2. Try to access API directly:
   ```bash
   curl http://localhost:3000/api/courses/123/chapters/456/sections/789/code-blocks
   ```

**Validation**:
- [ ] Returns 401 Unauthorized
- [ ] No data leaked
- [ ] Proper error message

---

### Authorization
**Test**: Cross-User Access

**Steps**:
1. User A creates code block
2. User B tries to access/edit/delete via API

**Validation**:
- [ ] Returns 403 Forbidden
- [ ] No cross-user data access
- [ ] Ownership verified

---

## 🐛 Error Handling

### Test 1: Network Failure
**Steps**:
1. Disable network (DevTools → Offline)
2. Try to add code block

**Validation**:
- [ ] Error toast appears
- [ ] User-friendly message
- [ ] No app crash
- [ ] Retry option available

---

### Test 2: Invalid Input
**Steps**:
1. Submit with empty title
2. Submit with 1-character code

**Validation**:
- [ ] Validation errors shown
- [ ] Form doesn't submit
- [ ] Errors are specific
- [ ] Red highlighting on fields

---

### Test 3: Server Error
**Steps**:
1. Mock 500 error from API
2. Try to fetch code blocks

**Validation**:
- [ ] Error state displayed
- [ ] "Try again" button shown
- [ ] Error doesn't leak details
- [ ] Graceful degradation

---

## 🎯 Performance Testing

### Load Time
**Tool**: Chrome DevTools → Performance

**Steps**:
1. Clear cache
2. Reload page
3. Navigate to Code tab

**Validation**:
- [ ] Initial load < 3s
- [ ] Interactive in < 1s
- [ ] Code blocks render < 500ms

**Metrics**:
- FCP (First Contentful Paint): \_\_\_\_ms
- LCP (Largest Contentful Paint): \_\_\_\_ms
- TTI (Time to Interactive): \_\_\_\_ms

---

### Interaction Performance
**Test**: Hover Tooltip

**Steps**:
1. Open DevTools → Performance
2. Record interaction
3. Hover over code block

**Validation**:
- [ ] Tooltip appears < 200ms
- [ ] Smooth 60 FPS animation
- [ ] No layout shifts
- [ ] No memory leaks

---

### Large Dataset
**Test**: 50 Code Blocks

**Steps**:
1. Create 50 code blocks via API
2. Load "View Code" tab

**Validation**:
- [ ] Page loads without crash
- [ ] Smooth scrolling
- [ ] No performance degradation
- [ ] Memory usage stable

---

## 📊 Test Results Summary

### Overall Status
- [ ] All functional tests passed
- [ ] All responsive tests passed
- [ ] All accessibility tests passed
- [ ] All security tests passed
- [ ] All performance tests passed

### Issues Found
| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Pass Rate
- Functional: \_\_\_/10 (\_\_%)
- Responsive: \_\_\_/6 (\_\_%)
- Accessibility: \_\_\_/4 (\_\_%)
- Security: \_\_\_/4 (\_\_%)
- Performance: \_\_\_/3 (\_\_%)

**Overall**: \_\_\_/27 (\_\_%)

---

## 🚀 Sign-Off

### Pre-Production Checklist
- [ ] All tests passed
- [ ] No critical issues
- [ ] Documentation updated
- [ ] Stakeholders approved
- [ ] Backup plan ready

### Approvals
- **Developer**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- **QA Lead**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- **Product Owner**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_

---

**Testing Guide Version**: 1.0
**Last Updated**: October 16, 2025
**Next Review**: After production deployment
