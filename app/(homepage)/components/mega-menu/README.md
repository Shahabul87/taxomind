# AI Features Mega Menu - Complete Documentation

## 📋 Overview

The **AI Features Mega Menu** is a unified, enterprise-grade dropdown menu that combines three previously separate tabs (Features, Intelligent LMS, and AI Tools) into one comprehensive, accessible navigation component.

### Key Features

✅ **Desktop Experience**:
- Hover or focus reveals a mega panel
- Left rail: vertical topic list with icons and badges
- Right panel: dynamic content grid (hero card + 5 mini cards)
- Smooth transitions with hover intent delay (150ms)
- Auto-alignment to stay within viewport

✅ **Mobile Experience**:
- Full-screen sheet/drawer with smooth animations
- Horizontal tab navigation
- Touch-friendly interface
- Swipe to close

✅ **Accessibility**:
- Keyboard navigation (Arrow keys, Enter, Esc)
- Screen reader friendly (ARIA labels, live regions)
- Focus trap when open
- Respects `prefers-reduced-motion`

✅ **Performance**:
- Content caching to avoid redundant fetches
- Lazy loading of topic content
- Prefetching on hover
- No layout shift (CLS = 0)

---

## 🏗️ Architecture

### Component Hierarchy

```
AIFeaturesMegaMenu (Main Desktop Component)
├── TopicRail (Left sidebar with topics)
│   ├── Topic buttons with icons & badges
│   └── Keyboard navigation
├── ContentGrid (Right content area)
│   ├── Hero Card (featured item)
│   ├── Mini Cards (5 additional items)
│   ├── Concept Chips
│   └── "See All" Link
└── AIFeaturesMobileSheet (Mobile drawer)
    ├── Drag handle
    ├── Topic tabs (horizontal scroll)
    ├── Content items
    └── Concept chips
```

### Data Structure

```
app/(homepage)/
├── data/
│   └── ai-features-data.ts        # Topics, content, chips
├── components/mega-menu/
│   ├── AIFeaturesMegaMenu.tsx     # Desktop component
│   ├── AIFeaturesMobileSheet.tsx  # Mobile component
│   ├── TopicRail.tsx              # Topic sidebar
│   └── ContentGrid.tsx            # Content display
├── hooks/
│   ├── useHoverIntent.ts          # Hover delay management
│   └── useFocusTrap.ts            # Focus trap for a11y
└── types/
    └── mega-menu-types.ts         # TypeScript types
```

---

## 🎨 Design System

### Colors & Accents

Each topic has a unique accent color for visual distinction:

| Topic | Accent Color | Hex |
|-------|-------------|-----|
| Platform Features | Pink | `#EC4899` |
| Intelligent LMS | Purple | `#8B5CF6` |
| SAM AI Assistant | Blue | `#3B82F6` |
| Adaptive Learning | Amber | `#F59E0B` |
| Course Intelligence | Cyan | `#06B6D4` |
| AI Tools | Green | `#10B981` |

### Typography

- **Trigger**: `text-sm` (14px), `font-medium`
- **Topic Labels**: `text-sm` (14px), `font-semibold`
- **Hero Title**: `text-lg` (18px), `font-bold`
- **Mini Card Title**: `text-sm` (14px), `font-semibold`
- **Description**: `text-xs` (12px), `text-slate-600`

### Spacing

- Panel padding: `p-6` (24px)
- Topic gap: `gap-6` (24px)
- Card gap: `gap-3` (12px)
- Border radius: `rounded-xl` (12px)

### Animation

```typescript
// Panel animation
initial: { opacity: 0, y: 10, scale: 0.98 }
animate: { opacity: 1, y: 0, scale: 1 }
exit: { opacity: 0, y: 10, scale: 0.98 }
transition: { duration: 0.18, ease: 'easeInOut' }

// Content grid cross-fade
initial: { opacity: 0 }
animate: { opacity: 1 }
transition: { duration: 0.15 }
```

---

## 🔧 Integration Guide

### 1. Import Required Components

