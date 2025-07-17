# Enhanced SAM AI Assistant - Integration Guide

## 🎯 Overview

This guide explains how to integrate the **Enhanced SAM AI Assistant** with deep contextual awareness into your Taxomind LMS teacher pages. The enhanced version provides:

- **Deep Form Understanding**: Sees form values, validation states, and field metadata
- **Server-Side Data Access**: Knows about courses, chapters, user permissions
- **Workflow Awareness**: Understands multi-step processes and guides users
- **Intelligent Actions**: Can populate forms, validate data, and execute page actions

## 🚀 Quick Start

### 1. Update Teacher Layout

Replace the existing SAM provider in your teacher layout with the enhanced version:

```tsx
// app/(protected)/teacher/layout.tsx
import { EnhancedSamProvider } from './_components/enhanced-sam-provider';
import { EnhancedSamAssistant } from './_components/enhanced-sam-assistant';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnhancedSamProvider>
      <div className="h-full">
        <Navbar />
        <main className="h-full pt-[80px]">
          {children}
        </main>
        <EnhancedSamAssistant />
      </div>
    </EnhancedSamProvider>
  );
}
```

### 2. Add Context to Your Pages

For pages with server-side data, inject context using the integration component:

```tsx
// app/(protected)/teacher/courses/[courseId]/page.tsx
import { CoursePageSamIntegration } from './_components/course-page-sam-integration';

export default async function CourseIdPage({ params }) {
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: { chapters: true, attachments: true }
  });

  return (
    <>
      {/* Inject SAM context */}
      <CoursePageSamIntegration
        course={course}
        chapters={course.chapters}
        categories={categories}
        completionStatus={completionStatus}
      />
      
      {/* Your existing page content */}
      <div className="p-6">
        {/* ... */}
      </div>
    </>
  );
}
```

## 📋 Form Integration

### Making Forms SAM-Aware

Add metadata attributes to your forms for better context understanding:

```tsx
// Example: Title Form
<form 
  id="title-form"
  data-form="title-form"
  data-purpose="update-course-title"
  data-entity-type="course"
  data-entity-id={courseId}
>
  <Input
    name="title"
    data-field-type="course-title"
    data-validation="required,min:3,max:100"
    placeholder="e.g. 'Advanced Web Development'"
  />
</form>
```

### Form Field Metadata

Add these attributes to help SAM understand your forms:

- `data-purpose`: What the form does (e.g., "update-title", "create-chapter")
- `data-field-type`: Type of content (e.g., "markdown", "bloom-taxonomy")
- `data-validation`: Validation rules
- `data-related-to`: Related entity ID

## 🔧 Advanced Integration

### 1. Custom Page Context Hook

For complex pages, use the page context hook:

```tsx
// In your page component
import { usePageSamContext } from '@/app/(protected)/teacher/_components/use-page-sam-context';

function MyComplexPage({ data }) {
  const { updateContext, refreshSam } = usePageSamContext({
    entityType: 'course',
    entityId: data.id,
    entityData: data,
    relatedData: {
      children: data.chapters,
      stats: {
        enrollments: data.enrollmentCount,
        completion: data.completionRate
      }
    },
    permissions: {
      canEdit: true,
      canPublish: data.status === 'draft'
    },
    workflow: {
      steps: ['Step 1', 'Step 2', 'Step 3'],
      currentStep: 1,
      completedSteps: ['Step 1']
    },
    capabilities: [
      'generate-content',
      'analyze-data',
      'suggest-improvements'
    ]
  });

  // Update context when data changes
  useEffect(() => {
    updateContext({ entityData: data });
  }, [data]);
}
```

### 2. Direct Context Injection

For immediate context updates:

```tsx
// Anywhere in your component
useEffect(() => {
  if ((window as any).enhancedSam) {
    (window as any).enhancedSam.injectContext({
      serverData: {
        entityType: 'chapter',
        entityId: chapterId,
        entityData: chapterData
      }
    });
  }
}, [chapterData]);
```

