"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import YouTube, { type YouTubeProps, type YouTubeEvent } from "react-youtube";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Monitor,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** YouTube IFrame API player instance methods used by this component */
interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
  getIframe: () => HTMLIFrameElement;
}

/** Public ref handle exposed to parent components */
export interface SectionYouTubePlayerRef {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number | undefined;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number | undefined;
  getDuration: () => number | undefined;
  setVolume: (volume: number) => void;
  getVolume: () => number | undefined;
}

interface SectionYouTubePlayerProps {
  videoUrl: string;
  sectionId: string;
  sectionTitle: string;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  autoplay?: boolean;
  startTime?: number;
}

export const SectionYouTubePlayer = forwardRef<SectionYouTubePlayerRef, SectionYouTubePlayerProps>(({
  videoUrl,
  sectionId,
  sectionTitle,
  onComplete,
  onProgress,
  autoplay = false,
  startTime = 0,
}, ref) => {
  const { mode, canTrackProgress, isPreviewMode, user } = useLearningMode();
  const [player, setPlayer] = useState<YTPlayerInstance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedMilestone = useRef<number>(0);

  // Expose player methods to parent component
  useImperativeHandle(ref, () => ({
    playVideo: () => player?.playVideo(),
    pauseVideo: () => player?.pauseVideo(),
    getPlayerState: () => player?.getPlayerState(),
    seekTo: (seconds: number) => player?.seekTo(seconds),
    getCurrentTime: () => player?.getCurrentTime(),
    getDuration: () => player?.getDuration(),
    setVolume: (volume: number) => player?.setVolume(volume),
    getVolume: () => player?.getVolume(),
  }), [player]);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const videoId = getYouTubeId(videoUrl);

  // Track progress at milestones
  const trackProgress = useCallback(
    async (percentage: number) => {
      if (!canTrackProgress || !user?.id) return;

      const milestones = [25, 50, 75, 100];
      const currentMilestone = milestones.find(
        (m) => percentage >= m && lastTrackedMilestone.current < m
      );

      if (currentMilestone) {
        lastTrackedMilestone.current = currentMilestone;

        try {
          const response = await fetch(`/api/sections/${sectionId}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              progress: currentMilestone,
              type: "video",
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save progress");
          }

          if (currentMilestone === 100) {
            toast.success("Video completed! Well done! 🎉");
            onComplete?.();
          } else {
            toast.success(`${currentMilestone}% completed`);
          }
        } catch (error) {
          console.error("Error tracking progress:", error);
        }
      }

      onProgress?.(percentage);
    },
    [canTrackProgress, user?.id, sectionId, onComplete, onProgress]
  );

  // Update progress periodically
  useEffect(() => {
    if (player && isPlaying && duration > 0) {
      progressIntervalRef.current = setInterval(async () => {
        try {
          const current = await player.getCurrentTime();
          const total = await player.getDuration();
          const percentage = (current / total) * 100;

          setCurrentTime(current);
          setProgress(percentage);
          trackProgress(percentage);
        } catch (error) {
          console.error("Error updating progress:", error);
        }
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [player, isPlaying, duration, trackProgress]);

  // YouTube player options
  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      controls: 0, // Hide default controls to use custom ones
      start: startTime,
      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    },
  };

  // Player event handlers
  const onReady = (event: YouTubeEvent) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
    setIsLoading(false);

    // Set initial volume and quality
    event.target.setVolume(volume);

    // Resume from last position if available
    if (startTime > 0) {
      event.target.seekTo(startTime, true);
    }
  };

  const onStateChange = (event: YouTubeEvent<number>) => {
    const state = event.data;
    setIsPlaying(state === 1); // 1 = playing

    if (state === 0) {
      // Video ended
      trackProgress(100);
    }
  };

  const onError = (event: YouTubeEvent<number>) => {
    setIsLoading(false);
    setError("Failed to load video. Please check your connection and try again.");
    console.error("YouTube Player Error:", event);
  };

  // Player controls
  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const seek = (seconds: number) => {
    if (player) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      player.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        player.setVolume(volume || 100);
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (player) {
      player.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const changeQuality = (quality: string) => {
    if (player) {
      player.setPlaybackQuality(quality);
      setQuality(quality);
    }
  };

  const enterFullscreen = () => {
    const iframe = player?.getIframe();
    if (iframe && iframe.requestFullscreen) {
      iframe.requestFullscreen();
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!videoId) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Invalid Video URL</h3>
        <p className="text-sm text-muted-foreground">
          Please provide a valid YouTube URL for this section.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      {/* Preview Mode Watermark */}
      {isPreviewMode && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="secondary" className="bg-yellow-500/90 text-black">
            <Monitor className="h-3 w-3 mr-1" />
            Preview Mode
          </Badge>
        </div>
      )}

      {/* Video Container */}
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-white mb-2 mx-auto" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center px-4">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
              <p className="text-white">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          onError={onError}
          className="absolute inset-0 w-full h-full"
        />

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2 text-white text-xs mb-1">
              <span>{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Skip Back/Forward */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => seek(-10)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => seek(10)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={cn(playbackRate === rate && "bg-accent")}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  {["auto", "1080p", "720p", "480p", "360p"].map((q) => (
                    <DropdownMenuItem
                      key={q}
                      onClick={() => changeQuality(q)}
                      className={cn(quality === q && "bg-accent")}
                    >
                      {q}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={enterFullscreen}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracking Info */}
      {canTrackProgress && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Video Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Start</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>Complete</span>
          </div>
        </div>
      )}
    </div>
  );
});

SectionYouTubePlayer.displayName = "SectionYouTubePlayer";