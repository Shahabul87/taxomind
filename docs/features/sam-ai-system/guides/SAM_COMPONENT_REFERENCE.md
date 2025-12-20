# SAM AI Component Reference Guide
**Taxomind LMS - Component Library Documentation**

## 📋 Component Overview

This reference guide provides detailed documentation for all SAM (Smart AI Mentor) components implemented in the Taxomind LMS platform.

---

## 🎯 Core Intelligence Components

### 1. MultiModalContentIntelligence

**Location**: `/components/sam/multi-modal-content-intelligence.tsx`  
**Purpose**: Analyzes and enhances content using AI intelligence

#### Props Interface
```typescript
interface MultiModalContentIntelligenceProps {
  contentId: string;
  userId?: string;
  contentType?: 'text' | 'video' | 'audio' | 'image' | 'document';
  enableAutoEnhancement?: boolean;
  enableComplexityAnalysis?: boolean;
  onAnalysisComplete?: (analysis: ContentAnalysis) => void;
  onEnhancementSuggested?: (suggestions: Enhancement[]) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<MultiModalContentIntelligence
  contentId="course-123-chapter-1"
  userId={user.id}
  contentType="text"
  enableAutoEnhancement={true}
  enableComplexityAnalysis={true}
  onAnalysisComplete={(analysis) => {
    console.log('Content complexity:', analysis.complexityScore);
    console.log('Suggested improvements:', analysis.suggestions);
  }}
  className="w-full bg-white rounded-lg"
/>
```

#### Features
- Content complexity analysis (0-100 scale)
- Learning objective extraction
- Prerequisite identification
- Enhancement suggestions
- Multi-format content support
- Real-time analysis feedback

