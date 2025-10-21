"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';
import { useSAMRoleConfig } from '@/sam/components/global/sam-role-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Target, 
  HelpCircle, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  MessageSquare,
  Star,
  Clock,
  User,
  TrendingUp,
  Brain,
  Zap,
  Award,
  FileText,
  PenTool,
  Compass
} from 'lucide-react';

interface CourseContext {
  courseId: string;
  courseName: string;
  chapterId?: string;
  chapterName?: string;
  sectionId?: string;
  sectionName?: string;
  progress: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  prerequisites: string[];
  learningObjectives: string[];
  nextSteps: string[];
  relatedTopics: string[];
}

interface LearningSession {
  id: string;
  startTime: Date;
  duration: number;
  progress: number;
  topics: string[];
  achievements: string[];
  strugglingAreas: string[];
  notes: string[];
}

export function SAMCourseIntegration() {
  const pathname = usePathname();
  const { learningContext, tutorMode, updateContext } = useSAMGlobal();
  const { hasFeature, getFeature } = useSAMRoleConfig();
  
  const [courseContext, setCourseContext] = useState<CourseContext | null>(null);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [quickHelp, setQuickHelp] = useState<string[]>([]);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);

  // Detect if we're in a course learning context
  const isInCourseContext = useMemo(() => {
    return pathname?.includes('/courses/') && pathname?.includes('/learn');
  }, [pathname]);

  // Extract course information from URL and context
  useEffect(() => {
    if (isInCourseContext && learningContext.courseId) {
      const mockCourseContext: CourseContext = {
        courseId: learningContext.courseId,
        courseName: learningContext.subject || 'Current Course',
        chapterId: learningContext.chapterId,
        chapterName: learningContext.chapterName,
        sectionId: learningContext.sectionId,
        sectionName: learningContext.sectionName,
        progress: 45, // Mock progress
        difficulty: learningContext.difficulty || 'intermediate',
        estimatedTime: 30,
        prerequisites: ['Basic concepts', 'Previous chapter'],
        learningObjectives: learningContext.learningObjectives || [
          'Understand key concepts',
          'Apply knowledge to problems',
          'Analyze real-world scenarios'
        ],
        nextSteps: ['Practice exercises', 'Chapter quiz', 'Next chapter'],
        relatedTopics: ['Related topic 1', 'Related topic 2', 'Advanced concepts']
      };
      
      setCourseContext(mockCourseContext);
      setIsLearningMode(true);

      // Update SAM context with course-specific information
      updateContext({
        ...learningContext,
        subject: mockCourseContext.courseName,
        currentTopic: mockCourseContext.chapterName,
        difficulty: mockCourseContext.difficulty,
        learningObjectives: mockCourseContext.learningObjectives
      });
    } else {
      setCourseContext(null);
      setIsLearningMode(false);
    }
  }, [isInCourseContext, learningContext, updateContext]);

  // Start learning session
  const startLearningSession = useCallback(() => {
    if (!courseContext) return;

    const session: LearningSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      progress: 0,
      topics: [courseContext.chapterName || 'Current Topic'],
      achievements: [],
      strugglingAreas: [],
      notes: []
    };

    setCurrentSession(session);
  }, [courseContext]);

  // Update learning session
  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null;
          
          const duration = Date.now() - prev.startTime.getTime();
          const progress = Math.min((duration / 1000) / 60 * 10, 100); // 10% per minute
          
          return {
            ...prev,
            duration,
            progress
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentSession]);

  // Generate contextual quick help
  useEffect(() => {
    if (courseContext && hasFeature('concept-explanation')) {
      const help = [
        `Explain ${courseContext.chapterName || 'this topic'}`,
        'Give me examples',
        'What should I focus on?',
        'Create practice questions',
        'Summarize key points'
      ];
      setQuickHelp(help);
    }
  }, [courseContext, hasFeature]);

  // Generate contextual suggestions
  useEffect(() => {
    if (courseContext) {
      const suggestions = [
        'Take notes on key concepts',
        'Create a concept map',
        'Practice with exercises',
        'Review learning objectives',
        'Check your understanding'
      ];
      setContextualSuggestions(suggestions);
    }
  }, [courseContext]);

  // Handle quick help actions
  const handleQuickHelp = useCallback((helpText: string) => {
    // This would typically open the SAM assistant with the pre-filled message

  }, []);

  // Handle suggestion actions
  const handleSuggestion = useCallback((suggestion: string) => {
    // This would typically trigger the suggested action

  }, []);

  if (!isInCourseContext || !courseContext) {
    return null;
  }

  return (
    <div className="sam-course-integration">
      {/* Learning Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{courseContext.courseName}</span>
                {courseContext.chapterName && (
                  <>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{courseContext.chapterName}</span>
                  </>
                )}
              </div>
              <Progress value={courseContext.progress} className="h-2" />
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {courseContext.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {courseContext.estimatedTime}min
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Course Context Panel */}
      <div className="fixed bottom-20 right-4 z-90 w-80 max-w-[calc(100vw-2rem)]">
        <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <span>Learning Assistant</span>
              </CardTitle>
              {currentSession && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{Math.floor(currentSession.duration / 60000)}:{Math.floor((currentSession.duration % 60000) / 1000).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Quick Help */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                <HelpCircle className="h-4 w-4" />
                <span>Quick Help</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {quickHelp.slice(0, 3).map((help, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp(help)}
                    className="text-xs justify-start h-auto py-2 px-3 whitespace-normal text-left"
                  >
                    {help}
                  </Button>
                ))}
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>Learning Objectives</span>
              </h4>
              <div className="space-y-1">
                {courseContext.learningObjectives.slice(0, 3).map((objective, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Suggestions */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
                <Lightbulb className="h-4 w-4" />
                <span>Suggestions</span>
              </h4>
              <div className="space-y-1">
                {contextualSuggestions.slice(0, 2).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Zap className="h-3 w-3" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {hasFeature('concept-explanation') && (
                <Button
                  size="sm"
                  onClick={() => handleQuickHelp('Explain this concept')}
                  className="flex-1 text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Explain
                </Button>
              )}
              {hasFeature('quiz-help') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickHelp('Create practice questions')}
                  className="flex-1 text-xs"
                >
                  <PenTool className="h-3 w-3 mr-1" />
                  Practice
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Course-specific SAM Assistant Component
export function SAMCourseAssistant({ 
  courseId, 
  mode = 'learning',
  features = [],
  position = 'floating'
}: {
  courseId: string;
  mode?: 'learning' | 'review' | 'assessment';
  features?: string[];
  position?: 'floating' | 'side-panel' | 'integrated';
}) {
  const { learningContext, updateContext } = useSAMGlobal();
  const { hasFeature } = useSAMRoleConfig();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Course-specific context
  const courseContext = useMemo(() => {
    return {
      ...learningContext,
      courseId,
      mode,
      availableFeatures: features.filter(feature => hasFeature(feature))
    };
  }, [learningContext, courseId, mode, features, hasFeature]);

  // Update context when course changes
  useEffect(() => {
    updateContext(courseContext);
  }, [courseContext, updateContext]);

  const handleFeatureSelect = useCallback((featureId: string) => {
    setActiveFeature(featureId);
    // Trigger SAM with specific feature context
  }, []);

  return (
    <div className={cn(
      "sam-course-assistant",
      position === 'floating' && "fixed bottom-4 right-4 z-50",
      position === 'side-panel' && "w-full h-full",
      position === 'integrated' && "w-full"
    )}>
      {/* Course Assistant UI */}
      <Card className="shadow-lg">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span>Course Assistant</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {mode}
              </Badge>
              {isExpanded ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Feature Tabs */}
            <Tabs defaultValue="help" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="help">Help</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="help" className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureSelect('concept-explanation')}
                  >
                    <Brain className="h-3 w-3 mr-2" />
                    Explain Concept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureSelect('quiz-help')}
                  >
                    <HelpCircle className="h-3 w-3 mr-2" />
                    Practice Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFeatureSelect('study-guidance')}
                  >
                    <Compass className="h-3 w-3 mr-2" />
                    Study Tips
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="progress" className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Chapter Progress</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Course</span>
                    <span>42%</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-2">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    Course Notes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <BookOpen className="h-3 w-3 mr-2" />
                    Reading List
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Award className="h-3 w-3 mr-2" />
                    Achievements
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Learning Progress Tracker
export function SAMLearningTracker() {
  const [sessionStats, setSessionStats] = useState({
    timeSpent: 0,
    conceptsLearned: 0,
    questionsAnswered: 0,
    accuracy: 0
  });

  useEffect(() => {
    // Mock session tracking
    const interval = setInterval(() => {
      setSessionStats(prev => ({
        timeSpent: prev.timeSpent + 1,
        conceptsLearned: prev.conceptsLearned + (Math.random() > 0.95 ? 1 : 0),
        questionsAnswered: prev.questionsAnswered + (Math.random() > 0.9 ? 1 : 0),
        accuracy: Math.min(prev.accuracy + (Math.random() > 0.8 ? 1 : 0), 100)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-40">
      <Card className="w-48 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">Session Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Time</span>
            <span>{Math.floor(sessionStats.timeSpent / 60)}:{(sessionStats.timeSpent % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Concepts</span>
            <span>{sessionStats.conceptsLearned}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Questions</span>
            <span>{sessionStats.questionsAnswered}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Accuracy</span>
            <span>{sessionStats.accuracy}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}