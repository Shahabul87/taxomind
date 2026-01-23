# Unified Header Merge Plan

## Executive Summary

This document outlines a comprehensive plan to merge the **SmartHeader** and **ViewToggle** (from NewDashboard) into a single, cohesive enterprise-level header component. The goal is to eliminate duplicate functionality (particularly the two notification bells), reduce vertical space consumption, and create a polished, professional user experience.

---

## 1. Current Architecture Analysis

### 1.1 SmartHeader (`components/dashboard/smart-header.tsx`)
**Location:** Fixed at top, `h-16` (64px), `z-40`
**Contents:**
- 🏠 TaxoMind Logo (links to home)
- 📍 Quick Navigation: Dashboard, Courses, My Courses (desktop only)
- 🔲 View Mode Toggle (grid/list)
- ➕ Quick Create dropdown (6 actions)
- 🔍 Search button (desktop only)
- 📊 StudyStatusBadge (compact)
- 🔔 **LearningNotificationBell** ← Notification #1
- 🟢 PresenceIndicator (Online/Away status)
- 👤 User Menu dropdown

### 1.2 ViewToggle (`NewDashboard.tsx` lines 310-403)
**Location:** Fixed at `top-16`, below SmartHeader
**Contents:**
- 🔔 **NotificationCenterTrigger** ← Notification #2 (DUPLICATE)
- Tab Navigation (9 tabs):
  - Learning, Skills, Practice, Achievements, Gaps, Innovation, Discover, Create, Assess

### 1.3 Problems Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| Two notification bells | 🔴 High | User confusion, inconsistent UX |
| Double header height | 🟠 Medium | Reduced content viewport |
| Fragmented navigation | 🟠 Medium | Split mental model |
| Duplicate glass morphism | 🟡 Low | Performance overhead |
| Non-cohesive design | 🟠 Medium | Unprofessional appearance |

---

## 2. Design Vision

### 2.1 Enterprise Design Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✓ Single Source of Truth: One header, one navigation system                 │
│ ✓ Visual Hierarchy: Clear primary/secondary action distinction              │
│ ✓ Information Density: Maximum utility in minimum vertical space           │
│ ✓ Responsive First: Adaptive layouts for all screen sizes                  │
│ ✓ Micro-interactions: Subtle animations that delight without distraction   │
│ ✓ Accessibility: Full keyboard navigation and screen reader support        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Unified Header Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════════════════════╗ │
│ ║ [🧠 TaxoMind]  [📊 Dashboard] [📚 Courses]            ──────────────────  ║ │
│ ║                                                                            ║ │
│ ║    [Learning] [Skills] [Practice] [Achievements] [Gaps] ...  │ 🔎 │+│🔔│👤│ ║ │
│ ╚═══════════════════════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     ↓
                          SINGLE UNIFIED HEADER
                          Height: 72px (from 64px + ~56px = 120px)
                          Saves: ~48px vertical space
```

---

## 3. Proposed Design: UnifiedDashboardHeader

### 3.1 Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [🧠] TaxoMind  │  [📊Dashboard] [📚Courses]  │  ═════ Tab Navigation ═════════ │
│                 │                              │                                 │
│  ════════════════════════════════════════════════════════════════════════════  │
│                                                                                 │
│  [Learning] [Skills] [Practice] [Achievements] [Gaps] [Innovation] [Discover]  │
│  [Create] [Assess✨]                                                            │
│                                              [🔍] [+] [📊Status] [🔔] [🟢] [👤] │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Height: 72px
- Primary Row (40px): Brand, Quick Nav, Actions
- Secondary Row (32px): Tab Navigation with scroll indicators
```

### 3.2 Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [🧠] TaxoMind                                    [🔍] [+] [🔔] [🟢] [👤]       │
│                                                                                 │
│  ◀ [Learning] [Skills] [Practice] [Achievements] [Gaps] [Innovation] ... ▶     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Height: 80px
- Primary Row: Brand + Actions (collapsed Quick Nav into hamburger)
- Secondary Row: Scrollable tabs with gradient fade edges
```

### 3.3 Mobile Layout (<768px)

```
┌──────────────────────────────────────────────────┐
│  [≡]  [🧠] TaxoMind              [🔔] [👤]       │
│                                                  │
│  ◀ [📊] [🎯] [⏱] [🏆] [⚠] [💡] [🧭] [✨] [📝] ▶  │
│                                                  │
└──────────────────────────────────────────────────┘

