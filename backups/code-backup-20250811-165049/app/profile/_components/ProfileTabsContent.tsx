import { TabsContent } from "@/components/ui/tabs";
import { ActivityDashboard } from "./activity-dashboard";
import { ProfileOverview } from "./dashboard/ProfileOverview";
import { SocialMediaManager } from "./social/SocialMediaManager";
import { ContentManager } from "./content/ContentManager";
import { SubscriptionManager } from "./subscriptions/SubscriptionManager";
import { CoursesTab } from "./CoursesTab";
import TabContent from "./TabContent";
import { ProfileLink, FavoriteVideo, FavoriteAudio, FavoriteBlog, FavoriteArticle, Subscription } from "@prisma/client";

interface ExtendedUser {
  id: string;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  profileLinks: ProfileLink[];
  courses: any[];
  favoriteVideos?: FavoriteVideo[];
  favoriteAudios?: FavoriteAudio[];
  favoriteBlogs?: FavoriteBlog[];
  favoriteArticles?: FavoriteArticle[];
  subscriptions?: Subscription[];
  ideas: any[];
  posts: any[];
  socialMediaAccounts?: any[];
  contentCollections?: any[];
  contentItems?: any[];
  userSubscriptions?: any[];
  goals?: any[];
  userAnalytics?: any[];
}

interface ProfileTabsContentProps {
  user: ExtendedUser;
  activities: any[];
}

export function ProfileTabsContent({ user, activities }: ProfileTabsContentProps) {
  return (
    <div className="mt-6 w-full">
      <TabsContent value="overview" className="w-full">
        <ProfileOverview userId={user.id} />
      </TabsContent>

      <TabsContent value="social" className="w-full">
        <SocialMediaManager 
          userId={user.id} 
          initialAccounts={user.socialMediaAccounts || []} 
        />
      </TabsContent>
      
      <TabsContent value="activity" className="w-full">
        <ActivityDashboard userId={user.id} initialActivities={activities || []} />
      </TabsContent>

      <TabsContent value="content" className="w-full">
        <ContentManager userId={user.id} />
      </TabsContent>
      
      <TabsContent value="courses" className="space-y-4 w-full">
        <CoursesTab courses={user.courses} />
      </TabsContent>
      
      <TabsContent value="ideas" className="w-full">
        <TabContent
          selectedTab="IDEAS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="minds" className="w-full">
        <TabContent
          selectedTab="MINDS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="scripts" className="w-full">
        <TabContent
          selectedTab="SCRIPTS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="profile" className="w-full">
        <TabContent
          selectedTab="PROFILE LINKS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="videos" className="w-full">
        <TabContent
          selectedTab="VIDEOS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="audios" className="w-full">
        <TabContent
          selectedTab="AUDIOS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="blogs" className="w-full">
        <TabContent
          selectedTab="BLOGS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="articles" className="w-full">
        <TabContent
          selectedTab="ARTICLES"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="settings" className="w-full">
        <TabContent
          selectedTab="SETTINGS"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="server" className="w-full">
        <TabContent
          selectedTab="SERVER"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="subscription" className="w-full">
        <SubscriptionManager userId={user.id} />
      </TabsContent>
      
      <TabsContent value="billing" className="w-full">
        <TabContent
          selectedTab="BILLING"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
      
      <TabsContent value="make-a-plan" className="w-full">
        <TabContent
          selectedTab="MAKE A PLAN"
          userId={user.id}
          profileLinks={user.profileLinks}
          favoriteVideos={user.favoriteVideos || []}
          favoriteAudios={user.favoriteAudios || []}
          favoriteBlogs={user.favoriteBlogs || []}
          favoriteArticles={user.favoriteArticles || []}
          subscriptions={user.subscriptions || []}
        />
      </TabsContent>
    </div>
  );
} 