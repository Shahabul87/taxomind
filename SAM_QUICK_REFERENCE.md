# SAM AI Assistant - Quick Reference Guide

## 🚀 Quick Start Checklist

### ✅ What's Already Working (Existing SAM)
- [x] Available on ALL teacher pages automatically
- [x] Detects forms and buttons
- [x] Can populate form fields
- [x] Generates learning objectives
- [x] Basic navigation help
- [x] No setup required

### 🆕 What's New (Enhanced SAM)
- [ ] Sees actual form values in real-time
- [ ] Knows server-side data (courses, chapters, etc.)
- [ ] Validates forms before submission
- [ ] Tracks workflow progress
- [ ] Permission-aware actions
- [ ] Deep contextual understanding

---

## 📍 Current SAM Locations

### Components
```
app/(protected)/teacher/_components/
├── universal-sam-provider.tsx          # Existing provider
├── universal-sam-assistant.tsx         # Existing UI
├── enhanced-sam-provider.tsx          # NEW: Enhanced provider
├── enhanced-sam-assistant.tsx         # NEW: Enhanced UI
└── use-page-sam-context.tsx          # NEW: Context hook
```

### API Routes
```
app/api/sam/
├── universal-assistant/route.ts        # Existing API
├── enhanced-universal-assistant/route.ts # NEW: Enhanced API
├── context-aware-assistant/route.ts    # Alternative endpoint
├── learning-objectives/route.ts        # Specific features
└── course-assistant/route.ts          # Course-specific
```

---

## 🔧 Quick Integration

### Option 1: Keep Existing SAM (No Changes Needed)
```tsx
// Already in teacher/layout.tsx
<UniversalSamProvider>
  {children}
  <UniversalSamAssistant />
</UniversalSamProvider>
```

### Option 2: Upgrade to Enhanced SAM
```tsx
// 1. Update teacher/layout.tsx
import { EnhancedSamProvider } from './_components/enhanced-sam-provider';
import { EnhancedSamAssistant } from './_components/enhanced-sam-assistant';

// 2. Add to any page that needs context
import { usePageSamContext } from '@/app/(protected)/teacher/_components/use-page-sam-context';

// 3. In your component
usePageSamContext({
  entityType: 'course',
  entityId: course.id,
  entityData: course
});
```

---

## 💬 Common SAM Commands

### Existing SAM Can Handle
- "Fill the title form"
- "Generate learning objectives"
- "Show me all forms"
- "Navigate to analytics"
- "What can I do here?"

### Enhanced SAM Can Also Handle
- "Generate objectives for [actual course name]"
- "Why can't I publish this course?"
- "What's my next step?"
- "Fill all required fields"
- "Validate this form"

---

## 🏷️ Form Metadata Attributes

### Basic (Existing SAM)
```html
<form id="title-form">
  <input name="title" placeholder="Course title" />
</form>
```

### Enhanced (For Better Context)
```html
<form 
  id="title-form"
  data-purpose="update-course-title"
  data-entity-type="course"
  data-entity-id="course-123"
>
  <input 
    name="title"
    data-field-purpose="course-title"
    data-validation="required,min:3"
  />
</form>
```

---

## 🔍 Debugging Tips

### Check Existing SAM
```javascript
// Browser console
window.universalSamFunctions.pageData
```

### Check Enhanced SAM
```javascript
// Browser console
window.enhancedSam.getPageData()
```

### Test Form Detection
```javascript
// See what SAM detects
document.querySelectorAll('form').forEach(f => 
  console.log(f.id, f.getAttribute('data-purpose'))
)
```

---

## ⚡ Performance Notes

### Existing SAM
- Refreshes every 5 seconds
- Minimal performance impact
- Works with dynamic content

### Enhanced SAM
- Refreshes every 500ms (configurable)
- Listens to custom events
- Slightly higher memory usage
- Better for complex pages

---

## 🎯 When to Use What

| Scenario | Use Existing | Use Enhanced |
|----------|--------------|--------------|
| Simple forms | ✅ | Optional |
| Need form values | ❌ | ✅ |
| Multi-step process | ❌ | ✅ |
| Need permissions | ❌ | ✅ |
| Basic assistance | ✅ | ✅ |
| Complex workflows | ❌ | ✅ |

---

## 📝 Quick Examples

### Make Any Form SAM-Aware
```tsx
// Minimum requirement
<form id="my-form">

// Better
<form id="my-form" data-purpose="create-chapter">

// Best
<form 
  id="my-form" 
  data-purpose="create-chapter"
  data-entity-type="course"
  data-entity-id={courseId}
>
```

### Inject Context (Enhanced Only)
```tsx
// Quick injection
useEffect(() => {
  (window as any).enhancedSam?.injectContext({
    serverData: { entityType: 'course', entityData: course }
  });
}, [course]);
```

### Custom SAM Query
```tsx
// Handle SAM questions
window.addEventListener('sam-query', (e) => {
  if (e.detail.query === 'get-stats') {
    e.detail.callback({ students: 100, revenue: 5000 });
  }
});
```

---

## 🚨 Common Issues & Fixes

### "SAM doesn't see my form"
```tsx
// Fix: Add an ID
<form id="unique-form-id">

// Or data-form
<form data-form="my-form">
```

### "SAM can't fill rich text editor"
```tsx
// Fix: Add wrapper attributes
<div 
  className="tiptap-editor"
  data-field="content"
  data-tiptap="true"
>
  <Editor />
</div>
```

### "SAM doesn't know my data"
```tsx
// Fix: Inject context (Enhanced SAM)
usePageSamContext({
  entityType: 'course',
  entityData: yourData
});
```

---

## 📞 Getting Help

1. Check browser console for errors
2. Verify SAM is loaded: `window.universalSamFunctions` or `window.enhancedSam`
3. Check the full guides:
   - [SAM_IMPLEMENTATION_COMPLETE_GUIDE.md](./SAM_IMPLEMENTATION_COMPLETE_GUIDE.md)
   - [ENHANCED_SAM_INTEGRATION_GUIDE.md](./ENHANCED_SAM_INTEGRATION_GUIDE.md)

---

*Quick Reference v1.0 - January 2025*