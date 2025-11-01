"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Github, Mail, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SocialLink {
  platform: "twitter" | "linkedin" | "github" | "email" | "website";
  url: string;
}

interface AuthorSocialLinksProps {
  authorId: string;
  authorName: string;
  socialLinks?: SocialLink[];
  isFollowing?: boolean;
  onFollowToggle?: (isFollowing: boolean) => Promise<void>;
}

const socialIcons = {
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  email: Mail,
  website: Globe,
};

export function AuthorSocialLinks({
  authorId,
  authorName,
  socialLinks = [],
  isFollowing = false,
  onFollowToggle,
}: AuthorSocialLinksProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const newFollowState = !following;

      if (onFollowToggle) {
        await onFollowToggle(newFollowState);
      } else {
        // Default follow/unfollow logic
        const response = await fetch(`/api/authors/${authorId}/follow`, {
          method: newFollowState ? "POST" : "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to update follow status");
        }
      }

      setFollowing(newFollowState);
      toast.success(newFollowState ? `Following ${authorName}` : `Unfollowed ${authorName}`);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="flex items-center gap-2">
          {socialLinks.map((link, index) => {
            const Icon = socialIcons[link.platform];
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                aria-label={`${authorName}&apos;s ${link.platform}`}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      )}

      {/* Follow Button */}
      <Button
        variant={following ? "outline" : "default"}
        size="sm"
        onClick={handleFollow}
        disabled={isLoading}
        className={cn(
          "transition-all",
          following && "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
        )}
      >
        {following ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Following
          </>
        ) : (
          "Follow"
        )}
      </Button>
    </div>
  );
}
