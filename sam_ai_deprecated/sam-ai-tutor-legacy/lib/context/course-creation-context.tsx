'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BloomsLevel } from '@prisma/client';

// Types for field context
export interface FieldContext {
  fieldName: string;
  fieldValue: string;
  fieldType: 'title' | 'description' | 'objective' | 'chapter' | 'section' | 'assessment';
  bloomsLevel?: BloomsLevel;
  suggestions?: string[];
  cursorPosition?: number;
}

// Types for course data
export interface CourseData {
  id?: string;
  title?: string;
  description?: string;
  learningObjectives?: string[];
  chapters?: ChapterData[];
  categoryId?: string;
  level?: string;
  price?: number;
}

export interface ChapterData {
  id?: string;
  title?: string;
  description?: string;
  sections?: SectionData[];
  order?: number;
}

export interface SectionData {
  id?: string;
  title?: string;
  description?: string;
  content?: string;
  bloomsLevel?: BloomsLevel;
  order?: number;
}

// Bloom's analysis response
export interface BloomsAnalysisResponse {
  courseLevel: {
    distribution: BloomsDistribution;
    cognitiveDepth: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  recommendations?: {
    contentAdjustments?: ContentRecommendation[];
    assessmentChanges?: AssessmentRecommendation[];
    activitySuggestions?: ActivitySuggestion[];
  };
}

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'remove';
  bloomsLevel: BloomsLevel;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface AssessmentRecommendation {
  type: string;
  bloomsLevel: BloomsLevel;
  description: string;
  examples: string[];
}

export interface ActivitySuggestion {
  bloomsLevel: BloomsLevel;
  activityType: string;
  description: string;
  implementation: string;
  expectedOutcome: string;
}

// Context type
interface CourseCreationContextType {
  currentField: FieldContext | null;
  setCurrentField: (field: FieldContext | null) => void;
  courseData: CourseData;
  updateCourseData: (updates: Partial<CourseData>) => void;
  bloomsAnalysis: BloomsAnalysisResponse | null;
  updateBloomsAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  samPanelOpen: boolean;
  setSamPanelOpen: (open: boolean) => void;
  floatingSamOpen: boolean;
  setFloatingSamOpen: (open: boolean) => void;
}

const CourseCreationContext = createContext<CourseCreationContextType | null>(null);

export function CourseCreationProvider({
  children,
  initialCourseData = {}
}: {
  children: React.ReactNode;
  initialCourseData?: Partial<CourseData>;
}) {
  const [currentField, setCurrentField] = useState<FieldContext | null>(null);
  const [courseData, setCourseData] = useState<CourseData>(initialCourseData);
  const [bloomsAnalysis, setBloomsAnalysis] = useState<BloomsAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [samPanelOpen, setSamPanelOpen] = useState(true); // Open by default
  const [floatingSamOpen, setFloatingSamOpen] = useState(false);

  const updateCourseData = useCallback((updates: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateBloomsAnalysis = useCallback(async () => {
    if (!courseData.title && !courseData.description && !courseData.learningObjectives?.length) {
      // Not enough content to analyze
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/sam/analyze-course-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseData }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setBloomsAnalysis(analysis);
      }
    } catch (error) {
      console.error('Failed to analyze course:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseData]);

  // Auto-analyze when significant changes occur
  useEffect(() => {
    const timer = setTimeout(() => {
      updateBloomsAnalysis();
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timer);
  }, [courseData.title, courseData.description, courseData.learningObjectives, updateBloomsAnalysis]);

  return (
    <CourseCreationContext.Provider
      value={{
        currentField,
        setCurrentField,
        courseData,
        updateCourseData,
        bloomsAnalysis,
        updateBloomsAnalysis,
        isAnalyzing,
        samPanelOpen,
        setSamPanelOpen,
        floatingSamOpen,
        setFloatingSamOpen,
      }}
    >
      {children}
    </CourseCreationContext.Provider>
  );
}

export function useCourseCreation() {
  const context = useContext(CourseCreationContext);
  if (!context) {
    throw new Error('useCourseCreation must be used within CourseCreationProvider');
  }
  return context;
}

// Utility function to detect Bloom's level from text
export function detectBloomsLevelFromText(text: string): BloomsLevel | null {
  if (!text || text.length < 10) return null;

  const lowerText = text.toLowerCase();

  // CREATE level indicators
  if (
    lowerText.match(/\b(create|design|develop|build|construct|formulate|compose|invent|generate)\b/)
  ) {
    return 'CREATE';
  }

  // EVALUATE level indicators
  if (
    lowerText.match(/\b(evaluate|assess|judge|critique|justify|argue|defend|rate|prioritize)\b/)
  ) {
    return 'EVALUATE';
  }

  // ANALYZE level indicators
  if (
    lowerText.match(/\b(analyze|compare|contrast|examine|investigate|categorize|differentiate|distinguish)\b/)
  ) {
    return 'ANALYZE';
  }

  // APPLY level indicators
  if (
    lowerText.match(/\b(apply|implement|use|solve|demonstrate|execute|perform|operate)\b/)
  ) {
    return 'APPLY';
  }

  // UNDERSTAND level indicators
  if (
    lowerText.match(/\b(explain|describe|summarize|interpret|classify|discuss|illustrate|paraphrase)\b/)
  ) {
    return 'UNDERSTAND';
  }

  // REMEMBER level indicators
  if (
    lowerText.match(/\b(define|list|name|identify|recall|recognize|memorize|state|label)\b/)
  ) {
    return 'REMEMBER';
  }

  return null;
}

// Get recommended Bloom's level for field type
export function getRecommendedBloomsLevel(fieldType: string): BloomsLevel {
  switch (fieldType) {
    case 'title':
      return 'APPLY'; // Titles should show application or higher
    case 'description':
      return 'UNDERSTAND'; // Descriptions should explain
    case 'objective':
      return 'APPLY'; // Learning objectives should be actionable
    case 'chapter':
      return 'UNDERSTAND';
    case 'section':
      return 'APPLY';
    case 'assessment':
      return 'ANALYZE'; // Assessments should test higher-order thinking
    default:
      return 'UNDERSTAND';
  }
}

// Get Bloom's level color for UI
export function getBloomsLevelColor(level: BloomsLevel): string {
  const colors: Record<BloomsLevel, string> = {
    REMEMBER: 'bg-gray-100 text-gray-800 border-gray-300',
    UNDERSTAND: 'bg-blue-100 text-blue-800 border-blue-300',
    APPLY: 'bg-green-100 text-green-800 border-green-300',
    ANALYZE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    EVALUATE: 'bg-orange-100 text-orange-800 border-orange-300',
    CREATE: 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return colors[level];
}

// Get Bloom's level emoji
export function getBloomsLevelEmoji(level: BloomsLevel): string {
  const emojis: Record<BloomsLevel, string> = {
    REMEMBER: '📝',
    UNDERSTAND: '💡',
    APPLY: '🔧',
    ANALYZE: '🔍',
    EVALUATE: '⚖️',
    CREATE: '🎨',
  };
  return emojis[level];
}
