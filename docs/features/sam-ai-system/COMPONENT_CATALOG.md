# SAM AI Component Catalog

> Complete reference for all 69+ SAM AI components available in Taxomind.

## Quick Stats

| Metric | Value |
|--------|-------|
| Total Components | 69 |
| Used in Dashboard | 47 |
| Component Utilization | 68% |
| Categories | 12 |

---

## Table of Contents

1. [Core Components](#core-components)
2. [Analytics Components](#analytics-components)
3. [Goal & Planning Components](#goal--planning-components)
4. [Learning Path Components](#learning-path-components)
5. [Social & Collaboration Components](#social--collaboration-components)
6. [Gamification Components](#gamification-components)
7. [Safety & Accessibility Components](#safety--accessibility-components)
8. [Memory & Context Components](#memory--context-components)
9. [Content & Creation Components](#content--creation-components)
10. [Tool & Orchestration Components](#tool--orchestration-components)
11. [Practice & Challenge Components](#practice--challenge-components)
12. [Utility Components](#utility-components)

---

## Core Components

### SAMAssistant
**File:** `components/sam/SAMAssistant.tsx`
**Status:** ✅ Active
**Usage:** Main AI chat assistant interface

```tsx
import { SAMAssistant } from '@/components/sam';

<SAMAssistant
  isOpen={true}
  onClose={() => setOpen(false)}
  context={{ pageType: 'dashboard' }}
/>
```

### SAMAssistantWrapper
**File:** `components/sam/SAMAssistantWrapper.tsx`
**Status:** ✅ Active
**Usage:** Safe wrapper with error boundary

```tsx
import { SAMAssistantWrapper } from '@/components/sam';

<SAMAssistantWrapper />
```

### SAMContextTracker
**File:** `components/sam/SAMContextTracker.tsx`
**Status:** ✅ Active
**Usage:** Tracks page context for SAM

```tsx
import { SAMContextTracker } from '@/components/sam';

<SAMContextTracker
  pageType="course"
  entityType="chapter"
  entityId={chapterId}
/>
```

### SAMGlobalProvider
**File:** `components/sam/sam-global-provider.tsx`
**Status:** ✅ Active
**Usage:** Global state provider (in root layout)

```tsx
import { SAMGlobalProvider } from '@/components/sam';

<SAMGlobalProvider>
  {children}
</SAMGlobalProvider>
```

### SAMQuickActions
**File:** `components/sam/SAMQuickActions.tsx`
**Status:** ✅ Active
**Usage:** Quick action buttons for SAM

```tsx
import { SAMQuickActions, DEFAULT_QUICK_ACTIONS } from '@/components/sam';

<SAMQuickActions
  actions={DEFAULT_QUICK_ACTIONS}
  onAction={handleAction}
/>
```

---

## Analytics Components

### TrendsExplorer
**File:** `components/sam/TrendsExplorer.tsx`
**Status:** ✅ In Dashboard
**Usage:** Learning trends visualization

```tsx
import { TrendsExplorer } from '@/components/sam';

<TrendsExplorer userId={userId} timeRange="month" />
```

### PredictiveInsights
**File:** `components/sam/PredictiveInsights.tsx`
**Status:** ✅ In Dashboard
**Usage:** AI-powered learning predictions

```tsx
import { PredictiveInsights } from '@/components/sam';

<PredictiveInsights compact={true} />
```

### MetaLearningInsightsWidget
**File:** `components/sam/MetaLearningInsightsWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Meta-learning pattern insights

```tsx
import { MetaLearningInsightsWidget } from '@/components/sam';

<MetaLearningInsightsWidget />
```

### CareerProgressWidget
**File:** `components/sam/CareerProgressWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Career development tracking

```tsx
import { CareerProgressWidget } from '@/components/sam';

<CareerProgressWidget userId={userId} />
```

### SAMAnalyticsDashboard
**File:** `components/sam/sam-analytics-dashboard.tsx`
**Status:** ✅ Active
**Usage:** Full analytics dashboard view

```tsx
import { SAMAnalyticsDashboard } from '@/components/sam';

<SAMAnalyticsDashboard userId={userId} />
```

---

## Goal & Planning Components

### GoalPlanner
**File:** `components/sam/goal-planner.tsx`
**Status:** ✅ Active
**Usage:** Learning goal creation and tracking

```tsx
import { GoalPlanner } from '@/components/sam';

<GoalPlanner
  userId={userId}
  onGoalCreated={handleGoalCreated}
/>
```

### OrchestrationPanel
**File:** `components/sam/OrchestrationPanel.tsx`
**Status:** ✅ Active
**Usage:** Multi-step plan orchestration

```tsx
import { OrchestrationPanel } from '@/components/sam';

<OrchestrationPanel
  planId={planId}
  onStepComplete={handleStepComplete}
/>
```

### PlanStepCard
**File:** `components/sam/PlanStepCard.tsx`
**Status:** ✅ Active
**Usage:** Individual plan step display

```tsx
import { PlanStepCard } from '@/components/sam';

<PlanStepCard
  step={step}
  onStart={handleStart}
  onComplete={handleComplete}
/>
```

### StepProgressBar
**File:** `components/sam/StepProgressBar.tsx`
**Status:** ✅ Active
**Usage:** Visual step progress indicator

```tsx
import { StepProgressBar } from '@/components/sam';

<StepProgressBar
  steps={steps}
  currentStep={2}
/>
```

### CheckInModal
**File:** `components/sam/CheckInModal.tsx`
**Status:** ✅ Active
**Usage:** Daily learning check-in

```tsx
import { CheckInModal } from '@/components/sam';

<CheckInModal
  isOpen={showCheckIn}
  onClose={handleClose}
  onSubmit={handleCheckIn}
/>
```

### CheckInHistory
**File:** `components/sam/CheckInHistory.tsx`
**Status:** ✅ In Dashboard
**Usage:** Past check-in records

```tsx
import { CheckInHistory } from '@/components/sam';

<CheckInHistory userId={userId} limit={10} />
```

---

## Learning Path Components

### LearningPathWidget
**File:** `components/sam/LearningPathWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Learning path overview

```tsx
import { LearningPathWidget } from '@/components/sam';

<LearningPathWidget userId={userId} />
```

### LearningPathTimeline
**File:** `components/sam/LearningPathTimeline.tsx`
**Status:** ✅ In Dashboard
**Usage:** Chronological learning journey

```tsx
import { LearningPathTimeline } from '@/components/sam';

<LearningPathTimeline userId={userId} />
```

### LearningPathOptimizer
**File:** `components/sam/LearningPathOptimizer.tsx`
**Status:** ✅ Active
**Usage:** AI-optimized path suggestions

```tsx
import { LearningPathOptimizer } from '@/components/sam';

<LearningPathOptimizer
  currentPath={path}
  onOptimize={handleOptimize}
/>
```

### PrerequisiteTreeView
**File:** `components/sam/PrerequisiteTreeView.tsx`
**Status:** ✅ In Dashboard
**Usage:** Concept dependency tree

```tsx
import { PrerequisiteTreeView } from '@/components/sam';

<PrerequisiteTreeView
  topicId={topicId}
  showCompleted={true}
/>
```

### KnowledgeGraphBrowser
**File:** `components/sam/KnowledgeGraphBrowser.tsx`
**Status:** ✅ In Dashboard
**Usage:** Interactive knowledge graph

```tsx
import { KnowledgeGraphBrowser } from '@/components/sam';

<KnowledgeGraphBrowser
  userId={userId}
  courseId={courseId}
/>
```

### CompetencyDashboard
**File:** `components/sam/CompetencyDashboard.tsx`
**Status:** ✅ In Dashboard
**Usage:** Skill competency tracking

```tsx
import { CompetencyDashboard } from '@/components/sam';

<CompetencyDashboard userId={userId} />
```

### MicrolearningWidget
**File:** `components/sam/MicrolearningWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Quick 5-minute learning sessions

```tsx
import { MicrolearningWidget } from '@/components/sam';

<MicrolearningWidget
  topicId={topicId}
  duration={5}
/>
```

### SpacedRepetitionCalendar
**File:** `components/sam/SpacedRepetitionCalendar.tsx`
**Status:** ✅ In Dashboard
**Usage:** Review schedule visualization

```tsx
import { SpacedRepetitionCalendar, SpacedRepetitionWidget } from '@/components/sam';

<SpacedRepetitionCalendar userId={userId} />
<SpacedRepetitionWidget compact={true} />
```

---

## Social & Collaboration Components

### StudyBuddyFinder
**File:** `components/sam/StudyBuddyFinder.tsx`
**Status:** ✅ In Dashboard
**Usage:** Find compatible study partners

```tsx
import { StudyBuddyFinder } from '@/components/sam';

<StudyBuddyFinder
  userId={userId}
  courseId={courseId}
/>
```

### PeerLearningHub
**File:** `components/sam/PeerLearningHub.tsx`
**Status:** ✅ In Dashboard
**Usage:** Collaborative learning space

```tsx
import { PeerLearningHub } from '@/components/sam';

<PeerLearningHub courseId={courseId} />
```

### CollaborationSpace
**File:** `components/sam/CollaborationSpace.tsx`
**Status:** ✅ Active
**Usage:** Real-time collaboration

```tsx
import { CollaborationSpace } from '@/components/sam';

<CollaborationSpace
  sessionId={sessionId}
  participants={participants}
/>
```

### SocialLearningFeed
**File:** `components/sam/SocialLearningFeed.tsx`
**Status:** ✅ Active
**Usage:** Social activity feed

```tsx
import { SocialLearningFeed } from '@/components/sam';

<SocialLearningFeed userId={userId} />
```

### RealtimeCollaborationWidget
**File:** `components/sam/RealtimeCollaborationWidget.tsx`
**Status:** ✅ Active
**Usage:** Live collaboration status

```tsx
import { RealtimeCollaborationWidget } from '@/components/sam';

<RealtimeCollaborationWidget sessionId={sessionId} />
```

### Presence Components
**File:** `components/sam/presence/`
**Status:** ✅ Active
**Exports:** `PresenceIndicator`, `ActiveLearnersWidget`, `StudyStatusBadge`

```tsx
import { PresenceIndicator, ActiveLearnersWidget } from '@/components/sam';

<PresenceIndicator userId={userId} />
<ActiveLearnersWidget courseId={courseId} />
```

---

## Gamification Components

### LeaderboardWidget
**File:** `components/sam/LeaderboardWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Learning leaderboards

```tsx
import { LeaderboardWidget } from '@/components/sam';

<LeaderboardWidget
  scope="course"
  scopeId={courseId}
  period="week"
/>
```

### AchievementBadges
**File:** `components/sam/AchievementBadges.tsx`
**Status:** ✅ In Dashboard
**Usage:** Achievement display

```tsx
import { AchievementBadges } from '@/components/sam';

<AchievementBadges
  userId={userId}
  showRecent={true}
/>
```

### CelebrationOverlay
**File:** `components/sam/CelebrationOverlay.tsx`
**Status:** ✅ Active
**Usage:** Achievement celebrations

```tsx
import { CelebrationOverlay, useCelebration, MiniCelebration } from '@/components/sam';

const { trigger } = useCelebration();
trigger({ type: 'achievement', data: achievement });

<CelebrationOverlay />
<MiniCelebration type="streak" />
```

---

## Safety & Accessibility Components

### BiasDetectionReport
**File:** `components/sam/BiasDetectionReport.tsx`
**Status:** ✅ In Dashboard
**Usage:** AI bias monitoring

```tsx
import { BiasDetectionReport } from '@/components/sam';

<BiasDetectionReport
  contentId={contentId}
  showDetails={true}
/>
```

### AccessibilityMetricsWidget
**File:** `components/sam/AccessibilityMetricsWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** WCAG compliance tracking

```tsx
import { AccessibilityMetricsWidget } from '@/components/sam';

<AccessibilityMetricsWidget contentId={contentId} />
```

### DiscouragingLanguageAlert
**File:** `components/sam/DiscouragingLanguageAlert.tsx`
**Status:** ✅ In Dashboard
**Usage:** Harmful language detection

```tsx
import { DiscouragingLanguageAlert } from '@/components/sam';

<DiscouragingLanguageAlert
  content={feedbackText}
  onFix={handleFix}
/>
```

### CognitiveLoadMonitor
**File:** `components/sam/CognitiveLoadMonitor.tsx`
**Status:** ✅ In Dashboard
**Usage:** Mental load tracking

```tsx
import { CognitiveLoadMonitor } from '@/components/sam';

<CognitiveLoadMonitor
  sessionId={sessionId}
  showAlerts={true}
/>
```

### IntegrityChecker
**File:** `components/sam/IntegrityChecker.tsx`
**Status:** ✅ Active
**Usage:** Academic integrity monitoring

```tsx
import { IntegrityChecker } from '@/components/sam';

<IntegrityChecker
  submissionId={submissionId}
  onViolation={handleViolation}
/>
```

---

## Memory & Context Components

### ConversationTimeline
**File:** `components/sam/ConversationTimeline.tsx`
**Status:** ✅ Active
**Usage:** Chat history visualization

```tsx
import { ConversationTimeline } from '@/components/sam';

<ConversationTimeline
  sessionId={sessionId}
  showSummaries={true}
/>
```

### ContextualHelpWidget
**File:** `components/sam/ContextualHelpWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Context-aware help

```tsx
import { ContextualHelpWidget } from '@/components/sam';

<ContextualHelpWidget
  context={{ page: 'course', section: 'quiz' }}
/>
```

### Memory Components
**File:** `components/sam/memory/`
**Status:** ✅ Active
**Exports:** `MemorySearchPanel`, `ConversationHistory`, `MemoryInsightsWidget`

```tsx
import { MemorySearchPanel, MemoryInsightsWidget } from '@/components/sam';

<MemorySearchPanel userId={userId} />
<MemoryInsightsWidget />
```

---

## Content & Creation Components

### RecommendationWidget
**File:** `components/sam/recommendation-widget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Personalized content recommendations

```tsx
import { RecommendationWidget } from '@/components/sam';

<RecommendationWidget
  userId={userId}
  context="dashboard"
/>
```

### LearningRecommendationsWidget
**File:** `components/sam/LearningRecommendationsWidget.tsx`
**Status:** ✅ Active
**Usage:** Learning path recommendations

```tsx
import { LearningRecommendationsWidget } from '@/components/sam';

<LearningRecommendationsWidget userId={userId} />
```

### ContentAnalysisResults
**File:** `components/sam/content-analysis-results.tsx`
**Status:** ✅ Active
**Usage:** Content quality analysis

```tsx
import { ContentAnalysisResults } from '@/components/sam';

<ContentAnalysisResults
  contentId={contentId}
  showMetrics={true}
/>
```

### ResourceIntelligenceContent
**File:** `components/sam/resource-intelligence-content.tsx`
**Status:** ✅ Active
**Usage:** Smart resource suggestions

```tsx
import { ResourceIntelligenceContent } from '@/components/sam';

<ResourceIntelligenceContent topicId={topicId} />
```

### CourseCreationProgress
**File:** `components/sam/course-creation-progress.tsx`
**Status:** ✅ Active
**Usage:** Course creation wizard progress

```tsx
import { CourseCreationProgress } from '@/components/sam';

<CourseCreationProgress
  steps={creationSteps}
  currentStep={2}
/>
```

### SequentialCreationModal
**File:** `components/sam/sequential-creation-modal.tsx`
**Status:** ✅ Active
**Usage:** Step-by-step content creation

```tsx
import { SequentialCreationModal } from '@/components/sam';

<SequentialCreationModal
  isOpen={showModal}
  onComplete={handleComplete}
/>
```

### MultimediaLibrary
**File:** `components/sam/MultimediaLibrary.tsx`
**Status:** ✅ Active
**Usage:** Media asset management

```tsx
import { MultimediaLibrary } from '@/components/sam';

<MultimediaLibrary
  onSelect={handleMediaSelect}
  filter="images"
/>
```

---

## Tool & Orchestration Components

### ToolApprovalDialog
**File:** `components/sam/ToolApprovalDialog.tsx`
**Status:** ✅ Active
**Usage:** Tool execution approval

```tsx
import { ToolApprovalDialog, useToolApproval } from '@/components/sam';

const { requestApproval, isOpen, request } = useToolApproval();

<ToolApprovalDialog
  isOpen={isOpen}
  request={request}
  onApprove={handleApprove}
  onDeny={handleDeny}
/>
```

### NotificationBell
**File:** `components/sam/notification-bell.tsx`
**Status:** ✅ Active
**Usage:** SAM notifications indicator

```tsx
import { NotificationBell } from '@/components/sam';

<NotificationBell
  userId={userId}
  showCount={true}
/>
```

### NotificationsWidget
**File:** `components/sam/NotificationsWidget.tsx`
**Status:** ✅ Active
**Usage:** Full notifications panel

```tsx
import { NotificationsWidget } from '@/components/sam';

<NotificationsWidget
  userId={userId}
  maxItems={10}
/>
```

### UserInterventionsWidget
**File:** `components/sam/UserInterventionsWidget.tsx`
**Status:** ✅ Active
**Usage:** Proactive intervention display

```tsx
import { UserInterventionsWidget } from '@/components/sam';

<UserInterventionsWidget
  userId={userId}
  onAction={handleAction}
/>
```

### TutoringOrchestrationWidget
**File:** `components/sam/TutoringOrchestrationWidget.tsx`
**Status:** ✅ Active
**Usage:** Tutoring session control

```tsx
import { TutoringOrchestrationWidget } from '@/components/sam';

<TutoringOrchestrationWidget
  sessionId={sessionId}
  mode="guided"
/>
```

---

## Practice & Challenge Components

### PracticeProblemsWidget
**File:** `components/sam/PracticeProblemsWidget.tsx`
**Status:** ✅ Active
**Usage:** Practice problem generator

```tsx
import { PracticeProblemsWidget } from '@/components/sam';

<PracticeProblemsWidget
  topicId={topicId}
  difficulty="adaptive"
/>
```

### AdaptiveContentWidget
**File:** `components/sam/AdaptiveContentWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** Difficulty-adaptive content

```tsx
import { AdaptiveContentWidget } from '@/components/sam';

<AdaptiveContentWidget
  contentId={contentId}
  userId={userId}
/>
```

### SocraticDialogueWidget
**File:** `components/sam/SocraticDialogueWidget.tsx`
**Status:** ✅ Active
**Usage:** Socratic questioning interface

```tsx
import { SocraticDialogueWidget } from '@/components/sam';

<SocraticDialogueWidget
  topicId={topicId}
  depth="intermediate"
/>
```

### ScaffoldingStrategyPanel
**File:** `components/sam/ScaffoldingStrategyPanel.tsx`
**Status:** ✅ Active
**Usage:** Learning scaffolding display

```tsx
import { ScaffoldingStrategyPanel } from '@/components/sam';

<ScaffoldingStrategyPanel
  currentLevel={userLevel}
  targetConcept={concept}
/>
```

### MetacognitionPanel
**File:** `components/sam/MetacognitionPanel.tsx`
**Status:** ✅ Active
**Usage:** Self-reflection prompts

```tsx
import { MetacognitionPanel } from '@/components/sam';

<MetacognitionPanel
  sessionId={sessionId}
  showReflection={true}
/>
```

---

## Utility Components

### SamErrorBoundary
**File:** `components/sam/sam-error-boundary.tsx`
**Status:** ✅ Active
**Usage:** Error boundary wrapper

```tsx
import { SamErrorBoundary, useSamErrorBoundary } from '@/components/sam';

<SamErrorBoundary fallback={<ErrorFallback />}>
  <SAMAssistant />
</SamErrorBoundary>
```

### SamLoadingState
**File:** `components/sam/sam-loading-state.tsx`
**Status:** ✅ Active
**Usage:** Loading state indicators

```tsx
import {
  SamLoadingState,
  SamSuggestionLoading,
  SamValidationLoading,
  SamGenerationLoading
} from '@/components/sam';

<SamLoadingState message="Processing..." />
<SamSuggestionLoading />
<SamGenerationLoading />
```

### SamStandardsInfo
**File:** `components/sam/sam-standards-info.tsx`
**Status:** ✅ Active
**Usage:** Standards compliance badges

```tsx
import { SamStandardsInfo, SamStandardsBadge } from '@/components/sam';

<SamStandardsInfo standards={['WCAG', 'SCORM']} />
<SamStandardsBadge standard="WCAG" level="AA" />
```

### ProgressDashboard
**File:** `components/sam/progress-dashboard.tsx`
**Status:** ✅ Active
**Usage:** Progress overview

```tsx
import { ProgressDashboard } from '@/components/sam';

<ProgressDashboard userId={userId} />
```

### FormSyncWrapper
**File:** `components/sam/form-sync-wrapper.tsx`
**Status:** ✅ Active
**Usage:** Form state synchronization

```tsx
import { FormSyncWrapper } from '@/components/sam';

<FormSyncWrapper formId={formId}>
  <FormContent />
</FormSyncWrapper>
```

### FeedbackButtons
**File:** `components/sam/FeedbackButtons.tsx`
**Status:** ✅ Active
**Usage:** User feedback collection

```tsx
import { FeedbackButtons } from '@/components/sam';

<FeedbackButtons
  responseId={responseId}
  onFeedback={handleFeedback}
/>
```

---

## Confidence & Quality Components

### ConfidenceCalibrationWidget
**File:** `components/sam/ConfidenceCalibrationWidget.tsx`
**Status:** ✅ In Dashboard
**Usage:** AI confidence tracking

```tsx
import { ConfidenceCalibrationWidget } from '@/components/sam';

<ConfidenceCalibrationWidget userId={userId} />
```

### QualityScoreDashboard
**File:** `components/sam/QualityScoreDashboard.tsx`
**Status:** ✅ In Dashboard
**Usage:** Content quality metrics

```tsx
import { QualityScoreDashboard } from '@/components/sam';

<QualityScoreDashboard contentId={contentId} />
```

### Confidence Components
**File:** `components/sam/confidence/`
**Exports:** `ConfidenceIndicator`, `SelfCritiquePanel`, `CalibrationChart`

```tsx
import { ConfidenceIndicator, CalibrationChart } from '@/components/sam';

<ConfidenceIndicator score={0.87} />
<CalibrationChart data={calibrationData} />
```

---

## Learning Gap Components

**File:** `components/sam/learning-gap/`
**Status:** ✅ Active
**Exports:**
- `LearningGapDashboard`
- `GapOverviewWidget`
- `SkillDecayTracker`
- `TrendAnalysisChart`
- `PersonalizedRecommendations`
- `ComparisonView`
- `useLearningGaps` (hook)

```tsx
import {
  LearningGapDashboard,
  GapOverviewWidget,
  SkillDecayTracker,
  useLearningGaps
} from '@/components/sam';

<LearningGapDashboard userId={userId} />
<GapOverviewWidget compact={true} />
<SkillDecayTracker skillId={skillId} />

// Hook usage
const { gaps, loading, refresh } = useLearningGaps(userId);
```

---

## Observability Components

**File:** `components/sam/observability/`
**Status:** ✅ Active
**Exports:** `SAMHealthDashboard`, `ToolExecutionLog`, `QualityMetricsPanel`

```tsx
import { SAMHealthDashboard, ToolExecutionLog } from '@/components/sam';

<SAMHealthDashboard />
<ToolExecutionLog limit={50} />
```

---

## Behavior Components

**File:** `components/sam/behavior/`
**Status:** ✅ Active
**Exports:** `BehaviorPatternsWidget`, `StruggleDetectionAlert`, `LearningStyleIndicator`

```tsx
import {
  BehaviorPatternsWidget,
  StruggleDetectionAlert,
  LearningStyleIndicator
} from '@/components/sam';

<BehaviorPatternsWidget userId={userId} />
<StruggleDetectionAlert sessionId={sessionId} />
<LearningStyleIndicator style={userStyle} />
```

---

## Plans Components

**File:** `components/sam/plans/`
**Status:** ✅ Active
**Exports:** `PlanControlPanel`, `PlanProgressTracker`, `DailyPlanWidget`

```tsx
import { PlanControlPanel, DailyPlanWidget } from '@/components/sam';

<PlanControlPanel planId={planId} />
<DailyPlanWidget userId={userId} />
```

---

## Recommendations Components

**File:** `components/sam/recommendations/`
**Status:** ✅ Active
**Exports:** `RecommendationCard`, `RecommendationTimeline`, `RecommendationReasonDisplay`

```tsx
import { RecommendationCard, RecommendationTimeline } from '@/components/sam';

<RecommendationCard recommendation={rec} />
<RecommendationTimeline userId={userId} />
```

---

## Specialty Components

### InnovationLab
**File:** `components/sam/InnovationLab.tsx`
**Status:** ✅ Active
**Usage:** Experimental learning features

### ResearchAssistant
**File:** `components/sam/ResearchAssistant.tsx`
**Status:** ✅ Active
**Usage:** Research workflow support

### FinancialSimulator
**File:** `components/sam/FinancialSimulator.tsx`
**Status:** ✅ Active
**Usage:** Financial learning simulations

---

## Import Patterns

### Single Import
```tsx
import { SAMAssistant } from '@/components/sam/SAMAssistant';
```

### Barrel Import (Recommended)
```tsx
import {
  SAMAssistant,
  SAMContextTracker,
  RecommendationWidget,
  LeaderboardWidget
} from '@/components/sam';
```

### Type Imports
```tsx
import type {
  CheckInData,
  LearningInsight,
  Achievement,
  StudyBuddy
} from '@/components/sam';
```

---

## Component Status Legend

| Status | Meaning |
|--------|---------|
| ✅ In Dashboard | Component is actively used in user dashboard |
| ✅ Active | Component is exported and ready for use |
| ⚠️ Experimental | Component is in beta/testing |
| 🔧 Internal | Component is used internally only |

---

*Last updated: January 2025*
*Total components: 69*
*Dashboard utilization: 68%*
