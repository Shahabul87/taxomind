'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVideoTracking, useVideoControlsTracking } from '@/hooks/use-video-tracking';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrackedVideoPlayerProps {
  videoId: string;
  src: string;
  title?: string;
  poster?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  autoplay?: boolean;
  className?: string;
  showAnalytics?: boolean;
}

export function TrackedVideoPlayer({
  videoId,
  src,
  title,
  poster,
  courseId,
  chapterId,
  sectionId,
  autoplay = false,
  className = '',
  showAnalytics = false
}: TrackedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Tracking hooks
  const { metrics, trackCustomEvent, trackInteraction } = useVideoTracking(
    videoRef.current,
    {
      videoId,
      videoTitle: title,
      courseId,
      chapterId,
      sectionId,
      duration,
      trackEngagement: true,
      trackQuality: true,
      trackSpeed: true,
      trackSeekBehavior: true,
      heartbeatInterval: 15
    }
  );

  const {
    trackControlClick,
    trackVolumeChange,
    trackFullscreenToggle
  } = useVideoControlsTracking(videoId, courseId, sectionId);

  // Video event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      const newVolume = videoRef.current.volume;
      const newMuted = videoRef.current.muted;
      
      if (newVolume !== volume) {
        trackVolumeChange(newVolume, volume);
        setVolume(newVolume);
      }
      
      if (newMuted !== isMuted) {
        setIsMuted(newMuted);
        trackControlClick('mute', { muted: newMuted });
      }
    }
  }, [volume, isMuted, trackVolumeChange, trackControlClick]);

  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(0);
      const bufferedPercent = (bufferedEnd / duration) * 100;
      setBuffered(bufferedPercent);
    }
  }, [duration]);

  // Control functions
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        trackControlClick('pause');
      } else {
        videoRef.current.play();
        trackControlClick('play');
      }
    }
  }, [isPlaying, trackControlClick]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      const oldTime = videoRef.current.currentTime;
      videoRef.current.currentTime = time;
      
      // Track significant seeks (more than 5 seconds)
      if (Math.abs(time - oldTime) > 5) {
        trackCustomEvent('manual_seek', {
          fromTime: oldTime,
          toTime: time,
          seekDistance: Math.abs(time - oldTime)
        });
      }
    }
  }, [trackCustomEvent]);

  const skipTime = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      handleSeek(newTime);
      trackCustomEvent(seconds > 0 ? 'skip_forward' : 'skip_back', {
        skipAmount: Math.abs(seconds),
        fromTime: currentTime,
        toTime: newTime
      });
    }
  }, [currentTime, duration, handleSeek, trackCustomEvent]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      trackControlClick('speed', {
        newRate: rate,
        oldRate: playbackRate
      });
    }
  }, [playbackRate, trackControlClick]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  }, [isFullscreen]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!videoRef.current) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skipTime(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipTime(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (videoRef.current) {
          const newVolume = Math.min(1, volume + 0.1);
          videoRef.current.volume = newVolume;
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (videoRef.current) {
          const newVolume = Math.max(0, volume - 0.1);
          videoRef.current.volume = newVolume;
        }
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }, [togglePlay, skipTime, volume, toggleMute, toggleFullscreen]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
      trackFullscreenToggle(fullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [trackFullscreenToggle]);

  // Keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Mouse movement for controls
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', () => setShowControls(true));
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
        }
      });

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(hideTimeout);
      };
    }
  }, [isPlaying]);

  // Track chapter/section markers
  const trackChapterMarker = useCallback((chapterTime: number, chapterName: string) => {
    trackCustomEvent('chapter_reached', {
      chapterTime,
      chapterName,
      timeTaken: currentTime
    });
  }, [currentTime, trackCustomEvent]);

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative video-player-container ${className}`}>
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden group"
        data-video-id={videoId}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoplay}
          className="w-full h-full"
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVolumeChange={handleVolumeChange}
          onProgress={handleProgress}
          onClick={togglePlay}
        />

        {/* Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group">
              {/* Buffered Progress */}
              <div
                className="absolute h-full bg-white/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Watched Progress */}
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Seek Handle */}
              <div
                className="absolute w-4 h-4 bg-blue-500 rounded-full -top-1 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              {/* Skip Backward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-10)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              {/* Skip Forward */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(10)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="w-20">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      if (videoRef.current) {
                        videoRef.current.volume = Number(e.target.value);
                        videoRef.current.muted = false;
                      }
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Time Display */}
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
              >
                <option value={0.5} className="text-black">0.5x</option>
                <option value={0.75} className="text-black">0.75x</option>
                <option value={1} className="text-black">1x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
                <option value={2} className="text-black">2x</option>
              </select>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading/Buffering Indicator */}
        {buffered < 100 && (
          <div className="absolute top-4 right-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <Card className="mt-4 p-4">
          <h4 className="text-sm font-medium mb-3">Video Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Watch Time</div>
              <div className="font-medium">{Math.round(metrics.watchTime)}s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Completion</div>
              <div className="font-medium">{Math.round(metrics.completionRate)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Engagement</div>
              <div className="font-medium">{Math.round(metrics.engagementScore)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Speed</div>
              <div className="font-medium">{metrics.averagePlaybackSpeed.toFixed(2)}x</div>
            </div>
          </div>
          
          {metrics.strugglingSegments.length > 0 && (
            <div className="mt-3">
              <div className="text-muted-foreground text-xs mb-1">Struggling Segments</div>
              <div className="flex gap-1 flex-wrap">
                {metrics.strugglingSegments.slice(0, 5).map((segment, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">
                    {formatTime(segment)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metrics.rewatchedSegments.length > 0 && (
            <div className="mt-2">
              <div className="text-muted-foreground text-xs mb-1">Rewatched Segments</div>
              <div className="flex gap-1 flex-wrap">
                {metrics.rewatchedSegments.slice(0, 5).map((segment, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {formatTime(segment)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}