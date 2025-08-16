"use client";

import { FavoriteVideo } from "@prisma/client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Pencil, Trash, Play, ExternalLink, Video, LayoutGrid, List, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface FavoriteVideoListProps {
  items: FavoriteVideo[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

type ViewMode = 'list' | 'grid';

// Individual video item component
const VideoItem = ({ 
  video, 
  onEdit, 
  onDelete, 
  confirmDelete,
  viewMode
}: { 
  video: FavoriteVideo; 
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  confirmDelete: (id: string) => void;
  viewMode: ViewMode;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Extract video thumbnail URL from YouTube, Vimeo, etc.
  const getThumbnailUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop() 
        : url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
    }
    // Default thumbnail
    return null;
  };

  const thumbnail = getThumbnailUrl(video.url);
  const formattedDate = new Date(video.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  // Close the details modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group relative"
        ref={itemRef}
      >
        <div 
          className={cn(
            "relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer",
            "bg-gray-100 dark:bg-gray-800",
            "border border-gray-200/50 dark:border-gray-700/50",
            showDetails ? "border-rose-500 dark:border-rose-400 shadow-md" : "hover:border-rose-500/50 dark:hover:border-rose-400/50",
            "shadow-sm hover:shadow-md transition-all duration-300"
          )}
          onClick={toggleDetails}
        >
          {/* Thumbnail */}
          {thumbnail ? (
            <Image 
              src={thumbnail} 
              alt={video.title} 
              width={320}
              height={180}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 w-full h-full flex items-center justify-center">
              <Video className="h-8 w-8 text-rose-500/60 dark:text-rose-400/60" />
            </div>
          )}
          
          {/* Actions */}
          <div className="absolute bottom-0 right-0 p-2 flex gap-1">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
              onClick={(e) => e.stopPropagation()}
            >
              <Play fill="white" className="h-3.5 w-3.5 ml-0.5" />
            </a>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(video.id);
              }}
              className="w-7 h-7 rounded-full bg-gray-700/90 flex items-center justify-center text-white hover:bg-gray-600 transition-colors hover:scale-110"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(video.id);
              }}
              className="w-7 h-7 rounded-full bg-red-700/80 flex items-center justify-center text-white hover:bg-red-600 transition-colors hover:scale-110"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {/* Title below thumbnail */}
        <div className="mt-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-transparent bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text truncate">
            {video.title}
          </h3>
          <button 
            className={cn(
              "text-gray-500 transition-colors p-1 rounded-full",
              showDetails ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={toggleDetails}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        
        {/* Details Modal */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4",
                "md:absolute md:inset-auto md:bottom-full md:mb-2 md:w-full md:max-w-xs md:p-0",
              )}
              style={{
                left: "50%",
                transform: "translateX(-50%)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
                onClick={toggleDetails}
              />
              <div className={cn(
                "bg-white dark:bg-gray-800 rounded-lg shadow-xl",
                "border border-gray-200/50 dark:border-gray-700/50",
                "p-4 relative z-10 w-full max-w-sm md:max-w-none"
              )}>
                <div className="absolute bottom-0 left-1/2 -mb-2 transform -translate-x-1/2 hidden md:block">
                  <div className="border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
                </div>
                
                <div className="mb-3 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                  <h3 className="font-medium text-base text-gray-900 dark:text-gray-100">{video.title}</h3>
                  <button 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
                    onClick={toggleDetails}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {video.category && (
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                    <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                      {video.category}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Platform:</span>
                  <span className="text-sm text-rose-600 dark:text-rose-400">{video.platform}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Added:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formattedDate}</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">URL:</span>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors truncate"
                  >
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{video.url}</span>
                  </a>
                </div>
                
                <div className="flex gap-2 justify-end mt-3 md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDetails}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      window.open(video.url, '_blank');
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Watch Video
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative rounded-xl overflow-hidden"
      ref={itemRef}
    >
      <div 
        className={cn(
          "relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-md cursor-pointer",
          "border border-gray-200/50 dark:border-gray-700/50",
          showDetails ? "border-rose-500 dark:border-rose-400 shadow-md" : "hover:border-rose-500/50 dark:hover:border-rose-400/50",
          "shadow-sm hover:shadow-md",
          "overflow-hidden rounded-xl transition-all duration-300"
        )}
        onClick={toggleDetails}
      >
        <div className="flex items-center">
          {/* Title (Always visible) */}
          <div className="flex-grow px-4 py-3">
            <h3 className="font-medium text-transparent bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text truncate">
              {video.title}
            </h3>
          </div>
          
          {/* Actions */}
          <div className="p-3 flex items-center gap-1">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "bg-rose-50 dark:bg-rose-900/20",
                "text-rose-600 dark:text-rose-400",
                "transition-transform hover:scale-110"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Play fill="currentColor" className="w-4 h-4 ml-0.5" />
            </a>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDetails(e);
              }}
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                showDetails ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-gray-100 dark:bg-gray-750/50 text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400",
                "transition-colors hover:scale-105"
              )}
            >
              <Info className="w-4 h-4" />
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(video.id);
              }}
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-750/50",
                "text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400",
                "transition-colors"
              )}
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(video.id);
              }}
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20",
                "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400",
                "transition-colors"
              )}
            >
              <Trash className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center p-4",
              "md:absolute md:inset-auto md:bottom-full md:left-0 md:mb-2 md:min-w-[300px] md:p-0",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={toggleDetails}
            />
            <div className={cn(
              "bg-white dark:bg-gray-800 rounded-lg shadow-xl",
              "border border-gray-200/50 dark:border-gray-700/50",
              "p-4 relative z-10 w-full max-w-sm md:max-w-none"
            )}>
              <div className="absolute bottom-0 left-10 -mb-2 transform hidden md:block">
                <div className="border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
              
              <div className="mb-3 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                <h3 className="font-medium text-base text-gray-900 dark:text-gray-100">{video.title}</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
                  onClick={toggleDetails}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              {video.category && (
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                    {video.category}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Platform:</span>
                <span className="text-sm text-rose-600 dark:text-rose-400">{video.platform}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">Added:</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{formattedDate}</span>
              </div>
              
              <div className="mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">URL:</span>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors truncate"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{video.url}</span>
                </a>
              </div>
              
              <div className="flex gap-2 justify-end mt-3 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDetails}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.open(video.url, '_blank');
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Watch Video
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FavoriteVideoList = ({
  items,
  onEdit,
  onDelete,
}: FavoriteVideoListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'platform' | 'category'>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    setIsMounted(true);
    // Sort by date added (newest first) internally
    setFavoriteVideos(
      [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, [items]);

  // Group videos based on selected grouping criteria
  const groupedVideos = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Videos': favoriteVideos };
    } else if (groupBy === 'platform') {
      return favoriteVideos.reduce((acc, video) => {
        const platform = video.platform || 'Other';
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(video);
        return acc;
      }, {} as Record<string, FavoriteVideo[]>);
    } else if (groupBy === 'category') {
      return favoriteVideos.reduce((acc, video) => {
        const category = video.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(video);
        return acc;
      }, {} as Record<string, FavoriteVideo[]>);
    }
    return { 'All Videos': favoriteVideos };
  }, [favoriteVideos, groupBy]);

  const confirmDelete = (id: string) => {
    setVideoToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (videoToDelete) {
      onDelete(videoToDelete);
      setShowDeleteModal(false);
      setVideoToDelete(null);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs",
              viewMode === 'list' 
                ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <List className="h-3.5 w-3.5 mr-1" />
            List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs",
              viewMode === 'grid' 
                ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Grid
          </Button>
        </div>
        
        {/* Group By Toggle */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">Group by:</div>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGroupBy('none')}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs",
                groupBy === 'none' 
                  ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              None
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGroupBy('platform')}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs",
                groupBy === 'platform' 
                  ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              Platform
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGroupBy('category')}
              className={cn(
                "rounded-sm px-3 py-1.5 text-xs",
                groupBy === 'category' 
                  ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              Category
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedVideos).map(([group, videos]) => (
          <div key={group} className="space-y-3">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 dark:to-transparent py-1 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                <span className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 dark:from-rose-400 dark:to-pink-400 h-4 w-1 mr-2 rounded-full"></span>
                {group}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({videos.length})
                </span>
              </h3>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {videos.map((video) => (
                    <VideoItem
                      key={video.id}
                      video={video}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      confirmDelete={confirmDelete}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {videos.map((video) => (
                    <VideoItem
                      key={video.id}
                      video={video}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      confirmDelete={confirmDelete}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "p-6 rounded-xl max-w-md w-full mx-4",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "shadow-xl"
            )}
          >
            <div className="flex items-center space-x-2 mb-5">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2">
                <Trash className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete this video?
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this favorite video? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 dark:bg-rose-500 hover:bg-red-700 dark:hover:bg-rose-600 text-white"
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
