/**
 * @sam-ai/react - useSAMAdaptiveContent Hook
 * React hook for adaptive content personalization
 */
import type { AdaptiveLearnerProfile, AdaptedContent, ContentToAdapt, AdaptationOptions, StyleDetectionResult, ContentInteractionData, SupplementaryResource } from '@sam-ai/educational';
/**
 * Options for the adaptive content hook
 */
export interface UseSAMAdaptiveContentOptions {
    /** API endpoint for adaptive content */
    apiEndpoint?: string;
    /** User ID for personalization */
    userId?: string;
    /** Course ID for context */
    courseId?: string;
    /** Auto-detect learning style */
    autoDetectStyle?: boolean;
    /** Cache duration for profile in milliseconds */
    profileCacheDuration?: number;
    /** Callback when learning style is detected */
    onStyleDetected?: (result: StyleDetectionResult) => void;
    /** Callback when content is adapted */
    onContentAdapted?: (content: AdaptedContent) => void;
}
/**
 * Return type for the adaptive content hook
 */
export interface UseSAMAdaptiveContentReturn {
    /** User's learning profile */
    learnerProfile: AdaptiveLearnerProfile | null;
    /** Whether profile is being loaded */
    isLoadingProfile: boolean;
    /** Whether content is being adapted */
    isAdapting: boolean;
    /** Last adapted content */
    adaptedContent: AdaptedContent | null;
    /** Style detection result */
    styleDetection: StyleDetectionResult | null;
    /** Error message if any */
    error: string | null;
    /** Whether learning style has been detected */
    isStyleDetected: boolean;
    /** Get or create learner profile */
    getProfile: () => Promise<AdaptiveLearnerProfile | null>;
    /** Detect learning style from interactions */
    detectStyle: () => Promise<StyleDetectionResult | null>;
    /** Adapt content for the user */
    adaptContent: (content: ContentToAdapt, options?: AdaptationOptions) => Promise<AdaptedContent | null>;
    /** Record a content interaction */
    recordInteraction: (interaction: Omit<ContentInteractionData, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
    /** Get content recommendations */
    getRecommendations: (topic: string, count?: number) => Promise<SupplementaryResource[]>;
    /** Get style-specific tips */
    getStyleTips: () => string[];
    /** Update profile manually */
    updateProfile: (updates: Partial<AdaptiveLearnerProfile>) => Promise<void>;
    /** Clear cached profile */
    clearProfile: () => void;
}
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
export declare function useSAMAdaptiveContent(options?: UseSAMAdaptiveContentOptions): UseSAMAdaptiveContentReturn;
export default useSAMAdaptiveContent;
//# sourceMappingURL=useSAMAdaptiveContent.d.ts.map