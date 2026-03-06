/**
 * Tests for useEmotionDetection hook and getEmotionSupportMessage utility
 *
 * Covers:
 * - Pure function getEmotionSupportMessage: all emotion types mapped to correct messages
 * - Hook initial state
 * - detectEmotion: successful API calls, failed calls, missing userId guard
 * - recordInteraction: tracking interactions, scroll tracking, pruning old entries
 * - getInteractionPatterns: returns InteractionPattern with expected fields
 * - Callbacks: onNegativeEmotion for frustrated/confused/overwhelmed,
 *              onDisengagement for bored/neutral with high confidence
 * - resetTracking and dismissNotification
 * - Auto-detect timers: setup when autoDetect=true, cleanup on unmount
 */

import { renderHook, act } from '@testing-library/react';
import {
  type EmotionType,
  type EmotionState,
  getEmotionSupportMessage,
  useEmotionDetection,
} from '@/hooks/use-emotion-detection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a successful fetch response for emotion detection */
function mockSuccessResponse(overrides: {
  emotion?: EmotionType;
  confidence?: number;
  recommendation?: string;
  suggestedAction?: { type: string; message: string; priority: string };
} = {}): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          emotion: overrides.emotion ?? 'engaged',
          confidence: overrides.confidence ?? 0.8,
          recommendation: overrides.recommendation ?? 'Keep going!',
          suggestedAction: overrides.suggestedAction ?? {
            type: 'none',
            message: '',
            priority: 'low',
          },
        },
      }),
  });
}

/** Build a failed (non-ok) fetch response */
function mockFailedResponse(statusText = 'Internal Server Error'): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    statusText,
    json: () => Promise.resolve({}),
  });
}

/** Build a fetch rejection (network error) */
function mockNetworkError(message = 'Network failure'): void {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(message));
}

// ---------------------------------------------------------------------------
// 1. getEmotionSupportMessage (pure function)
// ---------------------------------------------------------------------------