#### Data Structure
```typescript
interface ContentAnalysis {
  complexityScore: number;
  readabilityLevel: string;
  learningObjectives: string[];
  prerequisites: string[];
  suggestedEnhancements: Enhancement[];
  estimatedReadingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

---

### 2. ResourceIntelligenceHub

**Location**: `/components/sam/resource-intelligence-hub.tsx`  
**Purpose**: Provides smart content curation and personalized resource recommendations

#### Props Interface
```typescript
interface ResourceIntelligenceHubProps {
  courseId: string;
  userId: string;
  chapterId?: string;
  sectionId?: string;
  enableSmartCuration?: boolean;
  enablePersonalizedRecommendations?: boolean;
  enableResourceRating?: boolean;
  showLearningPath?: boolean;
  onResourceSelected?: (resource: Resource) => void;
  onPathUpdated?: (path: LearningPath) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<ResourceIntelligenceHub
  courseId="react-fundamentals"
  userId={user.id}
  chapterId="hooks-intro"
  enableSmartCuration={true}
  enablePersonalizedRecommendations={true}
  enableResourceRating={true}
  showLearningPath={true}
  onResourceSelected={(resource) => {
    console.log('User selected resource:', resource.title);
  }}
  onPathUpdated={(path) => {
    console.log('Learning path updated:', path.milestones);
  }}
/>
```

#### Features
- Smart content curation based on learning progress
- Personalized resource recommendations
- Interactive learning path visualization
- Resource effectiveness tracking
- Community-driven resource ratings
- Learning goal alignment

---

### 3. AIContentGenerationAssistant

**Location**: `/components/sam/ai-content-generation-assistant.tsx`  
**Purpose**: AI-powered content creation for courses, chapters, and assessments

#### Props Interface
```typescript
interface AIContentGenerationAssistantProps {
  context: {
    courseId?: string;
    subject: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    targetAudience?: string;
    duration?: number;
  };
  contentType: 'course' | 'chapter' | 'section' | 'assessment' | 'quiz';
  enableTemplates?: boolean;
  enableBulkGeneration?: boolean;
  onContentGenerated?: (content: GeneratedContent) => void;
  onTemplateSelected?: (template: ContentTemplate) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<AIContentGenerationAssistant
  context={{
    courseId: "web-dev-101",
    subject: "React Hooks",
    level: "intermediate",
    targetAudience: "Frontend Developers",
    duration: 45
  }}
  contentType="chapter"
  enableTemplates={true}
  enableBulkGeneration={false}
  onContentGenerated={(content) => {
    console.log('Generated content:', content);
    // Save content to course
    saveCourseContent(content);
  }}
  onTemplateSelected={(template) => {
    console.log('Template selected:', template.name);
  }}
/>
```

#### Features
- AI-powered content generation
- Multiple content formats support
- Template-based creation
- Bulk content generation
- Learning objective alignment
- Customizable generation parameters

---

## 📊 Analytics & Dashboard Components

### 4. PredictiveLearningDashboard

**Location**: `/components/dashboard/predictive-learning-dashboard.tsx`  
**Purpose**: Displays predictive learning analytics and personalized insights

#### Props Interface
```typescript
interface PredictiveLearningDashboardProps {
  userId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  courseId?: string;
  showRecommendations?: boolean;
  showProgressPredictions?: boolean;
  enableInteractiveCharts?: boolean;
  onRecommendationClick?: (recommendation: Recommendation) => void;
  onGoalSet?: (goal: LearningGoal) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<PredictiveLearningDashboard
  userId={user.id}
  timeRange="30d"
  courseId="data-science-fundamentals"
  showRecommendations={true}
  showProgressPredictions={true}
  enableInteractiveCharts={true}
  onRecommendationClick={(rec) => {
    // Navigate to recommended content
    router.push(rec.contentUrl);
  }}
  onGoalSet={(goal) => {
    // Save learning goal
    saveLearningGoal(goal);
  }}
/>
```

#### Features
- Learning trajectory visualization
- Performance predictions
- Adaptive recommendations
- Goal setting and tracking
- Interactive data exploration
- Progress optimization insights

---

### 5. SocialLearningAnalytics

**Location**: `/app/(course)/.../social-learning-analytics.tsx`  
**Purpose**: Provides insights into collaborative learning and social interactions

#### Props Interface
```typescript
interface SocialLearningAnalyticsProps {
  courseId: string;
  userId: string;
  chapterId?: string;
  sectionId?: string;
  enableCollaboration?: boolean;
  enableDiscussions?: boolean;
  enableStudyGroups?: boolean;
  showNetworkAnalysis?: boolean;
  onCollaborationJoin?: (session: CollaborationSession) => void;
  onDiscussionCreate?: (discussion: Discussion) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<SocialLearningAnalytics
  courseId="machine-learning-basics"
  userId={user.id}
  chapterId="neural-networks"
  enableCollaboration={true}
  enableDiscussions={true}
  enableStudyGroups={true}
  showNetworkAnalysis={true}
  onCollaborationJoin={(session) => {
    console.log('Joined collaboration session:', session.id);
  }}
  onDiscussionCreate={(discussion) => {
    console.log('Created discussion:', discussion.title);
  }}
/>
```

#### Features
- Collaboration metrics tracking
- Discussion forum analytics
- Study group insights
- Social learning network visualization
- Peer interaction analysis
- Community engagement metrics

---

### 6. EnterpriseIntelligenceDashboard

**Location**: `/components/admin/enterprise-intelligence-dashboard.tsx`  
**Purpose**: Comprehensive admin dashboard with enterprise-level analytics

#### Props Interface
```typescript
interface EnterpriseIntelligenceDashboardProps {
  organizationId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  enableRealTimeMonitoring?: boolean;
  enableSecurityAnalytics?: boolean;
  enablePerformanceMetrics?: boolean;
  showPredictiveAnalytics?: boolean;
  enableAlerts?: boolean;
  onAlertTriggered?: (alert: SecurityAlert) => void;
  onMetricThresholdReached?: (metric: PerformanceMetric) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<EnterpriseIntelligenceDashboard
  organizationId={organization.id}
  timeRange="30d"
  enableRealTimeMonitoring={true}
  enableSecurityAnalytics={true}
  enablePerformanceMetrics={true}
  showPredictiveAnalytics={true}
  enableAlerts={true}
  onAlertTriggered={(alert) => {
    console.log('Security alert:', alert);
    notifySecurityTeam(alert);
  }}
  onMetricThresholdReached={(metric) => {
    console.log('Performance threshold reached:', metric);
  }}
/>
```

#### Features
- Real-time system monitoring
- Security threat detection
- Performance analytics
- Predictive insights
- Business intelligence metrics
- Alert and notification system

---

### 7. FinancialIntelligenceDashboard

**Location**: `/components/billing/financial-intelligence-dashboard.tsx`  
**Purpose**: Advanced financial analytics and business intelligence

#### Props Interface
```typescript
interface FinancialIntelligenceDashboardProps {
  organizationId: string;
  timeRange?: '1m' | '3m' | '6m' | '12m';
  enableAdvancedAnalytics?: boolean;
  enableForecastingData?: boolean;
  enableCostOptimization?: boolean;
  showRevenueBreakdown?: boolean;
  onForecastGenerated?: (forecast: FinancialForecast) => void;
  onOptimizationSuggested?: (suggestion: CostOptimization) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<FinancialIntelligenceDashboard
  organizationId={organization.id}
  timeRange="6m"
  enableAdvancedAnalytics={true}
  enableForecastingData={true}
  enableCostOptimization={true}
  showRevenueBreakdown={true}
  onForecastGenerated={(forecast) => {
    console.log('Financial forecast:', forecast);
    saveFinancialForecast(forecast);
  }}
  onOptimizationSuggested={(suggestion) => {
    console.log('Cost optimization suggestion:', suggestion);
  }}
/>
```

#### Features
- Revenue analysis and optimization
- Cost breakdown and optimization
- Pricing intelligence
- Financial forecasting
- ROI analysis
- Budget planning assistance

---

## 🤝 Collaboration Components

### 8. RealTimeCollaboration

**Location**: `/app/(course)/.../real-time-collaboration.tsx`  
**Purpose**: Live collaboration tools for study sessions and group learning

#### Props Interface
```typescript
interface RealTimeCollaborationProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  enableVideo?: boolean;
  enableAudio?: boolean;
  enableScreenShare?: boolean;
  enableWhiteboard?: boolean;
  enableBreakoutRooms?: boolean;
  onSessionJoined?: (session: CollaborationSession) => void;
  onParticipantJoined?: (participant: Participant) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<RealTimeCollaboration
  courseId="programming-101"
  chapterId="functions"
  sectionId="arrow-functions"
  userId={user.id}
  userName={user.name}
  userAvatar={user.image}
  enableVideo={true}
  enableAudio={true}
  enableScreenShare={true}
  enableWhiteboard={true}
  enableBreakoutRooms={true}
  onSessionJoined={(session) => {
    console.log('Joined collaboration session:', session.title);
  }}
  onParticipantJoined={(participant) => {
    console.log('New participant joined:', participant.name);
  }}
/>
```

#### Features
- Live video/audio communication
- Interactive whiteboard collaboration
- Screen sharing capabilities
- Breakout room management
- Real-time chat messaging
- Session recording and playback

---

### 9. CollaborationWhiteboard

**Location**: `/app/(course)/.../collaboration-whiteboard.tsx`  
**Purpose**: Interactive whiteboard for collaborative drawing and annotation

#### Props Interface
```typescript
interface CollaborationWhiteboardProps {
  sessionId: string;
  userId: string;
  userName: string;
  enableDrawing?: boolean;
  enableShapes?: boolean;
  enableText?: boolean;
  enableEraser?: boolean;
  onPathAdded?: (path: DrawingPath) => void;
  onCanvasCleared?: () => void;
  onContentSaved?: (content: WhiteboardContent) => void;
  className?: string;
}
```

#### Usage Example
```typescript
<CollaborationWhiteboard
  sessionId="session-123"
  userId={user.id}
  userName={user.name}
  enableDrawing={true}
  enableShapes={true}
  enableText={true}
  enableEraser={true}
  onPathAdded={(path) => {
    console.log('New drawing path added:', path);
    broadcastPath(path);
  }}
  onCanvasCleared={() => {
    console.log('Canvas cleared');
    broadcastClearCanvas();
  }}
  onContentSaved={(content) => {
    console.log('Whiteboard content saved:', content);
  }}
/>
```

#### Features
- Multi-user collaborative drawing
- Various drawing tools and shapes
- Color palette and brush controls
- Undo/redo functionality
- Export and save capabilities
- Real-time synchronization

---

## 🎨 Personalization Components

### 10. EnhancedSectionLearningPersonalized

**Location**: `/app/(course)/.../enhanced-section-learning-personalized.tsx`  
**Purpose**: Adaptive learning interface with AI personalization

#### Props Interface
```typescript
interface EnhancedSectionLearningPersonalizedProps {
  user: User;
  course: Course;
  currentChapter: Chapter;
  currentSection: Section;
  nextSection?: Section;
  prevSection?: Section;
  nextChapterSection?: { section: Section; chapter: Chapter };
  totalSections: number;
  completedSections: number;
  courseId: string;
  chapterId: string;
  sectionId: string;
  enablePersonalization?: boolean;
  enableStudyBuddy?: boolean;
  enableSocialLearning?: boolean;
  onProgressUpdate?: (progress: LearningProgress) => void;
  onPersonalizationUpdate?: (preferences: LearningPreferences) => void;
}
```

#### Usage Example
```typescript
<EnhancedSectionLearningPersonalized
  user={user}
  course={course}
  currentChapter={currentChapter}
  currentSection={currentSection}
  nextSection={nextSection}
  prevSection={prevSection}
  totalSections={totalSections}
  completedSections={completedSections}
  courseId={courseId}
  chapterId={chapterId}
  sectionId={sectionId}
  enablePersonalization={true}
  enableStudyBuddy={true}
  enableSocialLearning={true}
  onProgressUpdate={(progress) => {
    console.log('Learning progress updated:', progress);
    saveLearningProgress(progress);
  }}
  onPersonalizationUpdate={(preferences) => {
    console.log('Personalization preferences updated:', preferences);
    saveUserPreferences(preferences);
  }}
/>
```

#### Features
- Adaptive learning interface
- AI study buddy integration
- Emotional state recognition
- Learning preference adaptation
- Progress tracking and analytics
- Social learning integration

---

## 🔧 Utility Components

### 11. SAMErrorBoundary

**Location**: `/components/sam/error-boundary.tsx`  
**Purpose**: Error boundary specifically designed for SAM components

#### Props Interface
```typescript
interface SAMErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolateErrors?: boolean;
}
```

#### Usage Example
```typescript
<SAMErrorBoundary
  fallback={({ error, reset }) => (
    <div className="error-fallback">
      <h2>SAM AI Service Error</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
  onError={(error, errorInfo) => {
    console.error('SAM Component Error:', error, errorInfo);
    logErrorToService(error, errorInfo);
  }}
  isolateErrors={true}
>
  <MultiModalContentIntelligence contentId="example" />
</SAMErrorBoundary>
```

---

### 12. SAMLoadingSpinner

**Location**: `/components/sam/loading-spinner.tsx`  
**Purpose**: Consistent loading states for SAM components

#### Props Interface
```typescript
interface SAMLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showProgress?: boolean;
  progress?: number;
  variant?: 'default' | 'brain' | 'analytics' | 'collaboration';
  className?: string;
}
```

#### Usage Example
```typescript
<SAMLoadingSpinner
  size="lg"
  text="Analyzing content with SAM AI..."
  showProgress={true}
  progress={65}
  variant="brain"
  className="my-4"
/>
```

---

## 📱 Responsive Design Guidelines

### Mobile Optimization
All SAM components are designed with mobile-first responsive principles:

```css
/* Component responsive design pattern */
.sam-component {
  @apply w-full;
}

/* Mobile */
@media (max-width: 768px) {
  .sam-component {
    @apply px-4 py-2 text-sm;
  }
}

/* Tablet */
@media (min-width: 768px) {
  .sam-component {
    @apply px-6 py-4 text-base;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .sam-component {
    @apply px-8 py-6 text-lg;
  }
}
```

### Dark Mode Support
All components support automatic dark mode switching:

```typescript
// Example dark mode implementation
const Component = ({ className }) => {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900",
      "text-gray-900 dark:text-gray-100",
      "border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Component content */}
    </div>
  );
};
```

---

## 🚀 Performance Considerations

### Lazy Loading
```typescript
// Lazy load heavy SAM components
const FinancialIntelligenceDashboard = lazy(() => 
  import('@/components/billing/financial-intelligence-dashboard')
);

const EnterpriseIntelligenceDashboard = lazy(() => 
  import('@/components/admin/enterprise-intelligence-dashboard')
);
```

### Memoization
```typescript
// Memoize expensive calculations
const ProcessedAnalytics = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <AnalyticsChart data={processedData} />;
});
```

### Virtual Scrolling
```typescript
// For large datasets in analytics components
import { FixedSizeList as List } from 'react-window';

const LargeDataTable = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <DataRow item={items[index]} />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </List>
  );
};
```

---

**Component Reference Complete**  
*Last Updated: January 2025*  
*Total Components Documented: 12*