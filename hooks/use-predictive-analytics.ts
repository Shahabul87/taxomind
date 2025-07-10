import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CompletionPrediction {
  completionProbability: number;
  riskFactors: string[];
  recommendations: string[];
  confidenceScore: number;
  estimatedCompletionDate?: string;
}

interface StudySchedule {
  recommendedDailyMinutes: number;
  bestStudyTimes: string[];
  weeklyGoal: number;
  estimatedCompletionWeeks: number;
  nextMilestone?: string;
}

interface AtRiskStudent {
  userId: string;
  riskScore: number;
  riskFactors: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

interface PersonalizedRecommendations {
  contentRecommendations: string[];
  studyStrategies: string[];
  peerConnections: string[];
  resourceSuggestions: string[];
}

export function usePredictiveAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictCourseCompletion = async (courseId: string): Promise<CompletionPrediction | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/predict-completion?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('API not available');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to predict course completion');
      }

      return data.prediction;
    } catch (err) {
      // Fallback to mock data for demo
      console.warn('Using fallback prediction data:', err);
      return {
        completionProbability: 85,
        confidenceScore: 78,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        riskFactors: [
          'Quiz performance declined by 5% in the last week',
          'Study session frequency decreased'
        ],
        recommendations: [
          'Review previous chapters before continuing',
          'Consider shorter, more frequent study sessions',
          'Focus on practical exercises'
        ]
      };
    } finally {
      setLoading(false);
    }
  };

  const predictOptimalStudySchedule = async (courseId: string): Promise<StudySchedule | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/study-schedule?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('API not available');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to predict optimal study schedule');
      }

      return data.schedule;
    } catch (err) {
      // Fallback to mock data for demo
      console.warn('Using fallback schedule data:', err);
      return {
        recommendedDailyMinutes: 45,
        estimatedCompletionWeeks: 8,
        bestStudyTimes: ['9:00 AM - 10:00 AM', '2:00 PM - 3:00 PM', '7:00 PM - 8:00 PM'],
        weeklyGoal: 315,
        nextMilestone: 'Complete JavaScript Fundamentals module'
      };
    } finally {
      setLoading(false);
    }
  };

  const identifyAtRiskStudents = async (courseId: string): Promise<AtRiskStudent[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/at-risk-students?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to identify at-risk students');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to identify at-risk students');
      }

      return data.atRiskStudents;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedRecommendations = async (courseId: string): Promise<PersonalizedRecommendations | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/recommendations?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('API not available');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate personalized recommendations');
      }

      return data.recommendations;
    } catch (err) {
      // Fallback to mock data for demo
      console.warn('Using fallback recommendations data:', err);
      return {
        contentRecommendations: [
          'Focus on JavaScript ES6+ features for modern development',
          'Practice async/await patterns with real-world examples',
          'Build small projects to reinforce learning'
        ],
        studyStrategies: [
          'Use spaced repetition for better retention',
          'Take breaks every 25 minutes (Pomodoro technique)',
          'Teach concepts to others to solidify understanding'
        ],
        peerConnections: [
          'Join the JavaScript study group',
          'Connect with learners at similar level',
          'Participate in code review sessions'
        ],
        resourceSuggestions: [
          'MDN Web Docs for comprehensive references',
          'JavaScript30 for hands-on practice',
          'Stack Overflow for community support'
        ]
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    predictCourseCompletion,
    predictOptimalStudySchedule,
    identifyAtRiskStudents,
    generatePersonalizedRecommendations
  };
}

export function useCompletionPrediction(courseId?: string) {
  const [prediction, setPrediction] = useState<CompletionPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { predictCourseCompletion } = usePredictiveAnalytics();

  const refreshPrediction = async () => {
    if (!courseId) {
      // Use default course for demo
      const result = await predictCourseCompletion('demo-course');
      setPrediction(result);
      return;
    }
    
    setLoading(true);
    const result = await predictCourseCompletion(courseId);
    setPrediction(result);
    setLoading(false);
  };

  useEffect(() => {
    refreshPrediction();
  }, [courseId]);

  return {
    prediction,
    loading,
    error,
    refreshPrediction
  };
}

export function useStudySchedule(courseId?: string) {
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { predictOptimalStudySchedule } = usePredictiveAnalytics();

  const refreshSchedule = async () => {
    if (!courseId) {
      // Use default course for demo
      const result = await predictOptimalStudySchedule('demo-course');
      setSchedule(result);
      return;
    }
    
    setLoading(true);
    const result = await predictOptimalStudySchedule(courseId);
    setSchedule(result);
    setLoading(false);
  };

  useEffect(() => {
    refreshSchedule();
  }, [courseId]);

  return {
    schedule,
    loading,
    error,
    refreshSchedule
  };
}

export function useAtRiskStudents(courseId: string) {
  const [students, setStudents] = useState<AtRiskStudent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { identifyAtRiskStudents } = usePredictiveAnalytics();

  const refreshStudents = async () => {
    if (!courseId) return;
    
    setLoading(true);
    const result = await identifyAtRiskStudents(courseId);
    setStudents(result);
    setLoading(false);
  };

  useEffect(() => {
    refreshStudents();
  }, [courseId]);

  return {
    students,
    loading,
    error,
    refreshStudents
  };
}

export function usePersonalizedRecommendations(courseId?: string) {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { generatePersonalizedRecommendations } = usePredictiveAnalytics();

  const refreshRecommendations = async () => {
    if (!courseId) {
      // Use default course for demo
      const result = await generatePersonalizedRecommendations('demo-course');
      setRecommendations(result);
      return;
    }
    
    setLoading(true);
    const result = await generatePersonalizedRecommendations(courseId);
    setRecommendations(result);
    setLoading(false);
  };

  useEffect(() => {
    refreshRecommendations();
  }, [courseId]);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations
  };
}