import { useCallback, useEffect, useState } from 'react';
import type { ProactiveCheckIn, ProactiveIntervention } from '../types';
import type { CheckInResponse, CheckInAction } from '@/components/sam/CheckInModal';
import { type CheckInData, type CheckInQuestion, type CheckInAction as CheckInActionType, type CheckInType } from '@/components/sam/CheckInModal';
import {
  getSAMRealtimeClient,
  isWebSocketEnabled,
  type SAMWebSocketEvent,
  SAMEventType,
} from '@/lib/sam/realtime/client';

interface UseProactiveFeaturesOptions {
  userId?: string;
  isOpen: boolean;
}

interface UseProactiveFeaturesReturn {
  pendingCheckIns: ProactiveCheckIn[];
  pendingInterventions: ProactiveIntervention[];
  activeCheckIn: ProactiveCheckIn | null;
  showCheckInModal: boolean;
  openCheckIn: (checkIn: ProactiveCheckIn) => void;
  closeCheckInModal: () => void;
  handleCheckInSubmit: (response: CheckInResponse) => Promise<void>;
  handleCheckInDismiss: (checkInId: string) => Promise<void>;
  handleInterventionAction: (
    intervention: ProactiveIntervention,
    actionId: string
  ) => Promise<void>;
  handleDismissIntervention: (interventionId: string) => Promise<void>;
  convertToCheckInData: (checkIn: ProactiveCheckIn) => CheckInData;
}

