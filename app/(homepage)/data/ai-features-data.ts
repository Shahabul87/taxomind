/**
 * AI Features Mega Menu Data
 * Combines Features, Intelligent LMS, and AI Tools into one unified dropdown
 */

import {
  Brain,
  Shield,
  Zap,
  Activity,
  GraduationCap,
  TrendingUp,
  Newspaper,
  FlaskConical,
  Sparkles,
  Star,
  Award,
  BookOpen,
  Cpu,
  Target,
  Rocket,
} from 'lucide-react';
import type { Topic, ContentItem, ConceptChip } from '../types/mega-menu-types';

// ============================================================================
// AI Features Topics (Combining all three tabs)
// ============================================================================

export const aiFeatureTopics: Topic[] = [
  {
    id: 'platform-features',
    slug: 'platform-features',
    label: 'Platform Features',
    icon: Star,
    accentHex: '#EC4899',
    description: 'Core platform capabilities',
    badge: {
      text: 'New',
      variant: 'new',
    },
  },
  {
    id: 'intelligent-lms',
    slug: 'intelligent-lms',
    label: 'Intelligent LMS',
    icon: Sparkles,
    accentHex: '#8B5CF6',
    description: 'AI-powered learning management',
    badge: {
      text: 'AI',
      variant: 'ai',
    },
  },
  {
    id: 'sam-assistant',
    slug: 'sam-assistant',
    label: 'SAM AI Assistant',
    icon: Brain,
    accentHex: '#3B82F6',
    description: 'Your personal AI tutor',
    badge: {
      text: 'New',
      variant: 'new',
    },
  },
  {
    id: 'adaptive-learning',
    slug: 'adaptive-learning',
    label: 'Adaptive Learning',
    icon: Zap,
    accentHex: '#F59E0B',
    description: 'Personalized learning paths',
  },
  {
    id: 'course-intelligence',
    slug: 'course-intelligence',
    label: 'Course Intelligence',
    icon: Activity,
    accentHex: '#06B6D4',
    description: 'Data-driven insights',
  },
  {
    id: 'ai-tools',
    slug: 'ai-tools',
    label: 'AI Tools',
    icon: Cpu,
    accentHex: '#10B981',
    description: 'Advanced AI utilities',
  },
];

// ============================================================================
// Content Items by Topic
// ============================================================================

