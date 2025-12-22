# Blog Theme Guide - Editorial Style

This document defines the design system for blog pages in Taxomind. Use these colors, typography, and patterns for consistent styling across all blog-related pages.

---

## Color Palette

### Primary Colors (Warm Earth Tones)

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Terracotta** | `#C65D3B` | Primary accent, buttons, badges, links |
| **Terracotta Dark** | `#A84D32` | Hover states, gradients |
| **Terracotta Light** | `#D97F5F` | Borders, subtle accents |
| **Sage** | `#87A878` | Secondary accent, success states |
| **Sage Light** | `#A8C49A` | Subtle highlights |
| **Gold** | `#C4A35A` | Tertiary accent, premium indicators |
| **Cream** | `#FAF6F1` | Background |
| **Cream Dark** | `#F5EDE3` | Surface/cards |

### Text Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Text Primary** | `#3D2E1F` | Headings, important text |
| **Text Muted** | `#6B5D4D` | Body text, descriptions |
| **Text Light** | `#A89888` | Subtle text, captions |

### Tailwind Classes

```tsx
// Primary accent (terracotta)
"bg-[#C65D3B]"           // Background
"text-[#C65D3B]"         // Text color
"border-[#C65D3B]"       // Border
"hover:bg-[#A84D32]"     // Hover state

// Secondary accent (sage)
"bg-[#87A878]"
"text-[#87A878]"

// Gold accent
"bg-[#C4A35A]"
"text-[#C4A35A]"

// Background colors
"bg-[#FAF6F1]"           // Cream background
"bg-[#F5EDE3]"           // Surface/card background

// Text colors
"text-slate-800"         // Primary text (light mode)
"text-slate-600"         // Muted text (light mode)
"dark:text-white"        // Primary text (dark mode)
"dark:text-slate-300"    // Muted text (dark mode)
```

---

## Typography

### Font Families

| Font | Variable | Usage |
|------|----------|-------|
| **Playfair Display** | `--font-display` | Headings, titles |
| **Source Serif 4** | `--font-body` | Body text, paragraphs |
| **Inter** | `--font-ui` | UI elements, buttons, badges |

### Tailwind Classes

```tsx
// Display font (Playfair Display) - For headings
"font-[family-name:var(--font-display)]"

// Body font (Source Serif 4) - For content
"font-[family-name:var(--font-body)]"

// UI font (Inter) - For buttons, badges, labels
"font-[family-name:var(--font-ui)]"
```

### Typography Patterns

```tsx
// Page title
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white font-[family-name:var(--font-display)] tracking-tight">
  Title Here
</h1>

// Section heading
<h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white font-[family-name:var(--font-display)]">
  Section Title
</h2>

// Body paragraph
<p className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-[family-name:var(--font-body)] leading-[1.8]">
  Body text content here...
</p>

// UI label/button text
<span className="text-sm font-medium font-[family-name:var(--font-ui)]">
  Button Text
</span>
```

---

## Component Patterns

### Buttons

```tsx
// Primary Button (Terracotta)
<button className="px-4 py-2 bg-[#C65D3B] text-white rounded-lg text-sm font-medium hover:bg-[#A84D32] transition-colors shadow-md font-[family-name:var(--font-ui)]">
  Primary Action
</button>

// Secondary Button
<button className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors font-[family-name:var(--font-ui)]">
  Secondary Action
</button>

// Ghost Button
<button className="px-4 py-2 text-[#C65D3B] hover:bg-[#C65D3B]/10 rounded-lg text-sm font-medium transition-colors font-[family-name:var(--font-ui)]">
  Ghost Action
</button>
```

### Badges

```tsx
// Chapter Badge
<span className="px-3 py-1.5 bg-[#C65D3B] text-white rounded-full text-xs font-medium shadow-lg font-[family-name:var(--font-ui)]">
  Chapter 1
</span>

// Category Badge
<span className="px-3 py-1 bg-[#87A878]/10 text-[#87A878] border border-[#87A878]/30 rounded-full text-xs font-medium font-[family-name:var(--font-ui)]">
  Category
</span>

// Free Badge
<span className="px-2 py-1 bg-[#87A878] text-white rounded-full text-xs font-medium font-[family-name:var(--font-ui)]">
  Free
</span>
```

