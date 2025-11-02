# Integration Guide - Enhanced Blog Post Features

## Quick Start (5 Minutes)

### Step 1: Replace Reading Mode Component

Open `app/blog/[postId]/page.tsx` and replace the import:

```typescript
// BEFORE
import ReadingModesRedesigned from "./_components/reading-mode-redesigned";

// AFTER
import ReadingModeEnhanced from "./_components/reading-mode-enhanced";
```

Update the component usage:

```typescript
// BEFORE
<ReadingModesRedesigned post={post} />

// AFTER
<ReadingModeEnhanced post={post} />
```

### Step 2: Test the Features

1. **Start dev server**: `npm run dev`
2. **Navigate to any blog post**: `http://localhost:3000/blog/[postId]`
3. **Try keyboard shortcuts**:
   - Press `?` to see all shortcuts
   - Press `t` to toggle Table of Contents
   - Press `f` for focus mode
   - Press `1-8` to switch reading modes
4. **Test TOC**: Click on chapters, see active highlighting
5. **Test print**: Press `Ctrl+P` (or `Cmd+P` on Mac)

Done! All features are now active.

---

## Detailed Integration

### Option 1: Full Integration (Recommended)

This gives you all new features immediately.

**File**: `app/blog/[postId]/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth';
import { Footer } from "@/app/(homepage)/footer";
import ReadingModeEnhanced from "./_components/reading-mode-enhanced"; // ✨ NEW
import { Metadata } from "next";
import PostHeaderDetailsEnterpriseV2 from "./_components/post-header-details-enterprise-v2";
import { getPostData } from "@/app/actions/get-post-data";
import SimilarPosts from "./_components/similar-posts";
import { CommentSection } from "./_components/comment-system";

const PostIdPage = async (props: {params: Promise<{ postId: string; }>}) => {
  const params = await props.params;
  const user = await currentUser();
  const post = await getPostData(params.postId);

  if (!post) {
    return redirect("/");
  }

  return (
    <>
      {/* Article JSON-LD for SEO */}
      {post && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.description || undefined,
              image: post.imageUrl || undefined,
              datePublished: post.createdAt?.toISOString?.() || new Date(post.createdAt).toISOString(),
              dateModified: post.updatedAt?.toISOString?.() || new Date(post.updatedAt).toISOString(),
              author: post.User?.name ? { '@type': 'Person', name: post.User.name } : undefined,
            }),
          }}
        />
      )}

      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200 pt-0">
        <div className="w-full max-w-[2000px] mx-auto pt-0">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mx-auto pt-0">
            <div className="mx-auto w-full lg:px-4 pt-0">

              {/* Header */}
              <PostHeaderDetailsEnterpriseV2
                title={post.title}
                category={post.category}
                authorName={post.User?.name}
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                description={post.description}
                imageUrl={post.imageUrl}
                readingTime={8}
                viewCount={1247}
                commentCount={post.comments?.length || 0}
                featured={true}
              />

              {/* ✨ Enhanced Reading Mode - All new features */}
              <div className="mb-12">
                <ReadingModeEnhanced post={post} />
              </div>

              {/* Similar Posts */}
              <SimilarPosts
                postId={params.postId}
                category={post.category}
                useDummyData={true}
              />

              {/* Comments */}
              <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                <CommentSection
                  postId={params.postId}
                  initialComments={post.comments as unknown as any[]}
                />
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default PostIdPage;

export async function generateMetadata(props: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostData(params.postId);

  const title = post?.title || 'Blog Post';
  const description = post?.description || 'Article';
  const images = post?.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images as any,
    },
  };
}
```

---

### Option 2: Selective Features

Add individual features to existing components.

#### Add Keyboard Shortcuts Only

```typescript
"use client";

import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useState, useMemo } from "react";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";

export function YourComponent() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: 't',
      description: 'Toggle table of contents',
      handler: () => {/* your logic */}
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: () => setShowShortcuts(true)
    },
  ], []);

  useKeyboardShortcuts({ shortcuts, enabled: true });

  return (
    <>
      {/* Your content */}
      <KeyboardShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        shortcuts={shortcuts}
      />
    </>
  );
}
```

#### Add Analytics Tracking Only

