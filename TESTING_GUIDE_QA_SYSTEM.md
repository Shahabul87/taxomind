# Q&A System Testing Guide

## 🎉 All Setup Complete!

Your Q&A Discussion System is now fully deployed and ready for testing!

---

## ✅ Completed Steps

1. **✅ Database Schema Applied** - All Q&A tables created with no data loss
2. **✅ Sample Data Seeded** - 3 questions, 2 answers, and 1 vote added
3. **✅ Development Server Running** - Ready to test at http://localhost:3001

---

## 🧪 Manual Testing Instructions

### Step 1: Navigate to Course Page

**URL**: http://localhost:3001/courses/9ce272d7-e11a-410d-a318-23771672c751

1. Open your browser and navigate to the URL above
2. You should see the course page for "Complete Next.js 15 Masterclass"
3. Click on the **"Q&A"** tab in the course navigation

### Step 2: View Existing Questions

You should see **3 sample questions**:

#### Question 1: ⭐ Answered with Best Answer
- **Title**: "How do I get started with this course?"
- **Features to verify**:
  - ✅ Question displays with upvote count (1 upvote)
  - ✅ Section badge shows linked section
  - ✅ Answer from instructor with "Instructor" badge
  - ✅ Best answer marked with green border and checkmark
  - ✅ Vote buttons functional (click to upvote/downvote)

#### Question 2: ⭐ Answered by Student
- **Title**: "What is the best practice for implementing authentication?"
- **Features to verify**:
  - ✅ Question displays with answer count
  - ✅ Answer from regular student (no instructor badge)
  - ✅ No best answer marked yet

#### Question 3: 📌 Pinned Question
- **Title**: "Assignment submission deadline question"
- **Features to verify**:
  - ✅ Pinned badge visible
  - ✅ No answers yet
  - ✅ No section linked

### Step 3: Test Search & Filters

#### Search Functionality
1. Type "authentication" in the search box
2. **Expected**: Only Question 2 should appear
3. Clear search to see all questions again

#### Sort Options
1. Click the **"Sort by"** dropdown
2. Try each option:
   - **Recent**: Questions sorted by creation date (newest first)
   - **Top Voted**: Question 1 should appear first (has 1 upvote)
   - **Unanswered**: Only Question 3 should appear

#### Section Filter
1. Click the **"Section"** dropdown
2. Select a specific section
3. **Expected**: Only questions linked to that section appear
4. Select "All sections" to reset

### Step 4: Test Voting System

1. **Click upvote** on any question:
   - ✅ Vote count increases immediately (optimistic update)
   - ✅ Upvote button highlights
   - ✅ If you upvote again, it removes your vote

2. **Click downvote** on any question:
   - ✅ Vote count decreases
   - ✅ Downvote button highlights
   - ✅ Net score updates (upvotes - downvotes)

3. **Switch vote**:
   - Upvote a question, then click downvote
   - ✅ Vote changes from +1 to -1 (net change of -2)

### Step 5: Test Ask Question Form

1. Click the **"Ask Question"** button
2. **Form should display** with:
   - Title field (10-200 characters)
   - Content field (20-5000 characters)
   - Section dropdown (optional)
   - Character counters for both fields

3. **Test Validation**:
   - Try submitting with title < 10 chars → **Should show error**
   - Try submitting with content < 20 chars → **Should show error**
   - Fill valid data → **Should create question successfully**

4. **After submission**:
   - ✅ Success toast notification appears
   - ✅ Form closes
   - ✅ New question appears in the list
   - ✅ Question list refreshes automatically

### Step 6: Test Answer Functionality

1. Click on any question to view details (if navigation implemented)
2. **Expected features**:
   - All answers displayed
   - Best answer shown first (if marked)
   - Instructor badges visible on instructor answers
   - Vote buttons on each answer

3. **Post an answer**:
   - Fill in answer content (10-5000 chars)
   - Submit answer
   - ✅ Answer appears in list
   - ✅ Question marked as "Answered"

### Step 7: Test Best Answer Marking (Instructor/Owner Only)

1. Log in as the **course instructor**
2. Navigate to a question with answers
3. **"Mark as Best"** button should appear on answers
4. Click to mark an answer as best:
   - ✅ Answer gets green border
   - ✅ "Best Answer" badge appears
   - ✅ Answer moves to top of list
   - ✅ Only one answer can be best at a time

### Step 8: Test Pagination

1. If you have > 10 questions:
   - ✅ Pagination controls appear at bottom
   - ✅ "Page X of Y" displays
   - ✅ Previous/Next buttons work
   - ✅ Buttons disable at boundaries (page 1 or last page)

