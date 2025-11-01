/**
 * Shared type definitions for Post-related entities
 * Following enterprise TypeScript standards - NO 'any' types
 */

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  postId: string;
  user?: User;
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  user?: User;
}

export interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  published: boolean | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
  comments?: Comment[];
  likes?: Like[];
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface PostStats {
  published: number;
  drafts: number;
  views: number;
  likes: number;
  comments: number;
}

export interface PostFilters {
  searchQuery: string;
  category: string;
  status: "published" | "drafts" | "all";
}

export interface PostCardProps {
  post: Post;
  viewMode: "grid" | "list";
  onDelete: () => void;
}

export interface MyPostsDashboardProps {
  posts: Post[];
  categories: string[];
  stats: PostStats;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}
