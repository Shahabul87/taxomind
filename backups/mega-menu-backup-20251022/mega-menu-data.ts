/**
 * Mock Data for Mega Menus
 * Provides sample topics, content items, and concept chips
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
} from 'lucide-react';
import type { Topic, ContentItem, ConceptChip, MenuCategory } from '../types/mega-menu-types';

// ============================================================================
// Intelligent LMS Topics
// ============================================================================

export const intelligentLMSTopics: Topic[] = [
  {
    id: 'overview',
    slug: 'overview',
    label: 'Overview',
    icon: Sparkles,
    accentHex: '#8B5CF6',
    description: 'AI-powered learning platform',
    badge: {
      text: 'AI',
      variant: 'ai',
    },
  },
  {
    id: 'sam-ai-assistant',
    slug: 'sam-ai-assistant',
    label: 'SAM AI Assistant',
    icon: Brain,
    accentHex: '#3B82F6',
    description: 'Your personal learning companion',
    badge: {
      text: 'New',
      variant: 'new',
    },
  },
  {
    id: 'evaluation-standards',
    slug: 'evaluation-standards',
    label: 'Global Evaluation',
    icon: Shield,
    accentHex: '#10B981',
    description: 'International assessment framework',
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
    description: 'Data-driven course insights',
  },
];

// ============================================================================
// Content Items by Topic
// ============================================================================

export const contentByTopic: Record<string, ContentItem[]> = {
  overview: [
    {
      id: 'overview-1',
      title: 'Introduction to Intelligent LMS',
      slug: 'introduction',
      href: '/intelligent-lms/overview',
      description: 'Discover how AI transforms learning with adaptive paths, smart recommendations, and personalized experiences.',
      image: '/images/intelligent-lms/overview-hero.jpg',
      readingTime: '5 min read',
      tag: 'Getting Started',
      date: '2025-01-15',
      isFeatured: true,
    },
    {
      id: 'overview-2',
      title: 'AI-Powered Learning Paths',
      slug: 'ai-powered-paths',
      href: '/intelligent-lms/overview/ai-paths',
      readingTime: '3 min read',
    },
    {
      id: 'overview-3',
      title: 'Real-Time Analytics Dashboard',
      slug: 'analytics-dashboard',
      href: '/intelligent-lms/overview/analytics',
      readingTime: '4 min read',
    },
    {
      id: 'overview-4',
      title: 'Personalized Recommendations',
      slug: 'recommendations',
      href: '/intelligent-lms/overview/recommendations',
      readingTime: '2 min read',
    },
    {
      id: 'overview-5',
      title: 'Collaborative Learning Spaces',
      slug: 'collaborative-spaces',
      href: '/intelligent-lms/overview/collaborative',
      readingTime: '3 min read',
    },
  ],
  'sam-ai-assistant': [
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
      title: 'How SAM Learns Your Style',
      slug: 'learning-style',
      href: '/intelligent-lms/sam-ai-assistant/learning-style',
      readingTime: '3 min read',
    },
    {
      id: 'sam-3',
      title: 'SAM&apos;s Study Recommendations',
      slug: 'recommendations',
      href: '/intelligent-lms/sam-ai-assistant/recommendations',
      readingTime: '2 min read',
    },
    {
      id: 'sam-4',
      title: 'Interactive Q&A with SAM',
      slug: 'qa-features',
      href: '/intelligent-lms/sam-ai-assistant/qa',
      readingTime: '3 min read',
    },
    {
      id: 'sam-5',
      title: 'Progress Tracking with SAM',
      slug: 'progress-tracking',
      href: '/intelligent-lms/sam-ai-assistant/progress',
      readingTime: '4 min read',
    },
  ],
  'evaluation-standards': [
    {
      id: 'eval-1',
      title: 'Global Evaluation Framework',
      slug: 'framework',
      href: '/intelligent-lms/evaluation-standards',
      description: 'Aligned with 12+ international standards including Bloom&apos;s Taxonomy, PISA, and Common Core.',
      image: '/images/intelligent-lms/evaluation-hero.jpg',
      readingTime: '6 min read',
      tag: 'Standards',
      date: '2025-01-18',
      isFeatured: true,
    },
    {
      id: 'eval-2',
      title: 'Bloom&apos;s Taxonomy Integration',
      slug: 'blooms-taxonomy',
      href: '/intelligent-lms/evaluation-standards/blooms',
      readingTime: '4 min read',
    },
    {
      id: 'eval-3',
      title: 'PISA Assessment Alignment',
      slug: 'pisa-alignment',
      href: '/intelligent-lms/evaluation-standards/pisa',
      readingTime: '3 min read',
    },
    {
      id: 'eval-4',
      title: 'Common Core Standards',
      slug: 'common-core',
      href: '/intelligent-lms/evaluation-standards/common-core',
      readingTime: '5 min read',
    },
    {
      id: 'eval-5',
      title: 'Custom Assessment Creation',
      slug: 'custom-assessments',
      href: '/intelligent-lms/evaluation-standards/custom',
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
      slug: 'difficulty-adjustment',
      href: '/intelligent-lms/adaptive-learning/difficulty',
      readingTime: '3 min read',
    },
    {
      id: 'adaptive-3',
      title: 'Learning Style Recognition',
      slug: 'learning-styles',
      href: '/intelligent-lms/adaptive-learning/styles',
      readingTime: '4 min read',
    },
    {
      id: 'adaptive-4',
      title: 'Smart Content Sequencing',
      slug: 'content-sequencing',
      href: '/intelligent-lms/adaptive-learning/sequencing',
      readingTime: '3 min read',
    },
    {
      id: 'adaptive-5',
      title: 'Performance-Based Recommendations',
      slug: 'recommendations',
      href: '/intelligent-lms/adaptive-learning/recommendations',
      readingTime: '4 min read',
    },
  ],
  'course-intelligence': [
    {
      id: 'intelligence-1',
      title: 'Course Analytics & Insights',
      slug: 'analytics-insights',
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
      title: 'Engagement Metrics Dashboard',
      slug: 'engagement-metrics',
      href: '/intelligent-lms/course-intelligence/engagement',
      readingTime: '4 min read',
    },
    {
      id: 'intelligence-3',
      title: 'Learning Outcome Analysis',
      slug: 'learning-outcomes',
      href: '/intelligent-lms/course-intelligence/outcomes',
      readingTime: '5 min read',
    },
    {
      id: 'intelligence-4',
      title: 'Content Effectiveness Reports',
      slug: 'content-effectiveness',
      href: '/intelligent-lms/course-intelligence/effectiveness',
      readingTime: '4 min read',
    },
    {
      id: 'intelligence-5',
      title: 'Predictive Student Success',
      slug: 'predictive-success',
      href: '/intelligent-lms/course-intelligence/predictive',
      readingTime: '6 min read',
    },
  ],
};

// ============================================================================
// Concept Chips by Topic
// ============================================================================

export const conceptChipsByTopic: Record<string, ConceptChip[]> = {
  overview: [
    { id: 'chip-1', label: 'AI Learning', href: '/topics/ai-learning', accentColor: '#8B5CF6' },
    { id: 'chip-2', label: 'Adaptive', href: '/topics/adaptive', accentColor: '#8B5CF6' },
    { id: 'chip-3', label: 'Personalized', href: '/topics/personalized', accentColor: '#8B5CF6' },
  ],
  'sam-ai-assistant': [
    { id: 'chip-4', label: 'AI Tutor', href: '/topics/ai-tutor', accentColor: '#3B82F6' },
    { id: 'chip-5', label: '24/7 Support', href: '/topics/support', accentColor: '#3B82F6' },
    { id: 'chip-6', label: 'Smart Q&A', href: '/topics/qa', accentColor: '#3B82F6' },
  ],
  'evaluation-standards': [
    { id: 'chip-7', label: 'Global Standards', href: '/topics/standards', accentColor: '#10B981' },
    { id: 'chip-8', label: 'Bloom&apos;s', href: '/topics/blooms', accentColor: '#10B981' },
    { id: 'chip-9', label: 'PISA', href: '/topics/pisa', accentColor: '#10B981' },
  ],
  'adaptive-learning': [
    { id: 'chip-10', label: 'Personalization', href: '/topics/personalization', accentColor: '#F59E0B' },
    { id: 'chip-11', label: 'Learning Paths', href: '/topics/paths', accentColor: '#F59E0B' },
    { id: 'chip-12', label: 'Smart Pacing', href: '/topics/pacing', accentColor: '#F59E0B' },
  ],
  'course-intelligence': [
    { id: 'chip-13', label: 'Analytics', href: '/topics/analytics', accentColor: '#06B6D4' },
    { id: 'chip-14', label: 'Insights', href: '/topics/insights', accentColor: '#06B6D4' },
    { id: 'chip-15', label: 'Optimization', href: '/topics/optimization', accentColor: '#06B6D4' },
  ],
};

// ============================================================================
// More Menu Categories (Compact/Laptop)
// ============================================================================

export const moreMenuCategories: MenuCategory[] = [
  {
    id: 'main-navigation',
    label: 'Main Navigation',
    items: [
      {
        id: 'features',
        label: 'Features',
        href: '/features',
        icon: Star,
        description: 'Platform highlights',
        preview: {
          title: 'Features',
          description: 'Explore the core capabilities of Taxomind: elegant UI, adaptive learning tools, and intelligent analytics to boost outcomes.',
          features: [
            'Intuitive user interface',
            'AI-powered recommendations',
            'Real-time analytics',
          ],
        },
      },
    ],
  },
  {
    id: 'intelligent-lms',
    label: 'Intelligent LMS',
    items: [
      {
        id: 'ilms-overview',
        label: 'Overview',
        href: '/intelligent-lms/overview',
        icon: Sparkles,
        description: 'Intelligent LMS',
        badge: {
          text: 'AI',
          variant: 'ai',
        },
        preview: {
          title: 'Intelligent LMS Overview',
          description: 'See how adaptive pathways, evaluations, and course intelligence combine to create a smarter learning experience.',
        },
      },
      {
        id: 'ilms-sam',
        label: 'SAM AI Assistant',
        href: '/intelligent-lms/sam-ai-assistant',
        icon: Brain,
        description: 'Personalized AI guidance',
        badge: {
          text: 'New',
          variant: 'new',
        },
        preview: {
          title: 'SAM AI Assistant',
          description: 'Meet your always-on learning partner for Q&A, explanations, and study guidance powered by AI.',
        },
        accentColor: '#3B82F6',
      },
      {
        id: 'ilms-evaluation',
        label: 'Global Evaluation',
        href: '/intelligent-lms/global-evaluation',
        icon: Award,
        description: 'Unified assessment',
        preview: {
          title: 'Global Evaluation',
          description: 'A consistent framework for evaluating learning outcomes across courses and topics.',
        },
        accentColor: '#10B981',
      },
      {
        id: 'ilms-adaptive',
        label: 'Adaptive Learning',
        href: '/intelligent-lms/adaptive-learning',
        icon: Zap,
        description: 'Personalized pathways',
        preview: {
          title: 'Adaptive Learning',
          description: 'Content and pacing adjust to each learner&apos;s needs for faster, deeper understanding.',
        },
        accentColor: '#F59E0B',
      },
      {
        id: 'ilms-course',
        label: 'Course Intelligence',
        href: '/intelligent-lms/course-intelligence',
        icon: GraduationCap,
        description: 'Course insights',
        preview: {
          title: 'Course Intelligence',
          description: 'Rich analytics and insights help you monitor progress and fine‑tune learning activities.',
        },
        accentColor: '#06B6D4',
      },
    ],
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    items: [
      {
        id: 'ai-tutor',
        label: 'AI Tutor',
        href: '/ai-tutor',
        icon: Brain,
        description: 'Personal learning assistant',
        badge: {
          text: 'New',
          variant: 'new',
        },
        preview: {
          title: 'AI Tutor',
          description: 'Ask questions, practice, and get explanations tailored to your level.',
        },
        accentColor: '#8B5CF6',
      },
      {
        id: 'ai-trends',
        label: 'AI Trends',
        href: '/ai-trends',
        icon: TrendingUp,
        description: 'Latest insights',
        preview: {
          title: 'AI Trends',
          description: 'Stay current with breakthroughs, tools, and shifts across the AI landscape.',
        },
        accentColor: '#10B981',
      },
      {
        id: 'ai-news',
        label: 'AI News',
        href: '/ai-news',
        icon: Newspaper,
        description: 'Breaking updates',
        preview: {
          title: 'AI News',
          description: 'Curated updates from research labs, companies, and the broader AI community.',
        },
        accentColor: '#3B82F6',
      },
      {
        id: 'ai-research',
        label: 'AI Research',
        href: '/ai-research',
        icon: FlaskConical,
        description: 'Academic papers',
        preview: {
          title: 'AI Research',
          description: 'Dive into cutting‑edge work from academia and industry with concise summaries.',
        },
        accentColor: '#06B6D4',
      },
    ],
  },
];

// ============================================================================
// Content Provider Function (simulates API call)
// ============================================================================

export const getContentByTopic = async (topicSlug: string): Promise<ContentItem[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return content for topic
  return contentByTopic[topicSlug] || [];
};
