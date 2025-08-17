"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Brain, 
  Dna, 
  Users, 
  Sparkles, 
  Activity, 
  Target, 
  TrendingUp, 
  Zap,
  BookOpen,
  Heart,
  Smile,
  Timer,
  Trophy,
  Shield,
  Cpu,
  BarChart3,
  Clock,
  MessageCircle,
  Gamepad2,
  Lightbulb,
  PieChart,
  Flame,
  Star,
  ChevronRight,
  RefreshCw,
  Settings,
  Info,
  Play,
  Pause,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Gem,
  Lock,
  Unlock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { User } from "next-auth";

// Types for Innovation Features
interface CognitiveFitnessData {
  overallScore: number;
  dimensions: {
    memory: number;
    focus: number;
    reasoning: number;
    creativity: number;
    processing: number;
  };
  exercises: CognitiveExercise[];
  history: CognitiveMeasurement[];
  recommendations: string[];
}

interface CognitiveExercise {
  id: string;
  name: string;
  type: 'memory' | 'focus' | 'reasoning' | 'creativity' | 'processing';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // minutes
  description: string;
  completed: boolean;
  score?: number;
  icon: any;
}

interface CognitiveMeasurement {
  date: Date;
  score: number;
  improvements: string[];
}

interface LearningDNAProfile {
  id: string;
  strengths: string[];
  challenges: string[];
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  intelligenceTypes: {
    linguistic: number;
    logical: number;
    spatial: number;
    musical: number;
    kinesthetic: number;
    interpersonal: number;
    intrapersonal: number;
    naturalist: number;
  };
  personalityTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  optimalConditions: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    sessionLength: number; // minutes
    breakFrequency: number; // minutes
    environment: 'quiet' | 'moderate' | 'lively';
    collaboration: 'solo' | 'pair' | 'group';
  };
}

interface StudyBuddyAI {
  id: string;
  name: string;
  personality: 'encouraging' | 'analytical' | 'creative' | 'practical' | 'balanced';
  avatar: string;
  mood: 'happy' | 'focused' | 'excited' | 'calm' | 'supportive';
  currentAdvice: string;
  learningInsights: string[];
  motivationalQuotes: string[];
  studyTips: string[];
  emotionalState: {
    energy: number;
    focus: number;
    motivation: number;
    stress: number;
  };
}

interface QuantumPath {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  estimatedTime: string;
  progress: number;
  milestones: QuantumMilestone[];
  branches: QuantumBranch[];
  rewards: QuantumReward[];
  status: 'locked' | 'available' | 'in-progress' | 'completed';
}

interface QuantumMilestone {
  id: string;
  name: string;
  completed: boolean;
  requiredScore: number;
  currentScore: number;
  skills: string[];
}

interface QuantumBranch {
  id: string;
  name: string;
  type: 'main' | 'optional' | 'bonus';
  unlocked: boolean;
  requirements: string[];
}

interface QuantumReward {
  id: string;
  name: string;
  type: 'badge' | 'skill' | 'certificate' | 'unlock';
  earned: boolean;
  icon: any;
}

interface SAMInnovationFeaturesProps {
  user: User;
  className?: string;
}