```typescript
import { AIFeaturesMegaMenu } from '../components/mega-menu/AIFeaturesMegaMenu';
import {
  aiFeatureTopics,
  getAIFeaturesByTopic,
  aiConceptChips
} from '../data/ai-features-data';
```

### 2. Add to Header Component

```typescript
<AIFeaturesMegaMenu
  topics={aiFeatureTopics}
  getContentByTopic={getAIFeaturesByTopic}
  conceptChips={aiConceptChips}
  variant="rich"
  triggerLabel="AI Features"
  panelId="ai-features-menu"
  hoverDelay={150}
  closeDelay={200}
  maxItems={6}
  currentPathname={pathname || undefined}
  centerOnHover={false}
/>
```

### 3. Props Configuration

```typescript
interface AIFeaturesMegaMenuProps {
  topics: Topic[];                   // Topic configuration
  getContentByTopic: (slug: string) => Promise<ContentItem[]>; // Content fetcher
  conceptChips?: Record<string, ConceptChip[]>; // Related topics
  variant?: 'minimal' | 'rich';      // Visual style
  triggerLabel?: string;             // Button text
  panelId?: string;                  // Unique ID for ARIA
  hoverDelay?: number;               // Hover intent delay (ms)
  closeDelay?: number;               // Close delay (ms)
  maxItems?: number;                 // Max items per topic
  currentPathname?: string;          // For active state
  centerOnHover?: boolean;           // Center panel on screen
}
```

---

## ⌨️ Keyboard Navigation

### Global Shortcuts

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle menu open/close |
| `↓` (Down Arrow) | Open menu and focus first topic |
| `Esc` | Close menu and return focus to trigger |

### Inside Panel

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between topics |
| `Enter` | Select active topic |
| `Tab` | Move focus through content items |
| `Esc` | Close and return to trigger |

---

## ♿ Accessibility Checklist

✅ **ARIA Attributes**:
- `aria-expanded` on trigger button
- `aria-haspopup="true"` on trigger
- `aria-controls` linking trigger to panel
- `role="menu"` on panel
- `aria-label` on panel and buttons
- `aria-live="polite"` for topic changes

✅ **Focus Management**:
- Focus trap active when panel open
- Focus returns to trigger on close
- Visible focus indicators (`focus:ring-2`)

✅ **Screen Readers**:
- Descriptive labels on all interactive elements
- Live region announces topic changes
- Semantic HTML (`<nav>`, `<button>`, etc.)

✅ **Motion**:
- Respects `prefers-reduced-motion`
- All animations have `duration < 0.2s`
- No parallax or jarring transitions

---

## 📊 Performance Metrics

### Load Performance

- **Initial Load**: Topic data loaded immediately
- **Hover Prefetch**: Content fetched on topic hover (~200ms delay)
- **Cache Hit**: Instant display from cache

### Bundle Size

- **AIFeaturesMegaMenu**: ~8KB (gzipped)
- **TopicRail**: ~2KB (gzipped)
- **ContentGrid**: ~3KB (gzipped)
- **Total**: ~13KB (gzipped)

### Runtime Performance

- **Hover Intent Delay**: 150ms (prevents accidental opens)
- **Close Delay**: 200ms (allows mouse movement)
- **Animation Duration**: 180ms (smooth but fast)
- **Content Fetch**: < 300ms (simulated API)

---

## 🧪 Testing Guide

### Unit Tests

```typescript
// Test hover intent
it('opens after hover delay', async () => {
  render(<AIFeaturesMegaMenu {...props} />);
  const trigger = screen.getByRole('button', { name: /AI Features/i });
  fireEvent.mouseEnter(trigger);

  // Should not open immediately
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  // Should open after delay
  await waitFor(() => {
    expect(screen.getByRole('menu')).toBeInTheDocument();
  }, { timeout: 200 });
});

// Test keyboard navigation
it('navigates topics with arrow keys', () => {
  render(<AIFeaturesMegaMenu {...props} />);
  const trigger = screen.getByRole('button');
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });

  const panel = screen.getByRole('menu');
  expect(panel).toBeInTheDocument();

  // Test topic navigation
  const topics = within(panel).getAllByRole('button');
  fireEvent.keyDown(topics[0], { key: 'ArrowDown' });
  expect(topics[1]).toHaveFocus();
});
```