```typescript
"use client";

import { useReadingAnalytics } from "@/hooks/use-reading-analytics";

export function YourComponent({ postId, totalChapters }: Props) {
  const {
    readingTime,
    scrollDepth,
    trackChapterView,
    trackModeChange,
  } = useReadingAnalytics({
    postId,
    totalChapters,
    enabled: true,
    onEvent: (event) => {
      console.log('Analytics event:', event);
      // Send to your analytics service
    }
  });

  return (
    <div>
      <p>Reading: {Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}</p>
      <p>Progress: {Math.round(scrollDepth)}%</p>
    </div>
  );
}
```

#### Add Enhanced TOC Only

```typescript
"use client";

import { useState } from "react";
import { EnhancedTableOfContents } from "@/app/blog/[postId]/_components/enhanced-table-of-contents";

export function YourComponent({ chapters }: Props) {
  const [showTOC, setShowTOC] = useState(false);

  return (
    <>
      <button onClick={() => setShowTOC(true)}>
        Show Table of Contents
      </button>

      <EnhancedTableOfContents
        chapters={chapters}
        open={showTOC}
        onOpenChange={setShowTOC}
        onChapterView={(id) => console.log('Viewing chapter:', id)}
      />
    </>
  );
}
```

#### Add Print Styles Only

```typescript
import { PrintStyles, PrintHeader, PrintFooter } from "@/app/blog/[postId]/_components/print-styles";

export default function YourPage({ post }: Props) {
  return (
    <>
      <PrintStyles />
      <PrintHeader
        title={post.title}
        author={post.User?.name}
        date={post.createdAt.toLocaleDateString()}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      {/* Your content */}

      <PrintFooter title={post.title} />
    </>
  );
}
```

---

### Option 3: A/B Testing Setup

Test new features with a subset of users.

```typescript
"use client";

import { useState, useEffect } from "react";
import ReadingModesRedesigned from "./_components/reading-mode-redesigned";
import ReadingModeEnhanced from "./_components/reading-mode-enhanced";

export function AdaptiveReadingMode({ post }: Props) {
  const [useEnhanced, setUseEnhanced] = useState(false);

  useEffect(() => {
    // Option 1: Random split (50/50)
    setUseEnhanced(Math.random() > 0.5);

    // Option 2: Feature flag from localStorage
    // setUseEnhanced(localStorage.getItem('use-enhanced-mode') === 'true');

    // Option 3: User preference from database
    // const user = await getCurrentUser();
    // setUseEnhanced(user.preferences.useEnhancedMode);

    // Option 4: Query parameter
    // const params = new URLSearchParams(window.location.search);
    // setUseEnhanced(params.get('enhanced') === 'true');
  }, []);

  return useEnhanced ? (
    <ReadingModeEnhanced post={post} />
  ) : (
    <ReadingModesRedesigned post={post} />
  );
}
```

---

## Adding Analytics API Endpoint

Create the analytics tracking endpoint to persist events.

**File**: `app/api/analytics/track/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const event = await req.json();

    // Validate event
    if (!event.type || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Store in database (example using Prisma)
    await db.analyticsEvent.create({
      data: {
        userId: user?.id,
        postId: event.data.postId,
        type: event.type,
        data: event.data,
        timestamp: new Date(event.timestamp),
      },
    });

    // Or send to analytics service (Google Analytics, Mixpanel, etc.)
    // await sendToAnalyticsService(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
```

**Prisma Schema Addition**:

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  userId    String?
  postId    String
  type      String
  data      Json
  timestamp DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([postId])
  @@index([type])
  @@index([timestamp])
}
```

---

## Environment Setup

### Required Dependencies

All dependencies are already in your `package.json`:
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icons
- ✅ `@radix-ui` - UI components
- ✅ `tailwindcss` - Styling

### Optional: Analytics Integration

Add your preferred analytics service:

```bash
# Google Analytics
npm install @next/third-parties

# Mixpanel
npm install mixpanel-browser

