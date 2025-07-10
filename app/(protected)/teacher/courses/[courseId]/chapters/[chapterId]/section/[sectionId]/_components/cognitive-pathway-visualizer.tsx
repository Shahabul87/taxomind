"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight,
  Brain,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Lightbulb,
  Route,
  MapPin,
  Flag,
  Zap,
  BookOpen,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel } from "@prisma/client";
import { 
  CognitivePrerequisiteMapper,
  CognitivePathway,
  PrerequisiteMasteryStatus,
  COGNITIVE_PREREQUISITE_MAP,
  SKILL_DEPENDENCIES,
  BridgingActivity
} from "@/lib/cognitive-prerequisite-mapping";

interface CognitivePathwayVisualizerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  studentId?: string;
  currentMasteryLevels?: Record<BloomsLevel, number>;
  targetLevel?: BloomsLevel;
  view?: 'teacher' | 'student';
}

const BLOOM_COLORS = {
  REMEMBER: "#3B82F6", // Blue
  UNDERSTAND: "#10B981", // Green
  APPLY: "#F59E0B", // Amber
  ANALYZE: "#F97316", // Orange
  EVALUATE: "#EF4444", // Red
  CREATE: "#8B5CF6" // Purple
};

const BLOOM_ICONS = {
  REMEMBER: BookOpen,
  UNDERSTAND: Eye,
  APPLY: Settings,
  ANALYZE: Target,
  EVALUATE: Award,
  CREATE: Lightbulb
};

const DIFFICULTY_COLORS = {
  easy: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
  medium: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
  hard: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
};