### Integration Tests

```typescript
// Test content loading
it('loads and displays topic content', async () => {
  render(<AIFeaturesMegaMenu {...props} />);

  // Open menu
  fireEvent.click(screen.getByRole('button', { name: /AI Features/i }));

  // Wait for content to load
  await waitFor(() => {
    expect(screen.getByText(/Platform Features/i)).toBeInTheDocument();
  });

  // Check for hero card
  expect(screen.getByText(/Modern Learning Platform/i)).toBeInTheDocument();
});
```

### Accessibility Tests

```typescript
// Test ARIA attributes
it('has correct ARIA attributes', () => {
  render(<AIFeaturesMegaMenu {...props} />);
  const trigger = screen.getByRole('button');

  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  expect(trigger).toHaveAttribute('aria-controls');

  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
});
```

---

## 🔄 Data Updates

### Adding New Topics

```typescript
// app/(homepage)/data/ai-features-data.ts

export const aiFeatureTopics: Topic[] = [
  // ... existing topics
  {
    id: 'new-topic',
    slug: 'new-topic',
    label: 'New Topic',
    icon: YourIcon,
    accentHex: '#FF6B6B',
    description: 'Topic description',
    badge: {
      text: 'Beta',
      variant: 'beta',
    },
  },
];

// Add content for the new topic
export const aiFeaturesByTopic: Record<string, ContentItem[]> = {
  // ... existing content
  'new-topic': [
    {
      id: 'new-1',
      title: 'Content Title',
      slug: 'content-slug',
      href: '/path/to/content',
      description: 'Content description',
      isFeatured: true,
      // ... more fields
    },
  ],
};
```

### Adding Content Items

```typescript
// Add to existing topic
export const aiFeaturesByTopic: Record<string, ContentItem[]> = {
  'platform-features': [
    // ... existing items
    {
      id: 'feature-7',
      title: 'New Feature',
      slug: 'new-feature',
      href: '/features/new-feature',
      description: 'Feature description',
      readingTime: '3 min read',
    },
  ],
};
```

---

## 🐛 Troubleshooting

### Menu Won't Open

**Issue**: Menu doesn't open on hover
**Solution**: Check `hoverDelay` prop (default 150ms). Try clicking instead of hovering.

### Content Not Loading

**Issue**: Content grid is empty
**Solution**: Verify `getContentByTopic` function returns data for the topic slug.

### Misaligned Panel

**Issue**: Panel appears off-screen
**Solution**: Dynamic alignment should handle this automatically. Check `centerOnHover` prop.

### Keyboard Navigation Broken

**Issue**: Arrow keys don't work
**Solution**: Ensure focus is inside the panel. Check browser console for errors.

---

## 📝 Best Practices

1. **Content Strategy**:
   - Keep hero card descriptive (50-100 words)
   - Mini cards should be concise (title + reading time)
   - Limit to 6 items per topic for performance

2. **Images**:
   - Use Next.js `<Image>` component
   - Optimize images (WebP, ~800x450px)
   - Provide fallback gradients

3. **Accessibility**:
   - Always provide `alt` text for images
   - Use semantic HTML
   - Test with keyboard only
   - Test with screen reader (VoiceOver/NVDA)

4. **Performance**:
   - Lazy load images below the fold
   - Cache API responses client-side
   - Prefetch on hover, not on mount
   - Monitor bundle size

---

## 📚 Additional Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🎯 Future Enhancements

- [ ] Analytics tracking (open/close events, topic selections)
- [ ] Search within mega menu
- [ ] Recent/popular content recommendations
- [ ] Dark mode optimizations
- [ ] i18n support for multiple languages
- [ ] A/B testing variants (minimal vs rich)

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: TaxoMind Development Team
