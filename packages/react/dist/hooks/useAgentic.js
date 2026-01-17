/**
 * useAgentic Hook
 * Provides React integration for SAM Agentic AI capabilities
 *
 * Phase 5: Frontend Integration
 * - Goal management (create, list, update, decompose)
 * - Learning recommendations
 * - Progress tracking
 * - Skill assessment
 * - Check-in management
 */
import { useState, useCallback, useEffect, useRef } from 'react';
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function useAgentic(options = {}) {
    const { autoFetchGoals = false, autoFetchRecommendations = false, autoFetchCheckIns = false, availableTime = 60, recommendationRefreshInterval, } = options;
    // State
    const [goals, setGoals] = useState([]);
    const [plans, setPlans] = useState([]);
    const [recommendations, setRecommendations] = useState(null);
    const [progressReport, setProgressReport] = useState(null);
    const [skills, setSkills] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [error, setError] = useState(null);
    // Loading states
    const [isLoadingGoals, setIsLoadingGoals] = useState(false);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);
    const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(false);
    const mountedRef = useRef(true);
    // ============================================================================
    // API HELPERS
    // ============================================================================
    const apiCall = useCallback(async (url, options) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
                ...options,
            });
            const result = await response.json();
            if (!response.ok) {
                return { success: false, error: result.error || 'Request failed' };
            }
            return { success: true, data: result.data };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Network error';
            return { success: false, error: message };
        }
    }, []);
    // ============================================================================
    // GOALS
    // ============================================================================
    const fetchGoals = useCallback(async (status) => {
        setIsLoadingGoals(true);
        setError(null);
        const url = status
            ? `/api/sam/agentic/goals?status=${status}`
            : '/api/sam/agentic/goals';
        const result = await apiCall(url);
        if (mountedRef.current) {
            if (result.success && result.data) {
                setGoals(result.data.goals);
            }
            else {
                setError(result.error || 'Failed to fetch goals');
            }
            setIsLoadingGoals(false);
        }
    }, [apiCall]);
    const createGoal = useCallback(async (data) => {
        setError(null);
        const result = await apiCall('/api/sam/agentic/goals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (result.success && result.data) {
            setGoals((prev) => [result.data, ...prev]);
            return result.data;
        }
        else {
            setError(result.error || 'Failed to create goal');
            return null;
        }
    }, [apiCall]);
    const updateGoal = useCallback(async (goalId, data) => {
        setError(null);
        const result = await apiCall(`/api/sam/agentic/goals/${goalId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
        if (result.success && result.data) {
            setGoals((prev) => prev.map((g) => (g.id === goalId ? result.data : g)));
            return result.data;
        }
        else {
            setError(result.error || 'Failed to update goal');
            return null;
        }
    }, [apiCall]);
    const decomposeGoal = useCallback(async (goalId) => {
        setError(null);
        const result = await apiCall(`/api/sam/agentic/goals/${goalId}/decompose`, {
            method: 'POST',
        });
        if (result.success && result.data) {
            setGoals((prev) => prev.map((g) => (g.id === goalId ? result.data : g)));
            return result.data;
        }
        else {
            setError(result.error || 'Failed to decompose goal');
            return null;
        }
    }, [apiCall]);
    const deleteGoal = useCallback(async (goalId) => {
        setError(null);
        const result = await apiCall(`/api/sam/agentic/goals/${goalId}`, {
            method: 'DELETE',
        });
        if (result.success) {
            setGoals((prev) => prev.filter((g) => g.id !== goalId));
            return true;
        }
        else {
            setError(result.error || 'Failed to delete goal');
            return false;
        }
    }, [apiCall]);
    // ============================================================================
    // PLANS
    // ============================================================================
    const fetchPlans = useCallback(async (goalId) => {
        setIsLoadingPlans(true);
        setError(null);
        const url = goalId
            ? `/api/sam/agentic/plans?goalId=${goalId}`
            : '/api/sam/agentic/plans';
        const result = await apiCall(url);
        if (mountedRef.current) {
            if (result.success && result.data) {
                setPlans(result.data.plans);
            }
            else {
                setError(result.error || 'Failed to fetch plans');
            }
            setIsLoadingPlans(false);
        }
    }, [apiCall]);
    const createPlan = useCallback(async (goalId, dailyMinutes = 30) => {
        setError(null);
        const result = await apiCall('/api/sam/agentic/plans', {
            method: 'POST',
            body: JSON.stringify({ goalId, dailyMinutes }),
        });
        if (result.success && result.data) {
            setPlans((prev) => [result.data, ...prev]);
            return result.data;
        }
        else {
            setError(result.error || 'Failed to create plan');
            return null;
        }
    }, [apiCall]);
    const startPlan = useCallback(async (planId) => {
        const result = await apiCall(`/api/sam/agentic/plans/${planId}/start`, {
            method: 'POST',
        });
        return result.success;
    }, [apiCall]);
    const pausePlan = useCallback(async (planId) => {
        const result = await apiCall(`/api/sam/agentic/plans/${planId}/pause`, {
            method: 'POST',
        });
        return result.success;
    }, [apiCall]);
    const resumePlan = useCallback(async (planId) => {
        const result = await apiCall(`/api/sam/agentic/plans/${planId}/resume`, {
            method: 'POST',
        });
        return result.success;
    }, [apiCall]);
    // ============================================================================
    // RECOMMENDATIONS
    // ============================================================================
    const fetchRecommendations = useCallback(async (time) => {
        setIsLoadingRecommendations(true);
        setError(null);
        const timeParam = time ?? availableTime;
        const result = await apiCall(`/api/sam/agentic/recommendations?time=${timeParam}`);
        if (mountedRef.current) {
            if (result.success && result.data) {
                setRecommendations(result.data);
            }
            else {
                setError(result.error || 'Failed to fetch recommendations');
            }
            setIsLoadingRecommendations(false);
        }
    }, [apiCall, availableTime]);
    const dismissRecommendation = useCallback((recommendationId) => {
        setRecommendations((prev) => {
            if (!prev)
                return null;
            return {
                ...prev,
                recommendations: prev.recommendations.filter((r) => r.id !== recommendationId),
            };
        });
    }, []);
    // ============================================================================
    // PROGRESS
    // ============================================================================
    const fetchProgressReport = useCallback(async (period = 'weekly') => {
        setIsLoadingProgress(true);
        setError(null);
        const result = await apiCall(`/api/sam/agentic/analytics/progress?period=${period}`);
        if (mountedRef.current) {
            if (result.success && result.data) {
                setProgressReport(result.data);
            }
            else {
                setError(result.error || 'Failed to fetch progress report');
            }
            setIsLoadingProgress(false);
        }
    }, [apiCall]);
    // ============================================================================
    // SKILLS
    // ============================================================================
    const fetchSkillMap = useCallback(async () => {
        setIsLoadingSkills(true);
        setError(null);
        const result = await apiCall('/api/sam/agentic/skills');
        if (mountedRef.current) {
            if (result.success && result.data) {
                setSkills(result.data.skills);
            }
            else {
                setError(result.error || 'Failed to fetch skill map');
            }
            setIsLoadingSkills(false);
        }
    }, [apiCall]);
    // ============================================================================
    // CHECK-INS
    // ============================================================================
    const fetchCheckIns = useCallback(async (status) => {
        setIsLoadingCheckIns(true);
        setError(null);
        const url = status
            ? `/api/sam/agentic/checkins?status=${status}`
            : '/api/sam/agentic/checkins';
        const result = await apiCall(url);
        if (mountedRef.current) {
            if (result.success && result.data) {
                setCheckIns(result.data.checkIns);
            }
            else {
                setError(result.error || 'Failed to fetch check-ins');
            }
            setIsLoadingCheckIns(false);
        }
    }, [apiCall]);
    const respondToCheckIn = useCallback(async (checkInId, response) => {
        setError(null);
        const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
            method: 'POST',
            body: JSON.stringify(response),
        });
        if (result.success) {
            setCheckIns((prev) => prev.map((c) => c.id === checkInId ? { ...c, status: 'responded' } : c));
            return true;
        }
        else {
            setError(result.error || 'Failed to respond to check-in');
            return false;
        }
    }, [apiCall]);
    const dismissCheckIn = useCallback(async (checkInId) => {
        setError(null);
        const result = await apiCall(`/api/sam/agentic/checkins/${checkInId}`, {
            method: 'DELETE',
        });
        if (result.success) {
            setCheckIns((prev) => prev.filter((c) => c.id !== checkInId));
            return true;
        }
        else {
            setError(result.error || 'Failed to dismiss check-in');
            return false;
        }
    }, [apiCall]);
    // ============================================================================
    // UTILITY
    // ============================================================================
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    // ============================================================================
    // EFFECTS
    // ============================================================================
    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetchGoals) {
            fetchGoals();
        }
        if (autoFetchRecommendations) {
            fetchRecommendations();
        }
        if (autoFetchCheckIns) {
            fetchCheckIns('pending');
        }
    }, [
        autoFetchGoals,
        autoFetchRecommendations,
        autoFetchCheckIns,
        fetchGoals,
        fetchRecommendations,
        fetchCheckIns,
    ]);
    // Recommendation refresh interval
    useEffect(() => {
        if (!recommendationRefreshInterval)
            return;
        const interval = setInterval(() => {
            fetchRecommendations();
        }, recommendationRefreshInterval);
        return () => clearInterval(interval);
    }, [recommendationRefreshInterval, fetchRecommendations]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);
    return {
        // Goals
        goals,
        isLoadingGoals,
        fetchGoals,
        createGoal,
        updateGoal,
        decomposeGoal,
        deleteGoal,
        // Plans
        plans,
        isLoadingPlans,
        fetchPlans,
        createPlan,
        startPlan,
        pausePlan,
        resumePlan,
        // Recommendations
        recommendations,
        isLoadingRecommendations,
        fetchRecommendations,
        dismissRecommendation,
        // Progress
        progressReport,
        isLoadingProgress,
        fetchProgressReport,
        // Skills
        skills,
        isLoadingSkills,
        fetchSkillMap,
        // Check-ins
        checkIns,
        isLoadingCheckIns,
        fetchCheckIns,
        respondToCheckIn,
        dismissCheckIn,
        // Utility
        error,
        clearError,
    };
}
export default useAgentic;
