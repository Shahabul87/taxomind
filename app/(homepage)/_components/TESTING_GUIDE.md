# Responsive Header Testing Guide

## Quick Testing Steps

### Using Browser DevTools

1. **Open your app** in a browser
2. **Open DevTools** (F12 or Cmd+Opt+I)
3. **Click the device toolbar** button (Cmd+Shift+M or Ctrl+Shift+M)
4. **Select "Responsive"** from the device dropdown
5. **Test each breakpoint** by manually entering widths

### Breakpoints to Test

#### 1. Mobile (< 768px)
```
Test Widths: 320px, 375px, 414px, 480px, 600px, 767px
Expected: MobileMiniHeader
- Ultra-compact header (52px height)
- Logo on left
- Search, notification, menu buttons on right
- Slide-out menu when clicking hamburger
- Works for BOTH portrait and landscape orientations
```

#### 2. Tablet (768px - 1023px)
```
Test Widths: 768px, 900px, 1023px
Expected: TabletHeader
- Standard header (64px)
- Full navigation visible
- AI Features mega menu present
- No mobile menu button
```

#### 3. Laptop (1024px - 1279px)
```
Test Widths: 1024px, 1200px, 1279px
Expected: LaptopHeader
- Standard header (64px)
- Compact navigation layout
- No text wrapping
- AI Features mega menu present
```

#### 4. Desktop (≥ 1280px)
```
Test Widths: 1280px, 1440px, 1920px, 2560px
Expected: MainHeader
- Full desktop header (64px)
- Rich mega menus
- Maximum spacing
- NO mobile menu code/button
```

## What to Verify

### Visual Checks
- [ ] Header height remains consistent within each breakpoint
- [ ] No layout shift when resizing between breakpoints
- [ ] Logo renders correctly at all sizes
- [ ] Navigation items don't wrap or overflow
- [ ] Buttons are properly aligned
- [ ] Theme toggle works at all breakpoints
- [ ] Dark mode looks good on all headers

### Functional Checks
- [ ] Search button opens search overlay
- [ ] Notifications popover works (if authenticated)
- [ ] Messages popover works (if authenticated)
- [ ] User menu works (if authenticated)
- [ ] Login/Sign Up buttons work (if not authenticated)
- [ ] Mobile menu slides out smoothly (mobile/landscape only)
- [ ] AI Features menu works (tablet+)
- [ ] Navigation links go to correct pages
- [ ] Theme toggle switches properly

### Transition Checks
- [ ] Resize from 320px to 2560px - smooth transitions
- [ ] No flashing or content jumping
- [ ] Correct header at each breakpoint boundary:
  - 767px → 768px (Mobile to Tablet)
  - 1023px → 1024px (Tablet to Laptop)
  - 1279px → 1280px (Laptop to Desktop)

### Performance Checks
- [ ] Resize is smooth (no lag)
- [ ] No console errors
- [ ] No memory leaks on repeated resizing
- [ ] Animations run at 60fps

## Common Issues & Fixes

### Issue: Wrong header showing
**Fix:** Clear browser cache, hard refresh (Cmd+Shift+R)

### Issue: Header jumping on resize
**Fix:** Check that all headers have fixed heights

### Issue: Mobile menu button visible on desktop
**Fix:** Verify MainHeader is rendering (≥1280px) and mobile menu code was removed

### Issue: Navigation items wrapping
**Fix:** Verify LaptopHeader has `whitespace-nowrap` on nav items

## Testing on Real Devices

### Mobile Testing
- iPhone SE (320px width)
- iPhone 12/13/14 (390px width)
- iPhone 12/13 Pro Max (428px width)
- Rotate to landscape and verify landscape header

### Tablet Testing
- iPad Mini (768px portrait)
- iPad Air (820px portrait)
- iPad Pro (1024px portrait, 1366px landscape)

### Desktop Testing
- 13" MacBook (1280px/1440px)
- 15" MacBook Pro (1440px/1680px)
- External monitor (1920px+)
- 4K display (3840px) - Should use MainHeader

## Automated Testing Commands

```bash
# Run development server
npm run dev

# Open in browser at different viewports
# Chrome DevTools > Device Toolbar > Responsive
# Manually test each width mentioned above

# Check for console errors
# Open Console tab and resize - should be clean
```

## Checklist Summary

```
Mobile (< 768px)
  ✓ 320px - MobileMiniHeader renders
  ✓ 375px - MobileMiniHeader renders
  ✓ 414px - MobileMiniHeader renders
  ✓ 480px - MobileMiniHeader renders (landscape)
  ✓ 600px - MobileMiniHeader renders
  ✓ 767px - MobileMiniHeader renders
  ✓ Slide-out menu works
  ✓ 52px height consistent

Tablet (768-1023px)
  ✓ 768px - TabletHeader renders
  ✓ 900px - TabletHeader renders
  ✓ 1023px - TabletHeader renders
  ✓ Mega menu works
  ✓ 64px height consistent

Laptop (1024-1279px)
  ✓ 1024px - LaptopHeader renders
  ✓ 1200px - LaptopHeader renders
  ✓ 1279px - LaptopHeader renders
  ✓ No wrapping
  ✓ 64px height consistent

Desktop (≥ 1280px)
  ✓ 1280px - MainHeader renders
  ✓ 1920px - MainHeader renders
  ✓ 2560px - MainHeader renders
  ✓ Rich mega menus work
  ✓ NO mobile menu button
  ✓ 64px height consistent

Cross-breakpoint
  ✓ Smooth transitions at boundaries
  ✓ No layout shift
  ✓ Theme toggle works everywhere
  ✓ Auth state consistent
  ✓ No console errors
```

## Report Issues

If you find any issues during testing:

1. Note the screen width where issue occurs
2. Screenshot the problem
3. Check browser console for errors
4. Document steps to reproduce
5. Check if issue exists at other breakpoints

---

**Last Updated:** October 23, 2025

