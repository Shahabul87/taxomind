# Enterprise Course Learning Experience Redesign Plan

**Version:** 1.0.0
**Created:** December 28, 2025
**Author:** Claude Code
**Status:** PLANNING PHASE

---

## Executive Summary

This document outlines a comprehensive redesign of the Taxomind course learning experience, transforming 4 key pages into enterprise-grade, modern learning interfaces inspired by platforms like Coursera, Udemy Business, LinkedIn Learning, and Masterclass.

---

## Pages to Redesign (In Order)

| # | Page | URL Pattern | Priority |
|---|------|-------------|----------|
| 1 | Course Landing | `/courses/[courseId]` | P0 |
| 2 | Learning Dashboard | `/courses/[courseId]/learn` | P0 |
| 3 | Chapter View | `/courses/[courseId]/learn/[chapterId]` | P1 |
| 4 | Section Learning | `/courses/[courseId]/learn/[chapterId]/sections/[sectionId]` | P0 |

---

## Design Principles

### 1. Visual Hierarchy
- Clear focal points with progressive disclosure
- F-pattern and Z-pattern layouts for scanning
- Whitespace as a design element (not empty space)

### 2. Micro-interactions
- Hover states with subtle animations
- Progress animations that celebrate achievements
- Smooth transitions between states

### 3. Accessibility First
- WCAG 2.1 AA compliance minimum
- Keyboard navigation throughout
- Screen reader optimized
- Color contrast ratios > 4.5:1

### 4. Performance
- Skeleton loading states
- Lazy loading for off-screen content
- Optimistic UI updates
- Code splitting per route

### 5. Mobile-First Responsive
- Touch-friendly targets (min 44px)
- Swipe gestures for navigation
- Collapsible sidebars
- Bottom navigation on mobile

---

## Page 1: Course Landing Page

**File:** `app/(course)/courses/[courseId]/page.tsx`

### Current Issues
- Generic hero section
- Information overload
- Lack of social proof prominence
- Weak call-to-action hierarchy

### Redesign Goals

#### Hero Section (Above the Fold)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐  │
│  │                          │  │  Category Badge                     │  │
│  │     Course Thumbnail     │  │  ══════════════════════════════════ │  │
│  │     with Play Button     │  │  COURSE TITLE                       │  │
│  │     (16:9 ratio)         │  │  ══════════════════════════════════ │  │
│  │                          │  │  Short description (2 lines max)    │  │
│  │     Hover: Preview       │  │                                     │  │
│  │                          │  │  ⭐ 4.8 (2,340 reviews) • 15,420    │  │
│  └──────────────────────────┘  │     students enrolled               │  │
│                                │                                     │  │
│                                │  👤 Instructor Name                 │  │
│                                │     "Expert in ML & AI"             │  │
│                                │                                     │  │
│                                │  ┌─────────────────────────────────┐│  │
│                                │  │  ENROLL NOW - $99    or FREE    ││  │
│                                │  └─────────────────────────────────┘│  │
│                                │  ✓ 30-day money-back guarantee     │  │
│                                └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Features

**1. Cinematic Hero**
- Full-width gradient background with course color theme
- Floating card with glassmorphism effect
- Animated stats counter on scroll
- Video preview on hover (if available)

**2. Trust Indicators Bar**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🎓 Certificate  │  📱 Mobile Access  │  ♾️ Lifetime  │  🔄 Updated Dec 2025│
└─────────────────────────────────────────────────────────────────────────┘
```

**3. Sticky Enrollment Bar (On Scroll)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Course Title                              $99  [Enroll Now] [Preview]  │
└─────────────────────────────────────────────────────────────────────────┘
```

