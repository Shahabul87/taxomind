#!/usr/bin/env tsx
/**
 * Domain Categorization Script for Prisma Schema
 *
 * This script analyzes the monolithic schema.prisma and categorizes all 238 models
 * into logical domains for better organization and maintainability.
 *
 * Based on: ENTERPRISE_SCHEMA_ARCHITECTURE.md recommendations
 */

import fs from 'fs';
import path from 'path';

interface DomainCategory {
  name: string;
  description: string;
  models: string[];
  priority: number;
}

// Domain definitions based on enterprise architecture document
const domains: Record<string, DomainCategory> = {
  auth: {
    name: 'Authentication & Security',
    description: 'User authentication, sessions, tokens, and security',
    models: [
      'User',
      'Account',
      'VerificationToken',
      'PasswordResetToken',
      'TwoFactorToken',
      'TwoFactorConfirmation',
      'ActiveSession',
      'AuthAudit',
      'AuthSession',
      'BackupCode',
      'TOTPSecret',
      'LoginAttempt',
      'PasswordHistory',
      'UserCapability',
      'UserPermission',
      'Permission',
      'RolePermission',
      'PermissionActivity',
      'PermissionRule',
      'AdminAccount',
      'AdminActiveSession',
      'AdminVerificationToken',
      'AdminPasswordResetToken',
      'AdminTwoFactorToken',
      'AdminTwoFactorConfirmation',
    ],
    priority: 1,
  },
  learning: {
    name: 'Core Learning',
    description: 'Courses, chapters, sections, enrollment, and progress tracking',
    models: [
      'Course',
      'Chapter',
      'Section',
      'Video',
      'Attachment',
      'Enrollment',
      'CourseReview',
      'Category',
      'UserChapterCompletion',
      'UserSectionCompletion',
      'UserCourseEnrollment',
      'LearningPath',
      'LearningPathNode',
      'PathEnrollment',
      'PathRecommendation',
      'NodeProgress',
      'LearningSession',
      'CourseBloomsAnalysis',
      'SectionBloomsMapping',
      'SectionCompletionTracking',
      'StudentBloomsProgress',
      'ExamBloomsProfile',
      'BloomsPerformanceMetric',
      'Exam',
      'ExamQuestion',
      'Question',
      'Answer',
      'UserAnswer',
      'UserExamAttempt',
      'QuestionBank',
      'LearningStyleAnalysis',
      'PersonalizedLearningPath',
      'PersonalizedResourceRecommendation',
      'QuantumLearningPath',
      'QuantumObservation',
    ],
    priority: 2,
  },
  content: {
    name: 'Content Management',
    description: 'Blogs, articles, posts, notes, and content organization',
    models: [
      'Blog',
      'Article',
      'Post',
      'Note',
      'Comment',
      'Reply',
      'CodeExplanation',
      'MathExplanation',
      'ContentCollection',
      'ContentItem',
      'ContentVersion',
      'ContentVersionApproval',
      'ContentFlag',
      'ContentOptimization',
      'PostChapterSection',
      'PostImageSection',
      'GeneratedContent',
      'MultiMediaAnalysis',
      'MultiModalAnalysis',
      'FavoriteBlog',
      'FavoriteArticle',
      'FavoriteVideo',
      'FavoriteAudio',
      'FavoriteImage',
      'Tag',
      'CustomTab',
    ],
    priority: 3,
  },
  commerce: {
    name: 'Commerce & Billing',
    description: 'Purchases, payments, subscriptions, and billing',
    models: [
      'Purchase',
      'StripeCustomer',
      'Bill',
      'BillPayment',
      'BillAttachment',
      'Subscription',
      'SubscriptionService',
      'SubscriptionTransaction',
      'SubscriptionAnalytics',
      'UserSubscription',
      'PricingExperiment',
      'FinancialSnapshot',
    ],
    priority: 4,
  },
  analytics: {
    name: 'Analytics & Reporting',
    description: 'User analytics, course analytics, and performance metrics',
    models: [
      'Analytics',
      'Activity',
      'ExamAnalytics',
      'UserAnalytics',
      'CourseCompletionAnalytics',
      'CertificateAnalytics',
      'CollaborationAnalytics',
      'ApprovalAnalytics',
      'OrganizationAnalytics',
      'EnterpriseAnalytics',
      'SAMAnalytics',
      'TeacherInsights',
      'UserLearningPattern',
      'LearningDNA',
      'PredictiveLearningAnalysis',
      'SocialLearningAnalysis',
      'ResourceROIAnalysis',
      'WorkforcePrediction',
      'SocialMetric',
      'performance_metrics',
      'learning_metrics',
      'learning_sessions',
      'progress_alerts',
      'realtime_activities',
      'study_streaks',
      'user_achievements',
      'user_progress',
    ],
    priority: 5,
  },
  social: {
    name: 'Social & Collaboration',
    description: 'Groups, messages, notifications, social features',
    models: [
      'Group',
      'GroupMember',
      'GroupDiscussion',
      'GroupDiscussionComment',
      'GroupDiscussionLike',
      'GroupNotification',
      'GroupResource',
      'Message',
      'Notification',
      'Reaction',
      'StudyBuddy',
      'BuddyInteraction',
      'BuddyAdjustment',
      'MentorMenteeMatch',
      'CollaborativeSession',
      'CollaborativeCursor',
      'CollaborativeOperation',
      'CollaborativePermission',
      'CollaborativeActivity',
      'CollaborationSession',
      'CollaborationParticipant',
      'CollaborationMessage',
      'CollaborationContribution',
      'CollaborationReaction',
      'SessionParticipant',
      'SessionComment',
      'SessionConflict',
      'SessionSnapshot',
      'EditConflict',
      'SocialPost',
      'SocialMediaAccount',
      'ProfileLink',
      'Mind',
      'MindLike',
      'Idea',
      'IdeaComment',
      'IdeaLike',
    ],
    priority: 6,
  },
  ai: {
    name: 'AI & Machine Learning',
    description: 'AI content generation, recommendations, personalization',
    models: [
      'AIContentGeneration',
      'AIContentTemplate',
      'AIGeneratedContent',
      'AIModelPerformance',
      'AIUsageMetrics',
      'UserAIPreferences',
      'SAMConversation',
      'SAMMessage',
      'SAMInteraction',
      'SAMLearningProfile',
      'SAMPoints',
      'SAMStreak',
      'SAMBadge',
      'PersonalizationResult',
      'RecommendationInteraction',
      'ResourceDiscovery',
      'StudentCognitiveProfile',
      'CognitiveFitnessAssessment',
      'EmotionalStateAnalysis',
      'MotivationProfile',
    ],
    priority: 7,
  },
  admin: {
    name: 'Admin & Audit',
    description: 'Admin operations, audit logs, system monitoring',
    models: [
      'AdminMetadata',
      'AdminAuditLog',
      'AdminSessionMetrics',
      'AuditLog',
      'EnhancedAuditLog',
      'ErrorLog',
      'ErrorAlert',
      'ErrorMetrics',
      'SecurityEvent',
      'ComplianceEvent',
      'DataBreach',
      'ApiKey',
      'RateLimit',
      'ApprovalWorkflow',
      'ApprovalWorkflowTemplate',
      'ApprovalNotification',
      'ApprovalAuditLog',
      'BulkApprovalOperation',
      'Organization',
      'OrganizationUser',
      'InstructorVerification',
      'ExecutiveReport',
      'SupportTicket',
      'GDPRRequest',
      'DataProcessingActivity',
      'UserConsent',
      'PrivacyPolicy',
      'UserContext',
    ],
    priority: 8,
  },
  gamification: {
    name: 'Gamification & Achievements',
    description: 'Badges, goals, milestones, achievements, streaks',
    models: [
      'Badge',
      'BadgeDefinition',
      'BadgeProgress',
      'UserBadge',
      'Goal',
      'Task',
      'Milestone',
      'FitnessMilestone',
      'FitnessSession',
      'Skill',
      'SkillProgress',
      'SkillGap',
      'intervention_actions',
      'UserProgressAlert',
      'CourseGuideAnalysis',
      'CourseMarketAnalysis',
      'CourseCompetitor',
      'CourseOptimizationSuggestion',
    ],
    priority: 9,
  },
  events: {
    name: 'Events & Calendar',
    description: 'Calendar events, certificates, schedules',
    models: [
      'CalendarEvent',
      'UserCalendarSettings',
      'Certification',
      'CertificateTemplate',
      'CertificateVerification',
      'CertificateEvent',
      'LearningEvent',
      'BadgeEvent',
      'GroupEvent',
      'GroupEventAttendee',
    ],
    priority: 10,
  },
};