export const aiFeaturesByTopic: Record<string, ContentItem[]> = {
  'platform-features': [
    {
      id: 'feature-1',
      title: 'Modern Learning Platform',
      slug: 'modern-platform',
      href: '/features',
      description: 'Experience intuitive design, responsive interface, and seamless navigation built for modern learners.',
      image: '/images/features/platform-hero.jpg',
      readingTime: '3 min read',
      tag: 'Platform',
      date: '2025-01-10',
      isFeatured: true,
    },
    {
      id: 'feature-2',
      title: 'Intelligent Dashboards',
      slug: 'dashboards',
      href: '/features/dashboards',
      description: 'Real-time analytics and personalized insights',
      readingTime: '2 min read',
    },
    {
      id: 'feature-3',
      title: 'Interactive Content',
      slug: 'interactive-content',
      href: '/features/content',
      description: 'Rich media, quizzes, and interactive exercises',
      readingTime: '3 min read',
    },
    {
      id: 'feature-4',
      title: 'Collaboration Tools',
      slug: 'collaboration',
      href: '/features/collaboration',
      description: 'Discussion forums, group projects, and peer learning',
      readingTime: '2 min read',
    },
    {
      id: 'feature-5',
      title: 'Mobile Learning',
      slug: 'mobile-learning',
      href: '/features/mobile',
      description: 'Learn anywhere, anytime on any device',
      readingTime: '2 min read',
    },
    {
      id: 'feature-6',
      title: 'Gamification',
      slug: 'gamification',
      href: '/features/gamification',
      description: 'Badges, points, and achievements to boost engagement',
      readingTime: '3 min read',
    },
  ],
  'intelligent-lms': [
    {
      id: 'ilms-1',
      title: 'AI-Powered Learning Management',
      slug: 'overview',
      href: '/intelligent-lms/overview',
      description: 'Discover how AI transforms learning with adaptive paths, smart recommendations, and personalized experiences.',
      image: '/images/intelligent-lms/overview-hero.jpg',
      readingTime: '5 min read',
      tag: 'LMS',
      date: '2025-01-15',
      isFeatured: true,
    },
    {
      id: 'ilms-2',
      title: 'Smart Content Delivery',
      slug: 'content-delivery',
      href: '/intelligent-lms/content-delivery',
      description: 'Automated content sequencing based on performance',
      readingTime: '4 min read',
    },
    {
      id: 'ilms-3',
      title: 'Learning Path Optimization',
      slug: 'path-optimization',
      href: '/intelligent-lms/paths',
      description: 'AI-generated optimal learning sequences',
      readingTime: '3 min read',
    },
    {
      id: 'ilms-4',
      title: 'Real-Time Progress Tracking',
      slug: 'progress-tracking',
      href: '/intelligent-lms/progress',
      description: 'Comprehensive analytics and milestone tracking',
      readingTime: '3 min read',
    },
    {
      id: 'ilms-5',
      title: 'Global Evaluation Standards',
      slug: 'evaluation',
      href: '/intelligent-lms/evaluation-standards',
      description: 'Aligned with Bloom&apos;s, PISA, Common Core',
      readingTime: '4 min read',
    },
    {
      id: 'ilms-6',
      title: 'Automated Assessments',
      slug: 'assessments',
      href: '/intelligent-lms/assessments',
      description: 'AI-generated quizzes and instant feedback',
      readingTime: '3 min read',
    },
  ],
  'sam-assistant': [
    {
      id: 'sam-1',
      title: 'Meet SAM: Your AI Learning Companion',
      slug: 'meet-sam',
      href: '/intelligent-lms/sam-ai-assistant',
      description: 'SAM provides 24/7 learning support, answers questions, explains concepts, and adapts to your learning style.',
      image: '/images/intelligent-lms/sam-hero.jpg',
      readingTime: '4 min read',
      tag: 'AI Assistant',
      date: '2025-01-20',
      isFeatured: true,
    },
    {
      id: 'sam-2',
      title: 'Personalized Study Plans',
      slug: 'study-plans',
      href: '/intelligent-lms/sam-ai-assistant/study-plans',
      description: 'Customized learning schedules based on your goals',
      readingTime: '3 min read',
    },
    {
      id: 'sam-3',
      title: 'Interactive Q&A',
      slug: 'qa',
      href: '/intelligent-lms/sam-ai-assistant/qa',
      description: 'Ask questions anytime and get instant explanations',
      readingTime: '2 min read',
    },
    {
      id: 'sam-4',
      title: 'Learning Style Adaptation',
      slug: 'learning-style',
      href: '/intelligent-lms/sam-ai-assistant/learning-style',
      description: 'SAM learns how you learn best',
      readingTime: '3 min read',
    },
    {
      id: 'sam-5',
      title: 'Smart Recommendations',
      slug: 'recommendations',
      href: '/intelligent-lms/sam-ai-assistant/recommendations',
      description: 'Personalized content and activity suggestions',
      readingTime: '2 min read',
    },
    {
      id: 'sam-6',
      title: 'Progress Insights',
      slug: 'insights',
      href: '/intelligent-lms/sam-ai-assistant/insights',
      description: 'Detailed analytics on your learning journey',
      readingTime: '4 min read',
    },
  ],
  'adaptive-learning': [
    {
      id: 'adaptive-1',
      title: 'Personalized Learning Journeys',
      slug: 'personalized-journeys',
      href: '/intelligent-lms/adaptive-learning',
      description: 'AI adapts content difficulty, pacing, and style based on your performance and preferences.',
      image: '/images/intelligent-lms/adaptive-hero.jpg',
      readingTime: '5 min read',
      tag: 'Personalization',
      date: '2025-01-22',
      isFeatured: true,
    },
    {
      id: 'adaptive-2',
      title: 'Dynamic Difficulty Adjustment',
      slug: 'difficulty',
      href: '/intelligent-lms/adaptive-learning/difficulty',
      description: 'Content adapts to keep you challenged but not overwhelmed',
      readingTime: '3 min read',
    },
    {
      id: 'adaptive-3',
      title: 'Intelligent Pacing',
      slug: 'pacing',
      href: '/intelligent-lms/adaptive-learning/pacing',
      description: 'Learn at your optimal speed with AI guidance',
      readingTime: '3 min read',
    },
    {
      id: 'adaptive-4',
      title: 'Knowledge Gap Detection',
      slug: 'gap-detection',
      href: '/intelligent-lms/adaptive-learning/gaps',
      description: 'Identify and fill learning gaps automatically',
      readingTime: '4 min read',
    },
    {
      id: 'adaptive-5',
      title: 'Multi-Modal Learning',
      slug: 'multi-modal',
      href: '/intelligent-lms/adaptive-learning/multi-modal',
      description: 'Video, text, audio adapted to your preferences',
      readingTime: '3 min read',
    },
    {
      id: 'adaptive-6',
      title: 'Mastery-Based Progression',
      slug: 'mastery',
      href: '/intelligent-lms/adaptive-learning/mastery',
      description: 'Advance only when you&apos;ve truly mastered concepts',
      readingTime: '4 min read',
    },
  ],
  'course-intelligence': [
    {
      id: 'intelligence-1',
      title: 'Course Analytics & Insights',
      slug: 'analytics',
      href: '/intelligent-lms/course-intelligence',
      description: 'Comprehensive analytics help instructors optimize courses with engagement metrics and learning outcomes.',
      image: '/images/intelligent-lms/intelligence-hero.jpg',
      readingTime: '5 min read',
      tag: 'Analytics',
      date: '2025-01-25',
      isFeatured: true,
    },
    {
      id: 'intelligence-2',
      title: 'Engagement Dashboards',
      slug: 'engagement',
      href: '/intelligent-lms/course-intelligence/engagement',
      description: 'Real-time student engagement tracking',
      readingTime: '4 min read',
    },
    {
      id: 'intelligence-3',
      title: 'Learning Outcome Analysis',
      slug: 'outcomes',
      href: '/intelligent-lms/course-intelligence/outcomes',
      description: 'Measure and improve learning effectiveness',
      readingTime: '5 min read',
    },
    {
      id: 'intelligence-4',
      title: 'Content Effectiveness',
      slug: 'effectiveness',
      href: '/intelligent-lms/course-intelligence/effectiveness',
      description: 'Identify which content drives results',
      readingTime: '4 min read',
    },
    {
      id: 'intelligence-5',
      title: 'Predictive Analytics',
      slug: 'predictive',
      href: '/intelligent-lms/course-intelligence/predictive',
      description: 'Forecast student success and intervene early',
      readingTime: '6 min read',
    },
    {
      id: 'intelligence-6',
      title: 'Performance Benchmarking',
      slug: 'benchmarking',
      href: '/intelligent-lms/course-intelligence/benchmarking',
      description: 'Compare course performance across cohorts',
      readingTime: '4 min read',
    },
  ],
  'ai-tools': [
    {
      id: 'tools-1',
      title: 'Advanced AI Learning Tools',
      slug: 'overview',
      href: '/ai-tools',
      description: 'Access cutting-edge AI tools: AI Tutor for personalized help, AI Trends for industry insights, and AI Research for academic papers.',
      image: '/images/ai-tools/tools-hero.jpg',
      readingTime: '4 min read',
      tag: 'AI Tools',
      date: '2025-01-28',
      isFeatured: true,
    },
    {
      id: 'tools-2',
      title: 'AI Tutor',
      slug: 'ai-tutor',
      href: '/ai-tutor',
      description: 'Personal AI tutor for any subject',
      readingTime: '3 min read',
    },
    {
      id: 'tools-3',
      title: 'AI Trends',
      slug: 'ai-trends',
      href: '/ai-trends',
      description: 'Latest AI industry trends and insights',
      readingTime: '4 min read',
    },
    {
      id: 'tools-4',
      title: 'AI News',
      slug: 'ai-news',
      href: '/ai-news',
      description: 'Breaking news from the AI world',
      readingTime: '2 min read',
    },
    {
      id: 'tools-5',
      title: 'AI Research',
      slug: 'ai-research',
      href: '/ai-research',
      description: 'Academic papers and research summaries',
      readingTime: '5 min read',
    },
    {
      id: 'tools-6',
      title: 'AI Practice Lab',
      slug: 'practice-lab',
      href: '/ai-tools/practice-lab',
      description: 'Hands-on AI experiments and exercises',
      readingTime: '6 min read',
    },
  ],
};

