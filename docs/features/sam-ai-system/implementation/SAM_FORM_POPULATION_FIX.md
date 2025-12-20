# SAM Form Population Fix

## Problem
SAM AI Assistant was unable to update the course description form because:
1. The form was only rendered when in edit mode (`isEditing=true`)
2. SAM couldn't detect or populate forms that weren't visible in the DOM
3. The form reference was being used before initialization, causing a ReferenceError

## Solution Implemented

### 1. Fixed Reference Error
- Moved the `form` initialization before the useEffect that references it
- Added a `pendingSamData` state to store data while the form initializes
- Split the logic into two useEffects - one for listening to events, another for applying data

### 2. Enhanced Form Detection
Added comprehensive metadata attributes to help SAM detect the form even when not in edit mode:
```html
<div 
  data-sam-form-metadata="course-description"
  data-form-id="course-description-form"
  data-form-purpose="update-course-description"
  data-form-alternate-id="update-description"
  data-form-type="description"
  data-entity-type="course"
  data-entity-id={courseId}
  data-current-value={initialData?.description || ""}
  data-is-editing={isEditing.toString()}
  data-field-name="description"
  data-field-type="rich-text"
  style={{ display: 'none' }}
/>
```

### 3. Auto-Edit Mode Activation
When SAM attempts to populate the form:
1. Event listener detects multiple form ID variations
2. Automatically switches to edit mode
3. Stores pending data if form isn't ready
4. Applies data once form is initialized

### 4. Event Handling Flow
```javascript
// Listen for SAM form population events
useEffect(() => {
  const handleSamFormPopulation = (event: CustomEvent) => {
    if (/* matches form ID */) {
      setIsEditing(true);  // Open edit mode
      setSamTriggerEdit(true);  // Track SAM trigger
      setPendingSamData(event.detail.data);  // Store data
    }
  };
  // ... event listener setup
}, []);

// Apply pending data when form is ready
useEffect(() => {
  if (pendingSamData && isEditing && form) {
    form.setValue("description", descriptionValue);
    form.trigger("description");
    // Dispatch success event
    setPendingSamData(null);
  }
}, [pendingSamData, isEditing, form]);
```

## Testing
Use the test script in browser console:
```javascript
// Copy contents of scripts/test-sam-form-population.js
```

## Forms That Need Similar Fixes
- [ ] Title form (`title-form.tsx`)
- [ ] Learning objectives form
- [ ] Price form (`price-form.tsx`)
- [ ] Category form (`category-form.tsx`)
- [ ] Chapter title form
- [ ] Chapter description form
- [ ] Section forms

## Key Pattern for Other Forms
1. Add hidden metadata div with form identifiers
2. Create event listener for 'sam-populate-form' event
3. Auto-open edit mode when SAM tries to populate
4. Use pending data state to handle async form initialization
5. Dispatch success event after population

## Benefits
- SAM can now detect and update forms even when not in edit mode
- Better user experience - forms automatically open when SAM needs to update them
- Consistent pattern that can be applied to all forms in the application
- No more "form not found" errors from SAM