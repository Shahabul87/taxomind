import { useCallback, useState } from 'react';
import type { SelfCritiqueData, ChatMessage } from '../types';

interface UseSelfCritiqueOptions {
  userId?: string;
}

interface UseSelfCritiqueReturn {
  selfCritiqueData: SelfCritiqueData | null;
  showSelfCritique: boolean;
  isLoadingSelfCritique: boolean;
  fetchSelfCritique: (messageContent: string, messages: ChatMessage[]) => Promise<void>;
  dismissSelfCritique: () => void;
}

export function useSelfCritique(options: UseSelfCritiqueOptions = {}): UseSelfCritiqueReturn {
  const { userId } = options;

  const [selfCritiqueData, setSelfCritiqueData] = useState<SelfCritiqueData | null>(null);
  const [showSelfCritique, setShowSelfCritique] = useState(false);
  const [isLoadingSelfCritique, setIsLoadingSelfCritique] = useState(false);

  const fetchSelfCritique = useCallback(
    async (messageContent: string, messages: ChatMessage[]) => {
      if (!userId) return;

      setIsLoadingSelfCritique(true);
      try {
        const lastMessage = messages[messages.length - 1];
        const response = await fetch('/api/sam/agentic/self-critique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId: lastMessage?.id || 'current',
            responseText: messageContent,
            responseType: 'explanation',
            critiqueMode: 'standard',
            runLoop: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.critique) {
            setSelfCritiqueData({
              overallConfidence: data.data.critique.overallScore / 100,
              dimensions:
                data.data.critique.dimensionScores?.map(
                  (d: {
                    dimension: string;
                    score: number;
                    feedback: string;
                  }) => ({
                    name: d.dimension,
                    score: d.score / 100,
                    description: d.feedback,
                    category: d.dimension.toLowerCase() as
                      | 'knowledge'
                      | 'reasoning'
                      | 'relevance'
                      | 'clarity'
                      | 'accuracy',
                  })
                ) || [],
              strengths: data.data.critique.strengths || [],
              weaknesses: data.data.critique.improvements || [],
              uncertainties: data.data.critique.uncertainties || [],
              suggestions: data.data.critique.suggestions || [],
              generatedAt: new Date().toISOString(),
            });
            setShowSelfCritique(true);
          }
        }
      } catch (err) {
        console.error('[SAM] Failed to fetch self-critique:', err);
      } finally {
        setIsLoadingSelfCritique(false);
      }
    },
    [userId]
  );

  const dismissSelfCritique = useCallback(() => {
    setShowSelfCritique(false);
    setSelfCritiqueData(null);
  }, []);

  return {
    selfCritiqueData,
    showSelfCritique,
    isLoadingSelfCritique,
    fetchSelfCritique,
    dismissSelfCritique,
  };
}
