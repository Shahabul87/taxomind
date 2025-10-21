# Course Page Enterprise Upgrades

This document summarizes the enterprise‑level UX, accessibility, and performance improvements implemented for the Course Detail page (`/courses/[courseId]`).

Scope includes: hero section, sticky mini header, mobile enroll bar, right‑side enrollment card, enterprise footer, and tab navigation.

## Highlights

- Consistent, elegant hero in light mode with strong readibility
- Sticky mini header for context + quick enroll access on scroll
- Mobile bottom enroll bar for high‑conversion small‑screen UX
- Enterprise footer (no icons) with language/currency controls
- Accessible, sticky, deep-linkable tabs with keyboard support
- Analytics instrumentation for tab selection
- Performance touches (responsive image sizes, optimized overlays)
- Dark-mode tab contrast and a compact summary row

## Implemented Changes

### 1) Hero Section
- Bottom‑aligned content for visibility below header
- Refined gradient overlay for contrast over course images
- Responsive `sizes="100vw"` and priority image loading

Files:
- `app/(course)/courses/[courseId]/_components/course-hero-section.tsx`

### 2) Sticky Mini Header
- Appears after ~140px scroll with title, rating, and Enroll button
- Button scrolls smoothly to the enrollment card
- Hidden when user is already enrolled

Files:
- `app/(course)/courses/[courseId]/_components/sticky-mini-header.tsx`
- Integrated in `course-layout.tsx`

### 3) Mobile Enroll Bar
- `md:hidden` bottom‑fixed bar with price + Enroll CTA
- Prevents scroll friction on small devices

Files:
- `app/(course)/courses/[courseId]/_components/mobile-enroll-bar.tsx`
- Rendered in `course-layout.tsx`

### 4) Enrollment Card (Right Column)
- Increased sticky offset to clear the fixed header
- Responsive image `sizes="(min-width: 1024px) 33vw, 100vw"`
- Added `id="enroll-card"` for jump links

Files:
- `app/(course)/courses/[courseId]/_components/course-info-card.tsx`

### 5) Enterprise Footer (Page‑specific)
- Replaces homepage footer; no brand/social icons
- Sections: Product, Solutions, Resources, Company, Legal
- Language and currency selectors (UI only)
- Newsletter form (accessible, non‑posting)

Files:
- `app/(course)/courses/[courseId]/_components/course-footer-enterprise.tsx`
- Imported in `app/(course)/courses/[courseId]/page.tsx`

### 6) Tabs: A11y, UX, and Deep Linking
- A11y roles: `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`
- Keyboard navigation: ArrowLeft/Right, Home/End
- Deep‑linking: `?tab=...` read on load and synced on click
- Sticky tab bar below header with backdrop + border
- Scrollable overflow with subtle edge shadows and chevrons
- Focus‑visible rings and active indicator bar
- Dark‑mode polish: higher contrast labels and chips, brighter active indicator
- Compact summary row under tabs with chapters, lessons, reviews, language, level, and last update
- Data attributes (`data-tab`) for cross‑component linking from hero/profile
- Basic i18n scaffold + RTL `dir` support (English default)
- Analytics: `course_tab_selected` event tracked client‑side

### 7) Content Tab (Enterprise)
- Dark-mode layering for chapters and panels for clarity
- Search and filter across chapters/lessons with debounce analytics
- Keyboard/ARIA for chapter accordions and section items
- Per-chapter progress bar (enrolled users)
- Deep links via `?chapter=<index|id>&section=<id>` with auto-expand and scroll
- Copy link to chapter with `Link` button and clipboard copy
- Incremental rendering for very large section lists (load +20)
- Free/Preview filter, sorting by type and duration, and a small session activity panel (optional)
- Persistent view preferences (search, filters, sort, last-open chapter) per course via localStorage
- Duration enhancements: computed total duration, optional Free/Preview duration when filter is active, and a small tooltip explaining calculation
- Per-chapter duration: shows computed total per chapter (if no estimated time provided) and Free/Preview duration badge when the Free filter is enabled
- Free-only header summary: When the Free filter is active, shows a compact pill near the Content header with total free/preview lessons and aggregate free duration
- CSV export: Adds an Export CSV button that downloads the full syllabus (chapters + sections) with fields: Chapter #, Chapter Title, Section #, Section Title, Type, Duration (min), Free, Preview
- JSON export: Adds an Export JSON button that downloads the full syllabus structure
- Print/PDF: Adds a client-side print-friendly syllabus view (use browser Save as PDF)
- API route: `GET /api/courses/[courseId]/syllabus?format=json|csv` for server-side downloads
- UI server downloads: Added Client buttons “Server CSV” and “Server JSON” that link to the API route for large exports
- Print/PDF branding: Added branded header and page breaks between chapters for neat PDF output
- Completed-only filter (enrolled): Filter sections to only completed items
- Per-chapter Free ratio badge next to each chapter title

Files:
- `app/(course)/courses/[courseId]/course-content.tsx`

Files:
- `app/(course)/courses/[courseId]/_components/course-page-tabs.tsx`
- Uses `EventTracker` from `lib/analytics/event-tracker.ts`

## Usage Notes

- Deep Links: `/courses/[id]?tab=instructor` opens with the Instructor tab active.
- Instructor Linkage: Clicking the instructor mini profile triggers the Instructor tab and scrolls to the tab list.
- RTL: The tab list respects `document.dir` when set to `rtl`.
- Analytics: Tab selections are batched to `/api/analytics/events` with session metadata (when analytics API is active).

## Next Steps (Optional)

- Add preview video in hero (lazy‑loaded HLS/MP4)
- Full i18n integration (labels, currency, dates)
- Payments polish (Apple Pay/Google Pay, coupons)
- Track CTA outcomes (enroll clicks, coupon applies)
- Visual regression tests for hero + tabs
