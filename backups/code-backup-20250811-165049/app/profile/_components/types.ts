import { ProfileLink, FavoriteVideo, FavoriteAudio, FavoriteBlog, FavoriteArticle, Subscription, CustomTab } from "@prisma/client";
import { ReactNode } from "react";

export interface ProfileProps {
  userId: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  profileLinks: ProfileLink[];
  favoriteVideos: FavoriteVideo[];
  favoriteAudios: FavoriteAudio[];
  favoriteBlogs: FavoriteBlog[];
  favoriteArticles: FavoriteArticle[];
  subscriptions: Subscription[];
  customTabs: CustomTab[];
}

export interface ProfileHeaderProps {
  userId: string;
  username?: string;
  avatarUrl?: string;
  joinDate?: string;
}

export interface ProfileNavigationProps {
  selectedTab: string;
  onTabChange: (tabId: string) => void;
}

export interface AnimatedContentProps {
  children: ReactNode;
}

export interface TabContentProps {
  selectedTab: string;
  userId: string;
  profileLinks: ProfileLink[];
  favoriteVideos: FavoriteVideo[];
  favoriteAudios: FavoriteAudio[];
  favoriteBlogs: FavoriteBlog[];
  favoriteArticles: FavoriteArticle[];
  subscriptions: Subscription[];
}

export interface ProfileImageUploadProps {
  userId: string;
  initialImage?: string | null;
} 