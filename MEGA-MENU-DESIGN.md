# Mega Menu Design Documentation

## 1. Wireframe & Interaction Notes

### Desktop Mega Menu ("Intelligent LMS")

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  Logo   Courses  Blog  Features  [Intelligent LMS ▼]  Actions  │
└─────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┴─────────────────────────────┐
            │ ┌──────────┬──────────────────────────────────────┐ │
            │ │ Topics   │   Content Grid (Dynamic)             │ │
            │ │ ┌──────┐ │  ┌────────────────┐  ┌──────┐       │ │
            │ │ │ 📊   │ │  │                │  │ Mini │       │ │
            │ │ │ Over-│ │  │  Hero Card     │  │ Card │       │ │
            │ │ │ view │◄┼─▶│  (Featured)    │  ├──────┤       │ │
            │ │ └──────┘ │  │                │  │ Mini │       │ │
            │ │ ┌──────┐ │  └────────────────┘  │ Card │       │ │
            │ │ │ 🧠   │ │                      ├──────┤       │ │
            │ │ │ SAM  │ │  [See all in Topic] │ Mini │       │ │
            │ │ │  AI  │ │                      └──────┘       │ │
            │ │ └──────┘ │  #tag1  #tag2  #tag3                │ │
            │ │ ┌──────┐ │                                      │ │
            │ │ │ 🛡️   │ │                                      │ │
            │ │ │ Eval │ │                                      │ │
            │ │ └──────┘ │                                      │ │
            │ └──────────┴──────────────────────────────────────┘ │
            └─────────────────────────────────────────────────────┘
```

### Compact Menu ("More" Dropdown - 1024-1280px)

```
┌────────────────────────┐
│  More Features ▼       │
└────────────────────────┘
           │
     ┌─────┴─────────────────┐
     │ ┌──────────────┐      │
     │ │ 📋 Features  │ ─►[Preview Popover]
     │ └──────────────┘      │
     │ ┌──────────────┐      │
     │ │ Intelligent LMS:    │
     │ │ ├─ 📊 Overview   ─►[Preview]
     │ │ ├─ 🧠 SAM AI    ─►[Preview]
     │ │ ├─ 🛡️ Eval     ─►[Preview]
     │ │ ├─ ⚡ Adaptive  ─►[Preview]
     │ │ └─ 🎓 Course   ─►[Preview]
     │ └──────────────┘      │
     │ ┌──────────────┐      │
     │ │ AI Tools:           │
     │ │ ├─ 🧠 AI Tutor  ─►[Preview]
     │ │ ├─ 📈 Trends    ─►[Preview]
     │ │ ├─ 📰 News      ─►[Preview]
     │ │ └─ 🔬 Research  ─►[Preview]
     │ └──────────────┘      │
     └────────────────────────┘
