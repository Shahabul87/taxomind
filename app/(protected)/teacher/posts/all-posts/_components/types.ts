// ==========================================
// Enterprise TypeScript Types for Posts Dashboard
// ==========================================

export interface PostUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isTeacher?: boolean;
}

export interface PostComment {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  views: number;
  body?: string;
  isArchived?: boolean;
  user: PostUser;
  comments: PostComment[];
  likes: PostLike[];
}

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role?: string;
}

export interface DashboardStats {
  published: number;
  drafts: number;
  views: number;
  likes: number;
  comments: number;
}

export interface TrendData {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  sparklineData: number[];
}

export interface EnhancedStats extends DashboardStats {
  trends: {
    published: TrendData;
    drafts: TrendData;
    views: TrendData;
    likes: TrendData;
    comments: TrendData;
  };
}

export type ViewMode = 'grid' | 'list';

export type TabValue = 'published' | 'drafts' | 'analytics';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'most-views'
  | 'least-views'
  | 'most-engagement'
  | 'alphabetical';

export interface FilterState {
  search: string;
  category: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: SortOption;
}

export interface BulkActionState {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
}

export interface AnalyticsData {
  dailyViews: { date: string; views: number; posts: number }[];
  categoryPerformance: { category: string; views: number; posts: number; engagement: number }[];
  topPosts: Post[];
  weeklyComparison: {
    thisWeek: { views: number; posts: number; comments: number };
    lastWeek: { views: number; posts: number; comments: number };
  };
}

// Animation variants for Framer Motion
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
};

export const slideUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  },
};
