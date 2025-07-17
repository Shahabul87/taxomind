# Enhanced SAM - Troubleshooting Guide

## 🚨 Common Migration Issues

### Issue: "useUniversalSam must be used within UniversalSamProvider"

**Cause**: Some components are still using the old `useUniversalSam` hook
**Solution**: Update imports to use Enhanced SAM

```tsx
// ❌ Old (causes error)
import { useUniversalSam } from '../_components/universal-sam-provider';

// ✅ New (correct)
import { useEnhancedSam } from '../_components/enhanced-sam-provider';
```

**Files Fixed**:
- ✅ `chapter-sam-integration.tsx` - Updated to use Enhanced SAM

---

### Issue: "Cannot read property 'forms' of undefined"

**Cause**: Enhanced SAM context not loaded yet
**Solution**: Check `isReady` before accessing pageData

```tsx
const { pageData, isReady } = useEnhancedSam();

if (!isReady) {
  return <div>Loading...</div>;
}
```

---

### Issue: "injectPageContext is not a function"

**Cause**: Using old SAM provider
**Solution**: Ensure layout is using Enhanced SAM

```tsx
// In teacher/layout.tsx
import { EnhancedSamProvider } from './_components/enhanced-sam-provider';
import { EnhancedSamAssistant } from './_components/enhanced-sam-assistant';
```

---

## 🔍 How to Find Issues

### 1. Search for old imports
```bash
# Find files still using Universal SAM
grep -r "useUniversalSam" app/
grep -r "from.*universal-sam-provider" app/
```

### 2. Check browser console
```javascript
// Should show enhanced SAM
console.log(window.enhancedSam);

// Should be undefined (old system)
console.log(window.universalSamFunctions);
```

### 3. Verify context injection
```javascript
// In browser console
window.enhancedSam.getPageData()
```

---

## 🛠️ Migration Checklist

### For Each Page Component:

1. **Update imports**
   ```tsx
   // Change this
   import { useUniversalSam } from '...universal-sam-provider';
   
   // To this
   import { useEnhancedSam } from '...enhanced-sam-provider';
   ```

2. **Update hook usage**
   ```tsx
   // Old
   const { refreshPageData } = useUniversalSam();
   
   // New
   const { refreshPageData, injectPageContext } = useEnhancedSam();
   ```

3. **Add context injection**
   ```tsx
   useEffect(() => {
     injectPageContext({
       serverData: {
         entityType: 'your-entity-type',
         entityData: yourData
       }
     });
   }, [yourData]);
   ```

---

## 📋 Component Status

| Component | Status | Notes |
|-----------|---------|-------|
| teacher/layout.tsx | ✅ Migrated | Using Enhanced SAM |
| course page | ✅ Migrated | Full context injection |
| chapter-sam-integration | ✅ Fixed | Was causing error |
| Other pages | ⏳ Basic | Work without context |

---

## 🚀 Quick Fixes

### Temporary Fix (if urgent)
```tsx
// Add this check to problematic components
if (typeof window !== 'undefined' && !window.enhancedSam) {
  return null; // Skip rendering if Enhanced SAM not ready
}
```

### Rollback (if needed)
```tsx
// In teacher/layout.tsx, revert to:
import { UniversalSamProvider } from './_components/universal-sam-provider';
import { UniversalSamAssistant } from './_components/universal-sam-assistant';
```

---

## 🔧 Environment Variables

No environment variables needed for Enhanced SAM. It uses the same Anthropic client configuration as the existing system.

---

## 📞 Debug Commands

```javascript
// Check if Enhanced SAM is loaded
window.enhancedSam ? 'Enhanced SAM Active' : 'Not Loaded'

// Get current page context
window.enhancedSam?.getPageData()

// Manually refresh context
window.enhancedSam?.refreshData()

// Check for old system (should be undefined)
window.universalSamFunctions
```

---

*Last Updated: January 2025*