**4. What You'll Learn Section**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  WHAT YOU'LL LEARN                                                      │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ ✓ Build neural networks │  │ ✓ Deploy ML models to production   │  │
│  │   from scratch          │  │                                     │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────┤  │
│  │ ✓ Master PyTorch        │  │ ✓ Computer vision applications     │  │
│  │   framework             │  │                                     │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────┤  │
│  │ ✓ Natural language      │  │ ✓ Build real-world AI projects     │  │
│  │   processing basics     │  │                                     │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**5. Course Content Accordion**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  COURSE CONTENT                    12 chapters • 86 sections • 24h     │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ▼ Chapter 1: Introduction to Deep Learning          4 lectures • 45m  │
│  ├── 📹 Welcome & Course Overview                              5:23    │
│  ├── 📹 Setting Up Your Environment                           12:45    │
│  ├── 📄 Course Resources & Downloads                           FREE    │
│  └── 📝 Chapter Quiz                                          10 Q     │
│                                                                         │
│  ▶ Chapter 2: Neural Network Fundamentals           8 lectures • 2h    │
│  ▶ Chapter 3: Convolutional Neural Networks        12 lectures • 3h    │
│  ...                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**6. Instructor Section**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR INSTRUCTOR                                                        │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌───────┐  Dr. Sarah Chen, PhD                                        │
│  │       │  Senior AI Researcher @ Google DeepMind                     │
│  │ Photo │                                                              │
│  │       │  ⭐ 4.9 Instructor Rating  │  👥 52,340 Students            │
│  └───────┘  📚 12 Courses            │  💬 8,920 Reviews              │
│                                                                         │
│  "With 15 years of experience in machine learning and a passion for    │
│   teaching, I've helped thousands of students break into AI..."        │
│                                                                         │
│  [View Full Profile]                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**7. Reviews Section with Filters**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  STUDENT REVIEWS                                                        │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────┐  Filter: [All Ratings ▼] [Most Recent ▼]          │
│  │  ⭐⭐⭐⭐⭐ 4.8    │                                                   │
│  │  ████████████░  │  ⭐⭐⭐⭐⭐  78%  ████████████████████░░░░          │
│  │  2,340 ratings  │  ⭐⭐⭐⭐☆   15%  ████░░░░░░░░░░░░░░░░░░░░          │
│  │                 │  ⭐⭐⭐☆☆    5%  █░░░░░░░░░░░░░░░░░░░░░░░          │
│  └─────────────────┘  ⭐⭐☆☆☆    1%  ░░░░░░░░░░░░░░░░░░░░░░░░          │
│                       ⭐☆☆☆☆    1%  ░░░░░░░░░░░░░░░░░░░░░░░░          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 👤 John D. • ⭐⭐⭐⭐⭐ • 2 days ago                                 │ │
│  │ "This course completely transformed my understanding of deep       │ │
│  │  learning. The hands-on projects were incredibly valuable..."      │ │
│  │  👍 42  │  Was this helpful?                                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**8. Related Courses Carousel**
- Horizontal scroll with cards
- AI-powered recommendations
- "Students also bought" section

### Component Structure

```
CourseDetailPage/
├── components/
│   ├── hero/
│   │   ├── CinematicHero.tsx
│   │   ├── CoursePreviewModal.tsx
│   │   ├── EnrollmentCard.tsx
│   │   └── TrustIndicators.tsx
│   ├── content/
│   │   ├── WhatYoullLearn.tsx
│   │   ├── CourseContentAccordion.tsx
│   │   ├── ChapterItem.tsx
│   │   └── SectionItem.tsx
│   ├── instructor/
│   │   ├── InstructorProfile.tsx
│   │   └── InstructorStats.tsx
│   ├── reviews/
│   │   ├── ReviewsSection.tsx
│   │   ├── RatingSummary.tsx
│   │   ├── ReviewCard.tsx
│   │   └── ReviewFilters.tsx
│   ├── sidebar/
│   │   ├── StickyEnrollmentSidebar.tsx
│   │   └── CourseFeatures.tsx
│   └── related/
│       └── RelatedCoursesCarousel.tsx
└── page.tsx
```

### Color Palette (Dynamic per Course Category)

| Category | Primary | Secondary | Accent |
|----------|---------|-----------|--------|
| Technology | `#6366F1` (Indigo) | `#818CF8` | `#4F46E5` |
| Business | `#0EA5E9` (Sky) | `#38BDF8` | `#0284C7` |
| Design | `#EC4899` (Pink) | `#F472B6` | `#DB2777` |
| Science | `#10B981` (Emerald) | `#34D399` | `#059669` |
| Arts | `#F59E0B` (Amber) | `#FBBF24` | `#D97706` |

---

## Page 2: Learning Dashboard