export function useProactiveFeatures(
  options: UseProactiveFeaturesOptions
): UseProactiveFeaturesReturn {
  const { userId, isOpen } = options;

  const [pendingCheckIns, setPendingCheckIns] = useState<ProactiveCheckIn[]>([]);
  const [pendingInterventions, setPendingInterventions] = useState<ProactiveIntervention[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<ProactiveCheckIn | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Initialize realtime connection for proactive features
  useEffect(() => {
    if (!isOpen || !userId) return;

    let unsubscribeCheckIn: (() => void) | null = null;
    let unsubscribeIntervention: (() => void) | null = null;
    let unsubscribeRecommendation: (() => void) | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;
    let sseSource: EventSource | null = null;

    const fetchInitialPendingItems = async () => {
      const [checkInsRes, interventionsRes] = await Promise.all([
        fetch('/api/sam/agentic/checkins?status=pending'),
        fetch('/api/sam/agentic/behavior/interventions?pending=true'),
      ]);

      if (checkInsRes.ok) {
        const checkInsData = await checkInsRes.json();
        if (checkInsData.success && checkInsData.data?.checkIns) {
          setPendingCheckIns(checkInsData.data.checkIns);
        }
      }

      if (interventionsRes.ok) {
        const interventionsData = await interventionsRes.json();
        if (interventionsData.success && interventionsData.data?.interventions) {
          setPendingInterventions(interventionsData.data.interventions);
        }
      }

      await fetch('/api/sam/agentic/checkins/evaluate', { method: 'POST' });
    };

    const initSSEFallback = async (): Promise<boolean> => {
      if (typeof EventSource === 'undefined') return false;

      try {
        const eventSource = new EventSource('/api/sam/realtime/events');
        sseSource = eventSource;

        return new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            eventSource.close();
            sseSource = null;
            resolve(false);
          }, 5000);

          eventSource.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              if (data.type === 'connected') {
                clearTimeout(timeout);
                resolve(true);
                return;
              }

              if (data.type === 'intervention' || data.type === SAMEventType.INTERVENTION) {
                const intervention = data.payload as ProactiveIntervention;
                setPendingInterventions((prev) => {
                  if (prev.some((i) => i.id === intervention.id)) return prev;
                  return [...prev, intervention];
                });
              }

              if (data.type === 'checkin' || data.type === SAMEventType.CHECKIN) {
                const checkIn = data.payload as ProactiveCheckIn;
                setPendingCheckIns((prev) => {
                  if (prev.some((c) => c.id === checkIn.id)) return prev;
                  return [...prev, checkIn];
                });
              }
            } catch {
              // Ignore unparseable messages
            }
          };

          eventSource.onerror = () => {
            clearTimeout(timeout);
            if (eventSource.readyState === EventSource.CLOSED) {
              sseSource = null;
              resolve(false);
            }
          };
        });
      } catch {
        return false;
      }
    };

    const initRestPolling = async () => {
      const fetchProactiveData = async () => {
        try {
          const [checkInsRes, interventionsRes] = await Promise.all([
            fetch('/api/sam/agentic/checkins?status=pending'),
            fetch('/api/sam/agentic/behavior/interventions?pending=true'),
          ]);

          if (checkInsRes.ok) {
            const checkInsData = await checkInsRes.json();
            if (checkInsData.success && checkInsData.data?.checkIns) {
              setPendingCheckIns(checkInsData.data.checkIns);
            }
          }

          if (interventionsRes.ok) {
            const interventionsData = await interventionsRes.json();
            if (interventionsData.success && interventionsData.data?.interventions) {
              setPendingInterventions(interventionsData.data.interventions);
            }
          }

          await fetch('/api/sam/agentic/checkins/evaluate', { method: 'POST' });
        } catch (fetchError) {
          console.error('[SAM] REST polling fetch failed:', fetchError);
        }
      };

      await fetchProactiveData();
      pollingInterval = setInterval(fetchProactiveData, 30000);
    };

    const initRealtime = async () => {
      if (!isWebSocketEnabled()) {
        const sseConnected = await initSSEFallback();
        if (sseConnected) {
          await fetchInitialPendingItems();
        } else {
          await initRestPolling();
        }
        return;
      }

      try {
        const realtimeClient = getSAMRealtimeClient();
        await realtimeClient.connect(userId);

        unsubscribeCheckIn = realtimeClient.on(SAMEventType.CHECKIN, (event: SAMWebSocketEvent) => {
          const checkIn = event.payload as ProactiveCheckIn;
          setPendingCheckIns((prev) => {
            if (prev.some((c) => c.id === checkIn.id)) return prev;
            return [...prev, checkIn];
          });
        });

        unsubscribeIntervention = realtimeClient.on(SAMEventType.INTERVENTION, (event: SAMWebSocketEvent) => {
          const intervention = event.payload as ProactiveIntervention;
          setPendingInterventions((prev) => {
            if (prev.some((i) => i.id === intervention.id)) return prev;
            return [...prev, intervention];
          });
        });

        unsubscribeRecommendation = realtimeClient.on(SAMEventType.RECOMMENDATION, () => {
          // Recommendation handling
        });

        await fetchInitialPendingItems();
      } catch {
        const sseConnected = await initSSEFallback();
        if (sseConnected) {
          await fetchInitialPendingItems();
        } else {
          await initRestPolling();
        }
      }
    };

    void initRealtime().catch(() => {
      void initRestPolling();
    });

    return () => {
      unsubscribeCheckIn?.();
      unsubscribeIntervention?.();
      unsubscribeRecommendation?.();
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isOpen, userId]);

  const convertToCheckInData = useCallback((checkIn: ProactiveCheckIn): CheckInData => {
    const typeMap: Record<string, CheckInType> = {
      daily_reminder: 'daily_reminder',
      progress_check: 'progress_check',
      struggle_detection: 'struggle_detection',
      milestone_celebration: 'milestone_celebration',
      inactivity_reengagement: 'inactivity_reengagement',
      streak_risk: 'streak_risk',
      weekly_summary: 'weekly_summary',
    };

    const checkInType = typeMap[checkIn.type] || 'progress_check';

    const questions: CheckInQuestion[] = (checkIn.questions || []).map((q, index) => ({
      id: q.id,
      question: q.question,
      type: q.type as CheckInQuestion['type'],
      options: q.options,
      required: q.required ?? false,
      order: index,
    }));

    const suggestedActions: CheckInActionType[] = (checkIn.suggestedActions || []).map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      type: action.type as CheckInActionType['type'],
      priority: (action.priority as 'high' | 'medium' | 'low') || 'medium',
    }));

    return {
      id: checkIn.id,
      type: checkInType,
      message: checkIn.message,
      questions,
      suggestedActions,
      priority: checkIn.priority,
    };
  }, []);

  const openCheckIn = useCallback((checkIn: ProactiveCheckIn) => {
    setActiveCheckIn(checkIn);
    setShowCheckInModal(true);
  }, []);

  const closeCheckInModal = useCallback(() => {
    setShowCheckInModal(false);
    setActiveCheckIn(null);
  }, []);

  const handleCheckInSubmit = useCallback(
    async (response: CheckInResponse) => {
      try {
        const apiResponse = await fetch(`/api/sam/agentic/checkins/${response.checkInId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: response.answers,
            selectedActions: response.selectedActions,
            emotionalState: response.emotionalState,
          }),
        });

        if (apiResponse.ok) {
          setPendingCheckIns((prev) => prev.filter((c) => c.id !== response.checkInId));
          setActiveCheckIn(null);
          setShowCheckInModal(false);
        } else {
          throw new Error('Failed to submit check-in');
        }
      } catch (error) {
        console.error('[SAM] Failed to submit check-in response:', error);
      }
    },
    []
  );

  const handleCheckInDismiss = useCallback(async (checkInId: string) => {
    try {
      await fetch(`/api/sam/agentic/checkins/${checkInId}`, { method: 'DELETE' });
      setPendingCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
      setActiveCheckIn(null);
      setShowCheckInModal(false);
    } catch (error) {
      console.error('[SAM] Failed to dismiss check-in:', error);
    }
  }, []);

  const handleInterventionAction = useCallback(
    async (intervention: ProactiveIntervention, actionId: string) => {
      const action = intervention.suggestedActions?.find((a) => a.id === actionId);
      if (!action) return;

      try {
        await fetch(
          `/api/sam/agentic/behavior/interventions?id=${intervention.id}&action=result`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              userResponse: 'accepted',
            }),
          }
        );

        if (action.targetUrl) {
          window.location.href = action.targetUrl;
        }

        setPendingInterventions((prev) => prev.filter((i) => i.id !== intervention.id));
      } catch (error) {
        console.error('[SAM] Failed to handle intervention:', error);
      }
    },
    []
  );

  const handleDismissIntervention = useCallback(async (interventionId: string) => {
    try {
      await fetch(
        `/api/sam/agentic/behavior/interventions?id=${interventionId}&action=result`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            userResponse: 'dismissed',
          }),
        }
      );
      setPendingInterventions((prev) => prev.filter((i) => i.id !== interventionId));
    } catch (error) {
      console.error('[SAM] Failed to dismiss intervention:', error);
    }
  }, []);

  return {
    pendingCheckIns,
    pendingInterventions,
    activeCheckIn,
    showCheckInModal,
    openCheckIn,
    closeCheckInModal,
    handleCheckInSubmit,
    handleCheckInDismiss,
    handleInterventionAction,
    handleDismissIntervention,
    convertToCheckInData,
  };
}
