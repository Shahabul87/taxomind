"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, ChevronRight, CheckCircle2, Clock, 
  Target, Sparkles, TrendingUp, BookOpen,
  Play, Pause, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";
import Link from "next/link";

interface LearningJourneyMapProps {
  user: User;
}

interface JourneyNode {
  id: string;
  title: string;
  type: "course" | "skill" | "milestone" | "project";
  status: "completed" | "current" | "upcoming" | "locked";
  progress: number;
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  url?: string;
  prerequisites?: string[];
}

export function LearningJourneyMap({ user }: LearningJourneyMapProps) {
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([
    {
      id: "1",
      title: "JavaScript Fundamentals",
      type: "course",
      status: "completed",
      progress: 100,
      estimatedTime: "2 weeks",
      difficulty: "beginner",
      url: "/courses/js-fundamentals"
    },
    {
      id: "2", 
      title: "React Basics",
      type: "course",
      status: "current",
      progress: 65,
      estimatedTime: "3 weeks",
      difficulty: "intermediate",
      url: "/courses/react-basics"
    },
    {
      id: "3",
      title: "Build Todo App",
      type: "project",
      status: "upcoming",
      progress: 0,
      estimatedTime: "1 week",
      difficulty: "intermediate",
      prerequisites: ["1", "2"]
    },
    {
      id: "4",
      title: "Advanced React Patterns",
      type: "course",
      status: "upcoming",
      progress: 0,
      estimatedTime: "4 weeks",
      difficulty: "advanced",
      prerequisites: ["2", "3"]
    },
    {
      id: "5",
      title: "Full-Stack Developer",
      type: "milestone",
      status: "locked",
      progress: 0,
      estimatedTime: "6 months",
      difficulty: "advanced",
      prerequisites: ["4"]
    }
  ]);

  const getNodeIcon = (type: string, status: string) => {
    if (status === "completed") return CheckCircle2;
    if (status === "current") return Play;
    if (status === "upcoming") return Clock;
    if (status === "locked") return Target;
    
    switch (type) {
      case "course": return BookOpen;
      case "skill": return Sparkles;
      case "milestone": return Target;
      case "project": return TrendingUp;
      default: return MapPin;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case "completed": return "from-green-500 to-emerald-500";
      case "current": return "from-blue-500 to-indigo-500";
      case "upcoming": return "from-purple-500 to-pink-500";
      case "locked": return "from-gray-400 to-gray-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "current": return "bg-blue-100 text-blue-800";
      case "upcoming": return "bg-purple-100 text-purple-800";
      case "locked": return "bg-gray-100 text-slate-400";
      default: return "bg-gray-100 text-slate-400";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-slate-400";
    }
  };

  const currentNode = journeyNodes.find(node => node.status === "current");
  const completedNodes = journeyNodes.filter(node => node.status === "completed");
  const upcomingNodes = journeyNodes.filter(node => node.status === "upcoming");

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Your Learning Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {completedNodes.length}
                </div>
                <div className="text-sm text-slate-300">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {currentNode ? "1" : "0"}
                </div>
                <div className="text-sm text-slate-300">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {upcomingNodes.length}
                </div>
                <div className="text-sm text-slate-300">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {Math.round((completedNodes.length / journeyNodes.length) * 100)}%
                </div>
                <div className="text-sm text-slate-300">Overall Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Focus */}
      {currentNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Play className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-white">Current Focus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {currentNode.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getStatusColor(currentNode.status)}>
                      {currentNode.status}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(currentNode.difficulty)}>
                      {currentNode.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {currentNode.progress}%
                  </div>
                  <div className="text-sm text-slate-400">
                    {currentNode.estimatedTime}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress value={currentNode.progress} className="h-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Keep going! You're making great progress.
                  </span>
                  {currentNode.url && (
                    <Link href={currentNode.url}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Continue Learning
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Journey Path */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journeyNodes.map((node, index) => {
                const NodeIcon = getNodeIcon(node.type, node.status);
                
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/60 hover:bg-white/80 transition-all duration-200"
                  >
                    {/* Node Icon */}
                    <div className={`p-3 rounded-full bg-gradient-to-r ${getNodeColor(node.status)} text-white flex-shrink-0`}>
                      <NodeIcon className="w-5 h-5" />
                    </div>

                    {/* Node Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white truncate">
                          {node.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(node.status)}>
                            {node.status}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(node.difficulty)}>
                            {node.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          {node.estimatedTime}
                        </div>
                        {node.progress > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${node.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {node.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {node.status === "current" && node.url && (
                        <Link href={node.url}>
                          <Button size="sm" variant="outline">
                            Continue
                          </Button>
                        </Link>
                      )}
                      {node.status === "completed" && (
                        <Button size="sm" variant="ghost" disabled>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {node.status === "upcoming" && (
                        <Button size="sm" variant="ghost" disabled>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                      {node.status === "locked" && (
                        <Button size="sm" variant="ghost" disabled>
                          <Target className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
                    </div>

                    {/* Connection Line */}
                    {index < journeyNodes.length - 1 && (
                      <div className="absolute left-8 top-full w-0.5 h-4 bg-gray-200 -translate-x-1/2" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}