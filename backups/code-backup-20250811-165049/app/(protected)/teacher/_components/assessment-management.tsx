"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/lib/logger';
import { 
  ClipboardList, 
  Target, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Brain, 
  Zap, 
  Award, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  PieChart, 
  Calendar, 
  Filter, 
  Search, 
  Send, 
  Sparkles, 
  Layers, 
  Lightbulb, 
  Gauge, 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AssessmentCardSkeleton, DashboardStatsSkeleton, LoadingSpinner } from './ui/loading-states';
import { FadeIn, StaggeredList, AnimatedCounter } from './ui/animations';
import { HoverLift } from './ui/animations';
import { ErrorBoundary, LoadingWithRetry } from './ui/error-handling';
import { OptimizedCard } from './ui/performance-optimized';

interface AssessmentManagementProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  teacherId: string;
}

export function AssessmentManagement({ 
  isOpen, 
  onClose, 
  courseId, 
  teacherId 
}: AssessmentManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [createAssessmentForm, setCreateAssessmentForm] = useState({
    title: '',
    description: '',
    assessmentType: 'quiz',
    subject: '',
    topic: '',
    difficulty: 'medium',
    questionCount: 10,
    duration: '30',
    learningObjectives: [''],
    bloomsLevels: ['knowledge'],
    questionTypes: ['multiple_choice'],
    isAdaptive: false,
    isPublished: false,
    dueDate: '',
    instructions: '',
    maxAttempts: 1,
    shuffleQuestions: true,
    showFeedback: true,
    allowReview: true
  });

  // Data fetching functions - moved before useEffect
  const fetchAssessments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, this would fetch from API
      const mockAssessments = [
        {
          id: 'assess_1',
          title: 'Introduction to AI Quiz',
          type: 'quiz',
          status: 'published',
          totalQuestions: 15,
          duration: 30,
          attempts: 45,
          avgScore: 82.5,
          difficulty: 'medium',
          createdAt: '2025-01-15T10:00:00Z',
          dueDate: '2025-01-25T23:59:59Z',
          completionRate: 78,
          isAdaptive: false,
          analytics: {
            totalStudents: 50,
            completed: 39,
            inProgress: 6,
            notStarted: 5,
            averageTime: 28.5,
            topPerformers: ['Sarah J.', 'Mike C.', 'Elena R.'],
            needsHelp: ['John S.', 'Lisa B.'],
            questionAnalytics: [
              { questionId: 'q1', correctRate: 85, avgTime: 45 },
              { questionId: 'q2', correctRate: 72, avgTime: 52 },
              { questionId: 'q3', correctRate: 91, avgTime: 38 }
            ]
          }
        },
        {
          id: 'assess_2',
          title: 'Machine Learning Fundamentals',
          type: 'exam',
          status: 'draft',
          totalQuestions: 25,
          duration: 60,
          attempts: 0,
          avgScore: 0,
          difficulty: 'hard',
          createdAt: '2025-01-18T14:30:00Z',
          dueDate: '2025-02-01T23:59:59Z',
          completionRate: 0,
          isAdaptive: true,
          analytics: {
            totalStudents: 50,
            completed: 0,
            inProgress: 0,
            notStarted: 50,
            averageTime: 0,
            topPerformers: [],
            needsHelp: [],
            questionAnalytics: []
          }
        },
        {
          id: 'assess_3',
          title: 'Neural Networks Practice',
          type: 'assignment',
          status: 'published',
          totalQuestions: 8,
          duration: 45,
          attempts: 32,
          avgScore: 76.8,
          difficulty: 'hard',
          createdAt: '2025-01-20T09:15:00Z',
          dueDate: '2025-01-30T23:59:59Z',
          completionRate: 64,
          isAdaptive: false,
          analytics: {
            totalStudents: 50,
            completed: 32,
            inProgress: 8,
            notStarted: 10,
            averageTime: 42.3,
            topPerformers: ['Alex K.', 'Maria L.'],
            needsHelp: ['Tom W.', 'Janet M.', 'Chris P.'],
            questionAnalytics: [
              { questionId: 'q1', correctRate: 68, avgTime: 180 },
              { questionId: 'q2', correctRate: 74, avgTime: 165 },
              { questionId: 'q3', correctRate: 82, avgTime: 140 }
            ]
          }
        }
      ];

      setAssessments(mockAssessments);
    } catch (error) {
      logger.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudentAnalytics = useCallback(async () => {
    try {
      // Mock student analytics data
      const mockAnalytics = {
        totalStudents: 50,
        activeStudents: 42,
        avgPerformance: 79.2,
        improvementRate: 15,
        engagementLevel: 85,
        completionRate: 72,
        timeSpent: 24.5,
        skillMastery: {
          knowledge: 82,
          comprehension: 78,
          application: 75,
          analysis: 71,
          synthesis: 68,
          evaluation: 73
        },
        performanceDistribution: {
          excellent: 22,
          good: 35,
          average: 28,
          needsImprovement: 15
        },
        trends: {
          thisWeek: 8,
          lastWeek: 12,
          improvement: true
        }
      };

      setStudentAnalytics(mockAnalytics);
    } catch (error) {
      logger.error('Error fetching student analytics:', error);
    }
  }, []);

  // Fetch assessment data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssessments();
      fetchStudentAnalytics();
    }
  }, [isOpen, fetchAssessments, fetchStudentAnalytics]);

  const handleCreateAssessment = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_assessment',
          assessmentType: createAssessmentForm.assessmentType,
          subject: createAssessmentForm.subject,
          topic: createAssessmentForm.topic,
          difficulty: createAssessmentForm.difficulty,
          questionCount: createAssessmentForm.questionCount,
          learningObjectives: createAssessmentForm.learningObjectives,
          bloomsLevels: createAssessmentForm.bloomsLevels,
          questionTypes: createAssessmentForm.questionTypes,
          duration: createAssessmentForm.duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Assessment created successfully!');
        setShowCreateDialog(false);
        fetchAssessments();
        
        // Reset form
        setCreateAssessmentForm({
          title: '',
          description: '',
          assessmentType: 'quiz',
          subject: '',
          topic: '',
          difficulty: 'medium',
          questionCount: 10,
          duration: '30',
          learningObjectives: [''],
          bloomsLevels: ['knowledge'],
          questionTypes: ['multiple_choice'],
          isAdaptive: false,
          isPublished: false,
          dueDate: '',
          instructions: '',
          maxAttempts: 1,
          shuffleQuestions: true,
          showFeedback: true,
          allowReview: true
        });
      }
    } catch (error) {
      logger.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      setIsLoading(false);
    }
  }, [createAssessmentForm, fetchAssessments]);

  const handleGenerateRubric = useCallback(async (assessmentId: string) => {
    try {
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_rubric',
          subject: createAssessmentForm.subject,
          topic: createAssessmentForm.topic,
          assessmentType: createAssessmentForm.assessmentType,
          rubricCriteria: ['Understanding', 'Application', 'Communication', 'Critical Thinking']
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Rubric generated successfully!');
        // Handle rubric data
      }
    } catch (error) {
      logger.error('Error generating rubric:', error);
      toast.error('Failed to generate rubric');
    }
  }, [createAssessmentForm]);

  const handleAnalyzeResponses = useCallback(async (assessmentId: string) => {
    try {
      const response = await fetch('/api/sam/ai-tutor/assessment-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_responses',
          studentResponses: [], // Mock data
          assessmentData: { id: assessmentId }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Response analysis completed!');
        // Handle analysis data
      }
    } catch (error) {
      logger.error('Error analyzing responses:', error);
      toast.error('Failed to analyze responses');
    }
  }, []);

  const handleFormChange = (field: string, value: any) => {
    setCreateAssessmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setCreateAssessmentForm(prev => {
      const currentField = prev[field as keyof typeof prev];
      if (Array.isArray(currentField)) {
        return {
          ...prev,
          [field]: currentField.map((item: string, i: number) => 
            i === index ? value : item
          )
        };
      }
      return prev;
    });
  };

  const addArrayField = (field: string) => {
    setCreateAssessmentForm(prev => {
      const currentField = prev[field as keyof typeof prev];
      if (Array.isArray(currentField)) {
        return {
          ...prev,
          [field]: [...currentField, '']
        };
      }
      return prev;
    });
  };

  const removeArrayField = (field: string, index: number) => {
    setCreateAssessmentForm(prev => {
      const currentField = prev[field as keyof typeof prev];
      if (Array.isArray(currentField)) {
        return {
          ...prev,
          [field]: currentField.filter((_: any, i: number) => i !== index)
        };
      }
      return prev;
    });
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <HoverLift>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                      <p className="text-2xl font-bold">
                        <AnimatedCounter value={assessments.length} />
                      </p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
            
            <HoverLift>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Published</p>
                      <p className="text-2xl font-bold">
                        <AnimatedCounter value={assessments.filter(a => a.status === 'published').length} />
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
            
            <HoverLift>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Score</p>
                      <p className="text-2xl font-bold">
                        <AnimatedCounter value={Math.round(studentAnalytics.avgPerformance || 0)} />%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
            
            <HoverLift>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        <AnimatedCounter value={studentAnalytics.completionRate || 0} />%
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </HoverLift>
          </div>
        </FadeIn>
      )}

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Assessments</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{assessment.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{assessment.totalQuestions} questions</span>
                      <span>{assessment.duration} min</span>
                      <Badge variant={assessment.status === 'published' ? 'default' : 'secondary'}>
                        {assessment.status}
                      </Badge>
                      <Badge variant="outline">{assessment.difficulty}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm">
                    <p className="font-medium">{assessment.attempts} attempts</p>
                    <p className="text-gray-600">{assessment.avgScore.toFixed(1)}% avg</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleAnalyzeResponses(assessment.id)}>
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Skill Mastery</h4>
              <div className="space-y-3">
                {Object.entries(studentAnalytics.skillMastery || {}).map(([skill, score]) => {
                  const scoreValue = typeof score === 'number' ? score : 0;
                  return (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{skill}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={scoreValue} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{scoreValue}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Performance Distribution</h4>
              <div className="space-y-3">
                {Object.entries(studentAnalytics.performanceDistribution || {}).map(([level, count]) => {
                  const countValue = typeof count === 'number' ? count : 0;
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{level.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${(countValue / 50) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{countValue}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssessmentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">All Assessments</h3>
        <div className="flex items-center space-x-2">
          <Input placeholder="Search assessments..." className="w-64" />
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.map((assessment) => (
          <Card key={assessment.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{assessment.title}</CardTitle>
                <Badge variant={assessment.status === 'published' ? 'default' : 'secondary'}>
                  {assessment.status}
                </Badge>
              </div>
              <CardDescription>{assessment.type} • {assessment.totalQuestions} questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Duration:</span>
                  <span>{assessment.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge variant="outline" className="text-xs">{assessment.difficulty}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Attempts:</span>
                  <span>{assessment.attempts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Score:</span>
                  <span className="font-medium">{assessment.avgScore.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Completion:</span>
                  <span>{assessment.completionRate}%</span>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAnalyzeResponses(assessment.id)}>
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  {assessment.isAdaptive && (
                    <Badge variant="outline" className="text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      Adaptive
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assessment Analytics</h3>
        <Button variant="outline" onClick={() => setShowAnalyticsDialog(true)}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Detailed Analytics
        </Button>
      </div>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{studentAnalytics.avgPerformance?.toFixed(1) || 0}%</div>
              <p className="text-sm text-gray-600">Average Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{studentAnalytics.completionRate || 0}%</div>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{studentAnalytics.engagementLevel || 0}%</div>
              <p className="text-sm text-gray-600">Engagement Level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessments.filter(a => a.status === 'published').map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{assessment.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{assessment.analytics.completed}/{assessment.analytics.totalStudents} completed</span>
                      <span>{assessment.analytics.inProgress} in progress</span>
                      <span>{assessment.analytics.averageTime.toFixed(1)} min avg</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-lg">{assessment.avgScore.toFixed(1)}%</p>
                    <Progress value={assessment.completionRate} className="w-20 h-2" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAssessment(assessment)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Student Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(studentAnalytics.performanceDistribution || {}).map(([level, count]) => {
              const countValue = typeof count === 'number' ? count : 0;
              return (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{level.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-4 bg-gray-200 rounded-full">
                      <div 
                        className={cn(
                          "h-4 rounded-full",
                          level === 'excellent' ? 'bg-green-500' :
                          level === 'good' ? 'bg-blue-500' :
                          level === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${(countValue / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{countValue}</span>
                    <span className="text-xs text-gray-500">{((countValue / 50) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderToolsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assessment Tools</h3>
      </div>

      {/* AI-Powered Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI-Powered Assessment Tools</span>
          </CardTitle>
          <CardDescription>Advanced tools powered by artificial intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 h-auto p-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <Sparkles className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">Auto-Generate Questions</div>
                <div className="text-sm text-gray-600">Create questions from learning objectives</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 h-auto p-4"
              onClick={() => handleGenerateRubric('new')}
            >
              <FileText className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Generate Rubrics</div>
                <div className="text-sm text-gray-600">Create detailed scoring rubrics</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 h-auto p-4"
            >
              <Zap className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <div className="font-medium">Adaptive Assessment</div>
                <div className="text-sm text-gray-600">AI-powered difficulty adjustment</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center space-x-2 h-auto p-4"
            >
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">Performance Analysis</div>
                <div className="text-sm text-gray-600">Deep learning analytics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Templates</CardTitle>
          <CardDescription>Pre-built templates for common assessment types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-8 h-8 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">Quick Quiz</h4>
                    <p className="text-sm text-gray-600">5-10 questions, 15 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-8 h-8 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Unit Test</h4>
                    <p className="text-sm text-gray-600">20-30 questions, 45 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-purple-500" />
                  <div>
                    <h4 className="font-semibold">Final Exam</h4>
                    <p className="text-sm text-gray-600">50+ questions, 2 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Import/Export Tools</CardTitle>
          <CardDescription>Manage assessment data and formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Import Assessments</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from CSV
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from QTI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Word
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Export Results</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export to PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export to LMS
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateAssessmentDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assessment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Assessment Title</Label>
              <Input
                id="title"
                value={createAssessmentForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Enter assessment title"
              />
            </div>
            
            <div>
              <Label htmlFor="assessmentType">Assessment Type</Label>
              <Select value={createAssessmentForm.assessmentType} onValueChange={(value) => handleFormChange('assessmentType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="practice">Practice Test</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={createAssessmentForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter assessment description"
              rows={3}
            />
          </div>

          {/* Assessment Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={createAssessmentForm.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
            
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={createAssessmentForm.topic}
                onChange={(e) => handleFormChange('topic', e.target.value)}
                placeholder="e.g., Algebra"
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={createAssessmentForm.difficulty} onValueChange={(value) => handleFormChange('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                value={createAssessmentForm.questionCount}
                onChange={(e) => handleFormChange('questionCount', parseInt(e.target.value))}
                placeholder="10"
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={createAssessmentForm.duration}
                onChange={(e) => handleFormChange('duration', e.target.value)}
                placeholder="30"
                min="1"
                max="300"
              />
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <Label>Learning Objectives</Label>
            <div className="space-y-2">
              {createAssessmentForm.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={objective}
                    onChange={(e) => handleArrayFieldChange('learningObjectives', index, e.target.value)}
                    placeholder="Enter learning objective"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField('learningObjectives', index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayField('learningObjectives')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Objective
              </Button>
            </div>
          </div>

          {/* Bloom&apos;s Taxonomy Levels */}
          <div>
            <Label>Bloom&apos;s Taxonomy Levels</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={level}
                    checked={createAssessmentForm.bloomsLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFormChange('bloomsLevels', [...createAssessmentForm.bloomsLevels, level]);
                      } else {
                        handleFormChange('bloomsLevels', createAssessmentForm.bloomsLevels.filter(l => l !== level));
                      }
                    }}
                  />
                  <Label htmlFor={level} className="text-sm capitalize">{level}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div>
            <Label>Question Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={createAssessmentForm.questionTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFormChange('questionTypes', [...createAssessmentForm.questionTypes, type]);
                      } else {
                        handleFormChange('questionTypes', createAssessmentForm.questionTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  <Label htmlFor={type} className="text-sm">{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Label>Advanced Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdaptive"
                  checked={createAssessmentForm.isAdaptive}
                  onCheckedChange={(checked) => handleFormChange('isAdaptive', checked)}
                />
                <Label htmlFor="isAdaptive">Enable Adaptive Assessment</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shuffleQuestions"
                  checked={createAssessmentForm.shuffleQuestions}
                  onCheckedChange={(checked) => handleFormChange('shuffleQuestions', checked)}
                />
                <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showFeedback"
                  checked={createAssessmentForm.showFeedback}
                  onCheckedChange={(checked) => handleFormChange('showFeedback', checked)}
                />
                <Label htmlFor="showFeedback">Show Immediate Feedback</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowReview"
                  checked={createAssessmentForm.allowReview}
                  onCheckedChange={(checked) => handleFormChange('allowReview', checked)}
                />
                <Label htmlFor="allowReview">Allow Review</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssessment} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <ErrorBoundary>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ClipboardList className="w-6 h-6" />
              <span>Assessment Management</span>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              {renderOverviewTab()}
            </TabsContent>
            
            <TabsContent value="assessments" className="mt-6">
              {renderAssessmentsTab()}
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              {renderAnalyticsTab()}
            </TabsContent>
            
            <TabsContent value="tools" className="mt-6">
              {renderToolsTab()}
            </TabsContent>
          </Tabs>
          
          {renderCreateAssessmentDialog()}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}