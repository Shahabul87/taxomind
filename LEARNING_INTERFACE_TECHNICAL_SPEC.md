# 🔧 Technical Specification - Section Learning Interface

## Quick Implementation Guide

### 🎯 Core Requirements Summary

#### Video Integration (YouTube)
- **Primary**: YouTube URLs stored in `section.videoUrl` or `videos.url`
- **Player**: react-youtube package with custom controls
- **Tracking**: 25%, 50%, 75%, 100% milestone tracking
- **Features**: Resume playback, quality selection, speed control

#### Content Types Support
1. **Videos**: YouTube embedded player with playlist
2. **Blogs**: Rich text with markdown support
3. **Math**: LaTeX rendering with KaTeX
4. **Code**: Syntax highlighting with Prism
5. **Exams**: Interactive quiz system
6. **Resources**: Downloadable files with access control

#### Dual Mode System
- **Learning Mode**: For enrolled users with progress tracking
- **Preview Mode**: For teachers and potential students

## 📁 File Structure

```
app/(course)/courses/[courseId]/learn/
├── layout.tsx                                    # Learning layout wrapper
├── [chapterId]/
│   ├── page.tsx                                 # Chapter overview
│   └── sections/
│       └── [sectionId]/
│           ├── page.tsx                         # Section learning page
│           ├── loading.tsx                      # Loading skeleton
│           ├── error.tsx                        # Error boundary
│           └── _components/
│               ├── enterprise-section-learning.tsx
│               ├── section-video-player.tsx
│               ├── section-content-tabs.tsx
│               ├── section-sidebar.tsx
│               └── section-progress.tsx
```

## 🔑 Key Component Interfaces

### Main Section Page
```typescript
// page.tsx
interface SectionPageProps {
  params: {
    courseId: string;
    chapterId: string;
    sectionId: string;
  };
}

// Data fetching
const sectionData = await db.section.findUnique({
  where: { id: sectionId },
  include: {
    videos: true,
    blogs: true,
    articles: true,
    notes: true,
    codeExplanations: true,
    mathExplanations: true,
    exams: true,
    chapter: {
      include: {
        sections: { orderBy: { position: "asc" } },
        course: true
      }
    }
  }
});

// Check enrollment
const enrollment = await db.enrollment.findUnique({
  where: {
    userId_courseId: {
      userId: session.user.id,
      courseId: params.courseId
    }
  }
});

// Determine mode
const isTeacher = sectionData.chapter.course.userId === session.user.id;
const mode = isTeacher ? 'preview' : enrollment ? 'learning' : 'restricted';
```

### YouTube Player Component
```typescript
// section-video-player.tsx
'use client';

import YouTube from 'react-youtube';
import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  sectionId: string;
  userId: string;
  mode: 'learning' | 'preview';
  onProgress?: (progress: number) => void;
}

export function SectionVideoPlayer({
  videoUrl,
  sectionId,
  userId,
  mode,
  onProgress
}: VideoPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // Extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  // Track progress
  useEffect(() => {
    if (!player || mode === 'preview') return;

    const interval = setInterval(async () => {
      const currentTime = await player.getCurrentTime();
      const duration = await player.getDuration();
      const percentage = (currentTime / duration) * 100;

      setProgress(percentage);

      // Save progress at milestones
      if ([25, 50, 75, 100].includes(Math.floor(percentage))) {
        await saveProgress(sectionId, userId, percentage);
      }

      onProgress?.(percentage);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [player, mode]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
      {mode === 'preview' && (
        <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
          Preview Mode
        </div>
      )}

      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={(event) => setPlayer(event.target)}
        className="absolute inset-0 w-full h-full"
      />

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

async function saveProgress(sectionId: string, userId: string, progress: number) {
  await fetch(`/api/sections/${sectionId}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, progress }),
  });
}
```

### Content Tabs Component
```typescript
// section-content-tabs.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, BookOpen, Calculator, Code2, FileQuestion, Download } from "lucide-react";

interface ContentTabsProps {
  section: SectionWithContent;
  mode: 'learning' | 'preview';
}

