# SAM AI Tutor Placement Guide

## Overview

This guide outlines the optimal placement strategies for the SAM AI Tutor within the Taxomind LMS interface, considering user experience, accessibility, and functionality across different user roles and contexts.

## Current Implementation Status

✅ **Already Implemented**: SAM AI Tutor is currently integrated in the **Teacher Layout** (`app/(protected)/teacher/layout.tsx`)

## Recommended Placement Strategies

### 1. **Global Floating Assistant (Recommended)**

**Best For**: Universal access across all authenticated pages

**Implementation**: Add SAM AI Tutor to the root layout with context-aware functionality

```typescript
// app/layout.tsx - Add to the main layout
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session;
  
  try {
    session = await auth();
  } catch (error) {
    console.error("Error fetching auth session:", error);
    session = null;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(dmSans.className, "min-h-screen")}>
        <Providers session={session}>
          <ConfettiProvider />
          <ClientToaster />
          <PageBackground>
            {/* Fixed header */}
            <div className="fixed top-0 left-0 right-0 z-[50]">
              <Suspense fallback={<HeaderFallback />}>
                <AsyncHeader />
              </Suspense>
            </div>
            
            {/* Main layout with sidebar and content */}
            <Suspense fallback={<div>Loading...</div>}>
              <AsyncLayoutWithSidebar>
                {children}
              </AsyncLayoutWithSidebar>
            </Suspense>
            
            {/* Global SAM AI Tutor */}
            {session && (
              <SAMTutorProvider>
                <SAMGlobalAssistant />
              </SAMTutorProvider>
            )}
          </PageBackground>
        </Providers>
      </body>
    </html>
  )
}
```

**Features**:
- **Floating Chat Icon**: Bottom-right corner with role-appropriate styling
- **Context-Aware**: Automatically detects current page and user role
- **Persistent**: Available across all authenticated pages
- **Responsive**: Adapts to mobile, tablet, and desktop views

### 2. **Role-Specific Placement**

#### A. **Teacher Dashboard Integration**

**Location**: `app/(protected)/teacher/layout.tsx` (✅ Already Implemented)

**Current Implementation**:
```typescript
const TeacherLayout = ({ children }: Props) => {
  return (
    <SamAITutorProvider>
      <TeacherPageContextInjector />
      <div className="">
        {children}
      </div>
      <SamAITutorAssistant />
    </SamAITutorProvider>
  );
};
```

**Enhancement Recommendations**:
```typescript
// Enhanced Teacher Layout with contextual SAM placement
const TeacherLayout = ({ children }: Props) => {
  return (
    <SamAITutorProvider>
      <TeacherPageContextInjector />
      <div className="relative">
        {children}
        
        {/* Context-aware SAM placement */}
        <SAMTeacherAssistant 
          position="floating" // or "sidebar" | "header" | "tab"
          features={[
            "lesson-planning",
            "student-analytics", 
            "assessment-generation",
            "teaching-insights"
          ]}
        />
      </div>
    </SamAITutorProvider>
  );
};
```

#### B. **Student Dashboard Integration**

**Location**: `app/dashboard/layout.tsx` (Recommended Addition)

```typescript
// Enhanced Student Dashboard Layout
const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen pt-0">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      
      {/* Student-focused SAM AI Tutor */}
      <SAMTutorProvider>
        <SAMStudentAssistant 
          features={[
            "homework-help",
            "concept-explanation",
            "study-guidance",
            "quiz-practice"
          ]}
        />
      </SAMTutorProvider>
    </div>
  );
};
```

#### C. **Course Learning Integration**

**Location**: `app/(course)/courses/[courseId]/learn/layout.tsx`

```typescript
// Course Learning Layout with SAM Integration
export default async function CourseLearnLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { courseId: string };
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <main className="flex-1 text-gray-900 dark:text-gray-100 relative">
          {children}
          
          {/* Course-specific SAM AI Tutor */}
          <SAMTutorProvider>
            <SAMCourseAssistant 
              courseId={params.courseId}
              mode="learning"
              features={[
                "chapter-explanation",
                "quiz-generation",
                "progress-tracking",
                "concept-clarification"
              ]}
              position="side-panel" // Integrated with course content
            />
          </SAMTutorProvider>
        </main>
      </div>
    </ThemeProvider>
  );
}
```

### 3. **Contextual Placement Options**

#### A. **Header Integration**

**Best For**: Quick access without taking up screen space