export const CognitivePathwayVisualizer = ({
  courseId,
  chapterId,
  sectionId,
  studentId,
  currentMasteryLevels = {
    REMEMBER: 0.9,
    UNDERSTAND: 0.8,
    APPLY: 0.6,
    ANALYZE: 0.4,
    EVALUATE: 0.2,
    CREATE: 0.1
  },
  targetLevel = 'CREATE',
  view = 'student'
}: CognitivePathwayVisualizerProps) => {
  const [pathway, setPathway] = useState<CognitivePathway | null>(null);
  const [prerequisiteStatuses, setPrerequisiteStatuses] = useState<Record<BloomsLevel, PrerequisiteMasteryStatus>>({});
  const [selectedLevel, setSelectedLevel] = useState<BloomsLevel | null>(null);
  const [activeTab, setActiveTab] = useState('pathway');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mapper = CognitivePrerequisiteMapper.getInstance();

  useEffect(() => {
    analyzePathway();
  }, [currentMasteryLevels, targetLevel]);

  const analyzePathway = async () => {
    setIsAnalyzing(true);
    try {
      // Find the starting level (highest mastered level)
      const masteredLevels = Object.entries(currentMasteryLevels)
        .filter(([_, mastery]) => mastery >= 0.7)
        .map(([level, _]) => level as BloomsLevel);
      
      const bloomsOrder: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
      const startLevel = masteredLevels.length > 0 
        ? masteredLevels[masteredLevels.length - 1]
        : 'REMEMBER';

      // Generate cognitive pathway
      const generatedPathway = mapper.generateCognitivePathway(
        startLevel,
        targetLevel,
        currentMasteryLevels
      );
      setPathway(generatedPathway);

      // Assess prerequisites for each level
      const statuses: Record<BloomsLevel, PrerequisiteMasteryStatus> = {};
      for (const level of bloomsOrder) {
        statuses[level] = mapper.assessPrerequisiteMastery(level, currentMasteryLevels);
      }
      setPrerequisiteStatuses(statuses);

    } catch (error) {
      console.error('Failed to analyze pathway:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return "text-green-600 dark:text-green-400";
    if (mastery >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    if (mastery >= 0.4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMasteryLevel = (mastery: number) => {
    if (mastery >= 0.9) return "Mastery";
    if (mastery >= 0.8) return "Proficient";
    if (mastery >= 0.6) return "Developing";
    if (mastery >= 0.4) return "Beginning";
    return "Not Started";
  };

  const PathwayVisualization = () => {
    if (!pathway) return null;

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-blue-600" />
            Cognitive Learning Pathway
          </CardTitle>
          <CardDescription>
            Optimal progression route to achieve {targetLevel} level mastery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Pathway Overview */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold">Estimated Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(pathway.totalDevelopmentTime)} hours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Flag className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold">Milestones</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pathway.criticalMilestones.length} checkpoints
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold">Risk Points</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pathway.riskPoints.length} identified
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Pathway */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {pathway.pathway.map((level, index) => {
                  const IconComponent = BLOOM_ICONS[level];
                  const mastery = currentMasteryLevels[level] || 0;
                  const isCompleted = mastery >= 0.8;
                  const isCurrent = !isCompleted && (index === 0 || currentMasteryLevels[pathway.pathway[index - 1]] >= 0.8);
                  
                  return (
                    <div key={level} className="flex items-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                          isCompleted 
                            ? "bg-green-50 dark:bg-green-900/20 border-green-500" 
                            : isCurrent 
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" 
                            : "bg-gray-50 dark:bg-gray-800 border-gray-300"
                        )}
                        onClick={() => setSelectedLevel(level)}
                      >
                        <div className={cn(
                          "p-3 rounded-full mb-2",
                          isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-400"
                        )}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-semibold text-sm">{level}</span>
                        <div className="w-full mt-2">
                          <Progress value={mastery * 100} className="h-2" />
                          <p className={cn("text-xs mt-1", getMasteryColor(mastery))}>
                            {Math.round(mastery * 100)}%
                          </p>
                        </div>
                        
                        {isCompleted && (
                          <CheckCircle2 className="absolute -top-2 -right-2 h-6 w-6 text-green-500 bg-white rounded-full" />
                        )}
                        
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Play className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      
                      {index < pathway.pathway.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-gray-400 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Points */}
            {pathway.riskPoints.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Identified Risk Points:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {pathway.riskPoints.map((risk, index) => (
                      <li key={index} className="text-sm">
                        <strong>{risk.level}:</strong> {risk.riskType} 
                        (Risk: {Math.round(risk.probability * 100)}%)
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const PrerequisiteMatrix = () => {
    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Prerequisite Mastery Matrix
          </CardTitle>
          <CardDescription>
            Current mastery status for each cognitive level's prerequisites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(prerequisiteStatuses).map(([level, status]) => (
              <div key={level} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: BLOOM_COLORS[level as BloomsLevel] }}
                    />
                    <span className="font-semibold">{level}</span>
                    <Badge 
                      variant={status.isReady ? "default" : "secondary"}
                      className={status.isReady ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {status.isReady ? "Ready" : "Needs Work"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-lg font-bold", getMasteryColor(status.readinessScore))}>
                      {Math.round(status.readinessScore * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Readiness</div>
                  </div>
                </div>

                <Progress value={status.readinessScore * 100} className="mb-3" />

                {status.specificDeficits.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Areas for Improvement:
                    </h4>
                    {status.specificDeficits.map((deficit, index) => (
                      <div key={index} className="text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{deficit.skill}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              deficit.deficitSeverity === 'major' ? 'border-red-300 text-red-700' :
                              deficit.deficitSeverity === 'moderate' ? 'border-yellow-300 text-yellow-700' :
                              'border-blue-300 text-blue-700'
                            )}
                          >
                            {deficit.deficitSeverity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Est. remediation: {deficit.estimatedRemediationTime} hours
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {status.recommendedActions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Recommended Actions:
                    </h4>
                    {status.recommendedActions.slice(0, 2).map((action, index) => (
                      <div key={index} className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-between">
                        <span>{action.description}</span>
                        <Badge variant="outline" size="sm">
                          {action.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const BridgingActivitiesView = () => {
    const bloomsOrder: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Bridging Activities
          </CardTitle>
          <CardDescription>
            Specific activities to help transition between cognitive levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {SKILL_DEPENDENCIES.map((dependency, index) => {
              const activities = dependency.bridgingActivities;
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: BLOOM_COLORS[dependency.sourceLevel] }}
                    />
                    <span className="font-medium">{dependency.sourceLevel}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: BLOOM_COLORS[dependency.targetLevel] }}
                    />
                    <span className="font-medium">{dependency.targetLevel}</span>
                    <Badge variant="outline" className="ml-auto">
                      {Math.round(dependency.dependencyStrength * 100)}% dependency
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activities.map((activity, actIndex) => (
                      <div key={actIndex} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{activity.activityType}</Badge>
                          <Badge className={cn("text-xs", DIFFICULTY_COLORS[activity.difficulty])}>
                            {activity.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{activity.description}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{activity.estimatedTime} min</span>
                          <span>Success: {Math.round(activity.successRate * 100)}%</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Cognitive Load:</span>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(i => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    i <= activity.cognitiveLoad ? "bg-orange-400" : "bg-gray-200"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {dependency.commonTransitionErrors.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Common Transition Challenges:
                      </h4>
                      {dependency.commonTransitionErrors.map((error, errIndex) => (
                        <div key={errIndex} className="text-xs mb-2 last:mb-0">
                          <span className="font-medium">{error.description}</span>
                          <span className="text-yellow-700 dark:text-yellow-300 ml-2">
                            ({Math.round(error.frequency * 100)}% frequency)
                          </span>
                          <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                            Solution: {error.interventionStrategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Analyzing cognitive pathway...</span>
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
            Cognitive Learning Pathway
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalized progression route through Bloom's taxonomy levels
          </p>
        </div>
        <Button onClick={analyzePathway} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reanalyze
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pathway">Learning Pathway</TabsTrigger>
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="activities">Bridging Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="pathway" className="space-y-6">
          <PathwayVisualization />
        </TabsContent>

        <TabsContent value="prerequisites" className="space-y-6">
          <PrerequisiteMatrix />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <BridgingActivitiesView />
        </TabsContent>
      </Tabs>
    </div>
  );
};