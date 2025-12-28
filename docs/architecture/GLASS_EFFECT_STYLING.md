# Glass Effect Styling Guide

This document contains the elegant glass effect styling used in the Cognitive Analytics dashboard components.

## 🎨 Core Glass Effect Styles

### Main Container (Large sections)
```css
bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8
```

### Card Components (Medium containers)
```css
bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300
```

### Detailed Cards (With enhanced interactivity)
```css
bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300
```

### Metric Cards (Individual metric containers)
```css
group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300
```

## 🔧 Style Breakdown

### Background Colors
- **Light mode**: `bg-white/80` (white with 80% opacity)
- **Dark mode**: `bg-slate-800/80` (slate-800 with 80% opacity)
- **Effect**: Creates semi-transparent glass appearance

### Backdrop Effects
- **Blur**: `backdrop-blur-sm` creates the frosted glass effect
- **Purpose**: Blurs content behind the element for depth

### Borders
- **Standard**: `border-slate-200 dark:border-slate-700` (solid borders)
- **Subtle**: `border-slate-200/50 dark:border-slate-700/50` (50% opacity for softer appearance)
- **Color**: Light gray in light mode, darker gray in dark mode

### Border Radius
- **Large containers**: `rounded-3xl` (very rounded corners)
- **Medium containers**: `rounded-2xl` (moderately rounded corners)
- **Purpose**: Modern, soft appearance

### Shadows
- **Deep shadow**: `shadow-lg` (for main containers)
- **Light shadow**: `shadow-sm` (for cards)
- **Hover effect**: `hover:shadow-md` or `hover:shadow-lg` (increases depth on interaction)

### Transitions
- **Universal**: `transition-all duration-300`
- **Purpose**: Smooth animations for all property changes

## 📱 Responsive Considerations

### Grid Layouts
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

### Padding/Spacing
- **Main containers**: `p-8` (2rem padding)
- **Cards**: `p-6` (1.5rem padding)
- **Sections**: `space-y-6` (1.5rem vertical spacing)

## 🌓 Dark Mode Support

All styles include comprehensive dark mode variants:
- `dark:bg-slate-800/80` - Dark background
- `dark:border-slate-700/50` - Dark borders
- `dark:text-white` - Dark mode text colors

## 🎯 Usage Examples

### Cognitive Development Analysis Section
```jsx
<div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8">
  {/* Content */}
</div>
```

### Individual Metric Cards
```jsx
<Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300">
  {/* Card content */}
</Card>
```

### Interactive Elements
```jsx
<motion.div className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all duration-300">
  {/* Interactive content */}
</motion.div>
```

## 🎨 Color Palette

### Background Colors
- **Primary**: `white/80` and `slate-800/80`
- **Accent**: Semi-transparent overlays

### Border Colors
- **Light mode**: `slate-200` and `slate-200/50`
- **Dark mode**: `slate-700` and `slate-700/50`

### Text Colors
- **Primary**: `slate-900` (light) / `white` (dark)
- **Secondary**: `slate-600` (light) / `slate-400` (dark)
- **Muted**: `slate-500` (light) / `slate-500` (dark)

## 🚀 Implementation Notes

### Key Features
1. **Glass Morphism**: Semi-transparent backgrounds with backdrop blur
2. **Layered Shadows**: Progressive shadow depth for visual hierarchy
3. **Rounded Design**: Modern, soft appearance with varying border radius
4. **Subtle Borders**: Low-opacity borders for subtle definition
5. **Smooth Interactions**: Hover effects with smooth transitions
6. **Full Dark Mode**: Complete dark/light theme compatibility

### Best Practices
1. Always include both light and dark mode variants
2. Use consistent padding and spacing across components
3. Apply hover effects for interactive elements
4. Maintain visual hierarchy with different shadow depths
5. Use backdrop-blur for the glass effect
6. Include smooth transitions for all interactive states

## 📁 Applied To Components

### Current Implementation
- ✅ Cognitive Development Analysis (`CognitiveAnalytics.tsx`)
- ✅ Strengths & Gaps Analysis (`StrengthWeaknessAnalysis.tsx`)
- ✅ Interactive Cognitive Mind Map (tooltips)
- ✅ AI Insights Tab sections

### Component Files
- `/components/analytics/CognitiveAnalytics.tsx`
- `/components/analytics/StrengthWeaknessAnalysis.tsx`
- `/components/analytics/CognitiveMindMap.tsx`
- `/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics.tsx`

---

*This styling creates a modern, elegant glass effect that enhances the user experience with sophisticated visual depth and clarity.*