/**
 * @sam-ai/react - useSAMAdaptiveContent Hook
 * React hook for adaptive content personalization
 */
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
const CACHE_KEY_PREFIX = 'sam-adaptive-profile-';
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * Hook for SAM AI Adaptive Content
 *
 * @example
 * ```tsx
 * function LearningComponent() {
 *   const {
 *     learnerProfile,
 *     adaptedContent,
 *     isAdapting,
 *     adaptContent,
 *     detectStyle,
 *     getStyleTips
 *   } = useSAMAdaptiveContent({
 *     userId: user.id,
 *     autoDetectStyle: true,
 *     onStyleDetected: (result) => {
 *       console.log('Learning style:', result.primaryStyle);
 *     }
 *   });
 *
 *   const handleAdapt = async () => {
 *     await adaptContent({
 *       id: 'lesson-1',
 *       type: 'lesson',
 *       content: lessonContent,
 *       topic: 'React Hooks',
 *       currentFormat: 'text',
 *       concepts: ['useState', 'useEffect'],
 *       prerequisites: ['JavaScript basics']
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {learnerProfile && (
 *         <p>Your learning style: {learnerProfile.primaryStyle}</p>
 *       )}
 *       {adaptedContent && (
 *         <div>
 *           {adaptedContent.chunks.map(chunk => (
 *             <div key={chunk.id}>{chunk.content}</div>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAMAdaptiveContent(options = {}) {
    const { apiEndpoint = '/api/sam/adaptive-content', userId, courseId, autoDetectStyle = true, profileCacheDuration = DEFAULT_CACHE_DURATION, onStyleDetected, onContentAdapted, } = options;
    const [learnerProfile, setLearnerProfile] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isAdapting, setIsAdapting] = useState(false);
    const [adaptedContent, setAdaptedContent] = useState(null);
    const [styleDetection, setStyleDetection] = useState(null);
    const [error, setError] = useState(null);
    const cacheKey = userId ? `${CACHE_KEY_PREFIX}${userId}` : null;
    const hasTriedAutoDetect = useRef(false);
    /**
     * Load cached profile on mount
     */
    useEffect(() => {
        if (!cacheKey)
            return;
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { profile, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                if (age < profileCacheDuration) {
                    setLearnerProfile(profile);
                }
                else {
                    localStorage.removeItem(cacheKey);
                }
            }
        }
        catch (err) {
            console.error('Error loading cached profile:', err);
        }
    }, [cacheKey, profileCacheDuration]);
    /**
     * Get or create learner profile
     */
    const getProfile = useCallback(async () => {
        if (!userId) {
            setError('User ID is required');
            return null;
        }
        setIsLoadingProfile(true);
        setError(null);
        try {
            const response = await fetch(`${apiEndpoint}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId }),
            });
            if (!response.ok) {
                throw new Error(`Failed to get profile: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.data) {
                const profile = data.data;
                setLearnerProfile(profile);
                // Cache the profile
                if (cacheKey) {
                    localStorage.setItem(cacheKey, JSON.stringify({ profile, timestamp: Date.now() }));
                }
                return profile;
            }
            throw new Error(data.error?.message || 'Failed to get profile');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsLoadingProfile(false);
        }
    }, [apiEndpoint, userId, courseId, cacheKey]);
    /**
     * Detect learning style from interactions
     */
    const detectStyle = useCallback(async () => {
        if (!userId) {
            setError('User ID is required');
            return null;
        }
        setIsLoadingProfile(true);
        setError(null);
        try {
            const response = await fetch(`${apiEndpoint}/detect-style`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId }),
            });
            if (!response.ok) {
                throw new Error(`Style detection failed: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.data) {
                const result = data.data;
                setStyleDetection(result);
                onStyleDetected?.(result);
                // Update profile with detected style
                if (data.profile) {
                    setLearnerProfile(data.profile);
                    if (cacheKey) {
                        localStorage.setItem(cacheKey, JSON.stringify({ profile: data.profile, timestamp: Date.now() }));
                    }
                }
                return result;
            }
            throw new Error(data.error?.message || 'Style detection failed');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsLoadingProfile(false);
        }
    }, [apiEndpoint, userId, courseId, cacheKey, onStyleDetected]);
    /**
     * Auto-detect learning style
     */
    useEffect(() => {
        if (!userId || !autoDetectStyle || hasTriedAutoDetect.current || learnerProfile)
            return;
        hasTriedAutoDetect.current = true;
        detectStyle();
    }, [userId, autoDetectStyle, learnerProfile, detectStyle]);
    /**
     * Adapt content for the user
     */
    const adaptContent = useCallback(async (content, adaptOptions) => {
        setIsAdapting(true);
        setError(null);
        try {
            // Ensure we have a profile
            let profile = learnerProfile;
            if (!profile) {
                profile = await getProfile();
            }
            const response = await fetch(`${apiEndpoint}/adapt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    profile,
                    options: adaptOptions,
                    userId,
                    courseId,
                }),
            });
            if (!response.ok) {
                throw new Error(`Content adaptation failed: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.data) {
                const adapted = data.data;
                setAdaptedContent(adapted);
                onContentAdapted?.(adapted);
                return adapted;
            }
            throw new Error(data.error?.message || 'Content adaptation failed');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsAdapting(false);
        }
    }, [apiEndpoint, userId, courseId, learnerProfile, getProfile, onContentAdapted]);
    /**
     * Record a content interaction
     */
    const recordInteraction = useCallback(async (interaction) => {
        if (!userId)
            return;
        try {
            await fetch(`${apiEndpoint}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...interaction,
                    userId,
                    timestamp: new Date().toISOString(),
                }),
            });
        }
        catch (err) {
            console.error('Failed to record interaction:', err);
        }
    }, [apiEndpoint, userId]);
    /**
     * Get content recommendations
     */
    const getRecommendations = useCallback(async (topic, count = 5) => {
        if (!learnerProfile)
            return [];
        try {
            const response = await fetch(`${apiEndpoint}/recommendations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    topic,
                    count,
                    style: learnerProfile.primaryStyle,
                }),
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.success ? data.data : [];
        }
        catch {
            return [];
        }
    }, [apiEndpoint, userId, learnerProfile]);
    /**
     * Get style-specific tips
     */
    const getStyleTips = useCallback(() => {
        const style = learnerProfile?.primaryStyle || 'multimodal';
        const tips = {
            visual: [
                'Focus on diagrams, charts, and visual representations',
                'Use color coding in your notes',
                'Create mind maps to connect concepts',
                'Watch video demonstrations before reading text',
                'Draw flowcharts for processes',
            ],
            auditory: [
                'Listen to explanations and discussions',
                'Read content aloud to yourself',
                'Join study groups for verbal exchange',
                'Use text-to-speech for reading materials',
                'Record yourself explaining concepts',
            ],
            reading: [
                'Read detailed documentation and articles',
                'Take comprehensive written notes',
                'Create written summaries in your own words',
                'Use highlighted text and annotations',
                'Write practice questions for yourself',
            ],
            kinesthetic: [
                'Practice with hands-on exercises immediately',
                'Build projects to apply concepts',
                'Take breaks and move while studying',
                'Use interactive simulations',
                'Teach concepts to others through demonstration',
            ],
            multimodal: [
                'Combine multiple learning methods',
                'Switch between videos, text, and practice',
                'Find what works best for each topic',
                'Use variety to maintain engagement',
                'Adapt your approach based on content type',
            ],
        };
        return tips[style];
    }, [learnerProfile]);
    /**
     * Update profile manually
     */
    const updateProfile = useCallback(async (updates) => {
        if (!userId || !learnerProfile)
            return;
        try {
            const response = await fetch(`${apiEndpoint}/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setLearnerProfile(data.data);
                    if (cacheKey) {
                        localStorage.setItem(cacheKey, JSON.stringify({ profile: data.data, timestamp: Date.now() }));
                    }
                }
            }
        }
        catch (err) {
            console.error('Failed to update profile:', err);
        }
    }, [apiEndpoint, userId, learnerProfile, cacheKey]);
    /**
     * Clear cached profile
     */
    const clearProfile = useCallback(() => {
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
        }
        setLearnerProfile(null);
        setStyleDetection(null);
        hasTriedAutoDetect.current = false;
    }, [cacheKey]);
    return {
        learnerProfile,
        isLoadingProfile,
        isAdapting,
        adaptedContent,
        styleDetection,
        error,
        isStyleDetected: styleDetection !== null || (learnerProfile?.confidence ?? 0) > 0.5,
        getProfile,
        detectStyle,
        adaptContent,
        recordInteraction,
        getRecommendations,
        getStyleTips,
        updateProfile,
        clearProfile,
    };
}
export default useSAMAdaptiveContent;
