"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeaderBackground } from "./HeaderBackground";
import { ProfileSection } from "./ProfileSection";
import { StatsGrid } from "./StatsGrid";
import { SocialPlatforms } from "./SocialPlatforms";
import { LoadingState, AuthErrorState, ErrorState } from "./LoadingStates";
import { logger } from '@/lib/logger';

interface UserStats {
  followers: number;
  following: number;
  likes: number;
  posts: number;
  comments: number;
  subscriptions: number;
  monthlySpending: number;
  content: number;
  ideas: number;
  courses: number;
}

interface UserData {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
  createdAt: string;
  stats: UserStats;
  socialMediaAccounts: any[];
  userSubscriptions: any[];
  profileLinks: any[];
}

interface EnhancedAnimatedHeaderProps {
  userId: string;
  initialData?: Partial<UserData>;
}

export function EnhancedAnimatedHeader({ userId, initialData }: EnhancedAnimatedHeaderProps) {
  const [userData, setUserData] = useState<UserData | null>(initialData as UserData || null);
  const [loading, setLoading] = useState(!initialData);
  const [authError, setAuthError] = useState<string | null>(null);
  const [layoutDimensions, setLayoutDimensions] = useState({
    headerHeight: 64, // Default header height
    sidebarWidth: 80, // Default sidebar width when collapsed
    isMobile: false
  });

  // Detect layout dimensions from the actual DOM elements
  useEffect(() => {
    const detectLayoutDimensions = () => {
      // Detect header height
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 64;
      
      // Detect sidebar width - look for the actual sidebar element
      const sidebar = document.querySelector('[data-sidebar]') || 
                     document.querySelector('.sidebar') ||
                     document.querySelector('aside');
      
      // Check if we're on mobile
      const isMobile = window.innerWidth < 1024;
      
      // Get sidebar width - it's 80px when collapsed, 280px when expanded
      let sidebarWidth = 0;
      if (sidebar && !isMobile) {
        const sidebarRect = sidebar.getBoundingClientRect();
        sidebarWidth = sidebarRect.width || 80;
        
        // If we can't detect the sidebar but we're not mobile, assume default collapsed width
        if (sidebarWidth === 0) {
          sidebarWidth = 80;
        }
      }

      setLayoutDimensions({ headerHeight, sidebarWidth, isMobile });
    };

    // Initial detection
    detectLayoutDimensions();
    
    // Re-detect on resize
    const handleResize = () => {
      setTimeout(detectLayoutDimensions, 100); // Small delay to let layout settle
    };
    
    window.addEventListener('resize', handleResize);
    
    // Re-detect when user data changes (sidebar might appear/disappear)
    if (userData) {
      setTimeout(detectLayoutDimensions, 200);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userData]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/profile');

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('API Error:', errorText);
          
          if (response.status === 401) {
            setAuthError('You need to be logged in to view your profile');
            toast.error('Please log in to view your profile');
            return;
          }
          
          throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();

        setUserData(data);
      } catch (error: any) {
        logger.error('Error fetching user data:', error);
        toast.error(`Failed to load profile data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Don't set mock data - let it show empty states
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!initialData) {
      fetchUserData();
    }
  }, [initialData]);

  const handleImageUpdate = (imageUrl: string) => {
    if (userData) {
      setUserData({ ...userData, image: imageUrl });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (authError) {
    return <AuthErrorState message={authError} />;
  }

  if (!userData) {
    return <ErrorState message="Failed to load profile data" />;
  }

  return (
    <div className="w-full">
      {/* Full-width hero section positioned relative for natural scrolling */}
      <div 
        className="w-screen overflow-hidden"
        style={{
          position: 'relative',
          left: '0',
          right: '0',
          paddingLeft: layoutDimensions.isMobile ? '0' : `${layoutDimensions.sidebarWidth}px`,
        }}
      >
        <HeaderBackground />

        <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-7xl mx-auto">
            <ProfileSection 
              userData={userData}
              userId={userId}
              onImageUpdate={handleImageUpdate}
            />
            
            <StatsGrid stats={userData.stats} />
            
            <SocialPlatforms socialMediaAccounts={userData.socialMediaAccounts} />
          </div>
        </div>
      </div>
    </div>
  );
} 