'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, AlertCircle, Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { toast } from 'sonner';
import { extractYouTubeId } from '@/lib/utils/youtube';
import { cn } from '@/lib/utils';

interface YouTubePlayerSecuredProps {
  videoUrl: string;
  isEnrolled: boolean;
  isPreview: boolean;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  courseId: string;
  sectionId: string;
  className?: string;
}

// YouTube IFrame API types
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (elementId: string, config: any) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export function YouTubePlayerSecured({
  videoUrl,
  isEnrolled,
  isPreview,
  onProgress,
  onComplete,
  courseId,
  sectionId,
  className,
}: YouTubePlayerSecuredProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdate = useRef<number>(0);

  // Check access
  const hasAccess = isEnrolled || isPreview;

  // Extract video ID
  const videoId = extractYouTubeId(videoUrl);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return;

      const current = playerRef.current.getCurrentTime();
      const total = playerRef.current.getDuration();

      if (current && total) {
        const progressPercent = (current / total) * 100;
        setProgress(progressPercent);
        setCurrentTime(current);

        // Only send progress updates every 5 seconds
        const now = Date.now();
        if (now - lastProgressUpdate.current >= 5000) {
          lastProgressUpdate.current = now;
          onProgress?.(progressPercent, current);
        }

        // Auto-complete at 90%
        if (progressPercent >= 90 && progressPercent < 91) {
          onComplete?.();
          toast.success('🎉 Section completed!');
        }
      }
    }, 1000);
  }, [onProgress, onComplete]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handleVideoComplete = useCallback(() => {
    onComplete?.();
    toast.success('🎉 Section completed!');
  }, [onComplete]);

  const initPlayer = useCallback(() => {
    if (!window.YT || !videoId) return;

    const handlePlayerReady = () => {
      setIsLoading(false);
      if (playerRef.current) {
        setDuration(playerRef.current.getDuration());
      }
    };

    const handlePlayerStateChange = (event: { data: number }) => {
      if (!window.YT) return;

      const state = event.data;

      // Playing
      if (state === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        startProgressTracking();
      }
      // Paused or Ended
      else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
        setIsPlaying(false);
        stopProgressTracking();
      }

      // Video ended
      if (state === window.YT.PlayerState.ENDED) {
        handleVideoComplete();
      }
    };

    const handlePlayerError = (event: { data: number }) => {
      const errorMessages: Record<number, string> = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found',
        101: 'Video is private or restricted',
        150: 'Video is private or restricted',
      };

      const message = errorMessages[event.data] || 'Failed to load video';
      setError(message);
      setIsLoading(false);
      console.error('YouTube player error:', event.data);
    };

    try {
      playerRef.current = new window.YT.Player('youtube-player-' + sectionId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0, // Don't show related videos
          showinfo: 0,
          origin: window.location.origin, // Security
          enablejsapi: 1,
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError,
        },
      });
    } catch (err) {
      console.error('Failed to initialize YouTube player:', err);
      setError('Failed to load video player');
      setIsLoading(false);
    }
  }, [videoId, sectionId, startProgressTracking, stopProgressTracking, handleVideoComplete]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!hasAccess || !videoId) return;

    // Check if API is already loaded
    if (window.YT) {
      initPlayer();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [hasAccess, videoId, initPlayer]);

  // Player controls
  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const seekTo = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(seconds, true);
  };

  // No access view
  if (!hasAccess) {
    return (
      <Card className={cn("aspect-video flex items-center justify-center bg-slate-100 dark:bg-slate-800", className)}>
        <div className="text-center p-8">
          <Lock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2">Enroll to Access</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This video is only available to enrolled students.
          </p>
          <Button asChild>
            <a href={`/courses/${courseId}`}>View Course</a>
          </Button>
        </div>
      </Card>
    );
  }

  // Invalid video ID
  if (!videoId) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid YouTube URL. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Error view
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative group", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg z-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      <div id={`youtube-player-${sectionId}`} className="aspect-video w-full rounded-lg overflow-hidden" />

      {isPreview && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-20">
          Preview Mode
        </div>
      )}

      {/* Custom Controls Overlay (optional) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex-1">
            <div className="bg-white/30 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
