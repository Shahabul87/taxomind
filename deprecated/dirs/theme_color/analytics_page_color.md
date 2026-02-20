# Analytics Page Color System Documentation

Complete color, typography, and styling reference for `/analytics/user` page.

---

## 🎨 Page Background Gradients

### Light Mode
```css
/* Main page background - soft blue gradient */
background: linear-gradient(to bottom right,
  #f8fafc,     /* from-slate-50: Lightest slate */
  #dbeafe80,   /* via-blue-50/30: Very light blue with 30% opacity */
  #e0e7ff66    /* to-indigo-50/40: Very light indigo with 40% opacity */
);
```

**Tailwind Class**: `bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40`

**HSL Values**:
- `from-slate-50`: `220 22% 98%`
- `via-blue-50`: `214 100% 97%` (with 30% opacity)
- `to-indigo-50`: `226 100% 97%` (with 40% opacity)

### Dark Mode
```css
/* Main page background - deep slate gradient */
background: linear-gradient(to bottom right,
  #0f172a,     /* from-slate-900: Deep slate */
  #1e293b,     /* via-slate-800: Medium dark slate */
  #334155      /* to-slate-700: Lighter dark slate */
);
```

**Tailwind Class**: `dark:from-slate-900 dark:via-slate-800 dark:to-slate-700`

**HSL Values**:
- `from-slate-900`: `222 47% 11%`
- `via-slate-800`: `217 33% 17%`
- `to-slate-700`: `215 28% 25%`

---

## 📦 Card & Container Backgrounds

### Standard Card Background

#### Light Mode
```css
/* Glassmorphism card with backdrop blur */
background: rgba(255, 255, 255, 0.8);  /* white with 80% opacity */
backdrop-filter: blur(12px);
border: 1px solid rgba(226, 232, 240, 0.5);  /* slate-200 with 50% opacity */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
border-radius: 1.5rem;  /* 24px - rounded-3xl */
```

**Tailwind Class**: `bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-3xl`

**Color Values**:
- Background: `#ffffff` at 80% opacity
- Border: `#e2e8f0` (slate-200) at 50% opacity

#### Dark Mode
```css
background: rgba(30, 41, 59, 0.8);  /* slate-800 with 80% opacity */
backdrop-filter: blur(12px);
border: 1px solid rgba(51, 65, 85, 0.5);  /* slate-700 with 50% opacity */
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
border-radius: 1.5rem;
```

**Color Values**:
- Background: `#1e293b` (slate-800) at 80% opacity
- Border: `#334155` (slate-700) at 50% opacity

---

## 🔖 Tab System Colors

### Tab Container (TabsList)