Height: 64px (same as before but now includes ALL functionality)
- Primary Row: Hamburger menu, Brand, Notification, Avatar
- Secondary Row: Icon-only tabs with horizontal scroll
```

---

## 4. Component Architecture

### 4.1 File Structure

```
components/dashboard/
├── unified-header/
│   ├── UnifiedDashboardHeader.tsx      # Main component (NEW)
│   ├── UnifiedHeaderClient.tsx         # Client wrapper with dynamic import
│   ├── components/
│   │   ├── BrandSection.tsx            # Logo + Brand name
│   │   ├── QuickNavigation.tsx         # Dashboard, Courses links
│   │   ├── TabNavigation.tsx           # All 9 dashboard tabs
│   │   ├── ActionGroup.tsx             # Search, Create, Notifications, etc.
│   │   ├── UnifiedNotificationBell.tsx # SINGLE merged notification system
│   │   ├── QuickCreateMenu.tsx         # Extracted from SmartHeader
│   │   ├── UserMenuDropdown.tsx        # Extracted from SmartHeader
│   │   └── MobileMenu.tsx              # Mobile-specific navigation
│   ├── hooks/
│   │   ├── useHeaderVisibility.ts      # Auto-hide logic
│   │   ├── useTabNavigation.ts         # Tab state management
│   │   └── useHeaderKeyboardNav.ts     # Keyboard navigation
│   └── index.ts                        # Barrel export
```

### 4.2 Props Interface

```typescript
interface UnifiedDashboardHeaderProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };

  // Tab Navigation
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;

  // View Mode
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;

  // Quick Actions
  quickActionHandlers?: QuickActionHandlers;

  // Mobile Controls
  onMobileSidebarOpen?: () => void;

  // Visibility Control
  autoHideOnScroll?: boolean;
}

type DashboardView =
  | 'learning'
  | 'skills'
  | 'practice'
  | 'gamification'  // maps to "Achievements"
  | 'gaps'
  | 'innovation'
  | 'discover'
  | 'create'
  | 'assess';
```

### 4.3 State Management

```typescript
// State lifted to DashboardClient.tsx
interface DashboardState {
  activeTab: DashboardView;
  viewMode: 'grid' | 'list';
  isMobileSidebarOpen: boolean;
  // ... modal states
}

// Tab state moved from NewDashboard to DashboardClient
// Eliminates prop drilling and keeps single source of truth
```

---

## 5. Unified Notification System

### 5.1 Current Notifications (to merge)

| Component | Location | Purpose |
|-----------|----------|---------|
| `LearningNotificationBell` | SmartHeader | Learning notifications with preferences |
| `NotificationCenterTrigger` | NewDashboard | GAP-9 comprehensive notification center |

### 5.2 Merged Solution: `UnifiedNotificationBell`

```typescript
interface UnifiedNotificationBellProps {
  variant?: 'full' | 'compact';
  showUnreadCount?: boolean;
  showPreferencesPanel?: boolean;
}

