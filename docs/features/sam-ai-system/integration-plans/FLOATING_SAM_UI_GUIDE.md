# Floating SAM - Visual UI Guide

## 🎨 Visual Mockup

### Closed State (Trigger Button)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│                                        ⚫       │  ← Green pulse indicator
│                                    ┌───────┐   │
│                                    │       │   │
│                                    │   ✨  │   │  ← Gradient button (blue→purple→pink)
│                                    │       │   │     Sparkles icon
│                                    └───────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
                Bottom-right corner (default)
```

### Open State - Quick Mode (Default)

```
┌────────────────────────────────────────────────┐
│ ⋮⋮ ✨ SAM                    [_] [X]          │  ← Draggable header
│    Smart Adaptive Mentor                       │     Gradient background
├────────────────────────────────────────────────┤
│ ⚡ Quick  │ 💬 Chat │ 📈 Analyze               │  ← Mode tabs
├────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ⚫ Active Field                          │   │  ← Context card
│ │ Course Title                             │   │     (gradient background)
│ │ [UNDERSTAND]                             │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Quick Actions                                   │
│ ┌──────────┐ ┌──────────┐                     │
│ │ 🎯       │ │ 📈       │                     │
│ │ Improve  │ │ Elevate  │                     │
│ │ This     │ │ Level    │                     │
│ └──────────┘ └──────────┘                     │
│ ┌──────────┐ ┌──────────┐                     │
│ │ 📖       │ │ ✨       │                     │
│ │ Add      │ │ Generate │                     │
│ │ Examples │ │ Ideas    │                     │
│ └──────────┘ └──────────┘                     │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Course Health                            │   │  ← Analytics widget
│ │ Cognitive Depth           65%           │   │
│ │ ████████████████░░░░░░░░                │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
    400px × 600px (draggable)
```

### Open State - Chat Mode

```
┌────────────────────────────────────────────────┐
│ ⋮⋮ ✨ SAM                    [_] [X]          │
│    Smart Adaptive Mentor                       │
├────────────────────────────────────────────────┤
│   Quick  │ ⚡ Chat │  Analyze                  │  ← Chat tab active
├────────────────────────────────────────────────┤
│                                                 │
│                  ┌──────────────────────┐      │
│                  │ How can I improve    │      │  ← User message
│                  │ this section?        │      │     (blue gradient)
│                  └──────────────────────┘      │
│                                                 │
│ ┌──────────────────────┐                      │
│ │ You could elevate to │                      │  ← SAM response
│ │ APPLY level by adding│                      │     (white background)
│ │ practical exercises. │                      │
│ └──────────────────────┘                      │
│                                                 │
│ ┌──────────────────────┐                      │
│ │ ●●● Thinking...      │                      │  ← Typing indicator
│ └──────────────────────┘                      │     (bouncing dots)
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Ask anything...              ] [⚡]           │  ← Input area (chat only)
└─────────────────────────────────────────────────┘
```

### Open State - Analyze Mode

```
┌────────────────────────────────────────────────┐
│ ⋮⋮ ✨ SAM                    [_] [X]          │
│    Smart Adaptive Mentor                       │
├────────────────────────────────────────────────┤
│   Quick  │  Chat │ ⚡ Analyze                  │  ← Analyze tab active
├────────────────────────────────────────────────┤
│                                                 │
│ Bloom's Distribution                           │
│                                                 │
│ REMEMBER      ████████░░░░░░░░░░  20%         │  ← Progress bars
│ UNDERSTAND    ████████████████░░░░  40%         │     (gradient fills)
│ APPLY         ██████████░░░░░░░░░░  25%         │
│ ANALYZE       ████░░░░░░░░░░░░░░░░  10%         │
│ EVALUATE      ██░░░░░░░░░░░░░░░░░░   5%         │
│ CREATE        ░░░░░░░░░░░░░░░░░░░░   0%         │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ⚠ Consider balancing cognitive levels   │   │  ← Balance indicator
│ │   Focus too heavy on lower levels       │   │     (orange if unbalanced)
│ └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Minimized State

```
┌────────────────────────────────────────────────┐
│ ⋮⋮ ✨ SAM                    [□] [X]          │  ← Compact header only
│    Smart Adaptive Mentor                       │     320px × 80px
└────────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Primary Gradients

```
Header Gradient:
┌──────────────────────────────────────────┐
│ BLUE (600)  →  PURPLE (600)  →  PINK (600) │
│ #2563eb       #9333ea          #db2777  │
└──────────────────────────────────────────┘