export function SAMInnovationFeatures({ user, className }: SAMInnovationFeaturesProps) {
  // State management
  const [activeTab, setActiveTab] = useState<"cognitive" | "dna" | "buddy" | "quantum">("cognitive");
  const [isLoading, setIsLoading] = useState(true);
  const [cognitiveData, setCognitiveData] = useState<CognitiveFitnessData | null>(null);
  const [learningDNA, setLearningDNA] = useState<LearningDNAProfile | null>(null);
  const [studyBuddy, setStudyBuddy] = useState<StudyBuddyAI | null>(null);
  const [quantumPaths, setQuantumPaths] = useState<QuantumPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<QuantumPath | null>(null);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<CognitiveExercise | null>(null);
  const [buddyMessage, setBuddyMessage] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch innovation data
  const fetchInnovationData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls - in real implementation, these would be actual API endpoints
      // Fetch cognitive fitness data
      const mockCognitiveData: CognitiveFitnessData = {
        overallScore: 78,
        dimensions: {
          memory: 82,
          focus: 75,
          reasoning: 85,
          creativity: 72,
          processing: 76
        },
        exercises: [
          {
            id: "ex-1",
            name: "Memory Matrix",
            type: "memory",
            difficulty: "medium",
            duration: 5,
            description: "Remember patterns in a growing matrix",
            completed: false,
            icon: Brain
          },
          {
            id: "ex-2",
            name: "Focus Flow",
            type: "focus",
            difficulty: "easy",
            duration: 3,
            description: "Track moving objects while avoiding distractions",
            completed: true,
            score: 85,
            icon: Target
          },
          {
            id: "ex-3",
            name: "Logic Puzzles",
            type: "reasoning",
            difficulty: "hard",
            duration: 10,
            description: "Solve complex logical reasoning challenges",
            completed: false,
            icon: Cpu
          },
          {
            id: "ex-4",
            name: "Creative Canvas",
            type: "creativity",
            difficulty: "medium",
            duration: 7,
            description: "Generate unique solutions to open-ended problems",
            completed: false,
            icon: Lightbulb
          },
          {
            id: "ex-5",
            name: "Speed Processing",
            type: "processing",
            difficulty: "easy",
            duration: 2,
            description: "Quick decision-making under time pressure",
            completed: true,
            score: 92,
            icon: Zap
          }
        ],
        history: [
          { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), score: 72, improvements: ["Memory improved by 5%"] },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), score: 75, improvements: ["Focus enhanced", "Processing speed increased"] },
          { date: new Date(), score: 78, improvements: ["Overall cognitive fitness improved by 8%"] }
        ],
        recommendations: [
          "Practice memory exercises daily for optimal retention",
          "Take 5-minute focus breaks every hour",
          "Engage in creative activities to boost innovation",
          "Challenge yourself with harder reasoning puzzles"
        ]
      };

      // Fetch learning DNA profile
      const mockLearningDNA: LearningDNAProfile = {
        id: "dna-1",
        strengths: ["Visual processing", "Logical reasoning", "Pattern recognition", "Quick learning"],
        challenges: ["Extended focus", "Auditory processing", "Group collaboration"],
        learningStyle: {
          visual: 85,
          auditory: 45,
          kinesthetic: 70,
          reading: 80
        },
        intelligenceTypes: {
          linguistic: 75,
          logical: 90,
          spatial: 85,
          musical: 40,
          kinesthetic: 70,
          interpersonal: 65,
          intrapersonal: 80,
          naturalist: 55
        },
        personalityTraits: {
          openness: 85,
          conscientiousness: 78,
          extraversion: 52,
          agreeableness: 70,
          neuroticism: 35
        },
        optimalConditions: {
          timeOfDay: 'morning',
          sessionLength: 45,
          breakFrequency: 15,
          environment: 'quiet',
          collaboration: 'solo'
        }
      };

      // Initialize Study Buddy AI
      const mockStudyBuddy: StudyBuddyAI = {
        id: "buddy-1",
        name: "Nova",
        personality: "encouraging",
        avatar: "/avatars/ai-buddy-nova.png",
        mood: "happy",
        currentAdvice: "Great to see you today! Based on your learning DNA, morning sessions work best for you. Let's make the most of this time!",
        learningInsights: [
          "You learn 40% faster with visual aids",
          "Your logical reasoning skills are exceptional",
          "Short, focused sessions yield best results for you",
          "You retain information better when studying alone"
        ],
        motivationalQuotes: [
          "Every expert was once a beginner. You're making great progress!",
          "Your unique learning style is your superpower!",
          "Small steps daily lead to big achievements!"
        ],
        studyTips: [
          "Use mind maps and diagrams for complex topics",
          "Take a 5-minute break every 45 minutes",
          "Review notes within 24 hours for better retention",
          "Practice active recall instead of passive reading"
        ],
        emotionalState: {
          energy: 85,
          focus: 78,
          motivation: 90,
          stress: 25
        }
      };

      // Fetch quantum learning paths
      const mockQuantumPaths: QuantumPath[] = [
        {
          id: "path-1",
          name: "React Mastery Quantum Path",
          description: "Master React through adaptive micro-learning with quantum branching",
          difficulty: 7,
          estimatedTime: "6 weeks",
          progress: 35,
          status: "in-progress",
          milestones: [
            {
              id: "m1",
              name: "React Fundamentals",
              completed: true,
              requiredScore: 80,
              currentScore: 92,
              skills: ["Components", "Props", "State"]
            },
            {
              id: "m2",
              name: "Advanced Hooks",
              completed: false,
              requiredScore: 85,
              currentScore: 42,
              skills: ["useEffect", "useContext", "Custom Hooks"]
            },
            {
              id: "m3",
              name: "Performance Optimization",
              completed: false,
              requiredScore: 90,
              currentScore: 0,
              skills: ["Memoization", "Code Splitting", "Lazy Loading"]
            }
          ],
          branches: [
            {
              id: "b1",
              name: "State Management Deep Dive",
              type: "optional",
              unlocked: true,
              requirements: ["Complete React Fundamentals"]
            },
            {
              id: "b2",
              name: "React Native Path",
              type: "bonus",
              unlocked: false,
              requirements: ["Complete Advanced Hooks", "Mobile Development Interest"]
            }
          ],
          rewards: [
            {
              id: "r1",
              name: "React Rookie",
              type: "badge",
              earned: true,
              icon: Award
            },
            {
              id: "r2",
              name: "Hook Master",
              type: "skill",
              earned: false,
              icon: Trophy
            }
          ]
        },
        {
          id: "path-2",
          name: "AI/ML Foundations Quantum Path",
          description: "Explore AI and Machine Learning with personalized quantum branches",
          difficulty: 8,
          estimatedTime: "12 weeks",
          progress: 0,
          status: "available",
          milestones: [
            {
              id: "m1",
              name: "Mathematics for ML",
              completed: false,
              requiredScore: 75,
              currentScore: 0,
              skills: ["Linear Algebra", "Statistics", "Calculus"]
            }
          ],
          branches: [
            {
              id: "b1",
              name: "Deep Learning Track",
              type: "main",
              unlocked: false,
              requirements: ["Complete Mathematics for ML"]
            }
          ],
          rewards: [
            {
              id: "r1",
              name: "AI Explorer",
              type: "certificate",
              earned: false,
              icon: Star
            }
          ]
        }
      ];

      setCognitiveData(mockCognitiveData);
      setLearningDNA(mockLearningDNA);
      setStudyBuddy(mockStudyBuddy);
      setQuantumPaths(mockQuantumPaths);
      setSelectedPath(mockQuantumPaths.find(p => p.status === "in-progress") || mockQuantumPaths[0]);

    } catch (error: any) {
      logger.error("Error fetching innovation data:", error);
      toast.error("Failed to load SAM Innovation features");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Complete cognitive exercise
  const completeExercise = useCallback((exercise: CognitiveExercise, score: number) => {
    if (!cognitiveData) return;

    const updatedExercises = cognitiveData.exercises.map(ex => 
      ex.id === exercise.id ? { ...ex, completed: true, score } : ex
    );

    setCognitiveData({
      ...cognitiveData,
      exercises: updatedExercises,
      overallScore: cognitiveData.overallScore + 1
    });

    setIsExerciseActive(false);
    setCurrentExercise(null);
    
    toast.success(`Exercise completed! Score: ${score}/100`);
    
    // Update study buddy response
    if (studyBuddy) {
      const newMessage = score > 80 
        ? "Fantastic work! Your cognitive fitness is improving rapidly!" 
        : "Good effort! Keep practicing to boost your score even higher!";
      
      setStudyBuddy({
        ...studyBuddy,
        currentAdvice: newMessage,
        mood: score > 80 ? 'excited' : 'supportive'
      });
    }
  }, [cognitiveData, studyBuddy]);

  // Start cognitive exercise
  const startExercise = useCallback((exercise: CognitiveExercise) => {
    setCurrentExercise(exercise);
    setIsExerciseActive(true);
    toast.success(`Starting ${exercise.name}...`);
    
    // In real implementation, this would navigate to the exercise interface
    setTimeout(() => {
      completeExercise(exercise, Math.floor(Math.random() * 30) + 70);
    }, 3000);
  }, [completeExercise]);

  // Ask study buddy for advice
  const askStudyBuddy = useCallback(async () => {
    if (!studyBuddy || !buddyMessage.trim()) return;

    // Simulate AI response
    const responses = [
      "Based on your learning DNA, try using visual diagrams for this concept.",
      "Your peak focus time is in the morning. Schedule challenging tasks then!",
      "Remember to take a break soon - your optimal session length is 45 minutes.",
      "Great question! Let me analyze your learning patterns to provide the best advice...",
      "Your logical reasoning strength makes you perfect for this type of problem!"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setStudyBuddy({
      ...studyBuddy,
      currentAdvice: randomResponse,
      mood: 'focused'
    });

    setBuddyMessage("");
    toast.success("Study Buddy is thinking...");
  }, [studyBuddy, buddyMessage]);

  // Initialize on mount
  useEffect(() => {
    fetchInnovationData();
  }, [fetchInnovationData]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Update real-time metrics
      setStudyBuddy(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          emotionalState: {
            energy: Math.max(0, Math.min(100, prev.emotionalState.energy + (Math.random() - 0.5) * 10)),
            focus: Math.max(0, Math.min(100, prev.emotionalState.focus + (Math.random() - 0.5) * 10)),
            motivation: Math.max(0, Math.min(100, prev.emotionalState.motivation + (Math.random() - 0.5) * 5)),
            stress: Math.max(0, Math.min(100, prev.emotionalState.stress + (Math.random() - 0.5) * 8))
          }
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700/50 backdrop-blur-sm", className)}>
        <CardContent className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Brain className="h-12 w-12 text-purple-400 animate-pulse" />
            <p className="text-slate-400">Loading SAM Innovation Features...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700/50 backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">SAM Innovation Hub</CardTitle>
              <CardDescription className="text-slate-400">
                Advanced AI-powered learning features for {user.name}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh" className="text-sm text-slate-400">Live Updates</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={(checked) => setAutoRefresh(checked)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="cognitive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Cognitive Fitness</span>
            </TabsTrigger>
            <TabsTrigger value="dna" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Learning DNA</span>
            </TabsTrigger>
            <TabsTrigger value="buddy" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Study Buddy</span>
            </TabsTrigger>
            <TabsTrigger value="quantum" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Quantum Paths</span>
            </TabsTrigger>
          </TabsList>

          {/* Cognitive Fitness Tab */}
          <TabsContent value="cognitive" className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-700/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Cognitive Fitness Score
                </h3>
                <Badge variant="outline" className="text-purple-300 border-purple-600">
                  Level {Math.floor(cognitiveData?.overallScore! / 20) + 1}
                </Badge>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (cognitiveData?.overallScore || 0) / 100)}`}
                      className="text-purple-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{cognitiveData?.overallScore}</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {Object.entries(cognitiveData?.dimensions || {}).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 capitalize">{key}</span>
                        <span className="text-white font-medium">{value}%</span>
                      </div>
                      <Progress value={value} className="h-2 bg-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cognitive Exercises */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-400" />
                Brain Training Exercises
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cognitiveData?.exercises.map((exercise) => {
                  const Icon = exercise.icon;
                  return (
                    <div
                      key={exercise.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all cursor-pointer",
                        exercise.completed 
                          ? "bg-green-900/20 border-green-700/50" 
                          : "bg-slate-900/50 border-slate-700/50 hover:border-purple-600/50"
                      )}
                      onClick={() => !exercise.completed && startExercise(exercise)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          exercise.completed ? "bg-green-600/20" : "bg-purple-600/20"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            exercise.completed ? "text-green-400" : "text-purple-400"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-white">{exercise.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                exercise.difficulty === 'easy' && "text-green-400 border-green-600",
                                exercise.difficulty === 'medium' && "text-yellow-400 border-yellow-600",
                                exercise.difficulty === 'hard' && "text-red-400 border-red-600"
                              )}
                            >
                              {exercise.difficulty}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-400 mb-2">{exercise.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {exercise.duration} min
                            </span>
                            
                            {exercise.completed ? (
                              <span className="text-sm font-medium text-green-400">
                                Score: {exercise.score}/100
                              </span>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-purple-400 hover:text-purple-300"
                              >
                                Start
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/30">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-400" />
                Personalized Recommendations
              </h4>
              <ul className="space-y-2">
                {cognitiveData?.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* Learning DNA Tab */}
          <TabsContent value="dna" className="space-y-6">
            {/* DNA Overview */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Dna className="h-5 w-5 text-blue-400" />
                Your Unique Learning DNA Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Learning Styles */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Learning Style Preferences</h4>
                  <div className="space-y-3">
                    {Object.entries(learningDNA?.learningStyle || {}).map(([style, percentage]) => (
                      <div key={style} className="flex items-center gap-3">
                        <span className="text-sm text-slate-300 w-20 capitalize">{style}</span>
                        <Progress value={percentage} className="flex-1 h-2 bg-slate-700" />
                        <span className="text-sm font-medium text-white w-12 text-right">{percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multiple Intelligences */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Intelligence Profile</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(learningDNA?.intelligenceTypes || {}).slice(0, 4).map(([type, score]) => (
                      <div key={type} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400 capitalize">{type}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              score >= 80 && "text-green-400 border-green-600",
                              score >= 60 && score < 80 && "text-yellow-400 border-yellow-600",
                              score < 60 && "text-red-400 border-red-600"
                            )}
                          >
                            {score}
                          </Badge>
                        </div>
                        <Progress value={score} className="h-1.5 bg-slate-700" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Your Strengths
                </h4>
                <div className="space-y-2">
                  {learningDNA?.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-slate-300">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-700/30">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  Growth Areas
                </h4>
                <div className="space-y-2">
                  {learningDNA?.challenges.map((challenge, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-slate-300">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Optimal Learning Conditions */}
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700/30">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                Optimal Learning Conditions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Best Time</p>
                  <p className="text-sm font-medium text-white capitalize">{learningDNA?.optimalConditions.timeOfDay}</p>
                </div>
                <div className="text-center">
                  <Timer className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Session Length</p>
                  <p className="text-sm font-medium text-white">{learningDNA?.optimalConditions.sessionLength} min</p>
                </div>
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Break Every</p>
                  <p className="text-sm font-medium text-white">{learningDNA?.optimalConditions.breakFrequency} min</p>
                </div>
                <div className="text-center">
                  <Volume2 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Environment</p>
                  <p className="text-sm font-medium text-white capitalize">{learningDNA?.optimalConditions.environment}</p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Collaboration</p>
                  <p className="text-sm font-medium text-white capitalize">{learningDNA?.optimalConditions.collaboration}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Study Buddy Tab */}
          <TabsContent value="buddy" className="space-y-6">
            {/* Study Buddy Interface */}
            <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-6 border border-indigo-700/30">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-indigo-500">
                  <AvatarImage src={studyBuddy?.avatar} alt={studyBuddy?.name} />
                  <AvatarFallback className="bg-indigo-600 text-white text-xl">
                    {studyBuddy?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{studyBuddy?.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        studyBuddy?.mood === 'happy' && "text-green-400 border-green-600",
                        studyBuddy?.mood === 'focused' && "text-blue-400 border-blue-600",
                        studyBuddy?.mood === 'excited' && "text-yellow-400 border-yellow-600",
                        studyBuddy?.mood === 'calm' && "text-purple-400 border-purple-600",
                        studyBuddy?.mood === 'supportive' && "text-pink-400 border-pink-600"
                      )}
                    >
                      <Smile className="h-3 w-3 mr-1" />
                      {studyBuddy?.mood}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-2">AI Study Companion • {studyBuddy?.personality} personality</p>
                  
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-white">{studyBuddy?.currentAdvice}</p>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={buddyMessage}
                  onChange={(e) => setBuddyMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askStudyBuddy()}
                  placeholder="Ask your study buddy anything..."
                  className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Button 
                  onClick={askStudyBuddy}
                  disabled={!buddyMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Emotional State Monitor */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                Your Current State
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(studyBuddy?.emotionalState || {}).map(([state, value]) => (
                  <div key={state} className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-700"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - value / 100)}`}
                          className={cn(
                            "transition-all duration-1000",
                            state === 'energy' && "text-yellow-500",
                            state === 'focus' && "text-blue-500",
                            state === 'motivation' && "text-green-500",
                            state === 'stress' && "text-red-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{value}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 capitalize">{state}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/30">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-400" />
                  Learning Insights
                </h4>
                <ul className="space-y-2">
                  {studyBuddy?.learningInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700/30">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-400" />
                  Study Tips
                </h4>
                <ul className="space-y-2">
                  {studyBuddy?.studyTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Quantum Paths Tab */}
          <TabsContent value="quantum" className="space-y-6">
            {/* Path Selector */}
            <div className="flex items-center gap-4 mb-6">
              <Select
                value={selectedPath?.id}
                onValueChange={(value) => setSelectedPath(quantumPaths.find(p => p.id === value) || null)}
              >
                <SelectTrigger className="w-64 bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select a learning path" />
                </SelectTrigger>
                <SelectContent>
                  {quantumPaths.map((path) => (
                    <SelectItem key={path.id} value={path.id}>
                      <div className="flex items-center gap-2">
                        {path.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-400" />}
                        {path.status === 'in-progress' && <Clock className="h-4 w-4 text-blue-400" />}
                        {path.status === 'locked' && <Lock className="h-4 w-4 text-red-400" />}
                        {path.status === 'available' && <Unlock className="h-4 w-4 text-yellow-400" />}
                        <span>{path.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Badge 
                variant="outline" 
                className={cn(
                  "ml-auto",
                  selectedPath?.status === 'completed' && "text-green-400 border-green-600",
                  selectedPath?.status === 'in-progress' && "text-blue-400 border-blue-600",
                  selectedPath?.status === 'locked' && "text-red-400 border-red-600",
                  selectedPath?.status === 'available' && "text-yellow-400 border-yellow-600"
                )}
              >
                {selectedPath?.status}
              </Badge>
            </div>

            {selectedPath && (
              <>
                {/* Path Overview */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg p-6 border border-cyan-700/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{selectedPath.name}</h3>
                      <p className="text-sm text-slate-400">{selectedPath.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-white">Difficulty: {selectedPath.difficulty}/10</span>
                      </div>
                      <p className="text-xs text-slate-400">Est. {selectedPath.estimatedTime}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Overall Progress</span>
                      <span className="text-white font-medium">{selectedPath.progress}%</span>
                    </div>
                    <Progress value={selectedPath.progress} className="h-3 bg-slate-700" />
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-400" />
                    Learning Milestones
                  </h4>
                  <div className="space-y-3">
                    {selectedPath.milestones.map((milestone, index) => (
                      <div
                        key={milestone.id}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          milestone.completed 
                            ? "bg-green-900/20 border-green-700/50" 
                            : "bg-slate-900/50 border-slate-700/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-medium",
                              milestone.completed 
                                ? "bg-green-600 text-white" 
                                : "bg-slate-700 text-slate-400"
                            )}>
                              {index + 1}
                            </div>
                            <h5 className="font-medium text-white">{milestone.name}</h5>
                          </div>
                          
                          {milestone.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <span className="text-sm text-slate-400">
                              {milestone.currentScore}/{milestone.requiredScore} pts
                            </span>
                          )}
                        </div>
                        
                        <div className="ml-11">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {milestone.skills.map((skill) => (
                              <Badge 
                                key={skill} 
                                variant="secondary" 
                                className="text-xs bg-slate-800 text-slate-300 border-slate-700"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          
                          {!milestone.completed && (
                            <Progress 
                              value={(milestone.currentScore / milestone.requiredScore) * 100} 
                              className="h-1.5 bg-slate-700" 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantum Branches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-purple-400" />
                      Quantum Branches
                    </h4>
                    <div className="space-y-2">
                      {selectedPath.branches.map((branch) => (
                        <div
                          key={branch.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            branch.unlocked 
                              ? "bg-purple-900/20 border-purple-700/50 cursor-pointer hover:border-purple-600" 
                              : "bg-slate-900/30 border-slate-800/50 opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {branch.unlocked ? (
                                <Unlock className="h-4 w-4 text-purple-400" />
                              ) : (
                                <Lock className="h-4 w-4 text-slate-500" />
                              )}
                              <span className={cn(
                                "text-sm font-medium",
                                branch.unlocked ? "text-white" : "text-slate-500"
                              )}>
                                {branch.name}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                branch.type === 'main' && "text-blue-400 border-blue-600",
                                branch.type === 'optional' && "text-purple-400 border-purple-600",
                                branch.type === 'bonus' && "text-yellow-400 border-yellow-600"
                              )}
                            >
                              {branch.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-400" />
                      Rewards & Achievements
                    </h4>
                    <div className="space-y-2">
                      {selectedPath.rewards.map((reward) => {
                        const Icon = reward.icon;
                        return (
                          <div
                            key={reward.id}
                            className={cn(
                              "p-3 rounded-lg border flex items-center gap-3",
                              reward.earned 
                                ? "bg-yellow-900/20 border-yellow-700/50" 
                                : "bg-slate-900/30 border-slate-800/50 opacity-50"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg",
                              reward.earned ? "bg-yellow-600/20" : "bg-slate-800"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                reward.earned ? "text-yellow-400" : "text-slate-500"
                              )} />
                            </div>
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm font-medium",
                                reward.earned ? "text-white" : "text-slate-500"
                              )}>
                                {reward.name}
                              </p>
                              <p className="text-xs text-slate-500 capitalize">{reward.type}</p>
                            </div>
                            {reward.earned && (
                              <CheckCircle className="h-5 w-5 text-yellow-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Active Exercise Modal */}
        <AnimatePresence>
          {isExerciseActive && currentExercise && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setIsExerciseActive(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {currentExercise.name} in Progress
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Simulating exercise... This would be the actual exercise interface.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsExerciseActive(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => completeExercise(currentExercise, 85)}
                    >
                      Complete Exercise
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Add missing import
import { GitBranch, Volume2 } from "lucide-react";