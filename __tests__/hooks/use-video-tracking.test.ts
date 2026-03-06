/**
 * Tests for useVideoTracking and useVideoControlsTracking hooks
 * Source: hooks/use-video-tracking.ts
 */

import { renderHook, act } from '@testing-library/react';

// --- Mocks ---

const mockTrack = jest.fn();

jest.mock('@/lib/analytics/analytics-provider', () => ({
  useEventTracker: () => ({ track: mockTrack }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test/path',
}));

// --- Helpers ---

interface MockVideoElement extends HTMLVideoElement {
  __trigger: (event: string) => void;
  __listeners: Record<string, Function[]>;
}

function createMockVideoElement(
  overrides: Partial<HTMLVideoElement> = {}
): MockVideoElement {
  const listeners: Record<string, Function[]> = {};
  return {
    currentTime: 0,
    duration: 100,
    paused: false,
    playbackRate: 1,
    volume: 0.8,
    autoplay: false,
    addEventListener: jest.fn((event: string, handler: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    }),
    removeEventListener: jest.fn((event: string, handler: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    __listeners: listeners,
    __trigger: (event: string) => {
      (listeners[event] || []).forEach((h) => h());
    },
    ...overrides,
  } as unknown as MockVideoElement;
}

const DEFAULT_OPTIONS = {
  videoId: 'video-1',
  videoTitle: 'Test Video',
  courseId: 'course-1',
  chapterId: 'chapter-1',
  sectionId: 'section-1',
};

// Import hooks after mocks are established
import {
  useVideoTracking,
  useVideoControlsTracking,
} from '@/hooks/use-video-tracking';

// --- Test Suites ---

describe('useVideoTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- Return value ----

  describe('return value', () => {
    it('returns metrics object', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(result.current.metrics).toBeDefined();
      expect(typeof result.current.metrics).toBe('object');
    });

    it('returns trackCustomEvent function', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(typeof result.current.trackCustomEvent).toBe('function');
    });

    it('returns trackInteraction function', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(typeof result.current.trackInteraction).toBe('function');
    });

    it('returns trackQualityChange function', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(typeof result.current.trackQualityChange).toBe('function');
    });

    it('returns calculateEngagementScore function', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(typeof result.current.calculateEngagementScore).toBe('function');
    });
  });

  // ---- Initial metrics ----

  describe('initial metrics', () => {
    it('initializes all numeric metrics to zero or default', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      const { metrics } = result.current;
      expect(metrics.watchTime).toBe(0);
      expect(metrics.totalPauses).toBe(0);
      expect(metrics.totalSeeks).toBe(0);
      expect(metrics.engagementScore).toBe(0);
      expect(metrics.completionRate).toBe(0);
      expect(metrics.averagePlaybackSpeed).toBe(1);
      expect(metrics.qualityChanges).toBe(0);
      expect(metrics.maxConsecutiveWatchTime).toBe(0);
    });

    it('initializes array metrics to empty arrays', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      expect(result.current.metrics.strugglingSegments).toEqual([]);
      expect(result.current.metrics.rewatchedSegments).toEqual([]);
    });
  });

  // ---- Event listeners ----

  describe('event listeners', () => {
    it('registers event listeners on mount', () => {
      const video = createMockVideoElement();
      renderHook(() => useVideoTracking(video, DEFAULT_OPTIONS));

      const expectedEvents = [
        'loadedmetadata',
        'play',
        'pause',
        'ended',
        'seeking',
        'ratechange',
      ];

      expectedEvents.forEach((event) => {
        expect(video.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });

    it('removes event listeners on unmount', () => {
      const video = createMockVideoElement();
      const { unmount } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      unmount();

      const expectedEvents = [
        'loadedmetadata',
        'play',
        'pause',
        'ended',
        'seeking',
        'ratechange',
      ];

      expectedEvents.forEach((event) => {
        expect(video.removeEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });
    });

    it('tracks video_play event when play is triggered', () => {
      const video = createMockVideoElement({ currentTime: 10, duration: 100 });
      renderHook(() => useVideoTracking(video, DEFAULT_OPTIONS));

      act(() => {
        video.__trigger('play');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_play',
          properties: expect.objectContaining({
            videoId: 'video-1',
            currentTime: 10,
            duration: 100,
            pathname: '/test/path',
          }),
          courseId: 'course-1',
          chapterId: 'chapter-1',
          sectionId: 'section-1',
        })
      );
    });

    it('tracks video_pause event and increments pause count', () => {
      const video = createMockVideoElement({ currentTime: 25, duration: 100 });
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      act(() => {
        video.__trigger('pause');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_pause',
          properties: expect.objectContaining({
            videoId: 'video-1',
            currentTime: 25,
          }),
        })
      );

      expect(result.current.metrics.totalPauses).toBe(1);
    });

    it('tracks video_session_start on loadedmetadata', () => {
      const video = createMockVideoElement({
        duration: 200,
        currentTime: 0,
        autoplay: false,
      });
      renderHook(() =>
        useVideoTracking(video, {
          ...DEFAULT_OPTIONS,
          videoTitle: 'My Video',
        })
      );

      act(() => {
        video.__trigger('loadedmetadata');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_session_start',
          properties: expect.objectContaining({
            videoId: 'video-1',
            videoTitle: 'My Video',
            duration: 200,
            initialPosition: 0,
            autoplay: false,
            pathname: '/test/path',
          }),
        })
      );
    });

    it('tracks video_complete on ended event', () => {
      const video = createMockVideoElement({
        currentTime: 100,
        duration: 100,
      });
      renderHook(() => useVideoTracking(video, DEFAULT_OPTIONS));

      act(() => {
        video.__trigger('ended');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_complete',
          properties: expect.objectContaining({
            videoId: 'video-1',
            finalTime: 100,
            duration: 100,
          }),
        })
      );
    });
  });

  // ---- Null video element ----

  describe('null video element', () => {
    it('handles null video element gracefully on mount', () => {
      expect(() => {
        renderHook(() => useVideoTracking(null, DEFAULT_OPTIONS));
      }).not.toThrow();
    });

    it('returns default metrics when video element is null', () => {
      const { result } = renderHook(() =>
        useVideoTracking(null, DEFAULT_OPTIONS)
      );

      expect(result.current.metrics.watchTime).toBe(0);
      expect(result.current.metrics.totalPauses).toBe(0);
    });

    it('calculateEngagementScore returns 0 when video element is null', () => {
      const { result } = renderHook(() =>
        useVideoTracking(null, DEFAULT_OPTIONS)
      );

      let score: number = 0;
      act(() => {
        score = result.current.calculateEngagementScore();
      });

      expect(score).toBe(0);
    });

    it('trackCustomEvent still calls tracker with fallback currentTime of 0', () => {
      const { result } = renderHook(() =>
        useVideoTracking(null, DEFAULT_OPTIONS)
      );

      act(() => {
        result.current.trackCustomEvent('test_event', { extra: 'data' });
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_test_event',
          properties: expect.objectContaining({
            videoId: 'video-1',
            currentTime: 0,
            extra: 'data',
            pathname: '/test/path',
          }),
        })
      );
    });
  });

  // ---- trackCustomEvent ----

  describe('trackCustomEvent', () => {
    it('prepends video_ to the event name', () => {
      const video = createMockVideoElement({ currentTime: 5 });
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      act(() => {
        result.current.trackCustomEvent('buffer_start');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'video_buffer_start',
        })
      );
    });
  });

  // ---- trackInteraction ----

  describe('trackInteraction', () => {
    it('tracks interaction with interactionType in properties', () => {
      const video = createMockVideoElement({ currentTime: 30 });
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      act(() => {
        result.current.trackInteraction('note_added', { noteId: 'n1' });
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'video_interaction',
          properties: expect.objectContaining({
            interactionType: 'note_added',
            noteId: 'n1',
          }),
        })
      );
    });
  });

  // ---- trackQualityChange ----

  describe('trackQualityChange', () => {
    it('increments qualityChanges metric', () => {
      const video = createMockVideoElement();
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      act(() => {
        result.current.trackQualityChange('1080p', '720p');
      });

      expect(result.current.metrics.qualityChanges).toBe(1);
    });

    it('calls tracker with quality data when trackQuality is enabled', () => {
      const video = createMockVideoElement({ currentTime: 15 });
      const { result } = renderHook(() =>
        useVideoTracking(video, {
          ...DEFAULT_OPTIONS,
          trackQuality: true,
        })
      );

      act(() => {
        result.current.trackQualityChange('1080p', '720p');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_quality_change',
          properties: expect.objectContaining({
            videoId: 'video-1',
            newQuality: '1080p',
            oldQuality: '720p',
            currentTime: 15,
            totalQualityChanges: 1,
          }),
        })
      );
    });
  });

  // ---- calculateEngagementScore ----

  describe('calculateEngagementScore', () => {
    it('returns a number between 0 and 100', () => {
      const video = createMockVideoElement({
        currentTime: 50,
        duration: 100,
      });
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      let score: number = 0;
      act(() => {
        score = result.current.calculateEngagementScore();
      });

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('updates the engagementScore metric when called', () => {
      const video = createMockVideoElement({
        currentTime: 50,
        duration: 100,
      });
      const { result } = renderHook(() =>
        useVideoTracking(video, DEFAULT_OPTIONS)
      );

      act(() => {
        result.current.calculateEngagementScore();
      });

      expect(result.current.metrics.engagementScore).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// useVideoControlsTracking
// ============================================================

describe('useVideoControlsTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Return value ----

  describe('return value', () => {
    it('returns trackControlClick function', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1', 'course-1', 'section-1')
      );

      expect(typeof result.current.trackControlClick).toBe('function');
    });

    it('returns trackVolumeChange function', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      expect(typeof result.current.trackVolumeChange).toBe('function');
    });

    it('returns trackFullscreenToggle function', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      expect(typeof result.current.trackFullscreenToggle).toBe('function');
    });

    it('returns trackSubtitleToggle function', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      expect(typeof result.current.trackSubtitleToggle).toBe('function');
    });
  });

  // ---- trackControlClick ----

  describe('trackControlClick', () => {
    it('calls tracker.track with video_control_click event', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1', 'course-1', 'section-1')
      );

      act(() => {
        result.current.trackControlClick('play');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_control_click',
          properties: expect.objectContaining({
            videoId: 'vid-1',
            control: 'play',
            pathname: '/test/path',
          }),
          courseId: 'course-1',
          sectionId: 'section-1',
        })
      );
    });

    it('passes additional data into properties', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackControlClick('mute', { previousVolume: 0.5 });
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            control: 'mute',
            previousVolume: 0.5,
          }),
        })
      );
    });

    it('works without optional courseId and sectionId', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-2')
      );

      act(() => {
        result.current.trackControlClick('pause');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_control_click',
          properties: expect.objectContaining({
            videoId: 'vid-2',
            control: 'pause',
          }),
          courseId: undefined,
          sectionId: undefined,
        })
      );
    });
  });

  // ---- trackVolumeChange ----

  describe('trackVolumeChange', () => {
    it('passes volume data to tracker', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1', 'course-1')
      );

      act(() => {
        result.current.trackVolumeChange(0.9, 0.5);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'video',
          eventName: 'video_control_click',
          properties: expect.objectContaining({
            videoId: 'vid-1',
            control: 'volume',
            newVolume: 0.9,
            oldVolume: 0.5,
            volumeChange: 0.4,
          }),
        })
      );
    });

    it('calculates negative volumeChange when volume decreases', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackVolumeChange(0.2, 0.8);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            newVolume: 0.2,
            oldVolume: 0.8,
            volumeChange: expect.closeTo(-0.6, 5),
          }),
        })
      );
    });
  });

  // ---- trackFullscreenToggle ----

  describe('trackFullscreenToggle', () => {
    it('passes isFullscreen=true and action=enter', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackFullscreenToggle(true);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            control: 'fullscreen',
            isFullscreen: true,
            action: 'enter',
          }),
        })
      );
    });

    it('passes isFullscreen=false and action=exit', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackFullscreenToggle(false);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            control: 'fullscreen',
            isFullscreen: false,
            action: 'exit',
          }),
        })
      );
    });
  });

  // ---- trackSubtitleToggle ----

  describe('trackSubtitleToggle', () => {
    it('passes enabled state and language', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackSubtitleToggle(true, 'en');
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            control: 'subtitle',
            enabled: true,
            language: 'en',
          }),
        })
      );
    });

    it('works without language parameter', () => {
      const { result } = renderHook(() =>
        useVideoControlsTracking('vid-1')
      );

      act(() => {
        result.current.trackSubtitleToggle(false);
      });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            control: 'subtitle',
            enabled: false,
            language: undefined,
          }),
        })
      );
    });
  });
});