```

### Mobile Full-Screen Sheet

```
┌─────────────────────────┐
│ ☰ Menu             ✕    │
├─────────────────────────┤
│ ⚡ Menu  │  👤 User      │ ← Tabs
├─────────────────────────┤
│                         │
│ [Accordion/Tabs:]       │
│                         │
│ ▼ Home                  │
│ ▼ Courses               │
│ ▼ Blog                  │
│ ▼ Features              │
│                         │
│ ▼ Intelligent LMS       │
│   ├─ Overview           │
│   ├─ SAM AI Assistant   │
│   ├─ Evaluations        │
│   └─ ...                │
│                         │
│ ▼ AI Tools              │
│   ├─ AI Tutor           │
│   ├─ Trends             │
│   └─ ...                │
│                         │
└─────────────────────────┘
```

## 2. Design Tokens

### Colors
```typescript
const designTokens = {
  colors: {
    // Accent per topic
    topics: {
      overview: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },    // Purple
      sam: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },         // Blue
      evaluation: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },  // Emerald
      adaptive: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },    // Amber
      course: { primary: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' },       // Cyan
    },

    // UI colors
    background: {
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(15, 23, 42, 0.95)',
    },

    border: {
      light: 'rgba(226, 232, 240, 0.8)',
      dark: 'rgba(51, 65, 85, 0.8)',
    },

    text: {
      primary: { light: '#0F172A', dark: '#F8FAFC' },
      secondary: { light: '#475569', dark: '#CBD5E1' },
      muted: { light: '#94A3B8', dark: '#64748B' },
    },
  },

  // Spacing
  spacing: {
    panel: {
      padding: '1rem',        // 16px
      gap: '0.75rem',         // 12px
    },
    card: {
      padding: '1rem',        // 16px
      gap: '0.5rem',          // 8px
    },
  },

  // Border Radius
  radius: {
    card: '0.75rem',          // 12px
    panel: '1rem',            // 16px
    button: '0.5rem',         // 8px
  },

  // Shadows
  shadows: {
    panel: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },

  // Focus styles
  focus: {
    ring: '0 0 0 3px rgba(139, 92, 246, 0.3)',
    outline: '2px solid #8B5CF6',
    offset: '2px',
  },
};
```

### Typography
```typescript
const typography = {
  // Pairing: Inter (sans) + EB Garamond (serif for titles)
  fontFamilies: {
    sans: 'Inter, -apple-system, system-ui, sans-serif',
    serif: 'EB Garamond, Georgia, serif',
  },

  sizes: {
    hero: '1.5rem',         // 24px - Hero card title
    title: '1.125rem',      // 18px - Topic titles
    body: '0.875rem',       // 14px - Card descriptions
    caption: '0.75rem',     // 12px - Meta information
    tiny: '0.625rem',       // 10px - Tags/chips
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};
```

## 3. Component API

### IntelligentLMSMegaMenu

```typescript
interface IntelligentLMSMegaMenuProps {
  // Topics configuration
  topics: Topic[];

  // Content provider
  getContentByTopic: (topicSlug: string) => Promise<ContentItem[]>;

  // Variant
  variant?: 'minimal' | 'rich';

  // Callbacks
  onTopicChange?: (topicSlug: string) => void;
  onItemClick?: (item: ContentItem) => void;
  onSeeAllClick?: (topicSlug: string) => void;

  // Accessibility
  triggerLabel?: string;
  panelId?: string;

  // Behavior
  hoverDelay?: number; // Default: 150ms
  closeDelay?: number; // Default: 200ms
}

interface Topic {
  id: string;
  slug: string;
  label: string;
  icon: React.ComponentType;
  accentHex: string;
  description?: string;
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  image?: string;
  readingTime?: string;
  tag?: string;
  date?: string;
  isFeatured?: boolean;
}
```

### MoreMegaMenu (Compact)

```typescript
interface MoreMegaMenuProps {
  // Categories configuration
  categories: MenuCategory[];

  // Variant
  variant?: 'minimal' | 'rich';

  // Callbacks
  onItemClick?: (item: MenuItem) => void;

  // Accessibility
  triggerLabel?: string;
  panelId?: string;

  // Hover preview
  showHoverPreview?: boolean;
  hoverPreviewDelay?: number; // Default: 120ms
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType;
  description?: string;
  badge?: {
    text: string;
    variant: 'new' | 'beta' | 'pro';
  };
  preview?: {
    title: string;
    description: string;
  };
}
```

## 4. Interaction Patterns

### Hover Intent
- **Delay**: 120-180ms before opening
- **Forgiving Gaps**: Panel stays open if pointer moves within "interaction zone"
- **Sticky Behavior**: Large hover hitboxes prevent accidental closes

### Keyboard Navigation
```
Trigger Button:
  - Enter/Space: Toggle panel
  - Arrow Down: Open panel & focus first topic
  - Escape: Close panel

Inside Panel (Left Rail):
  - Arrow Up/Down: Cycle through topics
  - Arrow Right: Move focus to content grid
  - Enter: Navigate to topic page
  - Escape: Close panel & return focus to trigger

Inside Content Grid:
  - Arrow Left: Return to topic rail
  - Tab: Move through grid items
  - Enter: Navigate to item
  - Escape: Close panel
```

### Screen Reader Announcements
- Topic change: "Now showing [Topic Name] content"
- Panel state: "Menu expanded/collapsed"
- Live regions for dynamic content updates

## 5. Performance Optimizations

### Preloading Strategy
```typescript
// Preload first topic images only
<link rel="preload" as="image" href={firstTopicHeroImage} />

// Lazy load other topics
const ContentGrid = lazy(() => import('./ContentGrid'));

// Prefetch topic routes on hover
<Link href={topicUrl} prefetch={true} />
```

### CSS Optimization
- Fixed image sizes to prevent CLS
- GPU-accelerated transforms for animations
- `will-change` on animated elements (sparingly)

### Bundle Size
- Avoid heavy animation libraries (framer-motion optional)
- Tree-shakeable icon imports
- Code splitting for mega menu

## 6. Accessibility Checklist

✅ **Keyboard Navigation**
- [ ] Tab order is logical
- [ ] All interactive elements keyboard accessible
- [ ] Arrow keys work for topic navigation
- [ ] Escape closes panel
- [ ] Focus trap active when panel open

✅ **Screen Reader**
- [ ] `role="menu"` or `role="navigation"` on panel
- [ ] `aria-expanded` on trigger button
- [ ] `aria-controls` links trigger to panel
- [ ] `aria-current` marks active topic
- [ ] `aria-live="polite"` for topic changes

✅ **Visual**
- [ ] Visible focus rings (2px outline, 3px ring)
- [ ] `prefers-reduced-motion` respected
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus visible on all states

✅ **General**
- [ ] No layout shift on open
- [ ] Works without JavaScript (progressive enhancement)
- [ ] Mobile touch targets ≥ 44x44px

## 7. Animation Specifications

### Panel Open/Close
```typescript
const panelAnimation = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 },
  transition: {
    duration: 0.18,
    ease: [0.25, 0.1, 0.25, 1], // easeInOutCubic
  }
};
```

### Content Grid Cross-Fade
```typescript
const gridAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};
```

### Topic Rail Indicator
```css
/* Accent bar on left side */
.topic-item[aria-current="true"]::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent-color);
  border-radius: 0 2px 2px 0;
  animation: slideIn 0.2s ease-out;
}
```

## 8. Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '< 768px',    // Full-screen drawer
  tablet: '768-1024px',  // Tablet layout (single panel)
  laptop: '1024-1280px', // Compact "More" menu with popovers
  desktop: '≥ 1280px',   // Full mega menu with rail + grid
};
```

