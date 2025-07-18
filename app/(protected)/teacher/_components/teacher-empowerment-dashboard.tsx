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
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  FileText,
  Lightbulb,
  Settings,
  Download,
  RefreshCw,
  MessageSquare,
  UserCheck,
  Brain,
  Clipboard,
  PenTool,
  Calendar,
  Award,
  Eye,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Share,
  Star,
  Heart,
  Zap,
  Sparkles,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Import new UI components
import { LoadingSpinner, DashboardStatsSkeleton } from './ui/loading-states';
import { FadeIn, SlideIn, AnimatedCounter, HoverLift } from './ui/animations';
import { ErrorBoundary } from './ui/error-handling';
import { AccessibleButton } from './ui/accessibility';
import { OptimizedCard, MemoizedStats } from './ui/performance-optimized';

interface TeacherEmpowermentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  teacherId: string;
}

export function TeacherEmpowermentDashboard({ 
  isOpen, 
  onClose, 
  courseId, 
  teacherId 
}: TeacherEmpowermentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState<any>(null);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [timeframe, setTimeframe] = useState('7_days');
  const [showLessonPlanDialog, setShowLessonPlanDialog] = useState(false);
  const [lessonPlanForm, setLessonPlanForm] = useState({
    planType: 'detailed_lesson',
    subject: '',
    topic: '',
    duration: '60',
    studentLevel: 'intermediate',
    learningObjectives: [''],
    constraints: [''],
    teachingStyle: 'interactive',
    classSize: 25,
    resources: ['']
  });

  // Fetch teacher insights
  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen, selectedMetric, timeframe, fetchInsights]);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sam/ai-tutor/teacher-insights?courseId=${courseId}&metric=${selectedMetric}&timeframe=${timeframe}`);
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, selectedMetric, timeframe]);

  const handleGenerateLessonPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sam/ai-tutor/lesson-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonPlanForm)
      });

      if (response.ok) {
        const data = await response.json();
        setLessonPlans(prev => [...prev, data.lessonPlan]);
        setShowLessonPlanDialog(false);
        toast.success('Lesson plan generated successfully!');
      }
    } catch (error) {
      console.error('Error generating lesson plan:', error);
      toast.error('Failed to generate lesson plan');
    } finally {
      setIsLoading(false);
    }
  }, [lessonPlanForm]);

  const handleFormChange = (field: string, value: any) => {
    setLessonPlanForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field: string, index: number, value: string) => {
    setLessonPlanForm(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayField = (field: string) => {
    setLessonPlanForm(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], '']
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setLessonPlanForm(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index)
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Metrics Selection */}
      <div className="flex items-center space-x-4">
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="at_risk">At-Risk Students</SelectItem>
            <SelectItem value="learning_patterns">Learning Patterns</SelectItem>
            <SelectItem value="content_effectiveness">Content Effectiveness</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">7 Days</SelectItem>
            <SelectItem value="30_days">30 Days</SelectItem>
            <SelectItem value="90_days">90 Days</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={fetchInsights} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : insights ? (
        <FadeIn>
          <MemoizedStats
            data={[
              {
                label: 'Total Students',
                value: insights.metrics?.totalStudents || 0,
                icon: <Users className="w-8 h-8 text-blue-500" />
              },
              {
                label: 'Avg. Performance',
                value: insights.metrics?.averageScore || 0,
                change: insights.metrics?.performanceChange,
                icon: <TrendingUp className="w-8 h-8 text-green-500" />
              },
              {
                label: 'Engagement',
                value: insights.metrics?.engagementRate || 0,
                change: insights.metrics?.engagementChange,
                icon: <Heart className="w-8 h-8 text-red-500" />
              },
              {
                label: 'At Risk',
                value: insights.metrics?.strugglingStudents?.length || 0,
                icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />
              }
            ]}
          />
        </FadeIn>
      ) : null}

      {/* AI-Generated Insights */}
      {insights && (
        <ErrorBoundary>
          <SlideIn direction="up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI-Generated Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {insights.summary}
                  </div>
                </div>
                
                {insights.recommendations && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Key Recommendations:</h4>
                    <ul className="space-y-1">
                      {insights.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </SlideIn>
        </ErrorBoundary>
      )}

      {/* Alerts */}
      {insights?.alerts && (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.alerts.map((alert: any, index: number) => (
                <div key={index} className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg",
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
                )}>
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.action}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowLessonPlanDialog(true)}
              className="flex items-center space-x-2"
            >
              <PenTool className="w-4 h-4" />
              <span>Create Lesson Plan</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Students</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLessonPlanningTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lesson Planning</h3>
        <Button onClick={() => setShowLessonPlanDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Lesson Plan Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HoverLift>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Detailed Lesson Plan</h4>
                  <p className="text-sm text-gray-600">Complete lesson with activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverLift>

        <HoverLift>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Unit Plan</h4>
                  <p className="text-sm text-gray-600">Multi-lesson unit planning</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverLift>

        <HoverLift>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Activity Plan</h4>
                  <p className="text-sm text-gray-600">Interactive activities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverLift>

        <HoverLift>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clipboard className="w-8 h-8 text-orange-500" />
                <div>
                  <h4 className="font-semibold">Assessment Plan</h4>
                  <p className="text-sm text-gray-600">Comprehensive assessment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverLift>

        <HoverLift>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-red-500" />
                <div>
                  <h4 className="font-semibold">Differentiated Plan</h4>
                  <p className="text-sm text-gray-600">Multi-level instruction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </HoverLift>
      </div>

      {/* Recent Lesson Plans */}
      {lessonPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Lesson Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lessonPlans.map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium">{plan.title}</h4>
                      <p className="text-sm text-gray-600">{plan.subject} • {plan.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStudentMonitoringTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Student Monitoring</h3>
        <div className="flex items-center space-x-2">
          <Input placeholder="Search students..." className="w-64" />
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Student Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">32</div>
              <p className="text-sm text-gray-600">On Track</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">8</div>
              <p className="text-sm text-gray-600">Need Support</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">5</div>
              <p className="text-sm text-gray-600">At Risk</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock student data */}
            {[
              { name: 'Sarah Johnson', score: 92, engagement: 95, status: 'excellent' },
              { name: 'Mike Chen', score: 85, engagement: 88, status: 'good' },
              { name: 'Elena Rodriguez', score: 78, engagement: 82, status: 'average' },
              { name: 'John Smith', score: 65, engagement: 45, status: 'at_risk' },
              { name: 'Lisa Brown', score: 72, engagement: 60, status: 'needs_support' }
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">{student.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{student.name}</h4>
                    <p className="text-sm text-gray-600">Score: {student.score}% • Engagement: {student.engagement}%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    student.status === 'excellent' ? 'default' :
                    student.status === 'good' ? 'secondary' :
                    student.status === 'average' ? 'outline' :
                    student.status === 'needs_support' ? 'secondary' : 'destructive'
                  }>
                    {student.status.replace('_', ' ')}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Teaching Resources</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Resource Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <h4 className="font-semibold">Lesson Templates</h4>
                <p className="text-sm text-gray-600">Ready-to-use lesson plans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clipboard className="w-8 h-8 text-green-500" />
              <div>
                <h4 className="font-semibold">Assessment Tools</h4>
                <p className="text-sm text-gray-600">Quizzes, rubrics, and forms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Lightbulb className="w-8 h-8 text-purple-500" />
              <div>
                <h4 className="font-semibold">Activity Ideas</h4>
                <p className="text-sm text-gray-600">Interactive classroom activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Resources */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Resources</CardTitle>
          <CardDescription>Get personalized teaching resources based on your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <div className="text-left">
                <div className="font-medium">Generate Quiz Questions</div>
                <div className="text-sm text-gray-600">Create questions for any topic</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Brain className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Create Rubrics</div>
                <div className="text-sm text-gray-600">Generate assessment rubrics</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <GraduationCap className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">Activity Generator</div>
                <div className="text-sm text-gray-600">Create engaging activities</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <FileText className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">Worksheet Creator</div>
                <div className="text-sm text-gray-600">Generate practice worksheets</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLessonPlanDialog = () => (
    <Dialog open={showLessonPlanDialog} onOpenChange={setShowLessonPlanDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lesson Plan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planType">Plan Type</Label>
              <Select value={lessonPlanForm.planType} onValueChange={(value) => handleFormChange('planType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed_lesson">Detailed Lesson Plan</SelectItem>
                  <SelectItem value="unit_plan">Unit Plan</SelectItem>
                  <SelectItem value="activity_plan">Activity Plan</SelectItem>
                  <SelectItem value="assessment_plan">Assessment Plan</SelectItem>
                  <SelectItem value="differentiated_plan">Differentiated Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={lessonPlanForm.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                placeholder="Enter subject"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={lessonPlanForm.topic}
                onChange={(e) => handleFormChange('topic', e.target.value)}
                placeholder="Enter topic"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={lessonPlanForm.duration}
                onChange={(e) => handleFormChange('duration', e.target.value)}
                placeholder="60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentLevel">Student Level</Label>
              <Select value={lessonPlanForm.studentLevel} onValueChange={(value) => handleFormChange('studentLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="classSize">Class Size</Label>
              <Input
                id="classSize"
                type="number"
                value={lessonPlanForm.classSize}
                onChange={(e) => handleFormChange('classSize', parseInt(e.target.value))}
                placeholder="25"
              />
            </div>
          </div>

          <div>
            <Label>Learning Objectives</Label>
            <div className="space-y-2">
              {lessonPlanForm.learningObjectives.map((objective, index) => (
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLessonPlanDialog(false)}>
              Cancel
            </Button>
            <AccessibleButton
              onClick={handleGenerateLessonPlan}
              disabled={isLoading}
              loading={isLoading}
              ariaLabel="Generate AI lesson plan"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Plan
                </>
              )}
            </AccessibleButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <GraduationCap className="w-6 h-6" />
            <span>Teacher Empowerment Dashboard</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lesson_planning">Lesson Planning</TabsTrigger>
            <TabsTrigger value="student_monitoring">Students</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>
          
          <TabsContent value="lesson_planning" className="mt-6">
            {renderLessonPlanningTab()}
          </TabsContent>
          
          <TabsContent value="student_monitoring" className="mt-6">
            {renderStudentMonitoringTab()}
          </TabsContent>
          
          <TabsContent value="resources" className="mt-6">
            {renderResourcesTab()}
          </TabsContent>
        </Tabs>
        
        {renderLessonPlanDialog()}
      </DialogContent>
    </Dialog>
  );
}