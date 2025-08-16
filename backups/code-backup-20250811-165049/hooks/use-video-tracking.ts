'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useEventTracker } from '@/lib/analytics/analytics-provider';
import { usePathname } from 'next/navigation';

interface VideoTrackingOptions {
  videoId: string;
  videoTitle?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  duration?: number;
  trackEngagement?: boolean;
  trackQuality?: boolean;
  trackSpeed?: boolean;
  trackSeekBehavior?: boolean;
  heartbeatInterval?: number; // Progress tracking interval in seconds
}

interface VideoMetrics {
  watchTime: number;
  totalPauses: number;
  totalSeeks: number;
  engagementScore: number;
  completionRate: number;
  averagePlaybackSpeed: number;
  qualityChanges: number;
  maxConsecutiveWatchTime: number;
  strugglingSegments: number[];
  rewatchedSegments: number[];
}

interface VideoEvent {
  type: 'play' | 'pause' | 'seek' | 'ended' | 'progress' | 'quality' | 'speed';
  timestamp: number;
  currentTime: number;
  duration: number;
  data?: any;
}

export function useVideoTracking(
  videoElement: HTMLVideoElement | null,
  options: VideoTrackingOptions
) {
  const {
    videoId,
    videoTitle,
    courseId,
    chapterId,
    sectionId,
    duration,
    trackEngagement = true,
    trackQuality = true,
    trackSpeed = true,
    trackSeekBehavior = true,
    heartbeatInterval = 10
  } = options;

  const tracker = useEventTracker();
  const pathname = usePathname();

  // State
  const [metrics, setMetrics] = useState<VideoMetrics>({
    watchTime: 0,
    totalPauses: 0,
    totalSeeks: 0,
    engagementScore: 0,
    completionRate: 0,
    averagePlaybackSpeed: 1,
    qualityChanges: 0,
    maxConsecutiveWatchTime: 0,
    strugglingSegments: [],
    rewatchedSegments: []
  });

  // Refs
  const sessionStartTime = useRef<number>();
  const lastProgressTime = useRef<number>(0);
  const playStartTime = useRef<number>();
  const watchedSegments = useRef<Set<number>>(new Set());
  const seekHistory = useRef<Array<{ from: number; to: number; timestamp: number }>>([]);
  const pauseHistory = useRef<Array<{ time: number; timestamp: number }>>([]);
  const speedHistory = useRef<Array<{ speed: number; timestamp: number; duration: number }>>([]);
  const heartbeatTimer = useRef<NodeJS.Timeout>();
  const consecutiveWatchStart = useRef<number>();
  const currentWatchStreak = useRef<number>(0);
  const lastHeartbeat = useRef<number>(0);

  // Track video session start
  const trackSessionStart = useCallback(() => {
    if (!videoElement) return;

    sessionStartTime.current = Date.now();
    consecutiveWatchStart.current = videoElement.currentTime;

    tracker.track({
      eventType: 'video',
      eventName: 'video_session_start',
      properties: {
        videoId,
        videoTitle,
        duration: videoElement.duration || duration,
        initialPosition: videoElement.currentTime,
        autoplay: videoElement.autoplay,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });
  }, [videoElement, videoId, videoTitle, duration, tracker, pathname, courseId, chapterId, sectionId]);

  // Track video play
  const trackPlay = useCallback(() => {
    if (!videoElement) return;

    playStartTime.current = Date.now();
    consecutiveWatchStart.current = videoElement.currentTime;

    tracker.track({
      eventType: 'video',
      eventName: 'video_play',
      properties: {
        videoId,
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
        playbackRate: videoElement.playbackRate,
        volume: videoElement.volume,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });

    // Start heartbeat tracking
    startHeartbeat();
  }, [videoElement, videoId, tracker, pathname, courseId, chapterId, sectionId, startHeartbeat]);

  // Track video pause
  const trackPause = useCallback(() => {
    if (!videoElement) return;

    const pauseTime = videoElement.currentTime;
    const watchDuration = playStartTime.current ? Date.now() - playStartTime.current : 0;

    // Update consecutive watch time
    if (consecutiveWatchStart.current !== undefined) {
      const consecutiveTime = pauseTime - consecutiveWatchStart.current;
      currentWatchStreak.current = Math.max(currentWatchStreak.current, consecutiveTime);
    }

    pauseHistory.current.push({
      time: pauseTime,
      timestamp: Date.now()
    });

    setMetrics(prev => ({
      ...prev,
      totalPauses: prev.totalPauses + 1,
      maxConsecutiveWatchTime: Math.max(prev.maxConsecutiveWatchTime, currentWatchStreak.current)
    }));

    tracker.track({
      eventType: 'video',
      eventName: 'video_pause',
      properties: {
        videoId,
        currentTime: pauseTime,
        duration: videoElement.duration,
        watchDuration,
        pauseCount: pauseHistory.current.length,
        consecutiveWatchTime: currentWatchStreak.current,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });

    // Stop heartbeat tracking
    stopHeartbeat();
  }, [videoElement, videoId, tracker, pathname, courseId, chapterId, sectionId, stopHeartbeat]);

  // Track seeking behavior
  const trackSeek = useCallback((fromTime: number, toTime: number) => {
    if (!videoElement) return;

    const seekDistance = Math.abs(toTime - fromTime);
    const seekDirection = toTime > fromTime ? 'forward' : 'backward';
    const isRewatch = watchedSegments.current.has(Math.floor(toTime / 10));

    seekHistory.current.push({
      from: fromTime,
      to: toTime,
      timestamp: Date.now()
    });

    // Detect struggling behavior (multiple seeks in short time)
    const recentSeeks = seekHistory.current.filter(
      seek => Date.now() - seek.timestamp < 30000 // Last 30 seconds
    );

    const isStruggling = recentSeeks.length >= 3 && seekDistance < 30;

    if (isStruggling) {
      setMetrics(prev => ({
        ...prev,
        strugglingSegments: [...prev.strugglingSegments, Math.floor(fromTime)]
      }));
    }

    if (isRewatch) {
      setMetrics(prev => ({
        ...prev,
        rewatchedSegments: [...prev.rewatchedSegments, Math.floor(toTime)]
      }));
    }

    setMetrics(prev => ({
      ...prev,
      totalSeeks: prev.totalSeeks + 1
    }));

    tracker.track({
      eventType: 'video',
      eventName: 'video_seek',
      properties: {
        videoId,
        fromTime,
        toTime,
        seekDistance,
        seekDirection,
        isRewatch,
        isStruggling,
        recentSeekCount: recentSeeks.length,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });
  }, [videoElement, videoId, tracker, pathname, courseId, chapterId, sectionId]);

  // Track playback speed changes
  const trackSpeedChange = useCallback((newSpeed: number, oldSpeed: number) => {
    const timestamp = Date.now();
    
    // Calculate duration at previous speed
    const lastSpeedEntry = speedHistory.current[speedHistory.current.length - 1];
    if (lastSpeedEntry) {
      lastSpeedEntry.duration = timestamp - lastSpeedEntry.timestamp;
    }

    speedHistory.current.push({
      speed: newSpeed,
      timestamp,
      duration: 0
    });

    // Calculate average playback speed
    const totalDuration = speedHistory.current.reduce((sum, entry) => sum + entry.duration, 0);
    const weightedSpeed = speedHistory.current.reduce(
      (sum, entry) => sum + (entry.speed * entry.duration), 0
    );
    const avgSpeed = totalDuration > 0 ? weightedSpeed / totalDuration : newSpeed;

    setMetrics(prev => ({
      ...prev,
      averagePlaybackSpeed: avgSpeed
    }));

    if (trackSpeed) {
      tracker.track({
        eventType: 'video',
        eventName: 'video_speed_change',
        properties: {
          videoId,
          newSpeed,
          oldSpeed,
          currentTime: videoElement?.currentTime || 0,
          averageSpeed: avgSpeed,
          pathname
        },
        courseId,
        chapterId,
        sectionId
      });
    }
  }, [videoElement, videoId, trackSpeed, tracker, pathname, courseId, chapterId, sectionId]);

  // Track quality changes
  const trackQualityChange = useCallback((newQuality: string, oldQuality: string) => {
    setMetrics(prev => ({
      ...prev,
      qualityChanges: prev.qualityChanges + 1
    }));

    if (trackQuality) {
      tracker.track({
        eventType: 'video',
        eventName: 'video_quality_change',
        properties: {
          videoId,
          newQuality,
          oldQuality,
          currentTime: videoElement?.currentTime || 0,
          totalQualityChanges: metrics.qualityChanges + 1,
          pathname
        },
        courseId,
        chapterId,
        sectionId
      });
    }
  }, [videoElement, videoId, metrics.qualityChanges, trackQuality, tracker, pathname, courseId, chapterId, sectionId]);

  // Heartbeat tracking for progress
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // Clear any existing heartbeat

    heartbeatTimer.current = setInterval(() => {
      if (!videoElement || videoElement.paused) return;

      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      
      // Mark segments as watched
      const segmentIndex = Math.floor(currentTime / 10); // 10-second segments
      watchedSegments.current.add(segmentIndex);

      // Calculate metrics
      const completionRate = duration > 0 ? (currentTime / duration) * 100 : 0;
      const watchTime = Array.from(watchedSegments.current).length * 10;

      setMetrics(prev => ({
        ...prev,
        watchTime,
        completionRate
      }));

      // Send heartbeat every minute or at significant milestones
      const shouldSendHeartbeat = 
        Date.now() - lastHeartbeat.current > 60000 || // Every minute
        currentTime % 300 < heartbeatInterval; // Every 5 minutes

      if (shouldSendHeartbeat) {
        lastHeartbeat.current = Date.now();
        
        tracker.track({
          eventType: 'video',
          eventName: 'video_progress',
          properties: {
            videoId,
            currentTime,
            duration,
            completionRate,
            watchTime,
            engagementScore: calculateEngagementScore(),
            pathname
          },
          courseId,
          chapterId,
          sectionId
        });
      }
    }, heartbeatInterval * 1000);
  }, [videoElement, videoId, heartbeatInterval, tracker, pathname, courseId, chapterId, sectionId, calculateEngagementScore, stopHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = undefined;
    }
  }, []);

  // Calculate engagement score
  const calculateEngagementScore = useCallback((): number => {
    if (!videoElement) return 0;

    const duration = videoElement.duration || 1;
    const currentTime = videoElement.currentTime;
    
    // Base score from completion rate
    let score = (currentTime / duration) * 40; // 40% weight for progress

    // Penalize excessive pausing
    const pauseRatio = metrics.totalPauses / (duration / 60); // Pauses per minute
    score -= Math.min(pauseRatio * 5, 20); // Max 20 point penalty

    // Penalize excessive seeking
    const seekRatio = metrics.totalSeeks / (duration / 60);
    score -= Math.min(seekRatio * 3, 15); // Max 15 point penalty

    // Bonus for consistent watching
    score += Math.min(metrics.maxConsecutiveWatchTime / 60 * 10, 20); // Max 20 point bonus

    // Speed factor
    const speedVariance = Math.abs(metrics.averagePlaybackSpeed - 1);
    score += Math.min((1 - speedVariance) * 10, 10); // Max 10 point bonus

    return Math.max(0, Math.min(100, score));
  }, [videoElement, metrics]);

  // Track video end
  const trackVideoEnd = useCallback(() => {
    if (!videoElement) return;

    const finalEngagementScore = calculateEngagementScore();
    const sessionDuration = sessionStartTime.current 
      ? Date.now() - sessionStartTime.current 
      : 0;

    setMetrics(prev => ({
      ...prev,
      engagementScore: finalEngagementScore
    }));

    tracker.track({
      eventType: 'video',
      eventName: 'video_complete',
      properties: {
        videoId,
        finalTime: videoElement.currentTime,
        duration: videoElement.duration,
        watchTime: metrics.watchTime,
        completionRate: metrics.completionRate,
        engagementScore: finalEngagementScore,
        sessionDuration,
        totalPauses: metrics.totalPauses,
        totalSeeks: metrics.totalSeeks,
        strugglingSegments: metrics.strugglingSegments,
        rewatchedSegments: metrics.rewatchedSegments,
        averagePlaybackSpeed: metrics.averagePlaybackSpeed,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });

    stopHeartbeat();
  }, [videoElement, videoId, calculateEngagementScore, metrics, tracker, pathname, courseId, chapterId, sectionId, stopHeartbeat]);

  // Set up event listeners
  useEffect(() => {
    if (!videoElement) return;

    let lastSeekTime = videoElement.currentTime;
    let lastPlaybackRate = videoElement.playbackRate;

    const handleLoadedMetadata = () => trackSessionStart();
    const handlePlay = () => trackPlay();
    const handlePause = () => trackPause();
    const handleEnded = () => trackVideoEnd();
    
    const handleSeeking = () => {
      const currentTime = videoElement.currentTime;
      if (Math.abs(currentTime - lastSeekTime) > 1) {
        trackSeek(lastSeekTime, currentTime);
      }
      lastSeekTime = currentTime;
    };

    const handleRateChange = () => {
      const newRate = videoElement.playbackRate;
      if (newRate !== lastPlaybackRate) {
        trackSpeedChange(newRate, lastPlaybackRate);
        lastPlaybackRate = newRate;
      }
    };

    // Add event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('seeking', handleSeeking);
    videoElement.addEventListener('ratechange', handleRateChange);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('seeking', handleSeeking);
      videoElement.removeEventListener('ratechange', handleRateChange);
      
      stopHeartbeat();
    };
  }, [
    videoElement,
    trackSessionStart,
    trackPlay,
    trackPause,
    trackVideoEnd,
    trackSeek,
    trackSpeedChange,
    stopHeartbeat
  ]);

  // Manual tracking functions
  const trackCustomEvent = useCallback((eventName: string, properties: any = {}) => {
    tracker.track({
      eventType: 'video',
      eventName: `video_${eventName}`,
      properties: {
        videoId,
        currentTime: videoElement?.currentTime || 0,
        ...properties,
        pathname
      },
      courseId,
      chapterId,
      sectionId
    });
  }, [tracker, videoId, videoElement, pathname, courseId, chapterId, sectionId]);

  const trackInteraction = useCallback((interactionType: string, data?: any) => {
    trackCustomEvent('interaction', {
      interactionType,
      ...data
    });
  }, [trackCustomEvent]);

  return {
    metrics,
    trackCustomEvent,
    trackInteraction,
    trackQualityChange,
    calculateEngagementScore: () => {
      const score = calculateEngagementScore();
      setMetrics(prev => ({ ...prev, engagementScore: score }));
      return score;
    }
  };
}

// Hook for video player controls tracking
export function useVideoControlsTracking(
  videoId: string,
  courseId?: string,
  sectionId?: string
) {
  const tracker = useEventTracker();
  const pathname = usePathname();

  const trackControlClick = useCallback((
    control: 'play' | 'pause' | 'mute' | 'fullscreen' | 'volume' | 'speed' | 'quality' | 'subtitle',
    data?: any
  ) => {
    tracker.track({
      eventType: 'video',
      eventName: 'video_control_click',
      properties: {
        videoId,
        control,
        ...data,
        pathname
      },
      courseId,
      sectionId
    });
  }, [tracker, videoId, courseId, sectionId, pathname]);

  const trackVolumeChange = useCallback((newVolume: number, oldVolume: number) => {
    trackControlClick('volume', {
      newVolume,
      oldVolume,
      volumeChange: newVolume - oldVolume
    });
  }, [trackControlClick]);

  const trackFullscreenToggle = useCallback((isFullscreen: boolean) => {
    trackControlClick('fullscreen', {
      isFullscreen,
      action: isFullscreen ? 'enter' : 'exit'
    });
  }, [trackControlClick]);

  const trackSubtitleToggle = useCallback((enabled: boolean, language?: string) => {
    trackControlClick('subtitle', {
      enabled,
      language
    });
  }, [trackControlClick]);

  return {
    trackControlClick,
    trackVolumeChange,
    trackFullscreenToggle,
    trackSubtitleToggle
  };
}