// Features:
// ✓ Single bell icon
// ✓ Combined unread count from all notification sources
// ✓ Unified dropdown with tabs:
//   - All Notifications (merged stream)
//   - Learning (course updates, deadlines)
//   - SAM AI (interventions, check-ins)
//   - System (achievements, milestones)
// ✓ Quick settings access
// ✓ Mark all as read
```

### 5.3 Notification Hierarchy

```
┌─────────────────────────────────────────────┐
│ 🔔 Notifications                    [⚙️] X  │
├─────────────────────────────────────────────┤
│ [All (12)] [Learning (5)] [SAM (4)] [System]│
├─────────────────────────────────────────────┤
│                                             │
│ 🎯 New goal achieved!              2m ago   │
│    You completed "React Basics"             │
│                                             │
│ 📚 Course reminder                 15m ago  │
│    Continue "TypeScript Advanced"           │
│                                             │
│ 🤖 SAM Check-in                    1h ago   │
│    "How's your focus today?"                │
│                                             │
│ ────────────── Load More ──────────────     │
└─────────────────────────────────────────────┘
```

---

## 6. Visual Design Specifications

### 6.1 Color System

```scss
// Light Mode
$header-bg: rgba(255, 255, 255, 0.95);
$header-border: rgba(148, 163, 184, 0.3);  // slate-400/30
$tab-active-bg: linear-gradient(135deg, #6366f1, #8b5cf6);  // indigo-violet
$tab-active-text: white;
$tab-hover-bg: rgba(99, 102, 241, 0.1);  // indigo-500/10

// Dark Mode
$header-bg-dark: rgba(30, 41, 59, 0.95);  // slate-800/95
$header-border-dark: rgba(71, 85, 105, 0.5);  // slate-600/50
$tab-active-bg-dark: linear-gradient(135deg, #818cf8, #a78bfa);  // indigo-400 to violet-400
```

### 6.2 Typography

```scss
// Brand
.brand-text {
  font-size: 1.25rem;  // 20px
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  -webkit-background-clip: text;
  color: transparent;
}

// Tab Labels
.tab-label {
  font-size: 0.875rem;  // 14px
  font-weight: 500;
  letter-spacing: -0.01em;
}

// Quick Nav
.quick-nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: $slate-600;

  &:hover {
    color: $slate-900;
  }
}
```

### 6.3 Spacing System

```scss
$header-height-desktop: 72px;
$header-height-tablet: 80px;
$header-height-mobile: 64px;

$primary-row-height: 40px;
$secondary-row-height: 32px;

$header-padding-x: 1rem;  // 16px mobile
$header-padding-x-md: 1.5rem;  // 24px tablet
$header-padding-x-lg: 2rem;  // 32px desktop

$tab-gap: 0.25rem;  // 4px
$action-gap: 0.5rem;  // 8px
```

### 6.4 Animation Specifications

```scss
// Tab Switch Animation
.tab-indicator {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

// Header Entrance
@keyframes headerSlideIn {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// Mobile Auto-hide
.header-hidden {
  transform: translateY(-100%);
  transition: transform 200ms ease-in;
}

.header-visible {
  transform: translateY(0);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 7. Tab Navigation Design

### 7.1 Tab Items Configuration

```typescript
const dashboardTabs: TabConfig[] = [
  {
    id: 'learning',
    label: 'Learning',
    icon: LayoutDashboard,
    shortLabel: 'Learn',  // For mobile
    gradient: 'from-blue-500 to-indigo-500',
    description: 'AI-powered learning hub',
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Target,
    shortLabel: 'Skills',
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Track skill mastery',
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: Timer,
    shortLabel: 'Practice',
    gradient: 'from-orange-500 to-red-500',
    description: '10,000 hour tracker',
  },
  {
    id: 'gamification',
    label: 'Achievements',
    icon: Trophy,
    shortLabel: 'Awards',
    gradient: 'from-amber-500 to-yellow-500',
    description: 'Badges & leaderboards',
  },
  {
    id: 'gaps',
    label: 'Gaps',
    icon: AlertTriangle,
    shortLabel: 'Gaps',
    gradient: 'from-red-500 to-rose-500',
    description: 'Knowledge gap analysis',
  },
  {
    id: 'innovation',
    label: 'Innovation',
    icon: Lightbulb,
    shortLabel: 'New',
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Experimental features',
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: Compass,
    shortLabel: 'Find',
    gradient: 'from-cyan-500 to-blue-500',
    description: 'Course marketplace',
  },
  {
    id: 'create',
    label: 'Create',
    icon: Wand2,
    shortLabel: 'Create',
    gradient: 'from-violet-500 to-purple-500',
    description: 'Creator studio',
  },
  {
    id: 'assess',
    label: 'Assess',
    icon: ClipboardCheck,
    shortLabel: 'Test',
    gradient: 'from-emerald-500 to-cyan-500',
    description: 'Self-assessment center',
    isPrimary: true,  // Highlight as CTA
  },
];
```

### 7.2 Active Tab Indicator

```tsx
// Animated underline that follows active tab
<motion.div
  layoutId="activeTabIndicator"
  className={cn(
    "absolute bottom-0 left-0 right-0 h-0.5",
    "bg-gradient-to-r",
    activeTab.gradient
  )}
  transition={{
    type: "spring",
    stiffness: 500,
    damping: 30
  }}
/>
```

### 7.3 Scrollable Tabs (Mobile/Tablet)

```tsx
// Horizontal scroll with gradient fade edges
<div className="relative">
  {/* Left gradient fade */}
  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-800 z-10 pointer-events-none" />

  {/* Scrollable container */}
  <div className="overflow-x-auto scrollbar-hide">
    <div className="flex items-center gap-1 px-8 min-w-max">
      {tabs.map(tab => <TabButton key={tab.id} {...tab} />)}
    </div>
  </div>

  {/* Right gradient fade */}
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-800 z-10 pointer-events-none" />
</div>
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Day 1-2)
- [ ] Create `unified-header/` directory structure
- [ ] Extract reusable components from SmartHeader
- [ ] Create base `UnifiedDashboardHeader` shell
- [ ] Implement responsive layout grid

### Phase 2: Tab Navigation (Day 2-3)
- [ ] Build `TabNavigation` component
- [ ] Move tab state from NewDashboard to DashboardClient
- [ ] Implement scrollable tabs for mobile
- [ ] Add animated active indicator

### Phase 3: Notification Merge (Day 3-4)
- [ ] Create `UnifiedNotificationBell` component
- [ ] Merge notification sources
- [ ] Implement unified notification dropdown
- [ ] Add notification preferences access

### Phase 4: Action Group (Day 4-5)
- [ ] Extract `QuickCreateMenu` component
- [ ] Extract `UserMenuDropdown` component
- [ ] Build `ActionGroup` with proper spacing
- [ ] Implement keyboard navigation

### Phase 5: Mobile Optimization (Day 5-6)
- [ ] Build `MobileMenu` component
- [ ] Implement icon-only tabs
- [ ] Add swipe gestures for tab switching
- [ ] Test auto-hide behavior

### Phase 6: Integration & Cleanup (Day 6-7)
- [ ] Update DashboardClient to use new header
- [ ] Remove ViewToggle from NewDashboard
- [ ] Remove old SmartHeader usage
- [ ] Full responsive testing

---

## 9. Migration Strategy

### 9.1 Files to Modify

| File | Action | Details |
|------|--------|---------|
| `components/dashboard/smart-header.tsx` | Deprecate | Mark as deprecated, keep for reference |
| `app/dashboard/user/_components/NewDashboard.tsx` | Modify | Remove ViewToggle component |
| `app/dashboard/user/_components/DashboardClient.tsx` | Modify | Add activeTab state, use UnifiedDashboardHeader |

### 9.2 Breaking Changes

```typescript
// Before: Tab state in NewDashboard
<NewDashboard user={user} viewMode={viewMode} />

// After: Tab state in DashboardClient
const [activeTab, setActiveTab] = useState<DashboardView>('learning');

<UnifiedDashboardHeader
  user={user}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  quickActionHandlers={quickActionHandlers}
/>

<NewDashboard
  user={user}
  viewMode={viewMode}
  activeTab={activeTab}  // Pass down instead of managing internally
/>
```

### 9.3 Backward Compatibility

During transition, keep both headers available:
```typescript
const USE_UNIFIED_HEADER = true; // Feature flag

{USE_UNIFIED_HEADER ? (
  <UnifiedDashboardHeader {...props} />
) : (
  <SmartHeader {...props} />
)}
```

---

## 10. Accessibility Requirements

### 10.1 Keyboard Navigation

```
Tab Order:
1. Logo (link to home)
2. Quick Nav links (Dashboard, Courses)
3. Each tab in order
4. Search button
5. Quick Create button
6. Notification bell
7. Presence indicator (interactive if dropdown)
8. User menu button

Arrow Key Navigation:
- Left/Right: Navigate between tabs
- Enter/Space: Activate tab
- Escape: Close any open dropdown
```

### 10.2 ARIA Labels

```tsx
<nav aria-label="Dashboard navigation">
  <div role="tablist" aria-label="Dashboard sections">
    {tabs.map(tab => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={activeTab === tab.id}
        aria-controls={`tabpanel-${tab.id}`}
        id={`tab-${tab.id}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
</nav>

<button
  aria-label={`Notifications, ${unreadCount} unread`}
  aria-haspopup="dialog"
  aria-expanded={isOpen}
>
  <Bell />
</button>
```

### 10.3 Focus Management

```tsx
// Focus trap in dropdowns
useFocusTrap(dropdownRef, isOpen);

// Return focus when dropdown closes
useEffect(() => {
  if (!isOpen && triggerRef.current) {
    triggerRef.current.focus();
  }
}, [isOpen]);
```

---

## 11. Performance Considerations

### 11.1 Code Splitting

```typescript
// Dynamic imports for heavy components
const QuickCreateMenu = dynamic(
  () => import('./QuickCreateMenu'),
  { ssr: false }
);

const UserMenuDropdown = dynamic(
  () => import('./UserMenuDropdown'),
  { ssr: false }
);

const NotificationDropdown = dynamic(
  () => import('./NotificationDropdown'),
  { ssr: false }
);
```

### 11.2 Memoization

```typescript
// Memoize tab items to prevent re-renders
const MemoizedTabButton = memo(TabButton);

// Memoize handlers
const handleTabChange = useCallback((tab: DashboardView) => {
  setActiveTab(tab);
}, []);
```

### 11.3 Animation Performance

```scss
// Use transform and opacity for animations (GPU accelerated)
.tab-button {
  will-change: transform, opacity;
  transform: translateZ(0); // Force GPU layer
}

// Reduce motion for users who prefer it
@media (prefers-reduced-motion: reduce) {
  .tab-indicator {
    transition: none;
  }
}
```

---

## 12. Testing Checklist

### 12.1 Functional Tests

- [ ] All 9 tabs navigate correctly
- [ ] Notifications show/hide properly
- [ ] Quick Create menu opens/closes
- [ ] User menu dropdown works
- [ ] Search functionality (if expanded)
- [ ] View mode toggle persists
- [ ] Mobile sidebar trigger works

### 12.2 Responsive Tests

- [ ] Desktop (≥1024px): Full layout
- [ ] Tablet (768-1023px): Condensed layout
- [ ] Mobile (<768px): Icon-only tabs, hamburger menu
- [ ] Header auto-hide on mobile scroll
- [ ] Tab scrolling on overflow

### 12.3 Accessibility Tests

- [ ] Keyboard navigation through all elements
- [ ] Screen reader announces tabs correctly
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Reduced motion preference respected

---

## 13. Success Metrics

| Metric | Before | Target | Method |
|--------|--------|--------|--------|
| Header Height | ~120px | 72px | Measure DOM |
| Notification Confusion | 2 bells | 1 bell | Visual audit |
| First Contentful Paint | Baseline | -10% | Lighthouse |
| Layout Shift | Baseline | 0 | CLS measurement |
| Tab Switch Time | Baseline | <100ms | Performance API |

---

## 14. Visual Mockups

### 14.1 Desktop Final Design

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [🧠] TaxoMind   │ Dashboard │ Courses │                                        │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ [📊Learning] [🎯Skills] [⏱Practice] [🏆Achievements] [⚠️Gaps] [💡Innovation]│ │
│  │ [🧭Discover] [✨Create] [📝Assess]                    │🔍│ ➕ │📊│🔔│🟢│👤│ │
│  │ ━━━━━━━━━━━━━━━━━━                                                         │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  backdrop-blur-md bg-white/95 dark:bg-slate-800/95                             │
│  border-b border-slate-200/50                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Color Coding for Tabs

```
Learning      → 💙 Blue/Indigo gradient
Skills        → 💚 Emerald/Teal gradient
Practice      → 🧡 Orange/Red gradient
Achievements  → 💛 Amber/Yellow gradient
Gaps          → ❤️ Red/Rose gradient
Innovation    → 💛 Yellow/Orange gradient
Discover      → 💙 Cyan/Blue gradient
Create        → 💜 Violet/Purple gradient
Assess        → 💚 Emerald/Cyan gradient (highlighted as CTA)
```

---

## 15. Conclusion

This merge plan transforms two fragmented navigation bars into a single, cohesive enterprise header that:

1. **Eliminates Redundancy**: Single notification bell, unified navigation
2. **Saves Space**: ~48px vertical space recovered
3. **Improves UX**: Clear visual hierarchy, consistent interactions
4. **Maintains Features**: All existing functionality preserved
5. **Enhances Accessibility**: Full keyboard navigation, ARIA compliance
6. **Optimizes Performance**: Code splitting, memoization, GPU animations

The phased implementation approach allows for incremental development and testing while maintaining a working product at each stage.

---

*Document Version: 1.0*
*Created: January 2025*
*Author: Claude Code Assistant*
*Status: READY FOR IMPLEMENTATION*