Progress Bar Gradient:
┌──────────────────────────────────────────┐
│ BLUE (500)  →  PURPLE (500)             │
│ #3b82f6       #a855f7                   │
└──────────────────────────────────────────┘
```

### Action Button Colors

```
BLUE Actions (Improve This):
├─ Border: blue-200 (#bfdbfe)
├─ Background: white → blue-50 (#eff6ff)
└─ Text/Icon: blue-600 (#2563eb)

PURPLE Actions (Elevate Level):
├─ Border: purple-200 (#e9d5ff)
├─ Background: white → purple-50 (#faf5ff)
└─ Text/Icon: purple-600 (#9333ea)

PINK Actions (Add Examples):
├─ Border: pink-200 (#fbcfe8)
├─ Background: white → pink-50 (#fdf2f8)
└─ Text/Icon: pink-600 (#db2777)

INDIGO Actions (Generate Ideas):
├─ Border: indigo-200 (#c7d2fe)
├─ Background: white → indigo-50 (#eef2ff)
└─ Text/Icon: indigo-600 (#4f46e5)
```

### Status Colors

```
Active Indicator:
└─ Green-500 (#22c55e) with pulse animation

Processing Dots:
├─ Dot 1: Blue-600 (#2563eb)
├─ Dot 2: Purple-600 (#9333ea)
└─ Dot 3: Pink-600 (#db2777)

Success State:
├─ Background: green-50 (#f0fdf4)
└─ Border: green-200 (#bbf7d0)

Warning State:
├─ Background: orange-50 (#fff7ed)
└─ Border: orange-200 (#fed7aa)
```

---

## 📐 Spacing & Dimensions

### Modal Dimensions

```
Normal State:
┌─────────────┐
│    400px    │
│             │  600px
│             │
└─────────────┘

Minimized State:
┌─────────────┐
│    320px    │  80px
└─────────────┘
```

### Internal Spacing

```
Padding:
├─ Header: px-4 py-3 (16px horizontal, 12px vertical)
├─ Content: p-4 (16px all sides)
└─ Input: p-3 (12px all sides)

Gaps:
├─ Header elements: gap-3 (12px)
├─ Quick action grid: gap-2 (8px)
├─ Mode tabs: (no gap, flush)
└─ Chat messages: space-y-3 (12px vertical)

Margins from viewport:
├─ Bottom: 24px
└─ Right: 24px
```

### Border Radius

```
┌─────── 16px (rounded-2xl) ───────┐
│ Modal corners                     │
└───────────────────────────────────┘

┌─────── 12px (rounded-xl) ────────┐
│ Button corners, Input fields      │
└───────────────────────────────────┘

┌─────── 9999px (rounded-full) ────┐
│ Badges, Active indicator          │
└───────────────────────────────────┘
```

---

## 🎭 Animation Timings

### Hover Effects

```
Trigger Button:
└─ scale(1.05) + shadow (duration: 300ms)

Sparkles Icon:
└─ rotate(12deg) (duration: 200ms)

Quick Action Buttons:
├─ Border color change (instant)
├─ Shadow elevation (duration: 150ms)
└─ Icon scale(1.1) (duration: 200ms)
```

### State Transitions

```
Open/Close:
└─ all properties (duration: 300ms, ease)

Mode Switching:
└─ opacity fade (duration: 200ms, ease-in-out)

Drag:
├─ During drag: none (instant positioning)
└─ After drag: all (duration: 300ms, ease)
```

### Loading Animations

```
Pulse (Active Indicator):
└─ Infinite pulse (duration: 2s)

Bounce (Typing Dots):
├─ Dot 1: 0ms delay
├─ Dot 2: 100ms delay
└─ Dot 3: 200ms delay
   (duration: 1s, infinite)
```

---

## 🖱️ Interaction States

### Trigger Button

```
Default:
└─ Gradient background, white icon, shadow-2xl

Hover:
├─ scale(1.05)
├─ shadow-blue-500/50 (colored shadow)
└─ Sparkles rotate(12deg)

Active:
└─ scale(1.0) (click feedback)

Disabled:
└─ (N/A - always enabled)
```

### Quick Action Buttons

```
Default:
├─ White→color gradient background
├─ Colored border
└─ Color icon

Hover:
├─ Darker border
├─ Shadow-md
└─ Icon scale(1.1)

Active:
└─ (Same as hover)

Disabled:
├─ opacity-50
└─ cursor-not-allowed
```

### Drag Header

```
Default:
└─ cursor-grab

Hover:
└─ cursor-grab (same)

Dragging:
├─ cursor-grabbing
├─ shadow-blue-500/30
└─ No transition (instant movement)
```

### Mode Tabs

```
Active Tab:
├─ bg-white
├─ text-blue-600
└─ border-b-2 border-blue-600

Inactive Tab:
├─ bg-transparent (gray-50/50 on container)
├─ text-gray-500
└─ No border

Hover (Inactive):
└─ bg-gray-100
```

---

## 📱 Responsive Breakpoints

### Current Implementation

```
Desktop (All Sizes):
├─ Width: 400px (fixed)
├─ Height: 600px (fixed)
├─ Draggable: Yes
└─ Position: Absolute (user-defined)
```

### Future Mobile Support

```
Mobile (<768px):
├─ Width: 100vw (full width)
├─ Height: 100vh or 80vh (bottom sheet)
├─ Draggable: No (swipe to dismiss)
└─ Position: Fixed bottom

Tablet (768px-1024px):
├─ Width: 380px
├─ Height: 550px
├─ Draggable: Yes (with touch support)
└─ Position: Bottom-right by default
```

---

## 🎯 Interactive Hotspots

### Click Zones

```
┌────────────────────────────────────────────────┐
│ [DRAG AREA ⋮⋮]     [✨ SAM]      [_][X]      │  ← Header
│                                                 │
├────────────────────────────────────────────────┤
│ [Mode 1] [Mode 2] [Mode 3]                    │  ← Tabs
├────────────────────────────────────────────────┤
│                                                 │
│ [Context Card - Read Only]                     │
│                                                 │
│ [Action 1] [Action 2]                          │  ← Clickable
│ [Action 3] [Action 4]                          │
│                                                 │
│ [Analytics Widget - Read Only]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Input Field................] [Send Button]    │  ← Input (chat mode)
└─────────────────────────────────────────────────┘

Legend:
[DRAG AREA] - Mouse down + move to drag
[_][X] - Minimize/Close buttons
[Mode N] - Switch interaction mode
[Action N] - Trigger quick action
[Send Button] - Submit message
```

---

## 🎨 Icon Reference

### Lucide React Icons Used

```
Header:
├─ GripVertical - Drag handle
├─ Sparkles - SAM branding
├─ Minimize2 - Minimize button
├─ Maximize2 - Maximize button
└─ X - Close button

Mode Tabs:
├─ Zap - Quick mode
├─ MessageSquare - Chat mode
└─ TrendingUp - Analyze mode

Quick Actions:
├─ Target - Improve This
├─ TrendingUp - Elevate Level
├─ BookOpen - Add Examples
└─ Sparkles - Generate Ideas
```

---

## 🔄 User Flow Diagrams

### Quick Action Flow

```
Start: User focuses field
    ↓
SAM opens (if closed) or updates (if open)
    ↓
Active Field card shows: "Course Title" + UNDERSTAND badge
    ↓
User sees 4 quick action buttons
    ↓
User clicks "Elevate Level"
    ↓
Mode switches to Chat automatically
    ↓
API call: POST /api/sam/contextual-help
    ↓
Response appears as message
    ↓
User can: Continue chat | Switch to Analyze | Switch to Quick
```

### Drag Interaction Flow

```
Start: User hovers header
    ↓
Cursor: grab
    ↓
User clicks and holds
    ↓
Cursor: grabbing
Shadow: blue-500/30
Transition: none
    ↓
User moves mouse
    ↓
SAM window follows (constrained to viewport)
    ↓
User releases mouse
    ↓
Position locks
Cursor: grab
Shadow: normal
Transition: 300ms ease
```

### Mode Switching Flow

```
Quick Mode:
├─ Shows: Context card + Actions + Analytics
├─ Input: Hidden
└─ Default state

       ↓ (User clicks Chat tab)

Chat Mode:
├─ Shows: Messages
├─ Input: Visible
└─ Conversation state

       ↓ (User clicks Analyze tab)

Analyze Mode:
├─ Shows: Bloom's distribution charts
├─ Input: Hidden
└─ Analytics state
```

---

## 📊 Component Hierarchy

```
<FloatingSAM>
│
├─ [Closed]
│  └─ Trigger Button
│     ├─ Sparkles Icon
│     └─ Active Indicator (green pulse)
│
└─ [Open]
   ├─ Header (draggable)
   │  ├─ GripVertical Icon
   │  ├─ SAM Branding
   │  └─ Control Buttons (Minimize, Close)
   │
   ├─ Mode Selector
   │  ├─ <ModeTab mode="quick" />
   │  ├─ <ModeTab mode="chat" />
   │  └─ <ModeTab mode="analyze" />
   │
   ├─ Content Area (conditional)
   │  │
   │  ├─ [Quick Mode]
   │  │  └─ <QuickActionsView>
   │  │     ├─ Active Field Card
   │  │     ├─ Quick Action Buttons (2×2 grid)
   │  │     └─ Course Health Widget
   │  │
   │  ├─ [Chat Mode]
   │  │  └─ <ChatView>
   │  │     ├─ Message List
   │  │     ├─ Typing Indicator
   │  │     └─ Empty State
   │  │
   │  └─ [Analyze Mode]
   │     └─ <AnalyzeView>
   │        ├─ Distribution Charts
   │        └─ Balance Indicator
   │
   └─ Input Area (chat mode only)
      ├─ Text Input
      └─ Send Button
```

---

## 🎨 Design System Tokens

```typescript
// Export for consistent styling across app

export const SAM_DESIGN_TOKENS = {
  colors: {
    primary: {
      gradient: 'from-blue-600 via-purple-600 to-pink-600',
      blue: '#2563eb',
      purple: '#9333ea',
      pink: '#db2777',
    },
    actions: {
      blue: { border: '#bfdbfe', bg: '#eff6ff', text: '#2563eb' },
      purple: { border: '#e9d5ff', bg: '#faf5ff', text: '#9333ea' },
      pink: { border: '#fbcfe8', bg: '#fdf2f8', text: '#db2777' },
      indigo: { border: '#c7d2fe', bg: '#eef2ff', text: '#4f46e5' },
    },
    status: {
      active: '#22c55e',
      success: { bg: '#f0fdf4', border: '#bbf7d0' },
      warning: { bg: '#fff7ed', border: '#fed7aa' },
    },
  },
  spacing: {
    modal: { width: 400, height: 600 },
    minimized: { width: 320, height: 80 },
    margin: { bottom: 24, right: 24 },
    padding: { header: '16px 12px', content: '16px', input: '12px' },
  },
  borderRadius: {
    modal: '16px',
    button: '12px',
    badge: '9999px',
  },
  animation: {
    transition: '300ms ease',
    hover: '150ms ease-out',
    pulse: '2s infinite',
    bounce: '1s infinite',
  },
};
```

---

## ✨ Best Practices for Customization

### Changing Colors

```typescript
// To change primary gradient:
// Find: from-blue-600 via-purple-600 to-pink-600
// Replace with: from-yourColor-600 via-yourColor-600 to-yourColor-600

// To change action button colors:
// Update the 'actions' array in QuickActionsView
// Modify the 'color' property for each action
```

### Adjusting Dimensions

```typescript
// To change modal size:
// Find: w-[400px] h-[600px]
// Replace with: w-[yourWidth] h-[yourHeight]

// To change minimized size:
// Find: w-80 h-20 (320px × 80px)
// Replace with: w-[yourWidth] h-[yourHeight]
```

### Adding New Quick Actions

```typescript
// In QuickActionsView component:
const actions = [
  // Add new action:
  {
    icon: YourIcon,
    label: 'Your Action',
    prompt: 'Your prompt for SAM',
    color: 'blue' | 'purple' | 'pink' | 'indigo'
  },
  // ... existing actions
];
```

### Customizing Modes

```typescript
// To add a new mode:
// 1. Update type: type InteractionMode = 'quick' | 'chat' | 'analyze' | 'yourMode';
// 2. Add ModeTab in JSX
// 3. Create YourModeView component
// 4. Add conditional rendering in Content Area
```

---

**Last Updated**: January 2025
**Design System Version**: 1.0
**Component Status**: ✅ Production Ready