## 9. Empty States & Fallbacks

### No Content Available
```typescript
<EmptyState
  icon={<InboxIcon />}
  title="No content yet"
  description="Check back soon for updates"
/>
```

### Loading State
```typescript
<LoadingState>
  <Skeleton className="h-32 w-full" /> {/* Hero card */}
  <Skeleton className="h-20 w-full" /> {/* Mini card */}
  <Skeleton className="h-20 w-full" /> {/* Mini card */}
</LoadingState>
```

### Error State
```typescript
<ErrorState
  title="Failed to load content"
  action={<Button onClick={retry}>Try Again</Button>}
/>
```

## 10. Testing Strategy

### Unit Tests
- Topic switching logic
- Keyboard navigation handlers
- Hover intent calculations
- Focus trap functionality

### Integration Tests (RTL)
```typescript
test('navigates topics with arrow keys', async () => {
  const user = userEvent.setup();
  render(<IntelligentLMSMegaMenu topics={mockTopics} />);

  await user.keyboard('[Tab]'); // Focus trigger
  await user.keyboard('[Enter]'); // Open panel
  await user.keyboard('[ArrowDown]'); // Next topic

  expect(screen.getByRole('menuitem', { name: /SAM AI/ }))
    .toHaveFocus();
});
```

### E2E Tests (Playwright)
```typescript
test('mega menu interaction flow', async ({ page }) => {
  await page.goto('/');
  await page.hover('button:has-text("Intelligent LMS")');
  await page.waitForSelector('[role="menu"]');

  // Hover first topic
  await page.hover('[role="menuitem"]:first-child');

  // Verify content updates
  await expect(page.locator('.content-grid'))
    .toContainText('Overview');

  // Click item
  await page.click('a:has-text("Learn more")');
  await expect(page).toHaveURL(/intelligent-lms\/overview/);
});
```

### Accessibility Tests
```typescript
test('passes axe accessibility audit', async () => {
  const { container } = render(<IntelligentLMSMegaMenu />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Implementation Priority

1. **Phase 1**: Desktop mega menu for Intelligent LMS (rich variant)
2. **Phase 2**: Compact "More" menu with hover previews (1024-1280px)
3. **Phase 3**: Mobile full-screen sheet with tabs
4. **Phase 4**: Accessibility enhancements & testing
5. **Phase 5**: Performance optimization & analytics

---

**Design System Compatibility**: Tailwind CSS v3.4+, Next.js 15+, React 19+
**Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
**Accessibility Standard**: WCAG 2.1 Level AA
