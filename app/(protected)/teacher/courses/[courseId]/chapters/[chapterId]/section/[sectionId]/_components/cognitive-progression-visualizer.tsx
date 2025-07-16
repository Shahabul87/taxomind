"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Target,
  Clock,
  Award,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
  User,
  Users,
  BookOpen,
  Eye,
  Settings,
  Lightbulb,
  Route,
  MapPin,
  Flag,
  Milestone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel } from "@prisma/client";
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from "recharts";

interface CognitiveProgressionVisualizerProps {
  studentId: string;
  courseId: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  view?: 'student' | 'teacher';
}

interface ProgressionDataPoint {
  date: string;
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
  overallMastery: number;
  learningVelocity: number;
  cognitiveLoad: number;
}

interface LearningMilestone {
  id: string;
  date: string;
  bloomsLevel: BloomsLevel;
  achievementType: 'mastery' | 'breakthrough' | 'plateau_overcome' | 'skill_transfer';
  description: string;
  significance: 'minor' | 'major' | 'critical';
  impactScore: number;
}

interface CognitiveTrend {
  bloomsLevel: BloomsLevel;
  direction: 'improving' | 'stable' | 'declining';
  strength: number; // 0-1
  duration: number; // days
  projectedOutcome: string;
  interventionNeeded: boolean;
}

interface ProgressionPrediction {
  bloomsLevel: BloomsLevel;
  currentMastery: number;
  predictedMastery30Days: number;
  predictedMastery90Days: number;
  confidenceInterval: [number, number];
  factorsInfluencing: string[];
  recommendedActions: string[];
}

const BLOOM_COLORS = {
  REMEMBER: "#3B82F6",
  UNDERSTAND: "#10B981", 
  APPLY: "#F59E0B",
  ANALYZE: "#F97316",
  EVALUATE: "#EF4444",
  CREATE: "#8B5CF6"
};

const BLOOM_ICONS = {
  REMEMBER: BookOpen,
  UNDERSTAND: Eye,
  APPLY: Settings,
  ANALYZE: Target,
  EVALUATE: Award,
  CREATE: Lightbulb
};

