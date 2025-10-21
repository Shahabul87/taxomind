# SAM Engines - Integration Examples

This document provides copy-paste examples for integrating SAM engines into your existing pages.

## Quick Integration Examples

### 1. Add SAM Quick Access to Any Page

```tsx
import { SAMQuickAccess } from '@/components/sam/sam-quick-access';

// In your component
<SAMQuickAccess 
  courseId={course.id}
  userId={user.id}
  role={user.role}
  variant="compact" // or "full"
/>
```

### 2. Add to Course Dashboard (Teacher)

```tsx
// In app/(protected)/teacher/courses/[courseId]/page.tsx
import { SAMQuickAccess } from '@/components/sam/sam-quick-access';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CoursePage() {
  const router = useRouter();
  
  return (
    <div>
      {/* Existing course content */}
      
      {/* Add SAM AI Section */}
      <div className="mt-6">
        <SAMQuickAccess 
          courseId={courseId}
          userId={userId}
          role="ADMIN"
          variant="full"
        />
        
        {/* Or add a simple button */}
        <Button 
          onClick={() => router.push(`/teacher/courses/${courseId}/sam-analysis`)}
          className="mt-4"
        >
          Open SAM AI Analysis
        </Button>
      </div>
    </div>
  );
}
```

### 3. Add to Student Dashboard