function analyzeSchema() {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Extract all model names
  const modelRegex = /^model\s+(\w+)\s*{/gm;
  const matches = [...schemaContent.matchAll(modelRegex)];
  const allModels = matches.map(match => match[1]);

  console.log('📊 Schema Analysis\n');
  console.log(`Total Models Found: ${allModels.length}\n`);

  // Categorize models
  const categorized: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  for (const domainKey in domains) {
    categorized[domainKey] = [];
  }

  for (const model of allModels) {
    let found = false;
    for (const domainKey in domains) {
      if (domains[domainKey].models.includes(model)) {
        categorized[domainKey].push(model);
        found = true;
        break;
      }
    }
    if (!found) {
      uncategorized.push(model);
    }
  }

  // Display results
  console.log('🎯 Domain Distribution:\n');

  for (const domainKey in domains) {
    const domain = domains[domainKey];
    const count = categorized[domainKey].length;
    console.log(`${domain.name} (${count} models)`);
    console.log(`  Priority: ${domain.priority}`);
    console.log(`  Description: ${domain.description}`);
    console.log(`  Models: ${categorized[domainKey].slice(0, 5).join(', ')}${count > 5 ? '...' : ''}\n`);
  }

  if (uncategorized.length > 0) {
    console.log('⚠️  Uncategorized Models:\n');
    console.log(uncategorized.join(', '));
    console.log(`\nTotal Uncategorized: ${uncategorized.length}\n`);
  }

  // Generate statistics
  const stats = {
    totalModels: allModels.length,
    categorized: allModels.length - uncategorized.length,
    uncategorized: uncategorized.length,
    domains: Object.keys(domains).length,
    distribution: Object.entries(categorized).map(([key, models]) => ({
      domain: domains[key].name,
      count: models.length,
      percentage: ((models.length / allModels.length) * 100).toFixed(1),
    })),
  };

  // Save results
  const outputPath = path.join(process.cwd(), 'docs', 'SCHEMA_DOMAIN_ANALYSIS.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    categorized,
    uncategorized,
    domains,
  }, null, 2));

  console.log(`✅ Analysis saved to: ${outputPath}\n`);

  return { categorized, uncategorized, stats };
}

// Run analysis
if (require.main === module) {
  console.log('🏗️  Enterprise Schema Domain Analyzer\n');
  console.log('=' .repeat(80) + '\n');

  const results = analyzeSchema();

  console.log('\n📈 Summary Statistics:\n');
  console.log(`Total Models: ${results.stats.totalModels}`);
  console.log(`Categorized: ${results.stats.categorized} (${((results.stats.categorized / results.stats.totalModels) * 100).toFixed(1)}%)`);
  console.log(`Uncategorized: ${results.stats.uncategorized} (${((results.stats.uncategorized / results.stats.totalModels) * 100).toFixed(1)}%)`);
  console.log(`Total Domains: ${results.stats.domains}`);

  console.log('\n🎯 Recommended Next Steps:\n');
  console.log('1. Review uncategorized models and assign to appropriate domains');
  console.log('2. Run schema splitting script to create domain-specific files');
  console.log('3. Set up automated schema merging for builds');
  console.log('4. Update CI/CD pipeline to use new structure\n');
}

export { analyzeSchema, domains };
