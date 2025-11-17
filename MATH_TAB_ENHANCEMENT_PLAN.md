# Math Tab Enhancement Plan
**Adding Code Tab Features to Math Tab**

---

## 📋 Executive Summary

This document outlines the plan to enhance the Math Tab with the same advanced features currently implemented in the Code Tab, providing a consistent and superior user experience across both learning materials.

**Date Created**: November 16, 2025
**Status**: Planning Phase
**Estimated Effort**: 3-4 hours

---

## 🎯 Objectives

Bring the following Code Tab features to the Math Tab:
1. ✅ Button-based explanation display (replace expand/collapse)
2. ✅ Multiple simultaneous explanations visible
3. ✅ Draggable explanation tooltips
4. ✅ Resizable tooltips (vertical & horizontal)
5. ✅ Font size controls (XS, SM, BASE, LG, XL)
6. ✅ Edit functionality with modal dialog
7. ✅ Delete functionality with confirmation
8. ✅ Improved button styling with proper contrast
9. ✅ Rich text editor integration (already exists)

---

## 📊 Current State Analysis

### Current Math Tab Structure

**Files:**
- `MathTab.tsx` - Main tab component
- `MathContentManager.tsx` - Manager component (similar to CodeBlockManager)
- `MathContentList.tsx` - Display component
- `MathContentForm.tsx` - Form for adding equations
- `math-equation-form.tsx` - Legacy form (in _explanations folder)
- `math-equations-list.tsx` - Legacy list component

**Current Features:**
- ✅ Add math equations (LaTeX or visual mode with images)
- ✅ Delete math equations
- ✅ Expand/collapse view (toggle-based)
- ✅ Rich text explanations with TipTap
- ✅ LaTeX rendering with KaTeX
- ✅ Image upload for visual mode

**Current Limitations:**
- ❌ Hover/expand toggle instead of button-based display
- ❌ Only one equation can be expanded at a time
- ❌ No draggable tooltips
- ❌ No resizable explanations
- ❌ No font size controls
- ❌ No edit functionality
- ❌ Basic button styling

---

## 🏗️ Architecture Comparison

### Code Tab Architecture (What We're Copying From)

```
CodeTab
└── CodeBlockManager
    ├── UnifiedCodeView (Display component)
    │   ├── Show Explanation buttons (per block)
    │   ├── Edit buttons (per block)
    │   ├── Delete buttons (per block)
    │   ├── handleShowExplanation()
    │   ├── handleEdit()
    │   ├── handleDelete()
    │   └── CodeBlockEditModal
    └── ExplanationTooltip (Draggable, Resizable)
        ├── Drag functionality
        ├── Resize functionality
        ├── Font size controls
        └── Close button
```

### Math Tab Architecture (Current)

```
MathTab
└── MathContentManager
    ├── MathContentList (Display component)
    │   ├── Expand/collapse toggle
    │   ├── Delete button
    │   └── Static expanded view
    └── MathContentForm (Add new)
```

### Math Tab Architecture (Proposed)

```
MathTab
└── MathContentManager
    ├── UnifiedMathView (NEW - Display component)
    │   ├── Show Explanation buttons (per equation)
    │   ├── Edit buttons (per equation)
    │   ├── Delete buttons (per equation)
    │   ├── handleShowExplanation()
    │   ├── handleEdit()
    │   ├── handleDelete()
    │   └── MathEquationEditModal (NEW)
    ├── MathExplanationTooltip (NEW - Draggable, Resizable)
    │   ├── Drag functionality
    │   ├── Resize functionality
    │   ├── Font size controls
    │   ├── LaTeX/Image rendering
    │   └── Close button
    └── AddMathEquationForm (Existing - refactored)
```

---

## 📝 Implementation Plan

### Phase 1: Create New Components (2 hours)

#### 1.1 Create `UnifiedMathView.tsx`
**Location**: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/UnifiedMathView.tsx`

**Responsibilities**:
- Display all math equations in a unified list
- Show "Show Explanation" button for each equation
- Show Edit and Delete buttons
- Manage multiple simultaneous tooltips (Map-based state)
- Handle tooltip positioning near buttons
- Render LaTeX equations or images based on mode

**Key State**:
```typescript
const [openTooltips, setOpenTooltips] = useState<Map<string, { x: number; y: number }>>(new Map());
const [editingEquation, setEditingEquation] = useState<MathEquation | null>(null);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
```

**Key Functions**:
- `handleShowExplanation(equationId, event)` - Open tooltip at button position
- `handleEdit(equation)` - Open edit modal
- `handleDelete(equationId)` - Delete with API call
- `handleTooltipClose(equationId)` - Close specific tooltip
- `calculateTooltipPosition(buttonElement)` - Smart positioning

#### 1.2 Create `MathExplanationTooltip.tsx`
**Location**: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/MathExplanationTooltip.tsx`