```typescript
// components/layout/header-with-sam.tsx
export function HeaderWithSAM({ user }: { user: any }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Logo />
          
          {/* Navigation */}
          <Navigation />
          
          {/* SAM AI Tutor Header Integration */}
          <div className="flex items-center space-x-4">
            <SAMHeaderButton 
              user={user}
              showNotifications={true}
              compactMode={true}
            />
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### B. **Sidebar Integration**

**Best For**: Persistent access with expanded functionality

```typescript
// components/layout/sidebar-with-sam.tsx
export function SidebarWithSAM({ user }: { user: any }) {
  return (
    <div className="fixed left-0 top-16 bottom-0 w-80 bg-slate-800/95 border-r border-slate-700/50">
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNavigation user={user} />
        </div>
        
        {/* SAM AI Tutor Sidebar Panel */}
        <div className="border-t border-slate-700/50 p-4">
          <SAMSidebarPanel 
            user={user}
            collapsed={false}
            features={["quick-help", "recent-conversations", "shortcuts"]}
          />
        </div>
      </div>
    </div>
  );
}
```

#### C. **Tab Integration**

**Best For**: Dedicated space for extended interactions

```typescript
// components/layout/tabbed-interface.tsx
export function TabbedInterfaceWithSAM({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
        
        {/* SAM AI Tutor Tab Panel */}
        <div className="w-96 border-l border-slate-200 dark:border-slate-700">
          <SAMTabPanel 
            defaultOpen={false}
            features={[
              "conversation-history",
              "learning-objectives",
              "performance-insights",
              "recommended-actions"
            ]}
          />
        </div>
      </div>
    </div>
  );
}
```

## Implementation Components

### 1. **SAM Global Assistant Component**

```typescript
// components/sam/sam-global-assistant.tsx
"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SAMAITutorAssistant } from '@/app/(protected)/teacher/_components/sam-ai-tutor-assistant';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SAMGlobalAssistant() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });

  // Context detection
  const learningContext = useMemo(() => {
    if (!pathname) return {};
    
    // Extract context from URL
    const courseMatch = pathname.match(/\/courses\/([^\/]+)/);
    const chapterMatch = pathname.match(/\/chapters\/([^\/]+)/);
    const sectionMatch = pathname.match(/\/sections\/([^\/]+)/);
    
    return {
      courseId: courseMatch?.[1],
      chapterId: chapterMatch?.[1],
      sectionId: sectionMatch?.[1],
      currentPage: pathname,
      userRole: session?.user?.role || 'student'
    };
  }, [pathname, session]);

  // Determine tutor mode based on context
  const tutorMode = useMemo(() => {
    if (pathname?.includes('/teacher')) return 'teacher';
    if (pathname?.includes('/admin')) return 'admin';
    return 'student';
  }, [pathname]);

  // Hide on specific routes
  const shouldHide = useMemo(() => {
    if (!pathname) return true;
    
    const hideRoutes = [
      '/auth',
      '/login',
      '/register',
      '/api',
      '/_next'
    ];
    
    return hideRoutes.some(route => pathname.startsWith(route));
  }, [pathname]);

  if (!session || shouldHide) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full shadow-lg",
            "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
            "border-2 border-white/20 backdrop-blur-sm",
            "transition-all duration-300 ease-in-out",
            "hover:scale-110 active:scale-95"
          )}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="sr-only">Open SAM AI Tutor</span>
        </Button>
      )}

      {/* SAM AI Tutor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className={cn(
            "bg-white dark:bg-slate-900 rounded-lg shadow-2xl",
            "w-full max-w-4xl h-[90vh] max-h-[800px]",
            "mx-4 overflow-hidden"
          )}>
            <SAMAITutorAssistant
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              learningContext={learningContext}
              tutorMode={tutorMode}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

### 2. **Context-Aware SAM Components**

```typescript
// components/sam/sam-context-aware.tsx
export function SAMContextAwareWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Determine SAM configuration based on context
  const samConfig = useMemo(() => {
    if (pathname?.includes('/teacher')) {
      return {
        mode: 'teacher',
        features: ['lesson-planning', 'student-analytics', 'assessment-generation'],
        position: 'floating',
        theme: 'teacher'
      };
    }
    
    if (pathname?.includes('/courses/') && pathname?.includes('/learn')) {
      return {
        mode: 'student',
        features: ['concept-explanation', 'quiz-help', 'study-guidance'],
        position: 'side-panel',
        theme: 'learning'
      };
    }
    
    if (pathname?.includes('/dashboard')) {
      return {
        mode: 'dashboard',
        features: ['progress-tracking', 'recommendations', 'quick-help'],
        position: 'header',
        theme: 'dashboard'
      };
    }
    
    return {
      mode: 'general',
      features: ['general-help', 'navigation-assistance'],
      position: 'floating',
      theme: 'default'
    };
  }, [pathname]);

  return (
    <SAMTutorProvider config={samConfig}>
      {children}
      <SAMAdaptiveInterface />
    </SAMTutorProvider>
  );
}
```

### 3. **Mobile-Responsive SAM Component**

```typescript
// components/sam/sam-mobile-responsive.tsx
export function SAMMobileResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <SAMBottomSheet
        trigger={
          <Button className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full">
            <MessageCircle className="h-6 w-6" />
          </Button>
        }
      />
    );
  }

  if (isTablet) {
    return (
      <SAMSidePanel
        position="right"
        width="360px"
        collapsible={true}
      />
    );
  }

  return (
    <SAMFloatingWindow
      defaultPosition={{ x: 20, y: 20 }}
      draggable={true}
      resizable={true}
    />
  );
}
```

## Placement Recommendations by Page Type

### 1. **Homepage & Marketing Pages**
- **Placement**: None (not needed for marketing)
- **Alternative**: Help chat button for general inquiries

### 2. **Course Catalog Pages**
- **Placement**: Header button for course recommendations
- **Features**: Course selection help, learning path suggestions

### 3. **Course Learning Pages**
- **Placement**: Side panel or floating window
- **Features**: Concept explanation, quiz help, progress tracking

### 4. **Teacher Dashboard**
- **Placement**: Floating assistant (current implementation)
- **Features**: Lesson planning, student analytics, assessment tools

### 5. **Student Dashboard**
- **Placement**: Header integration or floating button
- **Features**: Study recommendations, progress insights, help

### 6. **Assessment Pages**
- **Placement**: Minimized floating button (to avoid cheating)
- **Features**: Clarification on instructions only

### 7. **Profile & Settings Pages**
- **Placement**: Header button
- **Features**: Account help, platform guidance

## Implementation Priority

### Phase 1: Core Integration (Immediate)
1. ✅ **Teacher Layout** (Already implemented)
2. **Global Floating Assistant** (High priority)
3. **Course Learning Integration** (High priority)

### Phase 2: Enhanced Features (Next Sprint)
1. **Student Dashboard Integration**
2. **Mobile-Responsive Components**
3. **Context-Aware Configuration**

### Phase 3: Advanced Features (Future)
1. **Sidebar Integration**
2. **Tab Panel Interface**
3. **Voice-Activated SAM**

## Technical Implementation

### 1. **Add to Global Layout**

```typescript
// app/layout.tsx - Add SAM to global layout
import { SAMGlobalProvider } from '@/components/sam/sam-global-provider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  
  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          <SAMGlobalProvider>
            {/* Existing layout components */}
            <PageBackground>
              <AsyncHeader />
              <AsyncLayoutWithSidebar>
                {children}
              </AsyncLayoutWithSidebar>
            </PageBackground>
            
            {/* SAM AI Tutor - Available globally */}
            <SAMGlobalAssistant />
          </SAMGlobalProvider>
        </Providers>
      </body>
    </html>
  );
}
```

### 2. **Context Detection Hook**

```typescript
// hooks/use-sam-context.ts
export function useSAMContext() {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  return useMemo(() => {
    const context = {
      page: pathname,
      user: session?.user,
      role: session?.user?.role,
      features: [],
      mode: 'general'
    };
    
    // Detect context from URL
    if (pathname?.includes('/teacher')) {
      context.mode = 'teacher';
      context.features = ['lesson-planning', 'analytics', 'assessment'];
    } else if (pathname?.includes('/learn')) {
      context.mode = 'student';
      context.features = ['concept-help', 'quiz-help', 'progress'];
    }
    
    return context;
  }, [pathname, session]);
}
```

### 3. **Responsive SAM Provider**

```typescript
// components/sam/sam-responsive-provider.tsx
export function SAMResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <SAMContext.Provider value={{ screenSize }}>
      {children}
    </SAMContext.Provider>
  );
}
```

## Best Practices

### 1. **User Experience**
- **Non-Intrusive**: Don't block content or interfere with primary tasks
- **Contextual**: Provide relevant help based on current page/task
- **Accessible**: Ensure keyboard navigation and screen reader support

### 2. **Performance**
- **Lazy Loading**: Load SAM components only when needed
- **Efficient Context**: Minimize context recalculation
- **Memory Management**: Properly cleanup event listeners and timers

### 3. **Security**
- **Session Validation**: Ensure user is authenticated before showing SAM
- **Role-Based Access**: Limit features based on user role
- **Data Protection**: Don't expose sensitive information in context

### 4. **Customization**
- **Theme Adaptation**: Match SAM UI to current page theme
- **Feature Toggles**: Allow users to enable/disable specific features
- **Position Preferences**: Remember user's preferred SAM position

## Conclusion

The **Global Floating Assistant** approach is recommended as the primary implementation strategy, as it provides:

1. **Universal Access**: Available across all authenticated pages
2. **Context Awareness**: Automatically adapts to current page and user role
3. **Flexibility**: Can be easily customized for different use cases
4. **Performance**: Minimal impact on page load times
5. **User Experience**: Non-intrusive but easily accessible

The current implementation in the Teacher Layout serves as a solid foundation that can be extended to support the global approach while maintaining the existing functionality.

---

*Last updated: July 2025*
*Implementation Status: Teacher Layout ✅ | Global Layout 🔄 | Student Layout 📋*