**File:** `app/(course)/courses/[courseId]/learn/page.tsx`

### Current Issues
- Cluttered interface
- Progress not prominent
- Weak navigation hierarchy
- Missing gamification elements

### Redesign Goals

#### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CONTINUE LEARNING                                               │   │
│  │  ═══════════════════════════════════════════════════════════════│   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │  ▶ Chapter 3: CNNs • Section 2: Pooling Layers             │ │   │
│  │  │    Progress: ████████████████████░░░░  68%                  │ │   │
│  │  │                                                             │ │   │
│  │  │  [Resume Learning →]                    Est. 45 min left   │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  YOUR PROGRESS          │  │  LEARNING STREAK                     │  │
│  │  ═══════════════════   │  │  ══════════════════════════════════ │  │
│  │                         │  │                                     │  │
│  │      ┌─────────┐       │  │  🔥 12 Day Streak!                  │  │
│  │      │   68%   │       │  │                                     │  │
│  │      │ ████░░░ │       │  │  M  T  W  T  F  S  S                │  │
│  │      └─────────┘       │  │  ✓  ✓  ✓  ✓  ✓  ✓  ○               │  │
│  │                         │  │                                     │  │
│  │  24/35 sections done   │  │  Keep it up! 🎯                     │  │
│  │  Est. 8h remaining     │  │                                     │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  COURSE CONTENT                                                  │   │
│  │  ═══════════════════════════════════════════════════════════════│   │
│  │                                                                  │   │
│  │  ✅ Chapter 1: Introduction           █████████████████████ 100%│   │
│  │  ✅ Chapter 2: Neural Networks        █████████████████████ 100%│   │
│  │  🔵 Chapter 3: CNNs (In Progress)     ██████████████░░░░░░░  68%│   │
│  │  ○  Chapter 4: RNNs                   ░░░░░░░░░░░░░░░░░░░░░   0%│   │
│  │  🔒 Chapter 5: Transformers           ░░░░░░░░░░░░░░░░░░░░░   0%│   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Features

**1. Hero Continue Card**
- Large, prominent "Continue Learning" card
- Shows current section with thumbnail
- Progress ring animation
- Time estimate to completion

**2. Progress Dashboard**
- Circular progress indicator (animated)
- Sections completed / total
- Estimated time remaining
- Weekly learning goal tracker

**3. Gamification Panel**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ACHIEVEMENTS                                                           │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  🏆 First Steps      🎯 Quick Learner    🔥 On Fire        ⭐ Rising   │
│     Completed 1st       Finished 5          7-day streak      Star     │
│     section             sections            achieved          Top 10%  │
│                                                                         │
│  🔒 Master Mind     🔒 Perfectionist    🔒 Speedrunner    🔒 ...      │
│     Complete all        Score 100%         Finish in          ...      │
│     chapters            on all quizzes     < 2 weeks                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**4. Course Content Navigation**
- Expandable chapters with progress
- Visual completion indicators
- Time estimates per chapter
- Quick jump to any section

