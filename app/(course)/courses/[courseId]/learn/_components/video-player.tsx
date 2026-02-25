"use client";

import { useState, useEffect, useRef } from "react";
import { logger } from '@/lib/logger';
import { 
  Loader2, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  RotateCcw,
  SkipBack,
  SkipForward
} from "lucide-react";
import dynamic from "next/dynamic";
import type { YouTubeEvent } from 'react-youtube';

const YouTube = dynamic(() => import("react-youtube").then(m => m.default), { ssr: false });
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const VideoPlayer = ({ 
  videoUrl, 
  courseId, 
  chapterId, 
  sectionId 
}: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoUrl) {
      const extractVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
      };

      const id = extractVideoId(videoUrl);
      setVideoId(id);
    }
  }, [videoUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReady = async (event: YouTubeEvent) => {
    playerRef.current = event.target;
    const duration = await event.target.getDuration();
    setDuration(duration);
    setIsLoading(false);
  };

  const handleStateChange = (event: YouTubeEvent) => {
    setIsPlaying(event.data === 1); // 1 = playing
  };

  const handleProgress = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      setWatchTime(currentTime);
      
      // Update progress in database
      // This would need to be implemented with your progress tracking API
    }
  };

  const handleError = (error: any) => {
    logger.error("YouTube Player Error:", error);
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(nextRate);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playerRef.current) {
        handleProgress();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
            No Video Available
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            This section doesn&apos;t have a video yet.
          </p>
        </div>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl flex items-center justify-center border border-red-200 dark:border-red-800">
        <div className="text-center">
          <Play className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Invalid Video URL
          </h3>
          <p className="text-sm text-red-500 dark:text-red-400">
            Please check the video link and try again.
          </p>
        </div>
      </div>
    );
  }

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0 as const,
      modestbranding: 1 as const,
      rel: 0 as const,
      showinfo: 0 as const,
      controls: 1 as const,
      fs: 1 as const,
      playsinline: 1 as const,
    },
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group rounded-xl overflow-hidden shadow-lg",
        isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'w-full aspect-video'
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading video...</p>
          </div>
        </div>
      )}
      
      <div className={cn(
        "relative",
        isFullscreen ? 'h-full w-full' : 'aspect-video'
      )}>
        <YouTube
          videoId={videoId}
          opts={opts}
          className="absolute inset-0 w-full h-full"
          onReady={handleReady}
          onStateChange={handleStateChange}
          onError={handleError}
          iframeClassName="w-full h-full"
        />

        {/* Enhanced Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          {/* Top Info Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white pointer-events-auto">
            <div>
              <h3 className="font-semibold text-lg drop-shadow-lg">Learning Video</h3>
              <p className="text-sm text-white/80 drop-shadow">
                {duration > 0 && `Duration: ${formatTime(duration)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={changePlaybackRate}
                className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
              >
                {playbackRate}x
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto pb-safe-3">
            {/* Progress Info */}
            {duration > 0 && (
              <div className="flex items-center justify-between text-white text-sm mb-2 drop-shadow">
                <span>{formatTime(watchTime)}</span>
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(watchTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator for completed sections */}
      {watchTime > 0 && duration > 0 && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          {Math.round((watchTime / duration) * 100)}%
        </div>
      )}
    </div>
  );
}; 