export function SectionContentTabs({ section, mode }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>

        {section.videos?.length > 0 && (
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Videos</span>
            <Badge>{section.videos.length}</Badge>
          </TabsTrigger>
        )}

        {section.blogs?.length > 0 && (
          <TabsTrigger value="blogs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Articles</span>
            <Badge>{section.blogs.length}</Badge>
          </TabsTrigger>
        )}

        {section.mathExplanations?.length > 0 && (
          <TabsTrigger value="math" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Math</span>
            <Badge>{section.mathExplanations.length}</Badge>
          </TabsTrigger>
        )}

        {section.codeExplanations?.length > 0 && (
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">Code</span>
            <Badge>{section.codeExplanations.length}</Badge>
          </TabsTrigger>
        )}

        {section.exams?.length > 0 && (
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            <span className="hidden sm:inline">Exams</span>
            <Badge>{section.exams.length}</Badge>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <SectionOverview section={section} />
      </TabsContent>

      <TabsContent value="videos" className="mt-6">
        <VideosList videos={section.videos} mode={mode} />
      </TabsContent>

      <TabsContent value="blogs" className="mt-6">
        <BlogsList blogs={section.blogs} />
      </TabsContent>

      <TabsContent value="math" className="mt-6">
        <MathExplanations explanations={section.mathExplanations} />
      </TabsContent>

      <TabsContent value="code" className="mt-6">
        <CodeExplanations explanations={section.codeExplanations} />
      </TabsContent>

      <TabsContent value="exams" className="mt-6">
        <ExamsList exams={section.exams} mode={mode} />
      </TabsContent>
    </Tabs>
  );
}
```

### Progress Tracking
```typescript
// section-progress.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';

interface ProgressTrackerProps {
  sectionId: string;
  userId: string;
  totalItems: number;
  completedItems: string[];
}

export function SectionProgress({
  sectionId,
  userId,
  totalItems,
  completedItems
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const percentage = (completedItems.length / totalItems) * 100;
    setProgress(percentage);

    if (percentage === 100) {
      markSectionComplete();
    }
  }, [completedItems]);

  const markSectionComplete = async () => {
    await fetch(`/api/sections/${sectionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Section Progress</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        {completedItems.length} of {totalItems} items completed
      </div>
    </div>
  );
}
```

## 🔌 API Endpoints

### Progress Tracking
```typescript
// app/api/sections/[sectionId]/progress/route.ts
export async function POST(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  const { userId, progress, type, itemId } = await request.json();

  // Update progress
  const userProgress = await db.userProgress.upsert({
    where: {
      userId_sectionId: {
        userId,
        sectionId: params.sectionId,
      },
    },
    update: {
      [`${type}Progress`]: progress,
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      sectionId: params.sectionId,
      [`${type}Progress`]: progress,
    },
  });

  return NextResponse.json({ success: true, progress: userProgress });
}
```

### Section Completion
```typescript
// app/api/sections/[sectionId]/complete/route.ts
export async function POST(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  const { userId } = await request.json();

  // Mark section complete
  const completion = await db.sectionCompletion.create({
    data: {
      userId,
      sectionId: params.sectionId,
      completedAt: new Date(),
    },
  });

  // Check chapter completion
  await checkChapterCompletion(userId, params.sectionId);

  return NextResponse.json({ success: true, completion });
}
```

## 🎨 Styling Guidelines

### Tailwind Classes Structure
```css
/* Container */
.learning-container: "min-h-screen bg-gray-50 dark:bg-gray-900"

/* Header */
.learning-header: "sticky top-0 z-50 bg-white dark:bg-gray-800 border-b"

/* Content Area */
.content-wrapper: "container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6"

/* Main Content */
.main-content: "lg:col-span-8 space-y-6"

/* Sidebar */
.sidebar: "lg:col-span-4 space-y-4"

/* Cards */
.content-card: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"

/* Video Player */
.video-wrapper: "aspect-video w-full rounded-lg overflow-hidden bg-black"

/* Tabs */
.tab-active: "bg-blue-500 text-white"
.tab-inactive: "bg-gray-100 dark:bg-gray-700 text-gray-600"
```

## 🔐 Access Control

### Middleware Check
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession();
  const pathname = request.nextUrl.pathname;

  // Extract IDs from path
  const match = pathname.match(/courses\/([^\/]+)\/learn\/([^\/]+)\/sections\/([^\/]+)/);
  if (!match) return NextResponse.next();

  const [, courseId, chapterId, sectionId] = match;

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session?.user?.id || '',
        courseId,
      },
    },
  });

  // Check if teacher
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { userId: true },
  });

  const isTeacher = course?.userId === session?.user?.id;

  // Redirect if no access
  if (!enrollment && !isTeacher) {
    return NextResponse.redirect(new URL(`/courses/${courseId}`, request.url));
  }

  // Add headers
  const response = NextResponse.next();
  response.headers.set('X-User-Mode', isTeacher ? 'preview' : 'learning');
  response.headers.set('X-Enrollment-Id', enrollment?.id || '');

  return response;
}
```

## 🚀 Deployment Checklist

### Environment Variables
```env
# YouTube API
YOUTUBE_API_KEY=your_api_key

# Video Settings
MAX_VIDEO_DURATION=3600
VIDEO_QUALITY_DEFAULT=720p

# Progress Tracking
PROGRESS_UPDATE_INTERVAL=5000
PROGRESS_MILESTONES=25,50,75,100

# Cache Settings
CACHE_TTL=3600
REDIS_URL=redis://localhost:6379
```

### Database Schema Updates
```prisma
model UserProgress {
  id              String   @id @default(cuid())
  userId          String
  sectionId       String
  videoProgress   Json     @default("{}")
  completedItems  Json     @default("{}")
  overallProgress Float    @default(0)
  lastAccessedAt  DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id])
  section Section @relation(fields: [sectionId], references: [id])

  @@unique([userId, sectionId])
  @@index([userId])
  @@index([sectionId])
}

model SectionCompletion {
  id          String   @id @default(cuid())
  userId      String
  sectionId   String
  completedAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id])
  section Section @relation(fields: [sectionId], references: [id])

  @@unique([userId, sectionId])
  @@index([userId])
  @@index([sectionId])
}
```

## 🧪 Testing Requirements

### Unit Tests
```typescript
// __tests__/video-player.test.tsx
describe('VideoPlayer', () => {
  it('extracts YouTube ID correctly', () => {
    expect(getYouTubeId('https://youtube.com/watch?v=abc123')).toBe('abc123');
    expect(getYouTubeId('https://youtu.be/abc123')).toBe('abc123');
  });

  it('tracks progress at milestones', async () => {
    // Test progress tracking
  });

  it('shows preview mode indicator', () => {
    // Test preview mode
  });
});
```

### E2E Tests
```typescript
// e2e/learning-flow.spec.ts
test('Complete learning flow', async ({ page }) => {
  // Navigate to section
  await page.goto('/courses/123/learn/456/sections/789');

  // Check video plays
  await page.click('[data-testid="play-button"]');
  await page.waitForTimeout(5000);

  // Check progress updated
  const progress = await page.textContent('[data-testid="progress"]');
  expect(parseInt(progress)).toBeGreaterThan(0);

  // Navigate tabs
  await page.click('[data-testid="tab-blogs"]');
  await expect(page.locator('[data-testid="blog-content"]')).toBeVisible();
});
```

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Status:** READY FOR IMPLEMENTATION