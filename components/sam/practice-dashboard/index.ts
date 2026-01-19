/**
 * 10,000 Hour Practice Dashboard Components
 *
 * A comprehensive practice tracking dashboard with:
 * - Journey progress overview with circular progress ring
 * - Skill mastery cards showing 10K progress
 * - GitHub-style practice activity heatmap
 * - Real-time session tracking with timer
 * - Milestone timeline with rewards
 * - Goal setting and progress tracking
 */

// Types
export * from './types';

// Basic Components
export { QuickStatCard } from './QuickStatCard';
export { ProficiencyBadge } from './ProficiencyBadge';
export { PracticeStreakWidget } from './PracticeStreakWidget';

// Overview Tab
export { PracticeJourneyOverview } from './PracticeJourneyOverview';

// Mastery Tab
export { SkillMasteryCard } from './SkillMasteryCard';
export { SkillMasteryGrid } from './SkillMasteryGrid';

// Activity Tab (Heatmap)
export { PracticeHeatmap } from './PracticeHeatmap';

// Session Tab
export { SessionStartDialog } from './SessionStartDialog';
export { ActiveSessionTracker } from './ActiveSessionTracker';

// Milestones Tab
export { MilestoneTimeline } from './MilestoneTimeline';

// Goals Tab
export { PracticeGoalForm } from './PracticeGoalForm';
export { PracticeGoalsList } from './PracticeGoalsList';
