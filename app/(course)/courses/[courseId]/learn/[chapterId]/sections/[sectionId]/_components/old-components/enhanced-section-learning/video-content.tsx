import { useState } from "react";
import { Play, Clock, Eye, Star, ExternalLink, Filter, SortAsc, SortDesc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface VideoContentProps {
  videos: Array<{
    id: string;
    title: string;
    description?: string | null;
    url: string;
    duration?: number | null;
    thumbnail?: string | null;
    views?: number;
    rating?: number;
    platform?: string;
  }>;
}

export const VideoContent = ({ videos }: VideoContentProps) => {
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'duration' | 'views'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views?: number) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const handleVideoClick = (url: string, title: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  // Get unique platforms from videos and add common platforms
  const videoPlatforms = Array.from(new Set(videos.map(v => v.platform).filter((p): p is string => Boolean(p))));
  const commonPlatforms = ['YouTube', 'Vimeo', 'Wistia', 'JW Player', 'Brightcove', 'Kaltura', 'Twitch', 'Facebook', 'Instagram'];
  const allPlatforms = [...videoPlatforms, ...commonPlatforms];
  const platforms = Array.from(new Set(allPlatforms)).sort();

  // Filter and sort videos
  const filteredAndSortedVideos = videos
    .filter(video => {
      if (filterPlatform !== 'all' && video.platform !== filterPlatform) return false;
      if (filterRating !== 'all') {
        const minRating = parseFloat(filterRating);
        if (!video.rating || video.rating < minRating) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Videos Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Video content will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Video Lessons ({filteredAndSortedVideos.length})
        </h3>
        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
          <Play className="w-3 h-3 mr-1" />
          Videos
        </Badge>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
        </div>

        {/* Platform Filter */}
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms.map(platform => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rating Filter */}
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
            <SelectItem value="1">1+ Stars</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="views">Views</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
          {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Button>
      </div>

      {/* Video List */}
      <div className="space-y-2">
        {filteredAndSortedVideos.map((video, index) => (
          <div
            key={video.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer group"
            onClick={() => handleVideoClick(video.url, video.title)}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Video Number */}
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {index + 1}
              </div>

              {/* Video Title */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {video.title}
                </h4>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {video.platform && (
                    <span className="capitalize">{video.platform}</span>
                  )}
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  )}
                  {video.views !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{formatViews(video.views)} views</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              {video.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(video.rating)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {video.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* External Link Icon */}
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredAndSortedVideos.length === 0 && videos.length > 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            No videos match your filters
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filter criteria to see more results.
          </p>
        </div>
      )}
    </div>
  );
}; 