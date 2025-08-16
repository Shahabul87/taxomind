"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Route, Target, Brain, Clock, CheckCircle, ArrowRight, 
  BookOpen, Video, PenTool, Users, Trophy, Star, 
  TrendingUp, Calendar, MapPin, Lightbulb, Zap,
  Play, Pause, RotateCcw, Flag, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CognitiveProfile {
  overallScore: number;
  bloomsLevels: any[];
  strengths: string[];
  weaknesses: string[];
  learningStyle: string;
  cognitiveGrowth: number;
  recommendedFocus: string[];
  nextMilestones: string[];
  studyEfficiency: number;
  retentionRate: number;
  conceptualUnderstanding: number;
  applicationSkills: number;
}

interface LearningPathRecommendationsProps {
  cognitiveData: CognitiveProfile;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  bloomsLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  activities: Activity[];
  prerequisites: string[];
  outcomes: string[];
  priority: 'high' | 'medium' | 'low';
  progress: number;
  isUnlocked: boolean;
}

interface Activity {
  id: string;
  type: 'video' | 'reading' | 'exercise' | 'quiz' | 'project' | 'discussion';
  title: string;
  duration: number;
  completed: boolean;
  bloomsLevel: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: LearningModule[];
  totalTime: number;
  completionRate: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focus: string[];
}

