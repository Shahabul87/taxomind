# SAM Form Population - Complete Implementation Guide

## Overview
SAM AI Assistant can now populate all major forms in the course editor, even when they're not in edit mode. This guide documents the complete implementation pattern and lists all supported forms.

## Implementation Pattern

### 1. Core Components

Each form requires three key components:

#### A. Event Listener (useEffect)
```typescript
useEffect(() => {
  const handleSamFormPopulation = (event: CustomEvent) => {
    if (event.detail?.formId === 'form-id-here') {
      setIsEditing(true);
      setPendingSamData(event.detail.data);
    }
  };
  window.addEventListener('sam-populate-form', handleSamFormPopulation);
  return () => window.removeEventListener('sam-populate-form', handleSamFormPopulation);
}, []);
```

#### B. Data Handler (useEffect)
```typescript
useEffect(() => {
  if (pendingSamData && isEditing && form) {
    const value = pendingSamData.fieldName;
    if (value) {
      form.setValue("fieldName", value);
      form.trigger("fieldName");
      window.dispatchEvent(new CustomEvent('sam-form-populated', {
        detail: { formId: 'form-id', success: true }
      }));
      setPendingSamData(null);
    }
  }
}, [pendingSamData, isEditing, form]);
```

#### C. Hidden Metadata
```html
<div 
  data-sam-form-metadata="form-type"
  data-form-id="form-id"
  data-form-purpose="purpose"
  data-entity-type="course"
  data-entity-id={courseId}
  data-current-value={currentValue}
  data-field-name="fieldName"
  data-field-type="type"
  style={{ display: 'none' }}
/>
```

## Implemented Forms

### 1. Course Description Form
- **File**: `description-form.tsx`
- **Form IDs**: `course-description-form`, `course-description`, `update-course-description`, `update-description`, `general-form`
- **Field**: `description` (rich text)
- **Special**: Handles TipTap editor population

### 2. Course Title Form
- **File**: `title-form.tsx`
- **Form IDs**: `course-title-form`, `course-title`, `update-course-title`, `update-title`, `title-form`
- **Field**: `title` (text)
- **Data Keys**: `title`, `name`, `courseTitle`

### 3. Learning Objectives Form
- **File**: `what-you-will-learn-form.tsx`
- **Form IDs**: `learning-objectives-form`, `learning-objectives`, `what-you-will-learn-form`, `what-you-will-learn`, `objectives-form`
- **Field**: `whatYouWillLearn` (array)
- **Special**: Handles array of objectives, clears existing before populating

### 4. Course Price Form
- **File**: `price-form.tsx`
- **Form IDs**: `course-price-form`, `price-form`, `update-price`, `course-price`
- **Field**: `price` (number)
- **Data Keys**: `price`, `coursePrice`, `amount`

### 5. Course Category Form
- **File**: `category-form.tsx`
- **Form IDs**: `course-category-form`, `category-form`, `update-category`, `course-category`
- **Field**: `categoryId` (select)
- **Special**: Can create new categories if not found in existing options

## SAM Integration Points

### 1. Enhanced SAM Provider
The provider detects forms using:
- Form element IDs
- Data attributes
- Hidden metadata divs

### 2. Form Population Flow
1. SAM generates content based on context
2. SAM identifies target form from user intent
3. Provider dispatches `sam-populate-form` event
4. Form component receives event and opens edit mode
5. Form populates with SAM's data
6. Success event confirms population

### 3. Form Detection Strategy
SAM can detect forms even when hidden by checking:
```javascript
// Direct form detection
const form = document.getElementById(formId);

// Metadata detection (when form not rendered)
const metadata = document.querySelector(`[data-sam-form-metadata]`);
const formInfo = {
  formId: metadata.getAttribute('data-form-id'),
  currentValue: metadata.getAttribute('data-current-value'),
  isEditing: metadata.getAttribute('data-is-editing')
};
```

## Testing Forms

Use the browser console to test any form:

```javascript
// Test description form
window.dispatchEvent(new CustomEvent('sam-populate-form', {
  detail: {
    formId: 'course-description-form',
    data: {
      description: '<p>This is a test description from SAM.</p>'
    }
  }
}));

// Test title form
window.dispatchEvent(new CustomEvent('sam-populate-form', {
  detail: {
    formId: 'course-title-form',
    data: {
      title: 'Advanced Web Development Masterclass'
    }
  }
}));

// Test learning objectives
window.dispatchEvent(new CustomEvent('sam-populate-form', {
  detail: {
    formId: 'learning-objectives-form',
    data: {
      learningObjectives: [
        'Master React and Next.js',
        'Build production-ready applications',
        'Implement best practices'
      ]
    }
  }
}));

// Test price form
window.dispatchEvent(new CustomEvent('sam-populate-form', {
  detail: {
    formId: 'course-price-form',
    data: {
      price: 49.99
    }
  }
}));

// Test category form
window.dispatchEvent(new CustomEvent('sam-populate-form', {
  detail: {
    formId: 'course-category-form',
    data: {
      categoryId: 'web-development'
    }
  }
}));
```

## Forms Still Needing Implementation

### Chapter Forms
- Chapter title form
- Chapter description form
- Chapter learning outcome form
- Chapter access form

### Section Forms
- Section title form
- Section content form
- Exam/Quiz forms

### Other Forms
- Course image upload
- Attachment forms
- Prerequisites form

## Best Practices

1. **Multiple Form IDs**: Support various form ID patterns SAM might use
2. **Data Key Flexibility**: Check multiple possible data keys
3. **State Management**: Use pending data pattern to handle async form initialization
4. **Error Handling**: Gracefully handle missing or invalid data
5. **User Feedback**: Show success messages and dispatch events
6. **Metadata Richness**: Include comprehensive metadata for SAM detection

## Common Issues and Solutions

### Issue: Form not detected
**Solution**: Add more form ID variations and ensure metadata div is present

### Issue: Data not populating
**Solution**: Check data key mappings and ensure form is in edit mode

### Issue: Rich text not updating
**Solution**: Use proper TipTap event dispatching and value setting

### Issue: Array fields not working
**Solution**: Clear existing items before appending new ones

## Future Enhancements

1. **Batch Updates**: Allow SAM to update multiple forms at once
2. **Validation Feedback**: Return validation errors to SAM
3. **Partial Updates**: Support updating specific fields without clearing others
4. **Auto-save**: Automatically save after SAM population
5. **Undo/Redo**: Track SAM changes for easy reversal