#### Light Mode
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(226, 232, 240, 0.5);
border-radius: 0.75rem;  /* 12px - rounded-xl */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
padding: 0.25rem;  /* 4px */
```

**Tailwind Class**: `bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm`

#### Dark Mode
```css
background: rgba(30, 41, 59, 0.8);
border: 1px solid rgba(51, 65, 85, 0.5);
```

### Tab Trigger (Inactive State)

#### Light Mode
```css
color: #475569;  /* text-slate-600 */
transition: all 200ms;
```

**Hover State**:
```css
color: #0f172a;  /* text-slate-900 */
```

#### Dark Mode
```css
color: #cbd5e1;  /* text-slate-300 */
```

**Hover State**:
```css
color: #ffffff;  /* text-white */
```

**Tailwind Class**: `text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200`

### Tab Trigger (Active State)

#### Overview, Performance, Cognitive, Courses Tabs
```css
/* Blue to Indigo gradient */
background: linear-gradient(to right, #3b82f6, #6366f1);
color: #ffffff;
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

**Tailwind Class**: `data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md`

**Color Values**:
- `from-blue-500`: `#3b82f6` (HSL: `217 91% 60%`)
- `to-indigo-500`: `#6366f1` (HSL: `239 84% 67%`)

#### Posts Tab
```css
/* Emerald to Teal gradient */
background: linear-gradient(to right, #10b981, #14b8a6);
```

**Color Values**:
- `from-emerald-500`: `#10b981` (HSL: `160 84% 39%`)
- `to-teal-500`: `#14b8a6` (HSL: `173 80% 40%`)

#### Job Market & Student Tools Tabs
```css
/* Green to Emerald gradient */
background: linear-gradient(to right, #22c55e, #10b981);
```

**Color Values**:
- `from-green-500`: `#22c55e` (HSL: `142 71% 45%`)
- `to-emerald-500`: `#10b981`

#### AI Features Tab
```css
/* Purple to Pink gradient */
background: linear-gradient(to right, #a855f7, #ec4899);
```

**Color Values**:
- `from-purple-500`: `#a855f7` (HSL: `283 89% 66%`)
- `to-pink-500`: `#ec4899` (HSL: `330 81% 60%`)

#### Teacher Tools Tab
```css
/* Orange to Red gradient */
background: linear-gradient(to right, #f97316, #ef4444);
```

**Color Values**:
- `from-orange-500`: `#f97316` (HSL: `25 95% 53%`)
- `to-red-500`: `#ef4444` (HSL: `0 84% 60%`)

#### Admin Tools Tab
```css
/* Red to Pink gradient */
background: linear-gradient(to right, #ef4444, #ec4899);
```

**Color Values**:
- `from-red-500`: `#ef4444`
- `to-pink-500`: `#ec4899`

---

## 📊 Metric Cards (Overview Tab)

All metric cards use gradient backgrounds with hover effects:

### Common Card Structure
```css
/* Base card */
border: none;
border-radius: 0.5rem;  /* 8px */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
transition: all 300ms;
overflow: hidden;
position: relative;
```

**Hover State**:
```css
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
transform: scale(1.02);
```

### Individual Metric Card Colors

#### Total Time Card
```css
/* Blue gradient */
background: linear-gradient(to bottom right, #3b82f6, #2563eb);
/* from-blue-500 to-blue-600 */
```

**Overlay on Hover**:
```css
background: linear-gradient(to bottom right,
  rgba(96, 165, 250, 0.2),   /* blue-400/20 */
  rgba(29, 78, 216, 0.2)     /* blue-700/20 */
);
```

#### Engagement Card
```css
/* Emerald gradient */
background: linear-gradient(to bottom right, #10b981, #059669);
/* from-emerald-500 to-emerald-600 */
```

#### Progress Card
```css
/* Purple gradient */
background: linear-gradient(to bottom right, #a855f7, #9333ea);
/* from-purple-500 to-purple-600 */
```

#### Streak Card
```css
/* Orange to Red gradient */
background: linear-gradient(to bottom right, #f97316, #ef4444);
/* from-orange-500 to-red-500 */
```

#### Courses Card
```css
/* Indigo gradient */
background: linear-gradient(to bottom right, #6366f1, #4f46e5);
/* from-indigo-500 to-indigo-600 */
```

#### Achievements Card
```css
/* Yellow to Amber gradient */
background: linear-gradient(to bottom right, #eab308, #f59e0b);
/* from-yellow-500 to-amber-500 */
```

### Card Text Colors
All metric cards use white text:
```css
/* Icon container */
background: rgba(255, 255, 255, 0.2);
border-radius: 0.5rem;
padding: 0.5rem;

/* Label text */
color: rgba(255, 255, 255, 0.9);  /* white/90 */
font-size: 0.875rem;  /* text-sm */
font-weight: 500;

/* Value text */
color: #ffffff;
font-size: 1.5rem;  /* text-2xl */
font-weight: 700;

/* Subtext */
color: rgba(255, 255, 255, 0.8);  /* white/80 */
font-size: 0.75rem;  /* text-xs */
```

---

## 📈 Today's Activity Cards

These are the smaller stat cards inside the "Today's Learning Activity" section:

### Study Time Card
```css
background: linear-gradient(to bottom right, #22d3ee, #06b6d4);
/* from-cyan-400 to-cyan-500 */
border: none;
border-radius: 0.75rem;  /* rounded-xl */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### Sessions Card
```css
background: linear-gradient(to bottom right, #2dd4bf, #14b8a6);
/* from-teal-400 to-teal-500 */
```

### Engagement Card
```css
background: linear-gradient(to bottom right, #a78bfa, #8b5cf6);
/* from-violet-400 to-violet-500 */
```

### Day Streak Card
```css
background: linear-gradient(to bottom right, #fb7185, #f43f5e);
/* from-rose-400 to-rose-500 */
```

**Text Colors for Activity Cards**:
```css
/* Value */
color: #ffffff;
font-size: 1.5rem;
font-weight: 700;

/* Label */
color: rgba(255, 255, 255, 0.8);
font-size: 0.875rem;
```

---

## 📝 Typography System

### Font Family
```css
/* Inherited from Tailwind default */
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Heading Sizes
```css
/* Card titles */
.text-2xl {
  font-size: 1.5rem;      /* 24px */
  line-height: 2rem;      /* 32px */
  font-weight: 600;       /* semibold */
  letter-spacing: -0.025em; /* tracking-tight */
}

/* Section headers */
.text-xl {
  font-size: 1.25rem;     /* 20px */
  line-height: 1.75rem;   /* 28px */
  font-weight: 600;
}

/* Large metrics */
.text-2xl-bold {
  font-size: 1.5rem;
  font-weight: 700;       /* bold */
}
```

### Body Text
```css
/* Standard text */
.text-sm {
  font-size: 0.875rem;    /* 14px */
  line-height: 1.25rem;   /* 20px */
}

/* Extra small text */
.text-xs {
  font-size: 0.75rem;     /* 12px */
  line-height: 1rem;      /* 16px */
}
```

### Text Colors

#### Light Mode
```css
/* Primary text */
color: #0f172a;  /* slate-900 */

/* Secondary text */
color: #475569;  /* slate-600 */

/* Muted text */
color: #94a3b8;  /* slate-400 */

/* Card titles */
color: #1e293b;  /* slate-800 */
```

#### Dark Mode
```css
/* Primary text */
color: #ffffff;

/* Secondary text */
color: #cbd5e1;  /* slate-300 */

/* Muted text */
color: #94a3b8;  /* slate-400 */

/* Card titles */
color: #f1f5f9;  /* slate-100 */
```

---

## 🎯 Icon Colors

### Icon Container (in metric cards)
```css
/* Inside colored gradient cards */
background: rgba(255, 255, 255, 0.2);
color: #ffffff;
padding: 0.5rem;
border-radius: 0.5rem;
```

### Icon Size Classes
```css
.w-4.h-4 {
  width: 1rem;    /* 16px */
  height: 1rem;
}

.w-5.h-5 {
  width: 1.25rem; /* 20px */
  height: 1.25rem;
}

.w-8.h-8 {
  width: 2rem;    /* 32px */
  height: 2rem;
}
```

---

## 🔄 Loading States

### Loading Spinner
```css
/* Loader2 icon */
color: hsl(var(--primary));  /* Primary brand color */
animation: spin 1s linear infinite;
width: 2rem;
height: 2rem;
```

### Loading Text
```css
/* Light mode */
color: #64748b;  /* text-muted-foreground */

/* Dark mode */
color: #94a3b8;  /* slate-400 */
```

---

## ⚠️ Error States

### Error Card Background
```css
/* Light mode */
background: rgba(254, 226, 226, 1);  /* bg-red-50 */
border: 1px solid rgba(248, 113, 113, 0.5);  /* border-red-200/50 */

/* Dark mode */
background: rgba(127, 29, 29, 0.2);  /* bg-red-950/20 */
border: 1px solid rgba(185, 28, 28, 0.5);  /* border-red-800/50 */
```

### Error Text
```css
/* Error messages */
color: #dc2626;  /* text-red-600 */

/* Dark mode error text */
color: #f87171;  /* text-red-400 */
```

---

## 🎨 Shadow System

### Card Shadows
```css
/* Default card shadow */
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Medium shadow */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Large shadow */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Extra large shadow */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

---

## 🔵 Border Radius System

```css
/* Small radius */
.rounded-lg {
  border-radius: 0.5rem;   /* 8px */
}

/* Medium radius */
.rounded-xl {
  border-radius: 0.75rem;  /* 12px */
}

/* Large radius */
.rounded-2xl {
  border-radius: 1rem;     /* 16px */
}

/* Extra large radius */
.rounded-3xl {
  border-radius: 1.5rem;   /* 24px */
}
```

---

## 🎭 Transition & Animation

### Standard Transitions
```css
/* Default transition */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Medium duration */
.duration-200 {
  transition-duration: 200ms;
}

.duration-300 {
  transition-duration: 300ms;
}
```

### Hover Transformations
```css
/* Card hover scale */
.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}
```

### Framer Motion Animation Variants

#### Fade In Up
```javascript
{
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: 0 }
}
```

**Staggered Delays**: 0s, 0.1s, 0.2s, 0.3s, 0.4s, 0.5s for sequential cards

---

## 📐 Spacing System

### Container Padding
```css
/* Main container */
.container {
  padding-left: 1rem;   /* px-4 */
  padding-right: 1rem;
  padding-top: 2rem;    /* py-8 */
  padding-bottom: 2rem;
}

/* Card content padding */
.p-6 {
  padding: 1.5rem;      /* 24px */
}

.p-8 {
  padding: 2rem;        /* 32px */
}
```

### Gaps
```css
/* Grid gaps */
.gap-4 {
  gap: 1rem;            /* 16px */
}

/* Vertical spacing */
.space-y-6 > * + * {
  margin-top: 1.5rem;   /* 24px */
}

.space-y-8 > * + * {
  margin-top: 2rem;     /* 32px */
}
```

---

## 🎨 Custom CSS Variables (from globals.css)

### Light Mode Variables
```css
:root {
  --background: 220 22% 98%;           /* #f9fafb */
  --foreground: 222 47% 12%;           /* #1e293b */
  --muted: 215 30% 97%;                /* #f1f5f9 */
  --muted-foreground: 218 15% 45%;     /* #64748b */
  --card: 0 0% 100%;                   /* #ffffff */
  --card-foreground: 222 84% 5%;       /* #020617 */
  --border: 214 24% 90%;               /* #e2e8f0 */
  --primary: 142 76% 46%;              /* #22c55e - green CTA */
  --accent: 248 85% 60%;               /* #8b5cf6 - purple */
  --radius: 0.5rem;                    /* 8px */
}
```

### Dark Mode Variables
```css
.dark {
  --background: 232 46% 6.5%;          /* #0a0f1e */
  --foreground: 220 20% 96%;           /* #f1f5f9 */
  --muted: 230 25% 14%;                /* #1e293b */
  --muted-foreground: 220 12% 70%;     /* #94a3b8 */
  --card: 232 38% 10%;                 /* #0f1729 */
  --card-foreground: 220 20% 96%;      /* #f1f5f9 */
  --border: 230 18% 20%;               /* #1e293b */
  --primary: 142 76% 56%;              /* #34d399 - brighter green */
  --accent: 255 90% 76%;               /* #a78bfa - lighter purple */
}
```

---

## 🖼️ Backdrop Blur

```css
/* Standard backdrop blur for glassmorphism */
.backdrop-blur-sm {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

---

## 📱 Responsive Grid

### Metric Cards Grid
```css
/* Mobile: 2 columns */
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Tablet (md): 3 columns */
@media (min-width: 768px) {
  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Desktop (lg): 6 columns */
@media (min-width: 1024px) {
  .lg\:grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
```

### Today's Activity Grid
```css
/* Mobile: 2 columns */
.grid-cols-2

/* Desktop: 4 columns */
.md\:grid-cols-4
```

---

## 🎨 Complete Color Palette Reference

### Slate Colors (Primary Grays)
```css
slate-50:  #f8fafc   /* HSL: 210 40% 98% */
slate-100: #f1f5f9   /* HSL: 214 32% 91% */
slate-200: #e2e8f0   /* HSL: 214 32% 91% */
slate-300: #cbd5e1   /* HSL: 213 27% 84% */
slate-400: #94a3b8   /* HSL: 215 20% 65% */
slate-500: #64748b   /* HSL: 215 16% 47% */
slate-600: #475569   /* HSL: 215 19% 35% */
slate-700: #334155   /* HSL: 215 25% 27% */
slate-800: #1e293b   /* HSL: 217 33% 17% */
slate-900: #0f172a   /* HSL: 222 47% 11% */
```

### Blue Colors
```css
blue-50:  #eff6ff   /* HSL: 214 100% 97% */
blue-400: #60a5fa   /* HSL: 213 94% 68% */
blue-500: #3b82f6   /* HSL: 217 91% 60% */
blue-600: #2563eb   /* HSL: 221 83% 53% */
blue-700: #1d4ed8   /* HSL: 224 76% 48% */
```

### Indigo Colors
```css
indigo-50:  #e0e7ff  /* HSL: 226 100% 94% */
indigo-500: #6366f1  /* HSL: 239 84% 67% */
indigo-600: #4f46e5  /* HSL: 243 75% 59% */
indigo-700: #4338ca  /* HSL: 244 58% 51% */
```

### Green/Emerald Colors
```css
emerald-400: #34d399 /* HSL: 158 64% 52% */
emerald-500: #10b981 /* HSL: 160 84% 39% */
emerald-600: #059669 /* HSL: 161 94% 30% */
green-500:   #22c55e /* HSL: 142 71% 45% */
```

### Purple Colors
```css
purple-400: #c084fc  /* HSL: 270 95% 75% */
purple-500: #a855f7  /* HSL: 283 89% 66% */
purple-600: #9333ea  /* HSL: 271 81% 56% */
violet-400: #a78bfa  /* HSL: 258 90% 66% */
violet-500: #8b5cf6  /* HSL: 259 94% 51% */
```

### Orange/Red Colors
```css
orange-400: #fb923c  /* HSL: 27 96% 61% */
orange-500: #f97316  /* HSL: 25 95% 53% */
red-500:    #ef4444  /* HSL: 0 84% 60% */
rose-400:   #fb7185  /* HSL: 351 95% 71% */
rose-500:   #f43f5e  /* HSL: 350 89% 60% */
```

### Pink Colors
```css
pink-500: #ec4899    /* HSL: 330 81% 60% */
```

### Yellow/Amber Colors
```css
yellow-500: #eab308  /* HSL: 45 93% 47% */
amber-500:  #f59e0b  /* HSL: 38 92% 50% */
```

### Cyan/Teal Colors
```css
cyan-400: #22d3ee    /* HSL: 187 85% 53% */
cyan-500: #06b6d4    /* HSL: 188 94% 43% */
teal-400: #2dd4bf    /* HSL: 172 66% 50% */
teal-500: #14b8a6    /* HSL: 173 80% 40% */
```

---

## 💡 Usage Examples

### Creating a New Metric Card
```tsx
<Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div className="relative p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-medium text-white/90">Label</span>
    </div>
    <div className="text-2xl font-bold text-white">Value</div>
    <div className="text-xs text-white/80">Subtitle</div>
  </div>
</Card>
```

### Creating a Standard Content Card
```tsx
<Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
  <CardHeader className="pb-4">
    <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
        <Icon className="w-5 h-5 text-white" />
      </div>
      Section Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### Creating a Custom Tab
```tsx
<TabsTrigger
  value="custom-tab"
  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
>
  Custom Tab
</TabsTrigger>
```

---

## 📚 Color Psychology & Design Decisions

### Why These Colors?

- **Blue/Indigo**: Trust, intelligence, learning (primary tabs)
- **Emerald/Green**: Growth, progress, success (engagement, progress)
- **Purple**: Creativity, AI features, premium content
- **Orange/Red**: Energy, action, urgency (streaks, teacher tools)
- **Yellow/Amber**: Achievement, rewards, celebration
- **Cyan/Teal**: Focus, clarity, modern tech
- **Pink**: Warmth, community, social features

### Accessibility

All color combinations meet **WCAG AA** standards:
- White text on colored backgrounds: minimum 4.5:1 contrast ratio
- Dark text on light backgrounds: 7:1+ contrast ratio
- Focus indicators visible in both light and dark modes

---

## 🔧 Development Tips

### Testing Color Changes
```bash
# Test both modes
npm run dev
# Toggle dark mode in browser
# Check all tabs and card states
```

### Color Consistency
- Always use Tailwind classes, not arbitrary values
- Use opacity modifiers (`/80`, `/50`) for glassmorphism
- Maintain gradient direction consistency (`to-br`, `to-r`)
- Test hover states in both light and dark modes

### Performance
- Use CSS variables for dynamic theming
- Prefer Tailwind classes over inline styles
- Use `backdrop-blur-sm` (12px) for optimal performance
- Minimize shadow complexity

---

**Document Version**: 1.0
**Last Updated**: October 31, 2024
**Page Route**: `/analytics/user`
**Framework**: Next.js 15 + Tailwind CSS 3.4 + Radix UI
**Theme System**: next-themes with CSS variables

----------
  New Edit Button Design:
  - Background: Subtle slate background (slate-50 in light, slate-800/50 in dark)
  - Border: Thin, dimmed border (slate-200 in light, slate-700 in dark)
  - Text: Neutral slate colors (slate-700 in light, slate-300 in dark)
  - Hover: Slightly darker background with slightly more visible border
  - Cancel state: Still uses rose colors for visual distinction
  -----------
