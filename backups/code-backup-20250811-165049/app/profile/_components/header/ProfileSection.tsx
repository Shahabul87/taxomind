"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileImageUpload } from "../ProfileImageUpload";
import { logger } from '@/lib/logger';
import { 
  Crown, Mail, Calendar, Globe, Edit3, 
  Settings, Share2, Award
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  createdAt: string;
  socialMediaAccounts: any[];
}

interface ProfileSectionProps {
  userData: UserData;
  userId: string;
  onImageUpdate: (imageUrl: string) => void;
}

export function ProfileSection({ userData, userId, onImageUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditProfile = () => {
    // You can implement a modal or redirect to edit page
    toast.info("Edit Profile functionality - you can implement this based on your needs");
    // Example: router.push('/profile/edit');
  };

  const handleSettings = () => {
    // You can implement settings modal or redirect
    toast.info("Settings functionality - you can implement this based on your needs");
    // Example: router.push('/settings');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userData.name || 'User'}'s Profile`,
          text: `Check out ${userData.name || 'this user'}'s profile!`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (error) {
      logger.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      } catch (clipboardError) {
        toast.error("Failed to share profile");
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
      {/* Profile Image */}
      <div className="relative animate-fade-in">
        <ProfileImageUpload
          userId={userId}
          initialImage={userData.image}
          size="xl"
          onImageUpdate={onImageUpdate}
        />
        {/* Online Status */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full animate-pulse" />
      </div>

      {/* Profile Info */}
      <div className="flex-1 space-y-4">
        <div className="animate-slide-in-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {userData.name || "Anonymous User"}
            </h1>
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30 w-fit">
              <Crown className="w-3 h-3 mr-1" />
              Pro User
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            {userData.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{userData.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Joined {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm">{userData.socialMediaAccounts.length} Platforms</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 animate-slide-in-left delay-100">
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleEditProfile}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
            onClick={handleSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="hidden lg:block relative animate-bounce-in">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
          <Award className="w-10 h-10" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          5
        </div>
      </div>
    </div>
  );
} 