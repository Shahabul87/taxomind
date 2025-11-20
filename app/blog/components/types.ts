/**
 * Shared Types for Blog Components
 * Centralized type definitions to ensure consistency
 */

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  views: number;
  readingTime?: string;
  user: { name: string | null; image?: string };
  comments: { length: number };
  tags?: string[];
}

export interface BlogStatistics {
  totalArticles: number;
  publishedArticles: number;
  totalReaders: number;
  totalAuthors: number;
  totalViews: number;
  totalComments: number;
  averageViews: number;
  popularCategories: Array<{ category: string; count: number }>;
}

export interface ModernBlogPageProps {
  featuredPosts: BlogPost[];
  initialPosts: BlogPost[];
  categories: { id: string; name: string; count: number }[];
  trendingPosts: BlogPost[];
}