```tsx
// In app/(dashboard)/(routes)/dashboard/page.tsx
import { StudentDashboard } from '@/components/sam/student-dashboard';

export default function DashboardPage() {
  return (
    <div>
      {/* Existing dashboard content */}
      
      {/* Add SAM Learning Dashboard */}
      <Tabs>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sam-insights">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sam-insights">
          <StudentDashboard 
            userId={userId}
            courseId={currentCourseId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4. Add Market Analysis to Course Settings

```tsx
// In course settings or analytics page
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function CourseAnalytics() {
  const [marketData, setMarketData] = useState(null);
  
  const runMarketAnalysis = async () => {
    const response = await fetch('/api/sam/course-market-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    });
    
    const data = await response.json();
    setMarketData(data.data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Position</CardTitle>
      </CardHeader>
      <CardContent>
        {marketData ? (
          <div>
            <p>Market Value: {marketData.market.value}</p>
            <p>Growth Rate: {marketData.market.growthRate}%</p>
            <p>Competition: {marketData.competition.position}</p>
          </div>
        ) : (
          <Button onClick={runMarketAnalysis}>
            Analyze Market Position
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5. Add Exam Generation to Assessment Page

```tsx
// In exam/quiz creation page
import { Button } from '@/components/ui/button';

function CreateExamPage() {
  const generateAIExam = async () => {
    const response = await fetch('/api/sam/exam-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        config: {
          totalQuestions: 20,
          duration: 60,
          bloomsDistribution: {
            REMEMBER: 20,
            UNDERSTAND: 25,
            APPLY: 25,
            ANALYZE: 15,
            EVALUATE: 10,
            CREATE: 5,
          },
          adaptiveMode: true,
        },
      }),
    });
    
    const data = await response.json();
    // Redirect to exam
    router.push(`/exams/${data.data.exam.id}`);
  };
  
  return (
    <div>
      <Button onClick={generateAIExam}>
        Generate AI-Powered Adaptive Exam
      </Button>
    </div>
  );
}
```

### 6. Add Bloom's Progress to Student Profile

```tsx
// In student profile or progress page
import { BloomsProgressChart } from '@/components/sam/student-dashboard/blooms-progress-chart';

function StudentProgress() {
  const [bloomsData, setBloomsData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/sam/blooms-analysis/student?courseId=${courseId}`)
      .then(res => res.json())
      .then(data => setBloomsData(data.data));
  }, []);
  
  return (
    <div>
      {bloomsData && (
        <BloomsProgressChart
          bloomsScores={bloomsData.studentProgress.bloomsScores}
          strengthAreas={bloomsData.studentProgress.strengthAreas}
          weaknessAreas={bloomsData.studentProgress.weaknessAreas}
          overallLevel={bloomsData.cognitiveProfile.overallCognitiveLevel}
        />
      )}
    </div>
  );
}
```

### 7. Add Course Guide to Teacher Tools

```tsx
// In teacher tools or course management
import { useState } from 'react';

function TeacherTools() {
  const [guideData, setGuideData] = useState(null);
  
  const generateGuide = async () => {
    const response = await fetch('/api/sam/course-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        courseId,
        includeComparison: true,
        includeProjections: true,
      }),
    });
    
    const data = await response.json();
    setGuideData(data.data);
  };
  
  const exportReport = () => {
    window.open(`/api/sam/course-guide?courseId=${courseId}&format=html`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Improvement Guide</CardTitle>
      </CardHeader>
      <CardContent>
        {guideData ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Depth Score</p>
                <p className="text-2xl font-bold">
                  {guideData.metrics.depth.overallDepth.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Engagement</p>
                <p className="text-2xl font-bold">
                  {guideData.metrics.engagement.overallEngagement.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Market Acceptance</p>
                <p className="text-2xl font-bold">
                  {guideData.metrics.marketAcceptance.overallAcceptance.toFixed(0)}%
                </p>
              </div>
            </div>
            <Button onClick={exportReport} variant="outline">
              Export Full Report
            </Button>
          </div>
        ) : (
          <Button onClick={generateGuide}>
            Generate Course Guide
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

## Navigation Menu Integration

### Add to Main Navigation

```tsx
// In your navigation component
const samMenuItems = [
  {
    title: 'AI Analysis',
    href: `/teacher/courses/${courseId}/sam-analysis`,
    icon: Sparkles,
    role: 'ADMIN',
  },
  {
    title: 'My Learning Dashboard',
    href: '/student/sam-dashboard',
    icon: ChartBar,
    role: 'USER',
  },
];

// Add to existing menu
<NavigationMenu>
  {/* Existing items */}
  
  {/* SAM AI Section */}
  <NavigationMenuSection title="AI Features">
    {samMenuItems
      .filter(item => item.role === userRole)
      .map(item => (
        <NavigationMenuItem key={item.href}>
          <Link href={item.href}>
            <item.icon className="w-4 h-4 mr-2" />
            {item.title}
          </Link>
        </NavigationMenuItem>
      ))}
  </NavigationMenuSection>
</NavigationMenu>
```

## Sidebar Integration

```tsx
// In your sidebar component
const samSidebarItems = {
  teacher: [
    {
      label: 'SAM AI Analysis',
      icon: Sparkles,
      href: `/teacher/courses/${courseId}/sam-analysis`,
    },
    {
      label: 'Market Insights',
      icon: TrendingUp,
      href: `/teacher/courses/${courseId}/sam-analysis?tab=market`,
    },
    {
      label: 'Course Guide',
      icon: BookOpen,
      href: `/teacher/courses/${courseId}/sam-analysis?tab=guide`,
    },
  ],
  student: [
    {
      label: 'My Progress',
      icon: ChartBar,
      href: '/student/sam-dashboard',
    },
    {
      label: 'Study Guide',
      icon: FileText,
      href: '/student/study-guides',
    },
  ],
};
```

## Context Menu Integration

```tsx
// Add to course context menu
const samActions = [
  {
    label: 'Run AI Analysis',
    action: () => router.push(`/teacher/courses/${courseId}/sam-analysis`),
    icon: Sparkles,
  },
  {
    label: 'View Market Position',
    action: () => runQuickAnalysis('market'),
    icon: TrendingUp,
  },
  {
    label: 'Check Cognitive Depth',
    action: () => runQuickAnalysis('blooms'),
    icon: Brain,
  },
];

<ContextMenu>
  {/* Existing items */}
  <ContextMenuSeparator />
  <ContextMenuLabel>AI Features</ContextMenuLabel>
  {samActions.map(action => (
    <ContextMenuItem key={action.label} onClick={action.action}>
      <action.icon className="w-4 h-4 mr-2" />
      {action.label}
    </ContextMenuItem>
  ))}
</ContextMenu>
```

## Dashboard Widget

```tsx
// Create a SAM widget for existing dashboards
function SAMInsightsWidget({ courseId }: { courseId: string }) {
  const [insights, setInsights] = useState(null);
  
  useEffect(() => {
    // Load latest insights
    fetch(`/api/sam/integrated-analysis?courseId=${courseId}`)
      .then(res => res.json())
      .then(data => setInsights(data.data));
  }, [courseId]);
  
  if (!insights) return <LoadingSpinner />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {insights.integratedRecommendations?.slice(0, 3).map((rec, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded">
              <p className="text-sm font-medium">{rec.title}</p>
              <p className="text-xs text-gray-500">{rec.priority} priority</p>
            </div>
          ))}
        </div>
        <Button 
          variant="link" 
          className="mt-2 p-0"
          onClick={() => router.push(`/teacher/courses/${courseId}/sam-analysis`)}
        >
          View All Insights →
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Mobile Integration

```tsx
// Mobile-friendly SAM access
function MobileSAMMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sparkles className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>SAM AI Features</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Button 
            className="w-full justify-start"
            variant="ghost"
            onClick={() => router.push('/student/sam-dashboard')}
          >
            <ChartBar className="w-4 h-4 mr-2" />
            My Progress
          </Button>
          {/* Add more mobile-friendly buttons */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

These examples show various ways to integrate SAM engines into your existing application. Choose the integration method that best fits your UI/UX design.