// ============================================================================
// Concept Chips by Topic
// ============================================================================

export const aiConceptChips: Record<string, ConceptChip[]> = {
  'platform-features': [
    { id: 'chip-1', label: 'Modern UI', href: '/topics/modern-ui', accentColor: '#EC4899' },
    { id: 'chip-2', label: 'Responsive', href: '/topics/responsive', accentColor: '#EC4899' },
    { id: 'chip-3', label: 'Intuitive', href: '/topics/intuitive', accentColor: '#EC4899' },
    { id: 'chip-4', label: 'Interactive', href: '/topics/interactive', accentColor: '#EC4899' },
  ],
  'intelligent-lms': [
    { id: 'chip-5', label: 'AI Learning', href: '/topics/ai-learning', accentColor: '#8B5CF6' },
    { id: 'chip-6', label: 'Adaptive', href: '/topics/adaptive', accentColor: '#8B5CF6' },
    { id: 'chip-7', label: 'Personalized', href: '/topics/personalized', accentColor: '#8B5CF6' },
    { id: 'chip-8', label: 'Smart LMS', href: '/topics/smart-lms', accentColor: '#8B5CF6' },
  ],
  'sam-assistant': [
    { id: 'chip-9', label: 'AI Tutor', href: '/topics/ai-tutor', accentColor: '#3B82F6' },
    { id: 'chip-10', label: '24/7 Support', href: '/topics/support', accentColor: '#3B82F6' },
    { id: 'chip-11', label: 'Smart Q&A', href: '/topics/qa', accentColor: '#3B82F6' },
    { id: 'chip-12', label: 'Personalized', href: '/topics/personalized-sam', accentColor: '#3B82F6' },
  ],
  'adaptive-learning': [
    { id: 'chip-13', label: 'Personalization', href: '/topics/personalization', accentColor: '#F59E0B' },
    { id: 'chip-14', label: 'Learning Paths', href: '/topics/paths', accentColor: '#F59E0B' },
    { id: 'chip-15', label: 'Smart Pacing', href: '/topics/pacing', accentColor: '#F59E0B' },
    { id: 'chip-16', label: 'Mastery', href: '/topics/mastery', accentColor: '#F59E0B' },
  ],
  'course-intelligence': [
    { id: 'chip-17', label: 'Analytics', href: '/topics/analytics', accentColor: '#06B6D4' },
    { id: 'chip-18', label: 'Insights', href: '/topics/insights', accentColor: '#06B6D4' },
    { id: 'chip-19', label: 'Optimization', href: '/topics/optimization', accentColor: '#06B6D4' },
    { id: 'chip-20', label: 'Predictive', href: '/topics/predictive', accentColor: '#06B6D4' },
  ],
  'ai-tools': [
    { id: 'chip-21', label: 'AI Tutor', href: '/topics/ai-tutor-tool', accentColor: '#10B981' },
    { id: 'chip-22', label: 'Trends', href: '/topics/trends', accentColor: '#10B981' },
    { id: 'chip-23', label: 'Research', href: '/topics/research', accentColor: '#10B981' },
    { id: 'chip-24', label: 'News', href: '/topics/news', accentColor: '#10B981' },
  ],
};

// ============================================================================
// Content Provider Function
// ============================================================================

export const getAIFeaturesByTopic = async (topicSlug: string): Promise<ContentItem[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Return content for topic
  return aiFeaturesByTopic[topicSlug] || [];
};
