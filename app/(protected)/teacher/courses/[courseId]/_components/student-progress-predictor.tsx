"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logger } from '@/lib/logger';
import { 
  Brain,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  Zap,
  Star,
  Activity,
  BarChart3,
  Lightbulb,
  Shield,
  Calendar,
  Map,
  Award,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  UserX,
  Gauge,
  LineChart,
  PieChart,
  Layers,
  Route,
  BookOpen,
  PlayCircle,
  FileText,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface StudentPrediction {
  id: string;
  name: string;
  email: string;
  currentProgress: number;
  predictedCompletion: number;
  completionDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  interventions: string[];
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  performanceIndicators: {
    quizAverage: number;
    assignmentCompletion: number;
    videoEngagement: number;
    discussionParticipation: number;
    timeSpentLearning: number;
  };
  bloomsLevelProgress: Record<string, number>;
  learningPattern: {
    preferredContentType: string;
    optimalLearningTime: string[];
    studyFrequency: string;
    averageSessionLength: number;
  };
  similarStudentOutcomes: {
    successful: number;
    struggled: number;
    dropped: number;
  };
}

interface PredictionModel {
  accuracy: number;
  confidenceInterval: number;
  lastUpdated: string;
  trainingDataSize: number;
  modelVersion: string;
  featureImportance: {
    feature: string;
    importance: number;
    description: string;
  }[];
  performanceMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
}

interface CoursePredictions {
  overallCompletionRate: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  interventionSuccess: {
    early: number;
    medium: number;
    late: number;
  };
  dropoffPredictions: {
    chapter: string;
    riskLevel: number;
    studentsAtRisk: number;
  }[];
}

interface StudentProgressPredictorProps {
  courseId: string;
  courseTitle: string;
}

export const StudentProgressPredictor = ({ 
  courseId, 
  courseTitle 
}: StudentProgressPredictorProps) => {
  const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
  const [coursePredictions, setCoursePredictions] = useState<CoursePredictions | null>(null);
  const [modelInfo, setModelInfo] = useState<PredictionModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPrediction | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('risk');
  const [showModelDetails, setShowModelDetails] = useState(false);

  const generateRiskFactors = (riskLevel: string): string[] => {
    const factors = {
      low: ['Consistent engagement', 'Strong quiz performance'],
      medium: ['Irregular login patterns', 'Below average quiz scores'],
      high: ['Extended periods of inactivity', 'Low assignment completion rate', 'Declining engagement'],
      critical: ['No activity in 2+ weeks', 'Multiple failed assessments', 'Zero discussion participation']
    };
    return factors[riskLevel as keyof typeof factors] || [];
  };

  const generateRecommendations = (riskLevel: string): string[] => {
    const recommendations = {
      low: ['Continue current learning approach', 'Consider peer mentoring opportunities'],
      medium: ['Establish regular study schedule', 'Utilize available office hours'],
      high: ['Schedule one-on-one support session', 'Access supplementary learning materials'],
      critical: ['Immediate intervention required', 'Consider course extension or intensive support']
    };
    return recommendations[riskLevel as keyof typeof recommendations] || [];
  };

  const generateInterventions = (riskLevel: string): string[] => {
    const interventions = {
      low: ['Encourage advanced projects', 'Peer teaching opportunities'],
      medium: ['Send progress reminders', 'Provide study guides'],
      high: ['Personal check-in call', 'Assign learning buddy'],
      critical: ['Emergency academic support', 'Alternative learning path']
    };
    return interventions[riskLevel as keyof typeof interventions] || [];
  };

  const generateMockPredictions = useCallback(() => {
    const mockStudents: StudentPrediction[] = Array.from({ length: 15 }, (_, index) => {
      const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
      const riskLevel = riskLevels[Math.floor(Math.random() * 4)];
      const currentProgress = Math.random() * 100;
      
      return {
        id: `student-${index + 1}`,
        name: `Student ${index + 1}`,
        email: `student${index + 1}@example.com`,
        currentProgress,
        predictedCompletion: Math.max(currentProgress, Math.random() * 100),
        completionDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel,
        riskFactors: generateRiskFactors(riskLevel),
        recommendations: generateRecommendations(riskLevel),
        interventions: generateInterventions(riskLevel),
        engagementTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as any,
        performanceIndicators: {
          quizAverage: 60 + Math.random() * 35,
          assignmentCompletion: Math.random() * 100,
          videoEngagement: Math.random() * 100,
          discussionParticipation: Math.random() * 100,
          timeSpentLearning: 10 + Math.random() * 50
        },
        bloomsLevelProgress: {
          REMEMBER: 70 + Math.random() * 30,
          UNDERSTAND: 60 + Math.random() * 35,
          APPLY: 50 + Math.random() * 40,
          ANALYZE: 40 + Math.random() * 45,
          EVALUATE: 30 + Math.random() * 50,
          CREATE: 20 + Math.random() * 55
        },
        learningPattern: {
          preferredContentType: ['video', 'text', 'interactive', 'quiz'][Math.floor(Math.random() * 4)],
          optimalLearningTime: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)] === 'morning' ? ['9:00', '11:00'] : 
                              ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)] === 'afternoon' ? ['14:00', '16:00'] : ['19:00', '21:00'],
          studyFrequency: ['daily', 'every-other-day', 'weekly', 'irregular'][Math.floor(Math.random() * 4)],
          averageSessionLength: 15 + Math.random() * 45
        },
        similarStudentOutcomes: {
          successful: Math.round(50 + Math.random() * 40),
          struggled: Math.round(10 + Math.random() * 30),
          dropped: Math.round(5 + Math.random() * 20)
        }
      };
    });

    setPredictions(mockStudents);
    
    setCoursePredictions({
      overallCompletionRate: 73.2,
      riskDistribution: {
        low: 60,
        medium: 25,
        high: 12,
        critical: 3
      },
      interventionSuccess: {
        early: 85,
        medium: 68,
        late: 42
      },
      dropoffPredictions: [
        { chapter: 'Chapter 4: Advanced Concepts', riskLevel: 0.75, studentsAtRisk: 23 },
        { chapter: 'Chapter 6: Complex Applications', riskLevel: 0.62, studentsAtRisk: 18 },
        { chapter: 'Chapter 8: Final Project', riskLevel: 0.58, studentsAtRisk: 15 }
      ]
    });

    setModelInfo({
      accuracy: 0.847,
      confidenceInterval: 0.023,
      lastUpdated: new Date().toISOString(),
      trainingDataSize: 12847,
      modelVersion: '2.1.3',
      featureImportance: [
        { feature: 'Video Engagement', importance: 0.23, description: 'Time spent watching course videos' },
        { feature: 'Quiz Performance', importance: 0.19, description: 'Average scores on knowledge assessments' },
        { feature: 'Assignment Completion', importance: 0.17, description: 'Percentage of assignments submitted on time' },
        { feature: 'Discussion Participation', importance: 0.14, description: 'Active participation in course discussions' },
        { feature: 'Login Frequency', importance: 0.12, description: 'How often student accesses the course' },
        { feature: 'Time Spent Learning', importance: 0.11, description: 'Total active learning time per week' },
        { feature: 'Help-Seeking Behavior', importance: 0.04, description: 'Frequency of reaching out for assistance' }
      ],
      performanceMetrics: {
        precision: 0.823,
        recall: 0.791,
        f1Score: 0.807,
        auc: 0.889
      }
    });
  }, []);

  const loadPredictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/predictions`);
      if (!response.ok) throw new Error('Failed to load predictions');
      
      const data = await response.json();
      setPredictions(data.studentPredictions);
      setCoursePredictions(data.coursePredictions);
      setModelInfo(data.modelInfo);
      
      toast.success("Predictions updated");
    } catch (error) {
      logger.error('Error loading predictions:', error);
      toast.error('Failed to load predictions');
      
      // Mock data for demonstration
      generateMockPredictions();
    } finally {
      setIsLoading(false);
    }
  }, [courseId, generateMockPredictions]);

  useEffect(() => {
    loadPredictions();
  }, [courseId, loadPredictions]);

  const filteredAndSortedPredictions = () => {
    let filtered = predictions;
    
    if (filterRisk !== 'all') {
      filtered = predictions.filter(p => p.riskLevel === filterRisk);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        case 'progress':
          return b.currentProgress - a.currentProgress;
        case 'prediction':
          return b.predictedCompletion - a.predictedCompletion;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const OverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Low Risk</p>
              <p className="text-2xl font-bold text-green-700">
                {coursePredictions?.riskDistribution.low}%
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Medium Risk</p>
              <p className="text-2xl font-bold text-yellow-700">
                {coursePredictions?.riskDistribution.medium}%
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">High Risk</p>
              <p className="text-2xl font-bold text-orange-700">
                {coursePredictions?.riskDistribution.high}%
              </p>
            </div>
            <UserX className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Critical</p>
              <p className="text-2xl font-bold text-red-700">
                {coursePredictions?.riskDistribution.critical}%
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StudentList = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Student Risk Assessment
            </CardTitle>
            <CardDescription>
              Individual student progress predictions and risk analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Sort by Risk</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="prediction">Prediction</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredAndSortedPredictions().map((student) => (
            <div
              key={student.id}
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Current / Predicted</div>
                    <div className="font-medium">
                      {Math.round(student.currentProgress)}% / {Math.round(student.predictedCompletion)}%
                    </div>
                  </div>
                  <Badge className={getRiskColor(student.riskLevel)}>
                    {student.riskLevel}
                  </Badge>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={student.currentProgress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const ModelDetails = () => (
    <Dialog open={showModelDetails} onOpenChange={setShowModelDetails}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prediction Model Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">{((modelInfo?.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Precision:</span>
                  <span className="font-medium">{((modelInfo?.performanceMetrics.precision || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Recall:</span>
                  <span className="font-medium">{((modelInfo?.performanceMetrics.recall || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>F1 Score:</span>
                  <span className="font-medium">{((modelInfo?.performanceMetrics.f1Score || 0) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">{modelInfo?.modelVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Data:</span>
                  <span className="font-medium">{modelInfo?.trainingDataSize.toLocaleString()} records</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium">
                    {modelInfo ? new Date(modelInfo.lastUpdated).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-medium">±{((modelInfo?.confidenceInterval || 0) * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Importance</CardTitle>
              <CardDescription>
                Factors that most influence prediction accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modelInfo?.featureImportance.map((feature, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{feature.feature}</span>
                      <span>{(feature.importance * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={feature.importance * 100} className="h-2" />
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Generating predictions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            Student Progress Predictor
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered predictions for student success in {courseTitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowModelDetails(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Model Details
          </Button>
          <Button variant="outline" size="sm" onClick={loadPredictions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <OverviewMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Completion Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {coursePredictions?.overallCompletionRate}%
              </div>
              <p className="text-sm text-gray-600">
                Predicted course completion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Intervention Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Early Intervention:</span>
                <span className="font-medium">{coursePredictions?.interventionSuccess.early}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium Intervention:</span>
                <span className="font-medium">{coursePredictions?.interventionSuccess.medium}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Late Intervention:</span>
                <span className="font-medium">{coursePredictions?.interventionSuccess.late}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StudentList />

      {coursePredictions?.dropoffPredictions && coursePredictions.dropoffPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Predicted Drop-off Points
            </CardTitle>
            <CardDescription>
              Sections where students are most likely to struggle or drop out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coursePredictions.dropoffPredictions.map((prediction, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{prediction.chapter}</strong> - {prediction.studentsAtRisk} students at risk 
                    (Risk Level: {Math.round(prediction.riskLevel * 100)}%)
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ModelDetails />

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Progress Analysis: {selectedStudent.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-medium">{Math.round(selectedStudent.currentProgress)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Predicted Completion:</span>
                      <span className="font-medium">{Math.round(selectedStudent.predictedCompletion)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <Badge className={getRiskColor(selectedStudent.riskLevel)}>
                        {selectedStudent.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Engagement Trend:</span>
                      <span className={cn(
                        "font-medium",
                        selectedStudent.engagementTrend === 'increasing' && "text-green-600",
                        selectedStudent.engagementTrend === 'stable' && "text-blue-600",
                        selectedStudent.engagementTrend === 'decreasing' && "text-red-600"
                      )}>
                        {selectedStudent.engagementTrend}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quiz Average:</span>
                        <span>{Math.round(selectedStudent.performanceIndicators.quizAverage)}%</span>
                      </div>
                      <Progress value={selectedStudent.performanceIndicators.quizAverage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Assignment Completion:</span>
                        <span>{Math.round(selectedStudent.performanceIndicators.assignmentCompletion)}%</span>
                      </div>
                      <Progress value={selectedStudent.performanceIndicators.assignmentCompletion} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Video Engagement:</span>
                        <span>{Math.round(selectedStudent.performanceIndicators.videoEngagement)}%</span>
                      </div>
                      <Progress value={selectedStudent.performanceIndicators.videoEngagement} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Risk Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedStudent.riskFactors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedStudent.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};