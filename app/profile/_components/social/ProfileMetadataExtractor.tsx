"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logger } from '@/lib/logger';
import { 
  RefreshCw, 
  Users, 
  UserPlus, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  ExternalLink,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { ProfileLink } from "@prisma/client";

interface ProfileMetadata {
  linkId: string;
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
  isVerified?: boolean;
  location?: string;
  website?: string;
  joinDate?: string;
  error?: string;
}

interface ProfileMetadataExtractorProps {
  profileLinks: ProfileLink[];
  onMetadataUpdated?: (metadata: ProfileMetadata[]) => void;
}

export function ProfileMetadataExtractor({ 
  profileLinks, 
  onMetadataUpdated 
}: ProfileMetadataExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [metadata, setMetadata] = useState<ProfileMetadata[]>([]);
  const [lastExtracted, setLastExtracted] = useState<Date | null>(null);

  const extractMetadata = async () => {
    if (profileLinks.length === 0) {
      toast.info("No profile links to extract metadata from");
      return;
    }

    setIsExtracting(true);
    try {
      const response = await axios.post('/api/social/profile-metadata', {
        profileLinks
      });

      const extractedMetadata = response.data.results;
      setMetadata(extractedMetadata);
      setLastExtracted(new Date());
      
      onMetadataUpdated?.(extractedMetadata);
      
      const successCount = extractedMetadata.filter((m: ProfileMetadata) => !m.error).length;
      const errorCount = extractedMetadata.filter((m: ProfileMetadata) => m.error).length;
      
      if (successCount > 0) {
        toast.success(`Successfully extracted metadata from ${successCount} profile${successCount > 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.warning(`Failed to extract metadata from ${errorCount} profile${errorCount > 1 ? 's' : ''}`);
      }
      
    } catch (error: any) {
      logger.error('Metadata extraction error:', error);
      toast.error("Failed to extract profile metadata");
    } finally {
      setIsExtracting(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-500',
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
      linkedin: 'bg-blue-700',
      github: 'bg-gray-800',
      youtube: 'bg-red-600',
      tiktok: 'bg-black',
      facebook: 'bg-blue-600',
    };
    return colors[platform.toLowerCase()] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Social Media Profile Analytics
            </CardTitle>
            <Button 
              onClick={extractMetadata}
              disabled={isExtracting || profileLinks.length === 0}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isExtracting ? 'animate-spin' : ''}`} />
              {isExtracting ? 'Extracting...' : 'Extract Metadata'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Extract follower counts, bio information, and profile data from your social media links.</p>
            {lastExtracted && (
              <p className="mt-2">
                Last extracted: {lastExtracted.toLocaleString()}
              </p>
            )}
            {profileLinks.length === 0 && (
              <p className="mt-2 text-amber-600">
                No profile links available. Add some social media links first.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metadata Results */}
      {metadata.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metadata.map((data) => (
            <Card key={data.linkId} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    className={`text-white ${getPlatformColor(data.platform)}`}
                    variant="secondary"
                  >
                    {data.platform}
                  </Badge>
                  {data.error ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {data.error ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <p className="font-medium">Extraction Failed</p>
                    <p className="text-xs mt-1">{data.error}</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Username: {data.username}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Profile Header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={data.profileImage} alt={data.displayName} />
                        <AvatarFallback>
                          {data.displayName?.charAt(0) || data.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-sm truncate">
                            {data.displayName || data.username}
                          </h3>
                          {data.isVerified && (
                            <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">@{data.username}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {data.bio && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {data.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                        </div>
                        <p className="text-xs font-medium">{formatNumber(data.followerCount)}</p>
                        <p className="text-xs text-gray-500">Followers</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <UserPlus className="h-3 w-3 text-gray-500" />
                        </div>
                        <p className="text-xs font-medium">{formatNumber(data.followingCount)}</p>
                        <p className="text-xs text-gray-500">Following</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3 w-3 text-gray-500" />
                        </div>
                        <p className="text-xs font-medium">{formatNumber(data.postsCount)}</p>
                        <p className="text-xs text-gray-500">Posts</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(data.location || data.website) && (
                      <div className="space-y-1">
                        {data.location && (
                          <p className="text-xs text-gray-500">📍 {data.location}</p>
                        )}
                        {data.website && (
                          <a 
                            href={data.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {metadata.length > 0 && metadata.some(m => !m.error) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {metadata.filter(m => !m.error).length}
                </div>
                <div className="text-sm text-gray-600">Connected Profiles</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(
                    metadata
                      .filter(m => !m.error)
                      .reduce((sum, m) => sum + (m.followerCount || 0), 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Followers</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(
                    metadata
                      .filter(m => !m.error)
                      .reduce((sum, m) => sum + (m.followingCount || 0), 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Following</div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(
                    metadata
                      .filter(m => !m.error)
                      .reduce((sum, m) => sum + (m.postsCount || 0), 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 