**Features**:
- Draggable with Framer Motion
- Resizable from bottom-right corner
- Font size controls (XS, SM, BASE, LG, XL)
- Mobile-responsive (bottom sheet on mobile)
- Render LaTeX equations with KaTeX
- Display images for visual mode
- Rich text explanation rendering

**Props**:
```typescript
interface MathExplanationTooltipProps {
  equation: MathEquation;
  title: string;
  position: { x: number; y: number };
  onClose: () => void;
}
```

#### 1.3 Create `MathEquationEditModal.tsx`
**Location**: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/MathEquationEditModal.tsx`

**Features**:
- Modal dialog with form
- Title input
- Mode selector (Equation / Visual)
- LaTeX equation textarea OR image upload
- Rich text editor for explanation
- Form validation with Zod
- PATCH API integration

**Form Schema**:
```typescript
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  mode: z.enum(["equation", "visual"]),
  equation: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().optional(),
  explanation: z.string().optional(),
});
```

---

### Phase 2: Update Existing Components (1 hour)

#### 2.1 Update `MathContentManager.tsx`
**Changes**:
- Import `UnifiedMathView` instead of `MathContentList`
- Remove `editingId` state (handled internally now)
- Remove `handleDelete` (handled internally now)
- Keep `handleAdd` for the add form

**Before**:
```typescript
<MathContentList
  items={mathExplanations}
  onEdit={setEditingId}
  onDelete={handleDelete}
  isDeleting={isDeleting}
/>
```

**After**:
```typescript
<UnifiedMathView
  courseId={courseId}
  chapterId={chapterId}
  sectionId={sectionId}
  equations={mathExplanations}
/>
```

#### 2.2 Update Button Styles
Apply the same color-coded button styling from Code Tab:
- **Show Explanation**: Blue gradient → White text on hover
- **Edit**: Amber background → White text on hover
- **Delete**: Red background → White text on hover
- **Copy** (if added): Gray background → White text on hover

---

### Phase 3: API Integration (30 minutes)

#### 3.1 Verify API Endpoints
**PATCH Endpoint** (for edit):
```
/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/math-equations/[equationId]
```

**DELETE Endpoint**:
```
/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/math-equations/[equationId]
```

**Action**: Verify these endpoints exist and support the required operations.

#### 3.2 API Response Handling
- Success toast notifications
- Error handling with user-friendly messages
- Optimistic UI updates
- Router refresh after mutations

---

### Phase 4: Testing & Polish (30 minutes)

#### 4.1 Functional Testing
- ✅ Show explanation opens tooltip at button position
- ✅ Multiple tooltips can be open simultaneously
- ✅ Tooltips are draggable
- ✅ Tooltips are resizable
- ✅ Font size controls work
- ✅ Edit modal opens with correct data
- ✅ Edit saves changes correctly
- ✅ Delete shows confirmation
- ✅ Delete removes equation

#### 4.2 Visual Testing
- ✅ Button contrast is good in light/dark mode
- ✅ LaTeX equations render correctly in tooltips
- ✅ Images display properly in visual mode
- ✅ Tooltips stay within viewport boundaries
- ✅ Mobile bottom sheet works correctly
- ✅ Animations are smooth

#### 4.3 Edge Cases
- ✅ Handle equations with no explanation
- ✅ Handle very long equations
- ✅ Handle large images
- ✅ Handle tooltip overflow on small screens
- ✅ Handle simultaneous edit/delete operations

---

## 🔧 Technical Implementation Details

### Data Structure

**MathEquation Interface**:
```typescript
interface MathEquation {
  id: string;
  heading: string;
  code: string;  // JSON string for visual mode or LaTeX string
  explanation: string;  // HTML from TipTap
  createdAt: string;
  mode?: "equation" | "visual";
}
```

**Visual Mode Data** (stored in `code` field):
```json
{
  "isMathEquation": true,
  "mode": "visual",
  "imageUrl": "https://...",
  "content": "<p>Rich text content</p>"
}
```

### Component Hierarchy

```
UnifiedMathView
├── Header (title, stats, toggle button)
├── MathEquation blocks (map)
│   ├── Block Header
│   │   ├── Title + mode badge
│   │   └── Action buttons
│   │       ├── Show Explanation
│   │       ├── Copy (optional)
│   │       ├── Edit
│   │       └── Delete
│   └── LaTeX/Image preview (collapsed)
└── Multiple MathExplanationTooltips (Array.from map)
    └── Each with independent state