### Cards

```tsx
// Blog Card
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
  {/* Image */}
  <div className="relative h-48 w-full">
    <Image src={imageUrl} alt={title} fill className="object-cover" />
  </div>

  {/* Content */}
  <div className="p-4">
    <h3 className="text-lg font-bold text-slate-800 dark:text-white font-[family-name:var(--font-display)] mb-2">
      {title}
    </h3>
    <p className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)] line-clamp-2">
      {description}
    </p>
  </div>
</div>
```

### Content Prose

```tsx
// For rich text content areas
<div className={cn(
  "prose prose-lg dark:prose-invert max-w-none",
  "font-[family-name:var(--font-body)]",
  "prose-headings:font-[family-name:var(--font-display)]",
  "prose-headings:text-slate-800 dark:prose-headings:text-white",
  "prose-p:text-slate-600 dark:prose-p:text-slate-300",
  "prose-p:leading-[1.8]",
  "prose-a:text-[#C65D3B] dark:prose-a:text-[#D97F5F]",
  "prose-strong:text-slate-800 dark:prose-strong:text-white",
  "prose-blockquote:border-l-[#C65D3B] prose-blockquote:bg-[#C65D3B]/5",
  "prose-code:text-[#87A878]"
)}>
  {content}
</div>
```

---

## Decorative Elements

### Dividers

```tsx
// Gradient divider
<div className="h-px w-full bg-gradient-to-r from-transparent via-[#C65D3B]/30 to-transparent" />

// Decorative dots
<div className="flex items-center gap-2">
  <div className="h-2 w-2 rounded-full bg-[#C65D3B]/50" />
  <div className="h-2 w-2 rounded-full bg-[#87A878]/50" />
  <div className="h-2 w-2 rounded-full bg-[#C4A35A]/50" />
</div>
```

### Progress Bar

```tsx
// Reading progress bar
<div className="h-1 bg-slate-200 dark:bg-slate-800">
  <div
    className="h-full bg-gradient-to-r from-[#C65D3B] via-[#87A878] to-[#C4A35A]"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## Dark Mode Support

All components support dark mode using Tailwind's `dark:` prefix:

```tsx
// Example with dark mode
<div className="bg-[#FAF6F1] dark:bg-slate-900 text-slate-800 dark:text-white">
  <h1 className="text-[#C65D3B] dark:text-[#D97F5F]">
    Heading
  </h1>
</div>
```

---

## Animation Classes

These CSS classes are defined in `globals.css` for blog animations:

```tsx
// Staggered reveal animation
"blog-content-reveal"       // Base animation class
"blog-delay-1"             // 100ms delay
"blog-delay-2"             // 200ms delay
"blog-delay-3"             // 300ms delay
"blog-delay-4"             // 400ms delay
"blog-delay-5"             // 500ms delay
"blog-delay-6"             // 600ms delay
"blog-delay-7"             // 700ms delay

// Usage
<div className="blog-content-reveal blog-delay-3">
  Content with 300ms delay animation
</div>
```

---

## Quick Reference

### Most Used Classes

```tsx
// Terracotta background
"bg-[#C65D3B]"

// Cream background
"bg-[#FAF6F1]"

// Display font (headings)
"font-[family-name:var(--font-display)]"

// Body font (content)
"font-[family-name:var(--font-body)]"

// UI font (buttons)
"font-[family-name:var(--font-ui)]"

// Text colors
"text-slate-800 dark:text-white"      // Primary
"text-slate-600 dark:text-slate-300"  // Muted

// Line height for body text
"leading-[1.8]"
```

---

## File References

- **Global Styles**: `app/globals.css` (contains CSS variables and animations)
- **Tailwind Config**: `tailwind.config.ts` (contains blog color definitions)
- **Layout**: `app/layout.tsx` (contains Google Font imports)

---

*Last Updated: December 2024*
*Design System Version: 1.0*
