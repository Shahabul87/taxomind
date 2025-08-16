"use client";

import { ProfileLinksContent } from "../../_profileLinksComponent/profilelinkscontent";
import ServerSettingsContent from "../../server-settings-content";
import SettingsContent from "../../_profileLinksComponent/settings-content";
import { ProfileLink, FavoriteVideo, FavoriteAudio, FavoriteBlog, FavoriteArticle, Subscription } from "@prisma/client";
import { FavoriteVideoLinkForm } from "../../_favoriteVideos/fav-video-link-form";
import { FavoriteAudioLinkForm } from "../../_favoriteAudios/fav-audio-link-form";
import { FavoriteBlogLinkForm } from "../../_favoriteBlogs/fav-blog-link-form";
import { FavoriteArticleLinkForm } from "../../_favoriteArticles/fav-article-link-form";
import { SubscriptionLinkForm } from "../../_subscription/subscription-link-form";
import { IdeasContent } from "../../_components/ideas-content";
import { MindsContent } from "../../_components/minds-content";
import { ScriptsContent } from "../../_components/scripts-content";
import { BillingContent } from "../../_components/billing-content";
import { MakeAPlanContent } from "../../_components/make-a-plan-content";

interface TabContentProps {
  selectedTab: string;
  userId: string;
  profileLinks: ProfileLink[];
  favoriteVideos: FavoriteVideo[];
  favoriteAudios: FavoriteAudio[];
  favoriteBlogs: FavoriteBlog[];
  favoriteArticles: FavoriteArticle[];
  subscriptions: Subscription[];
}

export function TabContent({ 
  selectedTab, 
  userId, 
  profileLinks, 
  favoriteVideos, 
  favoriteAudios, 
  favoriteBlogs, 
  favoriteArticles,
  subscriptions,
}: TabContentProps) {
  switch (selectedTab) {
    case "MAKE A PLAN":
      return <MakeAPlanContent userId={userId} />;
    case "IDEAS":
      return <IdeasContent userId={userId} />;
    case "MINDS":
      return <MindsContent userId={userId} />;
    case "SCRIPTS":
      return <ScriptsContent userId={userId} />;
    case "PROFILE LINKS":
      return <ProfileLinksContent userId={userId} profileLinks={profileLinks} />;
    case "VIDEOS":
      return <FavoriteVideoLinkForm userId={userId} favoriteVideos={favoriteVideos} />;
    case "AUDIOS":
      return <FavoriteAudioLinkForm userId={userId} favoriteAudios={favoriteAudios} />;
    case "BLOGS":
      return <FavoriteBlogLinkForm userId={userId} favoriteBlogs={favoriteBlogs} />;
    case "ARTICLES":
      return <FavoriteArticleLinkForm userId={userId} favoriteArticles={favoriteArticles} />;
    case "SETTINGS":
      return <SettingsContent userId={userId} />;
    case "SERVER":
      return <ServerSettingsContent userId={userId} />;
    case "SUBSCRIPTION":
      return <SubscriptionLinkForm userId={userId} subscriptions={subscriptions} />;
    case "BILLING":
      return <BillingContent userId={userId} />;
    default:
      return null;
  }
} 