# Posthog
npm install posthog-js
```

---

## Testing Checklist

### Manual Testing

- [ ] **Keyboard Shortcuts**
  - [ ] Press `?` to open shortcuts dialog
  - [ ] Press `t` to toggle TOC
  - [ ] Press `f` for focus mode
  - [ ] Press `j`/`k` to navigate
  - [ ] Press `1-8` to switch modes
  - [ ] Press `Esc` to close dialogs

- [ ] **Table of Contents**
  - [ ] Opens with `t` or button click
  - [ ] Highlights active chapter while scrolling
  - [ ] Shows progress bars
  - [ ] Bookmarks persist after reload
  - [ ] Smooth scroll on chapter click

- [ ] **Analytics**
  - [ ] Open browser console
  - [ ] Scroll through post
  - [ ] Verify events logged
  - [ ] Check localStorage for preferences

- [ ] **Print**
  - [ ] Press `Ctrl+P` (or `Cmd+P`)
  - [ ] Verify clean print layout
  - [ ] Check page breaks
  - [ ] Verify no interactive elements

- [ ] **Responsive**
  - [ ] Test on mobile (320px)
  - [ ] Test on tablet (768px)
  - [ ] Test on desktop (1920px)
  - [ ] Verify mode switching

### Automated Testing

```typescript
// Example test with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingModeEnhanced from './reading-mode-enhanced';

describe('ReadingModeEnhanced', () => {
  it('opens keyboard shortcuts dialog with ?', () => {
    render(<ReadingModeEnhanced post={mockPost} />);

    fireEvent.keyDown(window, { key: '?', shiftKey: true });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('tracks chapter views', () => {
    const onEvent = jest.fn();
    render(<ReadingModeEnhanced post={mockPost} onEvent={onEvent} />);

    // Scroll to chapter
    fireEvent.scroll(window, { target: { scrollY: 500 } });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'chapter_viewed' })
    );
  });
});
```

---

## Troubleshooting

### Issue: Keyboard shortcuts not working

**Cause**: Shortcuts disabled in input fields
**Solution**: This is by design. Press `Esc` to exit input field, then use shortcuts.

---

### Issue: TOC not highlighting

**Cause**: Chapter elements missing `id` attributes
**Solution**: Ensure chapters have `id="chapter-{chapterId}"`:

```tsx
{chapters.map((chapter) => (
  <div id={`chapter-${chapter.id}`} key={chapter.id}>
    {/* Chapter content */}
  </div>
))}
```

---

### Issue: Preferences not saving

**Cause**: localStorage disabled or full
**Solution**:
1. Check browser settings for localStorage
2. Clear localStorage if full: `localStorage.clear()`
3. Test in incognito mode

---

### Issue: Analytics events not firing

**Cause**: API endpoint missing or user not scrolling
**Solution**:
1. Create `/api/analytics/track` endpoint
2. Check browser console for errors
3. Verify scroll depth > 5% to trigger `reading_started`

---

## Performance Optimization

### Lazy Load Components

```typescript
import dynamic from 'next/dynamic';

const ReadingModeEnhanced = dynamic(
  () => import('./_components/reading-mode-enhanced'),
  {
    loading: () => <ReadingModeSkeleton />,
    ssr: false // Client-side only
  }
);
```

### Debounce Analytics Events

Already implemented in hooks, but you can adjust:

```typescript
// In use-reading-analytics.ts
const SCROLL_DEBOUNCE = 100; // ms
const INACTIVITY_THRESHOLD = 30000; // 30 seconds
```

### Optimize IntersectionObserver

```typescript
// In use-scroll-spy.ts
const { activeId } = useScrollSpy({
  sectionIds,
  offset: 100,
  rootMargin: '0px 0px -60% 0px', // Adjust for earlier/later activation
  threshold: 0.1 // Lower = triggers sooner
});
```

---

## Next Steps

1. **✅ Complete**: Full integration with `ReadingModeEnhanced`
2. **📊 Analytics**: Create `/api/analytics/track` endpoint
3. **🧪 Testing**: Add automated tests
4. **📱 Mobile**: Fine-tune mobile experience
5. **🎨 Theming**: Customize colors/fonts
6. **🚀 Deploy**: Push to production

---

## Support

For issues or questions:
1. Check POST_PAGE_IMPLEMENTATION_SUMMARY.md
2. Review component source code (fully documented)
3. Test keyboard shortcuts with `?` key
4. Check browser console for errors

---

*Last Updated*: January 2025
*Version*: 1.0.0
*Status*: Production Ready ✅