```

---

## 📦 File Changes Summary

### New Files (Create)
1. `UnifiedMathView.tsx` (~500 lines)
2. `MathExplanationTooltip.tsx` (~350 lines)
3. `MathEquationEditModal.tsx` (~300 lines)

### Modified Files
1. `MathContentManager.tsx` - Replace list with unified view
2. `MathTab.tsx` - No changes needed (passes through)

### Deprecated Files (Keep for reference)
1. `MathContentList.tsx` - Can be deleted after migration
2. `math-equations-list.tsx` - Legacy component

---

## 🎨 UI/UX Improvements

### Button Design
```typescript
// Show Explanation Button
className="bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white"

// Edit Button
className="bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white"

// Delete Button
className="bg-red-100 text-red-700 hover:bg-red-600 hover:text-white"

// Active State (Explanation Shown)
className="bg-emerald-600 text-white hover:bg-emerald-700"
```

### Tooltip Design
- **Desktop**: Fixed position, draggable, resizable
- **Mobile**: Bottom sheet, swipe to dismiss
- **Min Size**: 300x200px
- **Max Size**: 90vw x 80vh
- **Default Size**: 384x400px

---

## ✅ Success Criteria

### Functional Requirements
- [ ] Button-based explanation display works
- [ ] Multiple explanations can be shown simultaneously
- [ ] Tooltips are draggable
- [ ] Tooltips are resizable
- [ ] Font size controls work (5 levels)
- [ ] Edit modal opens and saves correctly
- [ ] Delete confirmation works
- [ ] LaTeX equations render in tooltips
- [ ] Images display in visual mode tooltips

### Non-Functional Requirements
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds
- [ ] No console errors
- [ ] Smooth 60fps animations
- [ ] Responsive on all screen sizes
- [ ] Works in light and dark mode

---

## 🚀 Migration Strategy

### Step 1: Feature Flag (Optional)
Create a feature flag to toggle between old and new UI:
```typescript
const USE_UNIFIED_VIEW = true;
```

### Step 2: Parallel Development
Build new components without removing old ones initially.

### Step 3: A/B Testing
Test both versions with real users if needed.

### Step 4: Full Migration
Once validated, remove old components and feature flags.

---

## 📚 References

### Code Tab Implementation
- `UnifiedCodeView.tsx` - Main reference for structure
- `ExplanationTooltip.tsx` - Reference for tooltip features
- `CodeBlockEditModal.tsx` - Reference for edit modal

### Libraries Used
- **Framer Motion**: Drag and animations
- **react-katex**: LaTeX rendering
- **TipTap**: Rich text editor
- **Zod**: Form validation
- **React Hook Form**: Form management

---

## ⚠️ Risks & Mitigation

### Risk 1: LaTeX Rendering Performance
**Mitigation**: Only render LaTeX in visible tooltips, not in list view.

### Risk 2: Large Image Loading
**Mitigation**: Use Next.js Image component with proper loading states.

### Risk 3: State Management Complexity
**Mitigation**: Use Map for tooltips (same as Code Tab), well-tested pattern.

### Risk 4: Mobile UX
**Mitigation**: Use bottom sheet pattern for mobile, tested in Code Tab.

---

## 📈 Future Enhancements (Post-MVP)

1. **Copy to Clipboard**: Add copy button for LaTeX equations
2. **Export**: Export equations as images or PDF
3. **Templates**: Quick insert common equation templates
4. **Collaborative Editing**: Real-time collaborative editing
5. **Version History**: Track changes to equations
6. **LaTeX Preview**: Live preview while editing LaTeX
7. **Equation Library**: Save frequently used equations
8. **Search**: Search through equations and explanations

---

## 📞 Support & Questions

**Created by**: Claude Code Assistant
**Date**: November 16, 2025
**Version**: 1.0

For questions or clarifications, refer to:
- Code Tab implementation in `_components/code/`
- Framer Motion docs: https://www.framer.com/motion/
- KaTeX docs: https://katex.org/

---

**Ready to implement? Start with Phase 1.1: Create UnifiedMathView.tsx**