export const CognitiveProgressionVisualizer = ({
  studentId,
  courseId,
  timeRange = 'month',
  view = 'student'
}: CognitiveProgressionVisualizerProps) => {
  const [progressionData, setProgressionData] = useState<ProgressionDataPoint[]>([]);
  const [milestones, setMilestones] = useState<LearningMilestone[]>([]);
  const [trends, setTrends] = useState<CognitiveTrend[]>([]);
  const [predictions, setPredictions] = useState<ProgressionPrediction[]>([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [isLoading, setIsLoading] = useState(true);

  const generateMockProgressionData = useCallback(() => {
    const days = selectedTimeRange === 'week' ? 7 : 
                 selectedTimeRange === 'month' ? 30 : 
                 selectedTimeRange === 'quarter' ? 90 : 365;
    
    const progression: ProgressionDataPoint[] = [];
    const baseDate = new Date();
    
    // Generate progression data with realistic learning curves
    for (let i = days; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      const timeProgress = (days - i) / days;
      
      progression.push({
        date: date.toISOString().split('T')[0],
        remember: Math.min(1, 0.6 + timeProgress * 0.3 + Math.random() * 0.1),
        understand: Math.min(1, 0.5 + timeProgress * 0.35 + Math.random() * 0.1),
        apply: Math.min(1, 0.3 + timeProgress * 0.4 + Math.random() * 0.1),
        analyze: Math.min(1, 0.2 + timeProgress * 0.35 + Math.random() * 0.1),
        evaluate: Math.min(1, 0.1 + timeProgress * 0.3 + Math.random() * 0.1),
        create: Math.min(1, 0.05 + timeProgress * 0.25 + Math.random() * 0.1),
        overallMastery: 0.3 + timeProgress * 0.4 + Math.random() * 0.1,
        learningVelocity: 0.5 + Math.sin(timeProgress * Math.PI) * 0.3 + Math.random() * 0.2,
        cognitiveLoad: 2 + timeProgress * 1.5 + Math.random() * 0.5
      });
    }

    const milestones: LearningMilestone[] = [
      {
        id: '1',
        date: progression[Math.floor(days * 0.2)].date,
        bloomsLevel: 'REMEMBER',
        achievementType: 'mastery',
        description: 'Achieved 80% mastery in Remember level',
        significance: 'major',
        impactScore: 0.8
      },
      {
        id: '2', 
        date: progression[Math.floor(days * 0.5)].date,
        bloomsLevel: 'UNDERSTAND',
        achievementType: 'breakthrough',
        description: 'Breakthrough in conceptual understanding',
        significance: 'critical',
        impactScore: 0.9
      },
      {
        id: '3',
        date: progression[Math.floor(days * 0.8)].date,
        bloomsLevel: 'APPLY',
        achievementType: 'skill_transfer',
        description: 'Successfully transferred skills to new context',
        significance: 'major',
        impactScore: 0.7
      }
    ];

    const trends: CognitiveTrend[] = [
      {
        bloomsLevel: 'REMEMBER',
        direction: 'stable',
        strength: 0.9,
        duration: 15,
        projectedOutcome: 'Maintain current mastery level',
        interventionNeeded: false
      },
      {
        bloomsLevel: 'UNDERSTAND',
        direction: 'improving',
        strength: 0.7,
        duration: 10,
        projectedOutcome: 'Expected to reach mastery in 2 weeks',
        interventionNeeded: false
      },
      {
        bloomsLevel: 'APPLY',
        direction: 'improving',
        strength: 0.6,
        duration: 8,
        projectedOutcome: 'Steady progress, continue current approach',
        interventionNeeded: false
      },
      {
        bloomsLevel: 'ANALYZE',
        direction: 'stable',
        strength: 0.4,
        duration: 12,
        projectedOutcome: 'Plateau detected, may need intervention',
        interventionNeeded: true
      },
      {
        bloomsLevel: 'EVALUATE',
        direction: 'improving',
        strength: 0.3,
        duration: 5,
        projectedOutcome: 'Early progress, monitor closely',
        interventionNeeded: false
      },
      {
        bloomsLevel: 'CREATE',
        direction: 'stable',
        strength: 0.2,
        duration: 20,
        projectedOutcome: 'Needs foundational work before advancement',
        interventionNeeded: true
      }
    ];

    const predictions: ProgressionPrediction[] = Object.keys(BLOOM_COLORS).map(level => {
      const currentMastery = progression[progression.length - 1][level.toLowerCase() as keyof ProgressionDataPoint] as number;
      return {
        bloomsLevel: level as BloomsLevel,
        currentMastery,
        predictedMastery30Days: Math.min(1, currentMastery + 0.1 + Math.random() * 0.2),
        predictedMastery90Days: Math.min(1, currentMastery + 0.2 + Math.random() * 0.3),
        confidenceInterval: [currentMastery + 0.05, currentMastery + 0.35] as [number, number],
        factorsInfluencing: ['Practice frequency', 'Cognitive load management', 'Prior knowledge'],
        recommendedActions: ['Increase practice time', 'Focus on weak areas', 'Seek additional resources']
      };
    });

    return { progression, milestones, trends, predictions };
  }, [selectedTimeRange]);

  const loadProgressionData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data generation - replace with actual API calls
      const mockData = generateMockProgressionData();
      setProgressionData(mockData.progression);
      setMilestones(mockData.milestones);
      setTrends(mockData.trends);
      setPredictions(mockData.predictions);
    } catch (error) {
      console.error('Failed to load progression data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockProgressionData]);

  useEffect(() => {
    loadProgressionData();
  }, [studentId, courseId, selectedTimeRange, loadProgressionData]);

  const ProgressionTimeline = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Cognitive Progression Timeline
          </CardTitle>
          <CardDescription>
            Learning progress across all Bloom&apos;s taxonomy levels over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} />
              <Tooltip 
                formatter={(value: number) => [`${Math.round(value * 100)}%`, '']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              {Object.entries(BLOOM_COLORS).map(([level, color]) => (
                <Line
                  key={level}
                  type="monotone"
                  dataKey={level.toLowerCase()}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={level}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
          
          {/* Milestones overlay */}
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-sm">Learning Milestones</h4>
            <div className="flex flex-wrap gap-2">
              {milestones.map((milestone) => (
                <Badge
                  key={milestone.id}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    milestone.significance === 'critical' ? 'border-green-500 text-green-700' :
                    milestone.significance === 'major' ? 'border-blue-500 text-blue-700' :
                    'border-gray-400 text-gray-600'
                  )}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {milestone.bloomsLevel} - {milestone.achievementType}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TrendAnalysis = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Cognitive Trend Analysis
          </CardTitle>
          <CardDescription>
            Current learning trends and trajectory for each cognitive level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trends.map((trend) => {
              const IconComponent = BLOOM_ICONS[trend.bloomsLevel];
              const TrendIcon = trend.direction === 'improving' ? TrendingUp :
                              trend.direction === 'declining' ? TrendingDown : 
                              BarChart3;
              
              return (
                <div key={trend.bloomsLevel} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${BLOOM_COLORS[trend.bloomsLevel]}20` }}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: BLOOM_COLORS[trend.bloomsLevel] }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trend.bloomsLevel}</span>
                        <TrendIcon 
                          className={cn(
                            "h-4 w-4",
                            trend.direction === 'improving' ? 'text-green-600' :
                            trend.direction === 'declining' ? 'text-red-600' :
                            'text-gray-600'
                          )}
                        />
                        <Badge variant="outline" className="text-xs">
                          {Math.round(trend.strength * 100)}% strength
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trend.projectedOutcome}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{trend.duration} days</div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                    {trend.interventionNeeded && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const PredictiveAnalysis = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Predictive Learning Analysis
          </CardTitle>
          <CardDescription>
            Forecasted cognitive development and recommended interventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {predictions.map((prediction) => {
              const IconComponent = BLOOM_ICONS[prediction.bloomsLevel];
              const growth30 = prediction.predictedMastery30Days - prediction.currentMastery;
              const growth90 = prediction.predictedMastery90Days - prediction.currentMastery;
              
              return (
                <div key={prediction.bloomsLevel} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${BLOOM_COLORS[prediction.bloomsLevel]}20` }}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: BLOOM_COLORS[prediction.bloomsLevel] }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold">{prediction.bloomsLevel}</span>
                      <div className="text-sm text-gray-500">
                        Current: {Math.round(prediction.currentMastery * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>30-Day Prediction</span>
                          <span className={cn(
                            "font-medium",
                            growth30 > 0.1 ? "text-green-600" : 
                            growth30 > 0.05 ? "text-blue-600" : "text-gray-600"
                          )}>
                            {Math.round(prediction.predictedMastery30Days * 100)}%
                          </span>
                        </div>
                        <Progress value={prediction.predictedMastery30Days * 100} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">
                          Growth: +{Math.round(growth30 * 100)}%
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>90-Day Prediction</span>
                          <span className={cn(
                            "font-medium",
                            growth90 > 0.2 ? "text-green-600" : 
                            growth90 > 0.1 ? "text-blue-600" : "text-gray-600"
                          )}>
                            {Math.round(prediction.predictedMastery90Days * 100)}%
                          </span>
                        </div>
                        <Progress value={prediction.predictedMastery90Days * 100} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">
                          Growth: +{Math.round(growth90 * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Key Factors</h5>
                        <div className="space-y-1">
                          {prediction.factorsInfluencing.slice(0, 3).map((factor, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                              • {factor}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                        <div className="space-y-1">
                          {prediction.recommendedActions.slice(0, 2).map((action, index) => (
                            <div key={index} className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const LearningVelocityChart = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Learning Velocity & Cognitive Load
          </CardTitle>
          <CardDescription>
            Speed of learning and cognitive demand over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={progressionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="learningVelocity" 
                stackId="1"
                stroke="#F59E0B" 
                fill="#F59E0B" 
                fillOpacity={0.6}
                name="Learning Velocity"
              />
              <Area 
                type="monotone" 
                dataKey="cognitiveLoad" 
                stackId="2"
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                name="Cognitive Load"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const MilestoneTimeline = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gold-600" />
            Learning Milestones
          </CardTitle>
          <CardDescription>
            Key achievements and breakthroughs in cognitive development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const IconComponent = BLOOM_ICONS[milestone.bloomsLevel];
              
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "p-2 rounded-full",
                        milestone.significance === 'critical' ? 'bg-green-100 dark:bg-green-900/20' :
                        milestone.significance === 'major' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      <IconComponent 
                        className="h-5 w-5" 
                        style={{ color: BLOOM_COLORS[milestone.bloomsLevel] }}
                      />
                    </div>
                    <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-2" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{milestone.bloomsLevel}</span>
                      <Badge variant="outline" className="text-xs">
                        {milestone.achievementType}
                      </Badge>
                      <Badge 
                        className={cn(
                          "text-xs",
                          milestone.significance === 'critical' ? 'bg-green-100 text-green-800' :
                          milestone.significance === 'major' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        )}
                      >
                        {milestone.significance}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{milestone.date}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span>Impact: {Math.round(milestone.impactScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Loading progression analysis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Route className="h-6 w-6 text-blue-600" />
            Cognitive Progression Analysis
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive view of learning development and trajectory
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <ProgressionTimeline />
          <LearningVelocityChart />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalysis />
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <MilestoneTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
};