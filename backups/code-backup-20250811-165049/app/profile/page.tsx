import { EnhancedAnimatedHeader } from "./_components/header/EnhancedAnimatedHeader";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { getProfileData } from "@/app/actions/get-profile-data";
import { getActivityData } from "@/app/actions/get-activity-data";
import { ProfileLink, FavoriteVideo, FavoriteAudio, FavoriteBlog, FavoriteArticle, Subscription } from "@prisma/client";
import { ProfileTabsList } from "./_components/ProfileTabsList";
import { ProfileTabsContent } from "./_components/ProfileTabsContent";
import { UserDebugPanel } from "@/components/debug/UserDebugPanel";
import { DebugModeToggle } from "@/components/debug/DebugModeToggle";

// Define the user type to include all needed properties
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
  // Enhanced profile data
  socialMediaAccounts?: any[];
  contentCollections?: any[];
  contentItems?: any[];
  userSubscriptions?: any[];
  goals?: any[];
  userAnalytics?: any[];
}

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    return redirect("/auth/login");
  }
  
  const userData = await getProfileData();

  if (!userData) {
    return redirect("/auth/login");
  }
  
  // Fetch activities for the dashboard
  const activities = await getActivityData();
  
  // Cast the user data to our extended type
  const user = userData as unknown as ExtendedUser;

  return (
    <div className="w-full min-h-screen">
      <div className="w-full">
        <EnhancedAnimatedHeader 
          userId={user.id}
        />
        
        <div className="pl-[100px] pr-4 sm:pr-6 lg:pr-15 py-6 md:py-8">
          <Tabs defaultValue="overview" className="w-full">
            <ProfileTabsList />
            <ProfileTabsContent user={user} activities={activities || []} />
          </Tabs>
        </div>
        
        {/* Debug Panel - only shows in development or when enabled */}
        <UserDebugPanel />
        <DebugModeToggle />
      </div>
    </div>
  );
}


