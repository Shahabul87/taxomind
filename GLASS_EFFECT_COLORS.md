# Glass Effect Color Palette 🎨

This document defines the color scheme and glass effect design system used in the AI Course Creator page.

## Background Gradients

### Primary Background
```css
/* Light Mode */
bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50

/* Dark Mode */
dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
```

### Floating Orbs (Background Effects)
```css
/* Top Right Orb */
bg-gradient-to-br from-purple-400/20 to-pink-400/20

/* Bottom Left Orb */
bg-gradient-to-br from-blue-400/20 to-cyan-400/20

/* Center Orb */
bg-gradient-to-br from-indigo-400/10 to-purple-400/10
```

## Glass Effects

### Primary Glass Cards
```css
/* Main Content Cards */
backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20

/* Secondary Glass Elements */
bg-white/50 dark:bg-slate-900/50 border-white/20

/* Tertiary Glass Elements */
bg-white/30 dark:bg-slate-800/30 border-white/20
```

### Interactive Glass Elements
```css
/* Hover States */
hover:bg-white/50 dark:hover:bg-slate-800/50

/* Active/Selected States */
bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-300 dark:border-purple-600
```

## Button Gradients

### Primary Action Buttons
```css
bg-gradient-to-r from-purple-500 to-indigo-500
hover:from-purple-600 hover:to-indigo-600
```

### Step Indicators
```css
/* Current Step */
bg-gradient-to-r from-purple-500 to-indigo-500

/* Completed Step */
bg-gradient-to-r from-green-500 to-emerald-500
```

## Text Gradients

### Headings
```css
bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent
```

## Sam Suggestion Box

### Background
```css
bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10
border border-white/20
```

### Icon Background
```css
bg-white/50 dark:bg-black/20
```

## Color Opacity Scale

### Glass Effect Opacity Levels
- **10%** (`/10`) - Subtle background tints
- **20%** (`/20`) - Floating orbs and active states  
- **30%** (`/30`) - Tertiary glass elements
- **50%** (`/50`) - Secondary glass elements and hover states
- **70%** (`/70`) - Primary glass elements

### Border Opacity
- **20%** (`border-white/20`) - Standard glass borders
- **50%** (`border-white/50`) - Stronger definition borders

## Usage Guidelines

### ✅ Do's
- Use backdrop-blur effects for main content areas
- Layer multiple glass elements with different opacity levels
- Combine with subtle gradients for depth
- Use consistent border-white/20 for glass borders
- Apply smooth transitions for interactive elements

### ❌ Don'ts  
- Don't use solid backgrounds over glass effects
- Avoid high opacity that defeats the glass aesthetic
- Don't mix too many different blur levels
- Avoid harsh borders that break the glass illusion

## Implementation Examples

### Glass Card Component
```tsx
<Card className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Glass Input Field
```tsx
<Input className="bg-white/50 dark:bg-slate-900/50 border-white/20" />
```

### Glass Button (Secondary)
```tsx
<Button className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
  Action
</Button>
```

### Glass Alert/Notification
```tsx
<Alert className="border-0 shadow-lg backdrop-blur-md bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-white/20">
  <AlertDescription>
    Glass effect notification content
  </AlertDescription>
</Alert>
```

## Browser Support

The glass effects use modern CSS features:
- `backdrop-filter: blur()` - Supported in all modern browsers
- CSS gradients with opacity - Universal support
- Border opacity - Universal support

For older browsers, fallbacks are provided through the Tailwind CSS framework.

---

*This design system creates a modern, elegant interface that feels lightweight and premium while maintaining excellent readability and accessibility.*