export function LearningPathRecommendations({ cognitiveData }: LearningPathRecommendationsProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  // Generate personalized learning paths based on cognitive analysis
  const generateLearningPaths = (): LearningPath[] => {
    const weakAreas = cognitiveData.bloomsLevels
      .filter(level => level.score < 70)
      .map(level => level.level);

    const strongAreas = cognitiveData.bloomsLevels
      .filter(level => level.score >= 80)
      .map(level => level.level);

    return [
      {
        id: 'cognitive-foundation',
        title: 'Cognitive Foundation Enhancement',
        description: 'Build stronger analytical and critical thinking skills',
        difficulty: 'intermediate',
        focus: ['Analyze', 'Evaluate', 'Apply'],
        totalTime: 240,
        completionRate: 0,
        modules: [
          {
            id: 'critical-thinking',
            title: 'Critical Thinking Mastery',
            description: 'Develop analytical reasoning and evaluation skills',
            bloomsLevel: 'Analyze',
            difficulty: 'intermediate',
            estimatedTime: 60,
            priority: 'high',
            progress: 0,
            isUnlocked: true,
            prerequisites: [],
            outcomes: [
              'Identify logical fallacies',
              'Analyze complex arguments',
              'Evaluate evidence quality'
            ],
            activities: [
              {
                id: 'ct-1',
                type: 'video',
                title: 'Introduction to Critical Thinking',
                duration: 15,
                completed: false,
                bloomsLevel: 'Understand'
              },
              {
                id: 'ct-2',
                type: 'exercise',
                title: 'Argument Analysis Practice',
                duration: 30,
                completed: false,
                bloomsLevel: 'Analyze'
              },
              {
                id: 'ct-3',
                type: 'quiz',
                title: 'Logical Fallacies Assessment',
                duration: 15,
                completed: false,
                bloomsLevel: 'Evaluate'
              }
            ]
          },
          {
            id: 'problem-solving',
            title: 'Advanced Problem Solving',
            description: 'Apply knowledge to complex, real-world scenarios',
            bloomsLevel: 'Apply',
            difficulty: 'intermediate',
            estimatedTime: 90,
            priority: 'high',
            progress: 0,
            isUnlocked: true,
            prerequisites: [],
            outcomes: [
              'Apply systematic problem-solving methods',
              'Transfer knowledge to new contexts',
              'Develop practical solutions'
            ],
            activities: [
              {
                id: 'ps-1',
                type: 'video',
                title: 'Problem-Solving Frameworks',
                duration: 20,
                completed: false,
                bloomsLevel: 'Understand'
              },
              {
                id: 'ps-2',
                type: 'project',
                title: 'Case Study Analysis',
                duration: 45,
                completed: false,
                bloomsLevel: 'Apply'
              },
              {
                id: 'ps-3',
                type: 'exercise',
                title: 'Solution Implementation',
                duration: 25,
                completed: false,
                bloomsLevel: 'Create'
              }
            ]
          },
          {
            id: 'evaluation-skills',
            title: 'Evaluation & Judgment Skills',
            description: 'Master critical evaluation and decision-making',
            bloomsLevel: 'Evaluate',
            difficulty: 'advanced',
            estimatedTime: 90,
            priority: 'medium',
            progress: 0,
            isUnlocked: false,
            prerequisites: ['critical-thinking'],
            outcomes: [
              'Make informed judgments',
              'Evaluate solution effectiveness',
              'Assess information credibility'
            ],
            activities: [
              {
                id: 'ev-1',
                type: 'reading',
                title: 'Evaluation Criteria Development',
                duration: 30,
                completed: false,
                bloomsLevel: 'Analyze'
              },
              {
                id: 'ev-2',
                type: 'discussion',
                title: 'Peer Evaluation Practice',
                duration: 30,
                completed: false,
                bloomsLevel: 'Evaluate'
              },
              {
                id: 'ev-3',
                type: 'project',
                title: 'Comprehensive Assessment',
                duration: 30,
                completed: false,
                bloomsLevel: 'Evaluate'
              }
            ]
          }
        ]
      },
      {
        id: 'creative-innovation',
        title: 'Creative Innovation Path',
        description: 'Develop creativity and original thinking abilities',
        difficulty: 'advanced',
        focus: ['Create', 'Synthesize', 'Innovate'],
        totalTime: 180,
        completionRate: 0,
        modules: [
          {
            id: 'creative-thinking',
            title: 'Creative Thinking Techniques',
            description: 'Learn systematic approaches to creative problem-solving',
            bloomsLevel: 'Create',
            difficulty: 'intermediate',
            estimatedTime: 60,
            priority: 'high',
            progress: 0,
            isUnlocked: true,
            prerequisites: [],
            outcomes: [
              'Generate original ideas',
              'Use creative thinking methods',
              'Overcome creative blocks'
            ],
            activities: [
              {
                id: 'crt-1',
                type: 'video',
                title: 'Creativity Fundamentals',
                duration: 20,
                completed: false,
                bloomsLevel: 'Understand'
              },
              {
                id: 'crt-2',
                type: 'exercise',
                title: 'Brainstorming Techniques',
                duration: 25,
                completed: false,
                bloomsLevel: 'Apply'
              },
              {
                id: 'crt-3',
                type: 'project',
                title: 'Creative Solution Design',
                duration: 15,
                completed: false,
                bloomsLevel: 'Create'
              }
            ]
          },
          {
            id: 'innovation-methods',
            title: 'Innovation Methodologies',
            description: 'Master systematic innovation approaches',
            bloomsLevel: 'Create',
            difficulty: 'advanced',
            estimatedTime: 120,
            priority: 'medium',
            progress: 0,
            isUnlocked: false,
            prerequisites: ['creative-thinking'],
            outcomes: [
              'Apply design thinking methods',
              'Develop innovative solutions',
              'Prototype and test ideas'
            ],
            activities: [
              {
                id: 'in-1',
                type: 'video',
                title: 'Design Thinking Process',
                duration: 30,
                completed: false,
                bloomsLevel: 'Understand'
              },
              {
                id: 'in-2',
                type: 'project',
                title: 'Innovation Challenge',
                duration: 60,
                completed: false,
                bloomsLevel: 'Create'
              },
              {
                id: 'in-3',
                type: 'discussion',
                title: 'Peer Innovation Review',
                duration: 30,
                completed: false,
                bloomsLevel: 'Evaluate'
              }
            ]
          }
        ]
      },
      {
        id: 'knowledge-mastery',
        title: 'Knowledge Mastery & Retention',
        description: 'Optimize your learning efficiency and retention',
        difficulty: 'beginner',
        focus: ['Remember', 'Understand', 'Retain'],
        totalTime: 120,
        completionRate: 25,
        modules: [
          {
            id: 'memory-techniques',
            title: 'Advanced Memory Techniques',
            description: 'Master scientifically-proven memory enhancement methods',
            bloomsLevel: 'Remember',
            difficulty: 'beginner',
            estimatedTime: 45,
            priority: 'medium',
            progress: 60,
            isUnlocked: true,
            prerequisites: [],
            outcomes: [
              'Apply spaced repetition effectively',
              'Use mnemonic devices',
              'Optimize memory consolidation'
            ],
            activities: [
              {
                id: 'mem-1',
                type: 'video',
                title: 'Memory Science Basics',
                duration: 15,
                completed: true,
                bloomsLevel: 'Understand'
              },
              {
                id: 'mem-2',
                type: 'exercise',
                title: 'Spaced Repetition Practice',
                duration: 20,
                completed: true,
                bloomsLevel: 'Apply'
              },
              {
                id: 'mem-3',
                type: 'quiz',
                title: 'Memory Technique Assessment',
                duration: 10,
                completed: false,
                bloomsLevel: 'Remember'
              }
            ]
          },
          {
            id: 'comprehension-skills',
            title: 'Deep Comprehension Skills',
            description: 'Build stronger understanding of complex concepts',
            bloomsLevel: 'Understand',
            difficulty: 'intermediate',
            estimatedTime: 75,
            priority: 'low',
            progress: 0,
            isUnlocked: true,
            prerequisites: [],
            outcomes: [
              'Explain complex concepts clearly',
              'Connect ideas across domains',
              'Develop conceptual frameworks'
            ],
            activities: [
              {
                id: 'comp-1',
                type: 'reading',
                title: 'Active Reading Strategies',
                duration: 25,
                completed: false,
                bloomsLevel: 'Understand'
              },
              {
                id: 'comp-2',
                type: 'exercise',
                title: 'Concept Mapping',
                duration: 30,
                completed: false,
                bloomsLevel: 'Analyze'
              },
              {
                id: 'comp-3',
                type: 'discussion',
                title: 'Peer Teaching Practice',
                duration: 20,
                completed: false,
                bloomsLevel: 'Apply'
              }
            ]
          }
        ]
      }
    ];
  };

  const learningPaths = generateLearningPaths();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'reading': return BookOpen;
      case 'exercise': return PenTool;
      case 'quiz': return Target;
      case 'project': return Trophy;
      case 'discussion': return Users;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8 space-y-6">
      {/* Learning Path Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Route className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Personalized Learning Paths</h2>
                <p className="text-white/80">AI-generated recommendations based on your cognitive profile</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{learningPaths.length}</div>
              <div className="text-white/80 text-sm">Recommended Paths</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/80">Total Study Time</span>
              </div>
              <div className="text-2xl font-bold">
                {learningPaths.reduce((sum, path) => sum + path.totalTime, 0)} min
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/80">Focus Areas</span>
              </div>
              <div className="text-2xl font-bold">{cognitiveData.recommendedFocus.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-white/80" />
                <span className="text-sm text-white/80">Growth Potential</span>
              </div>
              <div className="text-2xl font-bold">+{cognitiveData.cognitiveGrowth}%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Learning Paths */}
      <div className="space-y-6">
        {learningPaths.map((path, pathIndex) => (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pathIndex * 0.1 }}
          >
            <Card className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-lg ${
              selectedPath === path.id 
                ? 'border-purple-300 dark:border-purple-600' 
                : 'border-slate-200/50 dark:border-slate-700/50'
            }`}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white">
                      <Route className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-800 dark:text-slate-200">{path.title}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{path.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getDifficultyColor(path.difficulty)}>
                      {path.difficulty}
                    </Badge>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {path.totalTime}min
                      </div>
                      <div className="text-xs text-slate-500">Total time</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {selectedPath === path.id && (
                <CardContent className="space-y-6">
                  {/* Path Progress */}
                  <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-lg p-4 border border-slate-200/30 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Overall Progress
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {path.completionRate}%
                      </span>
                    </div>
                    <Progress value={path.completionRate} className="h-2" />
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                      Focus Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {path.focus.map((focus, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Learning Modules */}
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Learning Modules
                    </h4>
                    <div className="space-y-4">
                      {path.modules.map((module, moduleIndex) => (
                        <Card 
                          key={module.id} 
                          className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${
                            !module.isUnlocked 
                              ? 'opacity-60 border-slate-300/50 dark:border-slate-600/50' 
                              : 'border-slate-200/40 dark:border-slate-700/40 hover:border-slate-300/60 dark:hover:border-slate-600/60'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  module.isUnlocked 
                                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                }`}>
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-slate-800 dark:text-slate-200">
                                    {module.title}
                                  </h5>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {module.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(module.priority)}>
                                  {module.priority}
                                </Badge>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {module.estimatedTime}min
                                  </div>
                                  <div className="text-xs text-slate-500">Duration</div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {/* Module Progress */}
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {module.progress}%
                                  </span>
                                </div>
                                <Progress value={module.progress} className="h-2" />
                              </div>

                              {/* Prerequisites */}
                              {module.prerequisites.length > 0 && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Prerequisites: {module.prerequisites.join(', ')}
                                  </span>
                                </div>
                              )}

                              {/* Activities */}
                              <div>
                                <h6 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Activities ({module.activities.length})
                                </h6>
                                <div className="space-y-2">
                                  {module.activities.map((activity, activityIndex) => {
                                    const Icon = getActivityIcon(activity.type);
                                    return (
                                      <div 
                                        key={activity.id} 
                                        className={`flex items-center gap-3 p-2 rounded-lg ${
                                          activity.completed 
                                            ? 'bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm border border-green-200/30 dark:border-green-800/30' 
                                            : 'bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm border border-slate-200/20 dark:border-slate-600/20'
                                        }`}
                                      >
                                        <div className={`p-1 rounded ${
                                          activity.completed 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                                        }`}>
                                          {activity.completed ? (
                                            <CheckCircle className="w-4 h-4" />
                                          ) : (
                                            <Icon className="w-4 h-4" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-sm ${
                                              activity.completed 
                                                ? 'text-green-700 dark:text-green-400' 
                                                : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                              {activity.title}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                              {activity.duration}min
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Learning Outcomes */}
                              <div>
                                <h6 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                  Learning Outcomes
                                </h6>
                                <ul className="space-y-1">
                                  {module.outcomes.map((outcome, idx) => (
                                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                      {outcome}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  disabled={!module.isUnlocked}
                                  className="gap-2"
                                >
                                  <Play className="w-4 h-4" />
                                  {module.progress > 0 ? 'Continue' : 'Start'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={!module.isUnlocked}
                                  className="gap-2"
                                >
                                  <BookOpen className="w-4 h-4" />
                                  Preview
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Action Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4 cursor-pointer group">
                <div className="flex flex-col items-start gap-2">
                  <div className="p-2 bg-blue-100/80 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/60 transition-colors">
                    <Flag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Set Weekly Goals</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Plan your learning schedule</span>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4 cursor-pointer group">
                <div className="flex flex-col items-start gap-2">
                  <div className="p-2 bg-green-100/80 dark:bg-green-900/40 rounded-lg group-hover:bg-green-200/80 dark:group-hover:bg-green-800/60 transition-colors">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Schedule Study Time</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Block time for learning</span>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4 cursor-pointer group">
                <div className="flex flex-col items-start gap-2">
                  <div className="p-2 bg-orange-100/80 dark:bg-orange-900/40 rounded-lg group-hover:bg-orange-200/80 dark:group-hover:bg-orange-800/60 transition-colors">
                    <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Track Achievements</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Monitor your progress</span>
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/40 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-all duration-300 p-4 cursor-pointer group">
                <div className="flex flex-col items-start gap-2">
                  <div className="p-2 bg-purple-100/80 dark:bg-purple-900/40 rounded-lg group-hover:bg-purple-200/80 dark:group-hover:bg-purple-800/60 transition-colors">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Find Study Partners</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Connect with peers</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}