**5. AI Learning Insights**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 SAM'S INSIGHTS                                                      │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  "Based on your learning pattern, I recommend reviewing the             │
│   Backpropagation section before moving to CNNs. Your quiz score        │
│   suggests this concept needs reinforcement."                           │
│                                                                         │
│  [Review Backpropagation] [Continue Anyway] [Dismiss]                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**6. Recent Activity Timeline**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY                                                        │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Today                                                                  │
│  ├─ ✅ Completed "Pooling Layers" section                     10:34 AM │
│  ├─ 📝 Scored 85% on Chapter 3 Quiz                           09:15 AM │
│  └─ 🔥 Extended streak to 12 days!                            09:00 AM │
│                                                                         │
│  Yesterday                                                              │
│  ├─ ✅ Completed "Convolutional Operations"                   04:22 PM │
│  └─ 💬 Asked question in discussion forum                     03:45 PM │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
LearningDashboard/
├── components/
│   ├── hero/
│   │   ├── ContinueLearningCard.tsx
│   │   └── ProgressRing.tsx
│   ├── progress/
│   │   ├── ProgressDashboard.tsx
│   │   ├── CircularProgress.tsx
│   │   └── TimeEstimate.tsx
│   ├── gamification/
│   │   ├── StreakTracker.tsx
│   │   ├── AchievementGrid.tsx
│   │   └── AchievementCard.tsx
│   ├── content/
│   │   ├── CourseContentNav.tsx
│   │   ├── ChapterProgressCard.tsx
│   │   └── SectionLink.tsx
│   ├── ai/
│   │   ├── SAMInsightsCard.tsx
│   │   └── LearningRecommendations.tsx
│   └── activity/
│       ├── RecentActivityTimeline.tsx
│       └── ActivityItem.tsx
└── page.tsx
```

---

## Page 3: Chapter View

**File:** `app/(course)/courses/[courseId]/learn/[chapterId]/page.tsx`

### Current Issues
- Redundant with section page
- Unclear purpose
- Poor mobile experience

### Redesign Goals

#### Chapter Overview Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Course                                    Chapter 3 of 12    │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  CHAPTER 3                                                       │   │
│  │  ══════════════════════════════════════════════════════════════ │   │
│  │  Convolutional Neural Networks                                  │   │
│  │                                                                  │   │
│  │  Master the fundamentals of CNNs, from basic convolutions to   │   │
│  │  advanced architectures like ResNet and VGG.                    │   │
│  │                                                                  │   │
│  │  ⏱️ 3h 45m  •  📚 12 sections  •  📝 2 quizzes  •  💻 4 labs    │   │
│  │                                                                  │   │
│  │  Progress: ██████████████░░░░░░░░  68%                          │   │
│  │                                                                  │   │
│  │  [Continue Learning →]                                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  LEARNING OBJECTIVES                                             │   │
│  │  ═══════════════════════════════════════════════════════════════│   │
│  │                                                                  │   │
│  │  By the end of this chapter, you will be able to:               │   │
│  │                                                                  │   │
│  │  ✓ Understand convolution operations and their properties       │   │
│  │  ✓ Implement CNN layers from scratch in PyTorch                 │   │
│  │  ✓ Build and train image classification models                  │   │
│  │  ✓ Apply transfer learning with pre-trained models              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CHAPTER CONTENTS                                                │   │
│  │  ═══════════════════════════════════════════════════════════════│   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ ✅ 1. Introduction to Convolutions           8:34  ✓    │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ ✅ 2. Padding and Stride                    12:45  ✓    │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ 🔵 3. Pooling Layers (Current)              15:20  →    │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ ○  4. Building a CNN Architecture           22:10       │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │  ...                                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Features

**1. Chapter Hero**
- Chapter number and title
- Description with learning outcomes
- Key stats (time, sections, quizzes, labs)
- Progress bar with percentage

**2. Learning Objectives**
- Clear bullet points
- Bloom's taxonomy aligned
- Checkmarks for completed objectives

**3. Section Cards**
- Visual status indicators
- Duration estimates
- Content type icons
- Hover preview

**4. Chapter Resources**
- Downloadable materials
- Reference links
- Practice datasets

### Component Structure

```
ChapterPage/
├── components/
│   ├── ChapterHero.tsx
│   ├── LearningObjectives.tsx
│   ├── SectionsList.tsx
│   ├── SectionCard.tsx
│   ├── ChapterResources.tsx
│   └── ChapterNavigation.tsx
└── page.tsx
```

---

## Page 4: Section Learning Page

**File:** `app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/page.tsx`

### Current Issues
- Video player not prominent enough
- Tab navigation cluttered
- Poor content organization
- Weak AI integration visibility

### Redesign Goals

#### Learning Interface Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ← Chapter 3: CNNs     Section 3 of 12     [Prev] [Next]   [≡]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │                                                                   │  │
│  │                    ┌─────────────────────┐                       │  │
│  │                    │                     │                       │  │
│  │                    │    VIDEO PLAYER     │                       │  │
│  │                    │    (16:9 ratio)     │                       │  │
│  │                    │                     │                       │  │
│  │                    │    ▶ Play           │                       │  │
│  │                    │                     │                       │  │
│  │                    └─────────────────────┘                       │  │
│  │                                                                   │  │
│  │  ────────────────────────────────────────────────────────────    │  │
│  │  ▶ 0:00 ──────────●────────────────────────────────── 15:20      │  │
│  │  🔊 ████░░  │  ⚙️ Settings  │  ⛶ Fullscreen  │  📝 Notes        │  │
│  │                                                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────┬────────────────────────┐  │
│  │                                         │                        │  │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┐ │  📚 COURSE CONTENTS    │  │
│  │  │Over │Video│Code │Math │Quiz │AI   │ │                        │  │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┘ │  ▼ Chapter 3: CNNs     │  │
│  │                                         │    ✅ 1. Intro         │  │
│  │  SECTION OVERVIEW                       │    ✅ 2. Padding       │  │
│  │  ═════════════════════════════════════  │    🔵 3. Pooling ←     │  │
│  │                                         │    ○  4. Architecture  │  │
│  │  Pooling Layers                         │    ○  5. Training      │  │
│  │                                         │                        │  │
│  │  In this section, you'll learn about    │  ▶ Chapter 4: RNNs    │  │
│  │  pooling operations that help reduce    │  ▶ Chapter 5: Trans.  │  │
│  │  spatial dimensions while preserving    │                        │  │
│  │  important features...                  │  ─────────────────     │  │
│  │                                         │                        │  │
│  │  KEY CONCEPTS                           │  🤖 ASK SAM            │  │
│  │  • Max Pooling                          │  ══════════════════    │  │
│  │  • Average Pooling                      │                        │  │
│  │  • Global Pooling                       │  "What is the diff    │  │
│  │  • Stride and Window Size               │   between max and     │  │
│  │                                         │   average pooling?"   │  │
│  │  [Mark as Complete ✓]                   │                        │  │
│  │                                         │  [Ask SAM →]           │  │
│  └─────────────────────────────────────────┴────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  [← Previous: Padding]                    [Next: Architecture →] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key Features

**1. Video Player (Theater Mode)**
- Full-width video with cinema-style dark background
- Custom controls with branding
- Picture-in-picture support
- Keyboard shortcuts overlay
- Playback speed controls
- Quality selector
- Notes timestamps

**2. Smart Tab Navigation**
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│📋   │🎬   │💻   │📐   │📝   │🤖   │📥   │
│Over │Video│Code │Math │Quiz │AI   │Files│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**3. Collapsible Sidebar**
- Course contents navigation
- Progress indicators
- Quick jump to any section
- Collapse for focus mode

**4. AI Assistant Panel**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 SAM AI TUTOR                                              [−] [×]  │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  How can I help you with this section?                                  │
│                                                                         │
│  Quick Actions:                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ 🔍 Explain      │ │ 📝 Practice     │ │ 🎯 Quiz Me      │           │
│  │    Concept      │ │    Problems     │ │                  │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                         │
│  💬 Ask anything about pooling layers...                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Type your question...                                    [Send] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**5. Content Tabs Enhanced**

- **Overview Tab**
  - Section description
  - Key concepts list
  - Learning objectives
  - Prerequisites

- **Video Tab**
  - Multiple video resources
  - Timestamps with chapters
  - Transcripts with search

- **Code Tab**
  - Syntax-highlighted code
  - Copy button
  - Run in browser (Pyodide)
  - Download as file

- **Math Tab**
  - LaTeX rendering
  - Step-by-step solutions
  - Interactive equations

- **Quiz Tab**
  - Inline quizzes
  - Immediate feedback
  - Score tracking

- **AI Tab**
  - SAM chat interface
  - Practice problems
  - Socratic dialogue

- **Resources Tab**
  - Downloadable files
  - External links
  - References

**6. Progress Tracking**
- Auto-mark on video completion
- Manual mark complete button
- Progress saved to server
- Celebration animation on completion

**7. Navigation Footer**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ← Previous Section              ○ ○ ● ○ ○            Next Section →   │
│    Padding and Stride                                  Building a CNN   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
SectionLearningPage/
├── components/
│   ├── header/
│   │   ├── SectionHeader.tsx
│   │   ├── NavigationBreadcrumb.tsx
│   │   └── PreviewModeBadge.tsx
│   ├── video/
│   │   ├── TheaterVideoPlayer.tsx
│   │   ├── VideoControls.tsx
│   │   ├── VideoSettings.tsx
│   │   └── PictureInPicture.tsx
│   ├── tabs/
│   │   ├── ContentTabs.tsx
│   │   ├── OverviewTab.tsx
│   │   ├── VideoTab.tsx
│   │   ├── CodeTab.tsx
│   │   ├── MathTab.tsx
│   │   ├── QuizTab.tsx
│   │   ├── AITab.tsx
│   │   └── ResourcesTab.tsx
│   ├── sidebar/
│   │   ├── CourseSidebar.tsx
│   │   ├── ChapterList.tsx
│   │   ├── SectionItem.tsx
│   │   └── SAMQuickChat.tsx
│   ├── ai/
│   │   ├── SAMTutorPanel.tsx
│   │   ├── PracticeProblems.tsx
│   │   └── SocraticDialogue.tsx
│   ├── navigation/
│   │   ├── SectionNavigation.tsx
│   │   └── ProgressDots.tsx
│   └── utils/
│       ├── CompletionCelebration.tsx
│       └── KeyboardShortcuts.tsx
└── page.tsx
```

