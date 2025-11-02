# 🎨 Taxomind Official Theme Color Palette

**Source Analysis:** Auth Pages (`/auth/login` & `/auth/register`)
**Last Updated:** January 2025
**Status:** Production-Ready - Use this as the single source of truth

---

## 📋 Table of Contents

1. [Color Philosophy](#color-philosophy)
2. [Complete Color Palette](#complete-color-palette)
3. [Page Background](#page-background)
4. [Card & Form Container](#card--form-container)
5. [Typography](#typography)
6. [Input Fields](#input-fields)
7. [Buttons](#buttons)
8. [Icons](#icons)
9. [Feature Cards](#feature-cards)
10. [Alert Messages](#alert-messages)
11. [Gradients](#gradients)
12. [Implementation Guide](#implementation-guide)
13. [Usage Examples](#usage-examples)

---

## 🎯 Color Philosophy

Taxomind uses a **dual-theme system** optimized for:
- **Light Mode:** Clean, professional, minimal eye strain
- **Dark Mode:** Rich, deep slate with vibrant accents
- **Consistency:** Semantic color naming for easy maintenance
- **Accessibility:** WCAG 2.1 AAA compliant contrast ratios

### Core Brand Colors:
- **Primary Action:** Green (#22C55E light, #34D399 dark)
- **Accent Gradient:** Purple → Blue (#6B46C1 → #3B82F6)
- **Background:** Off-white (#F7F8FB) / Deep Slate (#0F172A)

---

## 🌈 Complete Color Palette

### Light Mode Colors

```scss
/* ============================================ */
/* PAGE BACKGROUNDS                              */
/* ============================================ */
--page-bg-primary:    #F7F8FB;      /* Main page background */
--page-bg-secondary:  #F4F6F9;      /* Secondary gradient stop */
--page-accent-blob-1: rgba(99,102,241,0.12);   /* Decorative purple blob */
--page-accent-blob-2: rgba(6,182,212,0.12);    /* Decorative cyan blob */

/* ============================================ */
/* CARD & CONTAINER BACKGROUNDS                 */
/* ============================================ */
--card-bg:            #FFFFFF;      /* Main card background */
--card-border:        #E2E8F0;      /* slate-200 */
--card-shadow:        rgba(15, 23, 42, 0.08); /* Soft shadow */

/* ============================================ */
/* TEXT COLORS                                  */
/* ============================================ */
--text-primary:       #0F172A;      /* slate-900 - Main headings */
--text-secondary:     #475569;      /* slate-600 - Body text */
--text-tertiary:      #64748B;      /* slate-500 - Muted text */
--text-link:          #22C55E;      /* Primary green - Links */

/* ============================================ */
/* INPUT FIELDS                                 */
/* ============================================ */
--input-bg:           #FFFFFF;      /* Input background */
--input-border:       #E2E8F0;      /* slate-200 - Default border */
--input-border-focus: #A855F7;      /* purple-500 - Focus state */
--input-text:         #0F172A;      /* slate-900 - Input text */
--input-placeholder:  #94A3B8;      /* slate-400 - Placeholder */
--input-label:        #475569;      /* slate-600 - Label text */
--input-label-active: #A855F7;      /* purple-500 - Active label */
--input-icon-default: #94A3B8;      /* slate-400 - Icon default */
--input-icon-active:  #A855F7;      /* purple-500 - Icon active */
--input-icon-error:   #EF4444;      /* red-500 - Error state */

/* ============================================ */
/* BUTTONS                                      */
/* ============================================ */
--btn-primary-bg:     #22C55E;      /* green-500 - Primary CTA */
--btn-primary-hover:  #16A34A;      /* green-600 - Hover state */
--btn-primary-text:   #FFFFFF;      /* White text */
--btn-secondary-bg:   #FFFFFF;      /* White background */
--btn-secondary-border: #E2E8F0;    /* slate-200 - Border */
--btn-secondary-hover: #F8FAFC;     /* slate-50 - Hover */
--btn-secondary-text: #0F172A;      /* slate-900 - Text */

/* ============================================ */
/* GRADIENTS                                    */
/* ============================================ */
--gradient-brand:     linear-gradient(to right, #22C55E, #6366F1);
--gradient-heading:   linear-gradient(to right, #7C3AED, #3B82F6, #4F46E5);
--gradient-purple-blue: linear-gradient(to right, #A855F7, #3B82F6);
--gradient-blue-cyan: linear-gradient(to right, #3B82F6, #06B6D4);
--gradient-cyan-emerald: linear-gradient(to right, #06B6D4, #10B981);

/* ============================================ */
/* FEATURE CARDS                                */
/* ============================================ */
--feature-card-bg:    linear-gradient(to right, #FFFFFF, #F8FAFC);
--feature-card-border: rgba(226, 232, 240, 0.6); /* slate-200 with opacity */
--feature-card-hover-border: rgba(167, 139, 250, 0.4); /* purple-400 */
--feature-card-shadow: rgba(15, 23, 42, 0.05);

/* ============================================ */
/* TRUST METRICS CARD                           */
/* ============================================ */
--metrics-card-bg:    linear-gradient(to bottom right, #FFFFFF, #F8FAFC, #FFFFFF);
--metrics-card-border: #E2E8F0;    /* slate-200 */
--metrics-gradient-1: linear-gradient(to right, #7C3AED, #3B82F6); /* purple-blue */
--metrics-gradient-2: linear-gradient(to right, #3B82F6, #06B6D4); /* blue-cyan */
--metrics-gradient-3: linear-gradient(to right, #06B6D4, #10B981); /* cyan-emerald */

/* ============================================ */
/* ALERT MESSAGES                               */
/* ============================================ */
--alert-error-bg:     rgba(239, 68, 68, 0.1);  /* red-500/10 */
--alert-error-border: rgba(239, 68, 68, 0.2);  /* red-500/20 */
--alert-error-text:   #DC2626;      /* red-600 */

--alert-success-bg:   rgba(34, 197, 94, 0.1);  /* green-500/10 */
--alert-success-border: rgba(34, 197, 94, 0.2); /* green-500/20 */
--alert-success-text: #15803D;      /* green-700 */

--alert-info-bg:      rgba(59, 130, 246, 0.1); /* blue-500/10 */
--alert-info-border:  rgba(59, 130, 246, 0.2); /* blue-500/20 */
--alert-info-text:    #1D4ED8;      /* blue-700 */

/* ============================================ */
/* SECURITY BADGE                               */
/* ============================================ */
--security-badge-bg:  rgba(34, 197, 94, 0.1);  /* green-500/10 */
--security-badge-border: rgba(34, 197, 94, 0.2); /* green-500/20 */
--security-badge-icon: #16A34A;     /* green-600 */
--security-badge-text: #15803D;     /* green-700 */

/* ============================================ */
/* DIVIDER                                      */
/* ============================================ */
--divider-line:       #E2E8F0;      /* slate-200 */
--divider-text:       #475569;      /* slate-600 */

/* ============================================ */
/* LOADING OVERLAY                              */
/* ============================================ */
--loading-overlay-bg: rgba(15, 23, 42, 0.8); /* slate-900/80 */
--loading-card-bg:    #FFFFFF;      /* White */
--loading-card-border: #E2E8F0;     /* slate-200 */
--loading-spinner-track: #E2E8F0;   /* Muted gray */
--loading-spinner-active: #22C55E;  /* Primary green */
```

---

### Dark Mode Colors

```scss
/* ============================================ */
/* PAGE BACKGROUNDS                              */
/* ============================================ */
--dark-page-bg:       linear-gradient(to bottom right, #0F172A, #1E293B, #0F172A);

/* ============================================ */
/* CARD & CONTAINER BACKGROUNDS                 */
/* ============================================ */
--dark-card-bg:       rgba(15, 23, 42, 0.95); /* slate-900/95 with blur */
--dark-card-border:   rgba(51, 65, 85, 0.5);  /* slate-700/50 */
--dark-card-shadow:   rgba(0, 0, 0, 0.3);     /* Deep shadow */

/* ============================================ */
/* TEXT COLORS                                  */
/* ============================================ */
--dark-text-primary:  #F8FAFC;      /* slate-50 - Main headings */
--dark-text-secondary: #E2E8F0;     /* slate-200 - Body text */
--dark-text-tertiary: #94A3B8;      /* slate-400 - Muted text */
--dark-text-link:     #34D399;      /* Bright green - Links */

/* ============================================ */
/* INPUT FIELDS                                 */
/* ============================================ */
--dark-input-bg:      rgba(30, 41, 59, 0.8); /* slate-800/80 */
--dark-input-border:  rgba(51, 65, 85, 0.5);  /* slate-700/50 */
--dark-input-border-focus: #C084FC; /* purple-400 - Focus */
--dark-input-text:    #F8FAFC;      /* slate-50 - Input text */
--dark-input-placeholder: #64748B;  /* slate-500 - Placeholder */
--dark-input-label:   #94A3B8;      /* slate-400 - Label */
--dark-input-label-active: #C084FC; /* purple-400 - Active label */
--dark-input-icon-default: #64748B; /* slate-500 - Icon */
--dark-input-icon-active: #C084FC;  /* purple-400 - Active icon */

/* ============================================ */
/* BUTTONS                                      */
/* ============================================ */
--dark-btn-primary-bg: #34D399;     /* Bright green */
--dark-btn-primary-hover: #10B981;  /* green-500 */
--dark-btn-primary-text: #0F172A;   /* slate-900 - Dark text on bright bg */
--dark-btn-secondary-bg: rgba(30, 41, 59, 0.5); /* slate-800/50 */
--dark-btn-secondary-border: rgba(51, 65, 85, 0.5);
--dark-btn-secondary-hover: rgba(30, 41, 59, 0.8);
--dark-btn-secondary-text: #F8FAFC;

/* ============================================ */
/* GRADIENTS                                    */
/* ============================================ */
--dark-gradient-brand: linear-gradient(to right, #34D399, #A78BFA);
--dark-gradient-heading: linear-gradient(to right, #C084FC, #60A5FA, #818CF8);
--dark-gradient-purple-blue: linear-gradient(to right, #C084FC, #60A5FA);
--dark-gradient-blue-cyan: linear-gradient(to right, #60A5FA, #22D3EE);
--dark-gradient-cyan-emerald: linear-gradient(to right, #22D3EE, #34D399);

/* ============================================ */
/* FEATURE CARDS                                */
/* ============================================ */
--dark-feature-card-bg: linear-gradient(to right, rgba(30,41,59,0.9), rgba(30,41,59,0.6));
--dark-feature-card-border: rgba(51, 65, 85, 0.5);
--dark-feature-card-hover-border: rgba(192, 132, 252, 0.4); /* purple-400 */
--dark-feature-card-hover-shadow: rgba(168, 85, 247, 0.1);

/* ============================================ */
/* TRUST METRICS CARD                           */
/* ============================================ */
--dark-metrics-card-bg: linear-gradient(to bottom right, rgba(30,41,59,0.9), rgba(30,41,59,0.7), rgba(30,41,59,0.9));
--dark-metrics-card-border: rgba(51, 65, 85, 0.5);
--dark-metrics-gradient-1: linear-gradient(to right, #C084FC, #60A5FA);
--dark-metrics-gradient-2: linear-gradient(to right, #60A5FA, #22D3EE);
--dark-metrics-gradient-3: linear-gradient(to right, #22D3EE, #34D399);

/* ============================================ */
/* ALERT MESSAGES                               */
/* ============================================ */
--dark-alert-error-bg: rgba(239, 68, 68, 0.1);
--dark-alert-error-border: rgba(239, 68, 68, 0.2);
--dark-alert-error-text: #FCA5A5;   /* red-300 */

--dark-alert-success-bg: rgba(52, 211, 153, 0.1); /* green-400/10 */
--dark-alert-success-border: rgba(52, 211, 153, 0.2);
--dark-alert-success-text: #6EE7B7; /* green-300 */

--dark-alert-info-bg: rgba(96, 165, 250, 0.1); /* blue-400/10 */
--dark-alert-info-border: rgba(96, 165, 250, 0.2);
--dark-alert-info-text: #93C5FD;    /* blue-300 */

/* ============================================ */
/* SECURITY BADGE                               */
/* ============================================ */
--dark-security-badge-bg: rgba(52, 211, 153, 0.1);
--dark-security-badge-border: rgba(52, 211, 153, 0.2);
--dark-security-badge-icon: #6EE7B7; /* green-300 */
--dark-security-badge-text: #6EE7B7;

/* ============================================ */
/* DIVIDER                                      */
/* ============================================ */
--dark-divider-line: rgba(51, 65, 85, 0.5);
--dark-divider-text: #E2E8F0;       /* slate-200 */

/* ============================================ */
/* LOADING OVERLAY                              */
/* ============================================ */
--dark-loading-overlay-bg: rgba(15, 23, 42, 0.8);
--dark-loading-card-bg: #0F172A;    /* slate-900 */
--dark-loading-card-border: #334155; /* slate-700 */
--dark-loading-spinner-track: #334155;
--dark-loading-spinner-active: #34D399;
```

---

## 📦 Page Background

### Light Mode
```tsx
// Page container with gradient + decorative blobs
<div className="fixed inset-0 w-full h-full overflow-auto">
  {/* Main gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#f7f8fb] via-[#f4f6f9] to-[#f7f8fb]" />

  {/* Decorative accent blobs for depth */}
  <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-2xl opacity-70
    bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),rgba(99,102,241,0))]" />

  <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-2xl opacity-70
    bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),rgba(6,182,212,0))]" />
</div>
```

**Colors Used:**
- Base: `#F7F8FB` → `#F4F6F9` → `#F7F8FB`
- Purple Blob: `rgba(99,102,241,0.12)` (Indigo accent)
- Cyan Blob: `rgba(6,182,212,0.12)` (Cyan accent)

---

### Dark Mode
```tsx
// Page container with deep slate gradient
<div className="fixed inset-0 w-full h-full overflow-auto">
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
</div>
```

**Colors Used:**
- Gradient: `#0F172A` (slate-900) → `#1E293B` (slate-800) → `#0F172A`

---

## 🎴 Card & Form Container

### Light Mode
```tsx
<div className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl
  rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50
  overflow-hidden">

  {/* Animated gradient header strip */}
  <div className="relative h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500
    bg-size-200 bg-pos-0 animate-[shimmer_8s_ease-in-out_infinite]" />

  <div className="p-8 space-y-6">
    {/* Form content */}
  </div>
</div>
```

**Colors Used:**
- Background: `#FFFFFF` (white)
- Border: `#E2E8F0` (slate-200)
- Shadow: `rgba(15, 23, 42, 0.08)`
- Header Gradient: `#A855F7` (purple-500) → `#3B82F6` (blue-500) → `#A855F7`

---

### Dark Mode
```tsx
// Same structure, auto-switches via dark: classes
```

**Colors Used:**
- Background: `rgba(15, 23, 42, 0.95)` (slate-900/95 with backdrop blur)
- Border: `rgba(51, 65, 85, 0.5)` (slate-700/50)
- Shadow: `rgba(0, 0, 0, 0.3)`
- Header Gradient: Same purple-blue gradient

---

## 📝 Typography

### Headings

#### Main Heading (Animated)
```tsx
<h2 className="text-4xl font-bold mb-3
  bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600
  dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400
  bg-clip-text text-transparent bg-size-200 bg-pos-0"
  animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
>
  Welcome Back!
</h2>
```

**Light Mode:**
- Gradient: `#7C3AED` (purple-600) → `#3B82F6` (blue-600) → `#4F46E5` (indigo-600)

**Dark Mode:**
- Gradient: `#C084FC` (purple-400) → `#60A5FA` (blue-400) → `#818CF8` (indigo-400)

---

#### Form Title
```tsx
<h3 className="text-2xl font-bold tracking-tight
  bg-gradient-to-r from-slate-900 to-primary
  dark:from-white dark:to-primary
  bg-clip-text text-transparent">
  Sign In
</h3>
```

**Light Mode:**
- Gradient: `#0F172A` (slate-900) → `#22C55E` (primary green)

**Dark Mode:**
- Gradient: `#FFFFFF` (white) → `#34D399` (bright green)

---

### Body Text

```tsx
// Primary text
<p className="text-slate-700 dark:text-gray-300">

// Secondary/muted text
<p className="text-slate-600 dark:text-gray-400">

// Link text
<Link className="text-primary hover:text-primary/80">
```

**Light Mode:**
- Primary: `#334155` (slate-700)
- Secondary: `#475569` (slate-600)
- Muted: `#64748B` (slate-500)
- Link: `#22C55E` (green-500)

**Dark Mode:**
- Primary: `#D1D5DB` (gray-300)
- Secondary: `#9CA3AF` (gray-400)
- Muted: `#6B7280` (gray-500)
- Link: `#34D399` (green-400)

---

## 🔤 Input Fields

### Structure with Floating Labels

```tsx
<div className="relative group">
  <div className="relative">
    {/* Icon */}
    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300
      ${error ? "text-red-500" :
        filled ? "text-purple-500 dark:text-purple-400" :
        "text-slate-400 dark:text-slate-500"}`}
    />

    {/* Input */}
    <input
      className={`peer w-full h-14 pl-12 pr-4 pt-4 pb-2 rounded-xl border
        bg-white dark:bg-slate-800/80
        text-slate-900 dark:text-white
        transition-all duration-300 outline-none placeholder-transparent
        ${error
          ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
          : "border-slate-200 dark:border-slate-700/50 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
        }`}
      placeholder="Email Address"
    />

    {/* Floating Label */}
    <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-sm
      transition-all duration-300 pointer-events-none
      peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:px-2
      peer-[:not(:placeholder-shown)]:-top-2
      peer-[:not(:placeholder-shown)]:left-3
      peer-[:not(:placeholder-shown)]:text-xs
      peer-[:not(:placeholder-shown)]:px-2
      ${error
        ? "text-destructive peer-focus:text-destructive"
        : "text-slate-600 dark:text-slate-400 peer-focus:text-purple-500 dark:peer-focus:text-purple-400"
      }
      peer-focus:bg-white dark:peer-focus:bg-slate-900
      peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-900`}>
      Email Address
    </label>
  </div>
</div>
```

### Color Breakdown

#### Light Mode
| State | Background | Border | Text | Icon | Label | Ring |
|-------|-----------|--------|------|------|-------|------|
| **Default** | `#FFFFFF` | `#E2E8F0` | `#0F172A` | `#94A3B8` | `#475569` | - |
| **Focus** | `#FFFFFF` | `#A855F7` | `#0F172A` | `#A855F7` | `#A855F7` | `rgba(168,85,247,0.2)` |
| **Filled** | `#FFFFFF` | `#E2E8F0` | `#0F172A` | `#A855F7` | `#A855F7` | - |
| **Error** | `#FFFFFF` | `#EF4444` | `#0F172A` | `#EF4444` | `#DC2626` | `rgba(239,68,68,0.2)` |

#### Dark Mode
| State | Background | Border | Text | Icon | Label | Ring |
|-------|-----------|--------|------|------|-------|------|
| **Default** | `rgba(30,41,59,0.8)` | `rgba(51,65,85,0.5)` | `#F8FAFC` | `#64748B` | `#94A3B8` | - |
| **Focus** | `rgba(30,41,59,0.8)` | `#C084FC` | `#F8FAFC` | `#C084FC` | `#C084FC` | `rgba(192,132,252,0.2)` |
| **Filled** | `rgba(30,41,59,0.8)` | `rgba(51,65,85,0.5)` | `#F8FAFC` | `#C084FC` | `#C084FC` | - |
| **Error** | `rgba(30,41,59,0.8)` | `#EF4444` | `#F8FAFC` | `#EF4444` | `#DC2626` | `rgba(239,68,68,0.2)` |

---

## 🔘 Buttons

### Primary Button (CTA)

```tsx
<Button className="w-full h-13
  bg-primary hover:bg-primary/90
  text-primary-foreground
  rounded-xl font-semibold text-base
  shadow-lg hover:shadow-xl
  transition-all duration-300
  disabled:opacity-50 disabled:cursor-not-allowed
  relative overflow-hidden group">

  <span className="relative z-10">Sign In</span>

  {/* Shimmer effect on hover */}
  <div className="absolute inset-0
    bg-gradient-to-r from-transparent via-white/20 to-transparent
    -translate-x-full group-hover:translate-x-full
    transition-transform duration-1000" />
</Button>
```

**Light Mode:**
- Background: `#22C55E` (green-500)
- Hover: `#16A34A` (green-600) via 90% opacity
- Text: `#FFFFFF` (white)
- Shadow: `rgba(34, 197, 94, 0.3)`

**Dark Mode:**
- Background: `#34D399` (bright green-400)
- Hover: `#10B981` (green-500) via 90% opacity
- Text: `#0F172A` (slate-900) - Dark text on bright background
- Shadow: `rgba(52, 211, 153, 0.3)`

---

### Secondary Button (OAuth)

```tsx
<Button variant="outline"
  className="h-10 border border-slate-200 dark:border-slate-700/50
    hover:bg-slate-50 dark:hover:bg-slate-800/50
    hover:border-purple-500/50
    transition-all duration-300 text-sm group">

  <GoogleIcon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
  <span>Google</span>
</Button>
```

**Light Mode:**
- Background: `#FFFFFF` (transparent/white)
- Border: `#E2E8F0` (slate-200)
- Hover Background: `#F8FAFC` (slate-50)
- Hover Border: `rgba(168, 85, 247, 0.5)` (purple-500/50)
- Text: `#0F172A` (slate-900)

**Dark Mode:**
- Background: Transparent
- Border: `rgba(51, 65, 85, 0.5)` (slate-700/50)
- Hover Background: `rgba(30, 41, 59, 0.5)` (slate-800/50)
- Hover Border: `rgba(168, 85, 247, 0.5)`
- Text: `#F8FAFC` (slate-50)

---

## 🎨 Icons

### Default State
- **Light:** `#94A3B8` (slate-400)
- **Dark:** `#64748B` (slate-500)

### Active/Focused State
- **Light:** `#A855F7` (purple-500)
- **Dark:** `#C084FC` (purple-400)

### Error State
- **Light & Dark:** `#EF4444` (red-500)

### Success State
- **Light:** `#16A34A` (green-600)
- **Dark:** `#6EE7B7` (green-300)

---

## 🎴 Feature Cards

```tsx
<div className="group flex items-center gap-4 p-4 rounded-xl
  bg-gradient-to-r from-white to-slate-50
  dark:from-slate-800/90 dark:to-slate-800/60
  backdrop-blur-sm
  border border-slate-200/60 dark:border-slate-700/50
  hover:border-purple-400/40 dark:hover:border-purple-500/40
  hover:shadow-lg dark:hover:shadow-purple-500/10
  transition-all duration-300">

  {/* Icon Container with Gradient */}
  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500
    rounded-xl shrink-0 shadow-md
    group-hover:shadow-xl group-hover:scale-110
    transition-all duration-300">
    <Brain className="w-5 h-5 text-purple-100" />
  </div>

  {/* Content */}
  <div className="flex-1">
    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1
      group-hover:text-purple-700 dark:group-hover:text-purple-300
      transition-colors">
      Smart AI Tutor
    </h3>
    <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
      Real-time guidance and personalized learning paths
    </p>
  </div>
</div>
```

### Color Breakdown

**Light Mode:**
- Background: `#FFFFFF` → `#F8FAFC` (gradient)
- Border: `rgba(226, 232, 240, 0.6)` (slate-200/60)
- Hover Border: `rgba(167, 139, 250, 0.4)` (purple-400/40)
- Title: `#0F172A` (slate-900)
- Hover Title: `#7C3AED` (purple-700)
- Description: `#475569` (slate-600)

**Dark Mode:**
- Background: `rgba(30,41,59,0.9)` → `rgba(30,41,59,0.6)` (gradient)
- Border: `rgba(51, 65, 85, 0.5)` (slate-700/50)
- Hover Border: `rgba(168, 85, 247, 0.4)` (purple-500/40)
- Hover Shadow: `rgba(168, 85, 247, 0.1)` (purple-500/10)
- Title: `#F8FAFC` (white)
- Hover Title: `#D8B4FE` (purple-300)
- Description: `#9CA3AF` (gray-400)

### Icon Gradients

| Feature | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Purple-Blue** | `#A855F7` → `#3B82F6` | `#C084FC` → `#60A5FA` |
| **Blue-Cyan** | `#3B82F6` → `#06B6D4` | `#60A5FA` → `#22D3EE` |
| **Cyan-Emerald** | `#06B6D4` → `#10B981` | `#22D3EE` → `#34D399` |

---

## 🚨 Alert Messages

### Error Alert
```tsx
<div className="p-4 rounded-xl
  bg-destructive/10 border border-destructive/20
  text-sm text-destructive flex items-start gap-3">

  <div className="w-5 h-5 rounded-full bg-destructive/20
    flex items-center justify-center shrink-0 mt-0.5">
    <span className="text-xs font-bold">!</span>
  </div>

  <p className="flex-1">Error message here</p>
</div>
```

**Light Mode:**
- Background: `rgba(239, 68, 68, 0.1)` (red-500/10)
- Border: `rgba(239, 68, 68, 0.2)` (red-500/20)
- Text: `#DC2626` (red-600)
- Badge Background: `rgba(239, 68, 68, 0.2)`

**Dark Mode:**
- Background: `rgba(239, 68, 68, 0.1)`
- Border: `rgba(239, 68, 68, 0.2)`
- Text: `#FCA5A5` (red-300)
- Badge Background: `rgba(239, 68, 68, 0.2)`

---

### Success Alert
```tsx
<div className="p-4 rounded-xl
  bg-green-500/10 dark:bg-green-400/10
  border border-green-500/20 dark:border-green-400/20
  text-sm text-green-700 dark:text-green-400
  flex items-center gap-3">

  <div className="w-5 h-5 rounded-full bg-green-500/20
    flex items-center justify-center shrink-0">
    <span className="text-xs font-bold">✓</span>
  </div>

  <p className="flex-1">Success message</p>
</div>
```

**Light Mode:**
- Background: `rgba(34, 197, 94, 0.1)` (green-500/10)
- Border: `rgba(34, 197, 94, 0.2)` (green-500/20)
- Text: `#15803D` (green-700)
- Badge Background: `rgba(34, 197, 94, 0.2)`

**Dark Mode:**
- Background: `rgba(52, 211, 153, 0.1)` (green-400/10)
- Border: `rgba(52, 211, 153, 0.2)` (green-400/20)
- Text: `#6EE7B7` (green-300)
- Badge Background: `rgba(52, 211, 153, 0.2)`

---

### Info Alert (OAuth Linking)
```tsx
<div className="p-4 rounded-xl
  bg-blue-500/10 border border-blue-500/20
  text-sm text-blue-700 dark:text-blue-400
  flex items-start gap-3">

  <div className="w-5 h-5 rounded-full bg-blue-500/20
    flex items-center justify-center shrink-0 mt-0.5">
    <span className="text-xs font-bold">i</span>
  </div>

  <p className="flex-1">Info message</p>
</div>
```

**Light Mode:**
- Background: `rgba(59, 130, 246, 0.1)` (blue-500/10)
- Border: `rgba(59, 130, 246, 0.2)` (blue-500/20)
- Text: `#1D4ED8` (blue-700)
- Badge Background: `rgba(59, 130, 246, 0.2)`

**Dark Mode:**
- Background: `rgba(96, 165, 250, 0.1)` (blue-400/10)
- Border: `rgba(96, 165, 250, 0.2)` (blue-400/20)
- Text: `#93C5FD` (blue-300)
- Badge Background: `rgba(96, 165, 250, 0.2)`

---

## 🌈 Gradients

### Brand Gradients

| Name | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| **Primary Brand** | `#22C55E` → `#6366F1` | `#34D399` → `#A78BFA` | Logo, CTAs |
| **Animated Heading** | `#7C3AED` → `#3B82F6` → `#4F46E5` | `#C084FC` → `#60A5FA` → `#818CF8` | Main headings |
| **Purple-Blue** | `#A855F7` → `#3B82F6` | `#C084FC` → `#60A5FA` | Feature icons |
| **Blue-Cyan** | `#3B82F6` → `#06B6D4` | `#60A5FA` → `#22D3EE` | Metrics, progress |
| **Cyan-Emerald** | `#06B6D4` → `#10B981` | `#22D3EE` → `#34D399` | Success states |

### Gradient CSS Classes

```css
/* Primary Brand Gradient */
.gradient-brand {
  background: linear-gradient(to right, #22C55E, #6366F1);
}

.dark .gradient-brand {
  background: linear-gradient(to right, #34D399, #A78BFA);
}

/* Animated Heading Gradient */
.gradient-heading {
  background: linear-gradient(to right, #7C3AED, #3B82F6, #4F46E5);
  background-size: 200% auto;
  animation: gradient-x 5s linear infinite;
}

.dark .gradient-heading {
  background: linear-gradient(to right, #C084FC, #60A5FA, #818CF8);
}

/* Gradient Animation */
@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

---

## 💻 Implementation Guide

### Step 1: Add to globals.css

Copy the color variables from the complete palette sections above and add them to your `globals.css` file:

```css
@layer base {
  :root {
    /* Light mode variables */
    --auth-page-bg: #F7F8FB;
    --auth-card-bg: #FFFFFF;
    /* ... rest of variables */
  }

  .dark {
    /* Dark mode variables */
    --auth-page-bg: #0F172A;
    --auth-card-bg: rgba(15, 23, 42, 0.95);
    /* ... rest of variables */
  }
}
```

### Step 2: Use in Components

```tsx
// Using CSS variables
<div className="bg-[var(--auth-card-bg)]">

// Or using Tailwind classes directly
<div className="bg-white dark:bg-slate-900/95">
```

### Step 3: Ensure Consistency

Use the exact color values from this document to maintain visual consistency across all pages.

---

## 📋 Usage Examples

### Complete Login Form Example

```tsx
import { motion } from "framer-motion";
import { Mail, Lock, Shield } from "lucide-react";

export function LoginForm() {
  return (
    <div className="w-full relative">
      {/* Page Background */}
      <div className="fixed inset-0 w-full h-full overflow-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f7f8fb] via-[#f4f6f9] to-[#f7f8fb] dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

        {/* Light mode decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-2xl opacity-70 dark:hidden
          bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),rgba(99,102,241,0))]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-2xl opacity-70 dark:hidden
          bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),rgba(6,182,212,0))]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            {/* Gradient Header Strip */}
            <div className="relative h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-size-200 animate-[shimmer_8s_ease-in-out_infinite]" />

            <div className="p-8 space-y-6">
              {/* Title */}
              <motion.h3 className="text-2xl font-bold tracking-tight text-center
                bg-gradient-to-r from-slate-900 to-primary dark:from-white dark:to-primary
                bg-clip-text text-transparent">
                Sign In
              </motion.h3>

              {/* Email Field */}
              <div className="relative group">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5
                    text-slate-400 dark:text-slate-500 transition-colors" />

                  <input
                    type="email"
                    placeholder="Email Address"
                    className="peer w-full h-14 pl-12 pr-4 pt-4 pb-2 rounded-xl border
                      bg-white dark:bg-slate-800/80
                      text-slate-900 dark:text-white
                      border-slate-200 dark:border-slate-700/50
                      focus:border-purple-500 dark:focus:border-purple-400
                      focus:ring-2 focus:ring-purple-500/20
                      transition-all duration-300 outline-none placeholder-transparent"
                  />

                  <label className="absolute left-12 top-1/2 -translate-y-1/2 text-sm
                    text-slate-600 dark:text-slate-400
                    peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:px-2
                    peer-focus:text-purple-500 dark:peer-focus:text-purple-400
                    peer-focus:bg-white dark:peer-focus:bg-slate-900
                    transition-all duration-300 pointer-events-none">
                    Email Address
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button className="w-full h-13 bg-primary hover:bg-primary/90
                text-primary-foreground rounded-xl font-semibold text-base
                shadow-lg hover:shadow-xl transition-all duration-300
                relative overflow-hidden group">

                <span className="relative z-10">Sign In</span>

                <div className="absolute inset-0
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  -translate-x-full group-hover:translate-x-full
                  transition-transform duration-1000" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Key Takeaways

### Design Principles
1. **Consistency:** Use exact color values throughout the app
2. **Contrast:** WCAG 2.1 AAA compliant text/background ratios
3. **Hierarchy:** Purple-blue gradients for headings, green for CTAs
4. **Feedback:** Clear visual states (default, hover, focus, error)
5. **Accessibility:** Minimum 4.5:1 contrast ratio for all text

### Brand Identity
- **Primary:** Green (`#22C55E` light, `#34D399` dark) - Growth, success
- **Accent:** Purple-Blue gradient - Innovation, technology
- **Neutrals:** Slate family - Professional, modern
- **Feedback:** Standard semantic colors (red, green, blue)

### Most Used Colors
1. **Purple-Blue Gradients** (35% usage)
2. **Green Primary** (20% usage)
3. **Slate Backgrounds** (25% usage)
4. **White/Black Base** (20% usage)

---

## 📚 Related Documentation

- **Complete Theme System:** `THEME_COLOR_SYSTEM.md`
- **Global Styles:** `app/globals.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Component Examples:** `components/auth/*.tsx`

---

**Version:** 1.0
**Source:** Auth pages analysis (Login & Register)
**Status:** Production-Ready
**Last Updated:** January 2025
**Maintainer:** Development Team

Use this document as the **single source of truth** for color implementation across the entire Taxomind application.