---

## 🔍 What to Look For

### ✅ Expected Behaviors

1. **Performance**:
   - Questions load quickly
   - Voting updates instantly (optimistic)
   - No lag when typing in search

2. **UI/UX**:
   - All text readable on both light/dark mode
   - Buttons have hover effects
   - Forms have proper validation messages
   - Empty states show helpful messages

3. **Data Integrity**:
   - Vote counts accurate
   - Answer counts match reality
   - Best answer badge only on one answer
   - Pinned questions stay at top

### ❌ Common Issues to Check

1. **TypeScript Errors**: Check browser console for errors
2. **API Errors**: Check Network tab for failed requests
3. **UI Bugs**: Broken layouts, missing icons, incorrect colors
4. **Data Issues**: Questions not saving, votes not counting

---

## 🐛 Troubleshooting

### Issue: Questions don't load
**Solution**: Check browser console for API errors
```bash
# Check if API route exists
curl http://localhost:3001/api/courses/9ce272d7-e11a-410d-a318-23771672c751/questions
```

### Issue: Voting doesn't work
**Solution**:
1. Make sure you're logged in
2. Check browser console for errors
3. Verify user has enrollment in course

### Issue: Can't post questions
**Solution**:
1. Verify user is enrolled in course
2. Check validation requirements (10+ chars title, 20+ chars content)
3. Check browser console for API errors

### Issue: Server not responding
**Solution**:
```bash
# Check if server is running
lsof -i :3001

# Restart server if needed
# Kill the background process and run:
npm run dev
```

---

## 📊 Sample Test Data Summary

### Test User Created
- **Email**: qa.test@example.com
- **Name**: Test Student
- **ID**: qa-test-user-1760945692678

### Course Used
- **ID**: 9ce272d7-e11a-410d-a318-23771672c751
- **Title**: Complete Next.js 15 Masterclass

### Questions Created
1. "How do I get started with this course?" (1 upvote, answered, best answer)
2. "What is the best practice for implementing authentication?" (answered by student)
3. "Assignment submission deadline question" (pinned, unanswered)

### Database Tables Populated
- ✅ CourseQuestion (3 records)
- ✅ CourseAnswer (2 records)
- ✅ QuestionVote (1 record)
- ✅ Enrollment (1 record)
- ✅ User (1 test user)

---

## 🚀 Next Steps After Testing

### If All Tests Pass
1. **Document any UI/UX improvements** you'd like
2. **Add more sample data** if needed (run seed script again)
3. **Deploy to staging** for team review
4. **Create E2E tests** using Playwright

### If Issues Found
1. **Document the issue** with screenshots
2. **Check browser console** for errors
3. **Share the error details** for debugging
4. **Test in different browsers** (Chrome, Firefox, Safari)

---

## 📝 Testing Checklist

Use this checklist to track your manual testing:

- [ ] Questions load on Q&A tab
- [ ] All 3 sample questions visible
- [ ] Search functionality works
- [ ] Sort options work (Recent, Top, Unanswered)
- [ ] Section filter works
- [ ] Upvote button works
- [ ] Downvote button works
- [ ] Vote counts update correctly
- [ ] Ask Question button opens form
- [ ] Form validation works
- [ ] Question submission successful
- [ ] New questions appear in list
- [ ] Answer posting works
- [ ] Best answer marking works (instructor only)
- [ ] Pagination works (if >10 questions)
- [ ] Empty state shows when no questions
- [ ] Instructor badge shows on instructor answers
- [ ] Pinned badge shows on pinned questions
- [ ] Section badge shows when question linked to section
- [ ] Dark mode styling correct
- [ ] Mobile responsive layout works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] API responses < 500ms

---

## 🎯 Success Criteria

Your Q&A system is **production-ready** if:

✅ All 25 checklist items pass
✅ No TypeScript errors in browser console
✅ No API errors in Network tab
✅ Voting system works correctly
✅ Form validation prevents invalid submissions
✅ Data persists after page reload
✅ UI is responsive on mobile/tablet/desktop
✅ Dark mode works correctly

---

## 📞 Support

If you encounter any issues during testing:

1. Check browser console (F12 → Console tab)
2. Check Network tab (F12 → Network tab)
3. Review server logs in terminal
4. Check `docs/phases/PHASE_2_WEEK_5_QA_SYSTEM_IMPLEMENTATION.md` for detailed implementation info

---

**Happy Testing! 🎉**

The Q&A system is ready to revolutionize your course discussions!