---

## Shared Design System

### Typography Scale

```css
--font-display: 'Cal Sans', 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Color System

```css
/* Primary Brand */
--primary-50: #EEF2FF;
--primary-100: #E0E7FF;
--primary-500: #6366F1;
--primary-600: #4F46E5;
--primary-700: #4338CA;

/* Success */
--success-500: #10B981;
--success-600: #059669;

/* Warning */
--warning-500: #F59E0B;
--warning-600: #D97706;

/* Error */
--error-500: #EF4444;
--error-600: #DC2626;

/* Neutral */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### Shadow System

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
```

### Animation Presets

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
--transition-slower: 500ms ease;

/* Framer Motion Presets */
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };
const slideUp = { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 } };
const scaleIn = { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
```

---

## Implementation Timeline

### Phase 1: Course Landing Page (Week 1)
- [ ] Design new hero section
- [ ] Implement cinematic hero component
- [ ] Create enrollment card
- [ ] Build course content accordion
- [ ] Add instructor section
- [ ] Implement reviews section
- [ ] Add related courses carousel
- [ ] Mobile optimization
- [ ] Testing & refinement

### Phase 2: Learning Dashboard (Week 2)
- [ ] Design dashboard layout
- [ ] Implement continue learning card
- [ ] Create progress dashboard
- [ ] Build gamification elements
- [ ] Add achievement system
- [ ] Implement AI insights
- [ ] Add activity timeline
- [ ] Mobile optimization
- [ ] Testing & refinement