describe('getEmotionSupportMessage', () => {
  it('returns correct message for "frustrated"', () => {
    const msg = getEmotionSupportMessage('frustrated');
    expect(msg).toContain('challenging');
    expect(msg).toContain('hints');
  });

  it('returns correct message for "confused"', () => {
    const msg = getEmotionSupportMessage('confused');
    expect(msg).toContain('tricky');
    expect(msg).toContain('break it down');
  });

  it('returns correct message for "overwhelmed"', () => {
    const msg = getEmotionSupportMessage('overwhelmed');
    expect(msg).toContain('a lot to take in');
    expect(msg).toContain('short break');
  });

  it('returns correct message for "bored"', () => {
    const msg = getEmotionSupportMessage('bored');
    expect(msg).toContain('challenge');
  });

  it('returns correct message for "engaged"', () => {
    const msg = getEmotionSupportMessage('engaged');
    expect(msg).toContain('Great focus');
  });

  it('returns correct message for "excited"', () => {
    const msg = getEmotionSupportMessage('excited');
    expect(msg).toContain('enthusiasm');
    expect(msg).toContain('awesome');
  });

  it('returns correct message for "focused"', () => {
    const msg = getEmotionSupportMessage('focused');
    expect(msg).toContain('in the zone');
  });

  it('returns default message for "neutral"', () => {
    const msg = getEmotionSupportMessage('neutral');
    expect(msg).toBe('How can I help you learn better?');
  });

  it('returns default message for unknown emotion type', () => {
    // TypeScript union protects against this at compile time, but the
    // default branch should handle it at runtime.
    const msg = getEmotionSupportMessage('unknown-emotion' as EmotionType);
    expect(msg).toBe('How can I help you learn better?');
  });

  it('returns a non-empty string for every known emotion type', () => {
    const emotions: EmotionType[] = [
      'frustrated',
      'confused',
      'overwhelmed',
      'bored',
      'engaged',
      'excited',
      'focused',
      'neutral',
    ];
    emotions.forEach((emotion) => {
      const msg = getEmotionSupportMessage(emotion);
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. useEmotionDetection hook
// ---------------------------------------------------------------------------

describe('useEmotionDetection', () => {
  // Spies for window event listeners
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 2a. Initial state
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    it('returns null emotionState', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );
      expect(result.current.emotionState).toBeNull();
    });

    it('returns isDetecting as false', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );
      expect(result.current.isDetecting).toBe(false);
    });

    it('returns error as null', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );
      expect(result.current.error).toBeNull();
    });

    it('returns showNotification as false', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );
      expect(result.current.showNotification).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2b. detectEmotion
  // -----------------------------------------------------------------------

  describe('detectEmotion', () => {
    it('sets emotion state on successful detection', async () => {
      mockSuccessResponse({ emotion: 'engaged', confidence: 0.85 });

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(result.current.emotionState).not.toBeNull();
      expect(result.current.emotionState?.currentEmotion).toBe('engaged');
      expect(result.current.emotionState?.confidence).toBe(0.85);
      expect(result.current.error).toBeNull();
      expect(result.current.isDetecting).toBe(false);
    });

    it('sets error and neutral state on failed response', async () => {
      mockFailedResponse('Bad Gateway');

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(result.current.error).toContain('Detection failed');
      expect(result.current.emotionState?.currentEmotion).toBe('neutral');
      expect(result.current.emotionState?.confidence).toBe(0.3);
    });

    it('sets error and neutral state on network error', async () => {
      mockNetworkError('Network failure');

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(result.current.error).toBe('Network failure');
      expect(result.current.emotionState?.currentEmotion).toBe('neutral');
    });

    it('returns early without calling fetch when userId is missing', async () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.emotionState).toBeNull();
    });

    it('sends correct body payload to the API', async () => {
      mockSuccessResponse();

      const { result } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          courseId: 'course-abc',
          sectionId: 'section-xyz',
          autoDetect: false,
        }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sam/ai-tutor/detect-emotion',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.userId).toBe('user-1');
      expect(callBody.courseId).toBe('course-abc');
      expect(callBody.sectionId).toBe('section-xyz');
      expect(callBody).toHaveProperty('sessionDuration');
      expect(callBody).toHaveProperty('interactionPatterns');
      expect(callBody).toHaveProperty('recentInteractions');
    });

    it('sets isDetecting to true during detection and false after', async () => {
      // Use a deferred promise to control timing
      let resolveResponse: (value: unknown) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveResponse = resolve;
        }),
      );

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      let detectPromise: Promise<void>;
      act(() => {
        detectPromise = result.current.detectEmotion();
      });

      // isDetecting should be true while the promise is pending
      expect(result.current.isDetecting).toBe(true);

      await act(async () => {
        resolveResponse!({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { emotion: 'neutral', confidence: 0.5 },
            }),
        });
        await detectPromise!;
      });

      expect(result.current.isDetecting).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2c. recordInteraction
  // -----------------------------------------------------------------------

  describe('recordInteraction', () => {
    it('records interactions that appear in interaction patterns', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      act(() => {
        result.current.recordInteraction('click', { tagName: 'BUTTON' });
        result.current.recordInteraction('click', { tagName: 'A' });
      });

      const patterns = result.current.getInteractionPatterns();
      // Two clicks within the 60s window should produce a non-zero clickFrequency
      expect(patterns.clickFrequency).toBeGreaterThan(0);
    });

    it('tracks scroll positions', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      act(() => {
        result.current.recordInteraction('scroll', { position: 0 });
        result.current.recordInteraction('scroll', { position: 100 });
        result.current.recordInteraction('scroll', { position: 50 });
      });

      const patterns = result.current.getInteractionPatterns();
      // Going from 100 to 50 is backtracking
      expect(patterns.backtrackCount).toBeGreaterThanOrEqual(1);
    });

    it('prunes interactions older than 5 minutes', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      act(() => {
        result.current.recordInteraction('click', { tagName: 'DIV' });
      });

      // Advance time beyond the 5-minute interaction window (INTERACTION_WINDOW * 5 = 300s)
      act(() => {
        jest.advanceTimersByTime(6 * 60 * 1000);
      });

      // Record a new interaction to trigger pruning
      act(() => {
        result.current.recordInteraction('click', { tagName: 'SPAN' });
      });

      // The old interaction should have been pruned. The pattern should
      // reflect only the recent click.
      const patterns = result.current.getInteractionPatterns();
      // clickFrequency is calculated from interactions within the last 60s
      // One click in the last minute: 1 / 60 = ~0.0167
      expect(patterns.clickFrequency).toBeCloseTo(1 / 60, 2);
    });
  });

  // -----------------------------------------------------------------------
  // 2d. getInteractionPatterns
  // -----------------------------------------------------------------------

  describe('getInteractionPatterns', () => {
    it('returns an InteractionPattern object with all expected fields', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      const patterns = result.current.getInteractionPatterns();

      expect(patterns).toHaveProperty('scrollSpeed');
      expect(patterns).toHaveProperty('pauseDuration');
      expect(patterns).toHaveProperty('clickFrequency');
      expect(patterns).toHaveProperty('backtrackCount');
      expect(patterns).toHaveProperty('timeOnSection');
      expect(patterns).toHaveProperty('videoSeekCount');
      expect(patterns).toHaveProperty('notesTaken');
    });

    it('returns zero scrollSpeed with no scroll data', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      const patterns = result.current.getInteractionPatterns();
      expect(patterns.scrollSpeed).toBe(0);
    });

    it('counts video seek interactions', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      act(() => {
        result.current.recordInteraction('video_seek');
        result.current.recordInteraction('video_seek');
      });

      const patterns = result.current.getInteractionPatterns();
      expect(patterns.videoSeekCount).toBe(2);
    });

    it('detects notesTaken when a note_taken interaction exists', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      act(() => {
        result.current.recordInteraction('note_taken');
      });

      const patterns = result.current.getInteractionPatterns();
      expect(patterns.notesTaken).toBe(true);
    });

    it('returns notesTaken as false when no notes recorded', () => {
      const { result } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      const patterns = result.current.getInteractionPatterns();
      expect(patterns.notesTaken).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 2e. Callbacks: onNegativeEmotion, onDisengagement
  // -----------------------------------------------------------------------

  describe('callbacks', () => {
    it.each<EmotionType>(['frustrated', 'confused', 'overwhelmed'])(
      'calls onNegativeEmotion for "%s" emotion',
      async (emotion) => {
        mockSuccessResponse({ emotion, confidence: 0.9 });
        const onNegativeEmotion = jest.fn();

        const { result } = renderHook(() =>
          useEmotionDetection({
            userId: 'user-1',
            autoDetect: false,
            onNegativeEmotion,
          }),
        );

        await act(async () => {
          await result.current.detectEmotion();
        });

        expect(onNegativeEmotion).toHaveBeenCalledTimes(1);
        expect(onNegativeEmotion).toHaveBeenCalledWith(
          expect.objectContaining({ currentEmotion: emotion }),
        );
        // Notification should also be shown for negative emotions
        expect(result.current.showNotification).toBe(true);
      },
    );

    it('does not call onNegativeEmotion for positive emotions', async () => {
      mockSuccessResponse({ emotion: 'engaged', confidence: 0.9 });
      const onNegativeEmotion = jest.fn();

      const { result } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: false,
          onNegativeEmotion,
        }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(onNegativeEmotion).not.toHaveBeenCalled();
      expect(result.current.showNotification).toBe(false);
    });

    it.each<EmotionType>(['bored', 'neutral'])(
      'calls onDisengagement for "%s" with confidence > 0.7',
      async (emotion) => {
        mockSuccessResponse({ emotion, confidence: 0.85 });
        const onDisengagement = jest.fn();

        const { result } = renderHook(() =>
          useEmotionDetection({
            userId: 'user-1',
            autoDetect: false,
            onDisengagement,
          }),
        );

        await act(async () => {
          await result.current.detectEmotion();
        });

        expect(onDisengagement).toHaveBeenCalledTimes(1);
        expect(onDisengagement).toHaveBeenCalledWith(
          expect.objectContaining({ currentEmotion: emotion }),
        );
      },
    );

    it('does not call onDisengagement when confidence is below 0.7', async () => {
      mockSuccessResponse({ emotion: 'bored', confidence: 0.5 });
      const onDisengagement = jest.fn();

      const { result } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: false,
          onDisengagement,
        }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(onDisengagement).not.toHaveBeenCalled();
    });

    it('does not call onDisengagement for engaged emotion even with high confidence', async () => {
      mockSuccessResponse({ emotion: 'engaged', confidence: 0.95 });
      const onDisengagement = jest.fn();

      const { result } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: false,
          onDisengagement,
        }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(onDisengagement).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 2f. resetTracking and dismissNotification
  // -----------------------------------------------------------------------

  describe('resetTracking and dismissNotification', () => {
    it('resets emotion state and notification on resetTracking', async () => {
      mockSuccessResponse({ emotion: 'frustrated', confidence: 0.9 });

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(result.current.emotionState).not.toBeNull();
      expect(result.current.showNotification).toBe(true);

      act(() => {
        result.current.resetTracking();
      });

      expect(result.current.emotionState).toBeNull();
      expect(result.current.showNotification).toBe(false);
    });

    it('dismisses notification without clearing emotion state', async () => {
      mockSuccessResponse({ emotion: 'confused', confidence: 0.9 });

      const { result } = renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      await act(async () => {
        await result.current.detectEmotion();
      });

      expect(result.current.showNotification).toBe(true);

      act(() => {
        result.current.dismissNotification();
      });

      expect(result.current.showNotification).toBe(false);
      // Emotion state should still be present
      expect(result.current.emotionState?.currentEmotion).toBe('confused');
    });
  });

  // -----------------------------------------------------------------------
  // 2g. Event listeners (scroll and click tracking)
  // -----------------------------------------------------------------------

  describe('event listeners', () => {
    it('registers scroll and click listeners on mount', () => {
      renderHook(() => useEmotionDetection({ autoDetect: false }));

      const scrollCalls = addEventListenerSpy.mock.calls.filter(
        (call: [string, ...unknown[]]) => call[0] === 'scroll',
      );
      const clickCalls = addEventListenerSpy.mock.calls.filter(
        (call: [string, ...unknown[]]) => call[0] === 'click',
      );

      expect(scrollCalls.length).toBeGreaterThanOrEqual(1);
      expect(clickCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('removes scroll and click listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useEmotionDetection({ autoDetect: false }),
      );

      unmount();

      const scrollCalls = removeEventListenerSpy.mock.calls.filter(
        (call: [string, ...unknown[]]) => call[0] === 'scroll',
      );
      const clickCalls = removeEventListenerSpy.mock.calls.filter(
        (call: [string, ...unknown[]]) => call[0] === 'click',
      );

      expect(scrollCalls.length).toBeGreaterThanOrEqual(1);
      expect(clickCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // 2h. Auto-detect timers
  // -----------------------------------------------------------------------

  describe('auto-detect timers', () => {
    it('sets up initial timer and interval when autoDetect is true and userId is provided', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: true,
          detectionInterval: 300000,
        }),
      );

      // The hook sets a 2-minute initial timeout
      const timeoutCalls = setTimeoutSpy.mock.calls.filter(
        (call) => call[1] === 2 * 60 * 1000,
      );
      expect(timeoutCalls.length).toBeGreaterThanOrEqual(1);

      // The hook sets an interval at the configured detectionInterval
      const intervalCalls = setIntervalSpy.mock.calls.filter(
        (call) => call[1] === 300000,
      );
      expect(intervalCalls.length).toBeGreaterThanOrEqual(1);

      setTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    it('does not set up timers when autoDetect is false', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      renderHook(() =>
        useEmotionDetection({ userId: 'user-1', autoDetect: false }),
      );

      // There should be no 2-minute timeout set by the hook
      const twoMinTimeouts = setTimeoutSpy.mock.calls.filter(
        (call) => call[1] === 2 * 60 * 1000,
      );
      expect(twoMinTimeouts).toHaveLength(0);

      setTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    it('does not set up timers when userId is missing', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      renderHook(() =>
        useEmotionDetection({ autoDetect: true }),
      );

      const twoMinTimeouts = setTimeoutSpy.mock.calls.filter(
        (call) => call[1] === 2 * 60 * 1000,
      );
      expect(twoMinTimeouts).toHaveLength(0);

      setTimeoutSpy.mockRestore();
    });

    it('clears timers on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: true,
          detectionInterval: 300000,
        }),
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });

    it('triggers detection after the initial 2-minute timeout fires', async () => {
      mockSuccessResponse({ emotion: 'focused', confidence: 0.7 });

      const { result } = renderHook(() =>
        useEmotionDetection({
          userId: 'user-1',
          autoDetect: true,
          detectionInterval: 300000,
        }),
      );

      // Advance past the 2-minute initial timer
      await act(async () => {
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      // Allow the async fetch to resolve
      await act(async () => {
        await Promise.resolve();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sam/ai-tutor/detect-emotion',
        expect.anything(),
      );
    });
  });

  // -----------------------------------------------------------------------
  // 2i. Section change reset
  // -----------------------------------------------------------------------

  describe('section change', () => {
    it('resets tracking data when sectionId changes', () => {
      const { result, rerender } = renderHook(
        ({ sectionId }: { sectionId: string }) =>
          useEmotionDetection({ autoDetect: false, sectionId }),
        { initialProps: { sectionId: 'section-1' } },
      );

      // Record some interactions
      act(() => {
        result.current.recordInteraction('click');
        result.current.recordInteraction('scroll', { position: 100 });
      });

      // Change section
      rerender({ sectionId: 'section-2' });

      // After section change, interaction patterns should be reset
      const patterns = result.current.getInteractionPatterns();
      expect(patterns.clickFrequency).toBe(0);
      expect(patterns.backtrackCount).toBe(0);
    });
  });
});