### 3. Custom SAM Queries

Handle SAM queries for page-specific information:

```tsx
useEffect(() => {
  const handleSamQuery = (event: CustomEvent) => {
    const { query, callback } = event.detail;
    
    if (query === 'get-course-modules') {
      callback({
        modules: chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          completed: ch.isPublished
        }))
      });
    }
  };
  
  window.addEventListener('sam-query', handleSamQuery);
  return () => window.removeEventListener('sam-query', handleSamQuery);
}, [chapters]);
```

## 🎨 UI Customization

### Custom Welcome Messages

Override the default welcome message:

```tsx
useEffect(() => {
  window.dispatchEvent(new CustomEvent('sam-welcome-override', {
    detail: {
      title: 'Welcome to Course Builder!',
      message: 'I can help you create an amazing course.',
      suggestions: ['Create course outline', 'Generate chapter ideas']
    }
  }));
}, []);
```

### Custom Actions

Add page-specific actions:

```tsx
const customActions = [
  {
    id: 'generate-quiz',
    label: 'Generate Quiz Questions',
    type: 'custom',
    enabled: true,
    handler: async () => {
      // Your custom logic
    }
  }
];

// Inject into SAM
(window as any).enhancedSam?.injectContext({
  availableActions: customActions
});
```

## 📊 Example Integrations

### 1. Course Creation Page

```tsx
// Simple integration for create page
useEffect(() => {
  (window as any).enhancedSam?.injectContext({
    workflow: {
      steps: [
        'Choose course topic',
        'Set target audience',
        'Create outline',
        'Add content'
      ],
      currentStep: 0,
      nextAction: 'choose-topic'
    },
    metadata: {
      capabilities: ['ai-course-generation', 'template-selection']
    }
  });
}, []);
```

### 2. Analytics Page

```tsx
// Analytics page with data context
usePageSamContext({
  entityType: 'analytics',
  entityData: {
    totalStudents: analytics.students,
    avgCompletion: analytics.completionRate,
    revenue: analytics.revenue
  },
  capabilities: [
    'analyze-trends',
    'generate-insights',
    'export-data'
  ]
});
```

### 3. Chapter Editor

```tsx
// Rich editor integration
<div 
  className="tiptap-editor"
  data-field="content"
  data-content-type="markdown"
  data-purpose="chapter-content"
  data-sam-enhanced="true"
>
  <Editor />
</div>
```

## 🔍 Debugging

### Check SAM Context

Open browser console and run:
```javascript
window.enhancedSam.getPageData()
```

### Monitor Context Updates

```javascript
window.addEventListener('sam-context-update', (e) => {
  console.log('SAM Context Updated:', e.detail);
});
```

### Test Form Detection

```javascript
// See what forms SAM can detect
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  console.log('Form:', form.id, form.getAttribute('data-purpose'));
});
```

## ✅ Best Practices

1. **Always add form metadata** - Use data attributes to help SAM understand forms
2. **Inject server data early** - Add context in useEffect or component mount
3. **Use semantic IDs** - Give forms and components meaningful IDs
4. **Validate before submit** - SAM validates but double-check critical operations
5. **Test context injection** - Verify SAM receives your page data

## 🚨 Common Issues

### SAM doesn't see my forms
- Ensure forms have `id` or `data-form` attributes
- Add `data-purpose` to describe what the form does
- Check forms are rendered when SAM initializes

### Server data not available
- Inject context after data is loaded
- Use the integration component pattern
- Check for race conditions in useEffect

### Actions not working
- Verify action handlers are defined
- Check permissions in context
- Ensure elements have proper selectors

## 🎉 Result

With enhanced SAM integration, your users will experience:
- **Intelligent form filling** with context-aware suggestions
- **Guided workflows** that understand their progress
- **Smart actions** that work with actual page data
- **Deep understanding** of page structure and purpose

The enhanced SAM AI assistant transforms from a simple chatbot into a truly intelligent assistant that understands not just the page structure, but the user's intent and workflow state.