### Phase 3: Chapter View (Week 2-3)
- [ ] Design chapter overview
- [ ] Implement chapter hero
- [ ] Create section list
- [ ] Add resources panel
- [ ] Mobile optimization
- [ ] Testing & refinement

### Phase 4: Section Learning (Week 3-4)
- [ ] Design learning interface
- [ ] Implement theater video player
- [ ] Create smart tab navigation
- [ ] Build collapsible sidebar
- [ ] Enhance AI assistant panel
- [ ] Add progress tracking
- [ ] Implement keyboard shortcuts
- [ ] Mobile optimization
- [ ] Testing & refinement

---

## Technical Requirements

### Dependencies to Add
```json
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "framer-motion": "^10.16.4",
    "react-player": "^2.13.0",
    "react-confetti": "^6.1.0",
    "lucide-react": "^0.294.0"
  }
}
```

### Performance Targets
- Lighthouse Performance: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1

### Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation throughout
- Screen reader tested
- Focus indicators visible
- Color contrast > 4.5:1

---

## Success Metrics

### User Experience
- Reduced bounce rate on course pages
- Increased enrollment conversion
- Higher course completion rates
- Improved time on page
- Better mobile engagement

### Technical
- Improved Lighthouse scores
- Reduced bundle size
- Faster page loads
- Lower error rates

---

## Next Steps

1. **Review this plan** and provide feedback
2. **Approve design direction** for each page
3. **Begin Phase 1** implementation
4. **Iterate based on feedback**

---

*This plan is a living document and will be updated as we progress through implementation.*

**Document Version:** 1.0.0
**Last Updated:** December 28, 2025
