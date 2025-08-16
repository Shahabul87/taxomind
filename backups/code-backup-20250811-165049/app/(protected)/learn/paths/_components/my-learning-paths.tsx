"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Route, Clock, CheckCircle2, PlayCircle, 
  PauseCircle, MoreVertical, TrendingUp,
  Calendar, Target, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface NodeProgress {
  id: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  startedAt?: string;
  completedAt?: string;
  node: {
    id: string;
    name: string;
    description: string;
    contentType: string;
    contentId?: string;
    order: number;
  };
}

interface PathEnrollment {
  id: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  completedAt?: string;
  progressPercent: number;
  path: {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    estimatedDuration: number;
    nodes: Array<{
      id: string;
      name: string;
      order: number;
    }>;
  };
  nodeProgress: NodeProgress[];
}

interface MyLearningPathsProps {
  userId: string;
}

export const MyLearningPaths = ({ userId }: MyLearningPathsProps) => {
  const [enrollments, setEnrollments] = useState<PathEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<PathEnrollment | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/learning-paths/enrollments");
      setEnrollments(response.data.enrollments || []);
    } catch (error) {
      logger.error("Failed to fetch enrollments:", error);
      toast.error("Failed to load learning paths");
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollmentStatus = async (enrollmentId: string, status: string) => {
    try {
      await axios.patch(`/api/learning-paths/enrollments/${enrollmentId}/status`, {
        status
      });
      toast.success(`Path ${status.toLowerCase()}`);
      fetchEnrollments();
    } catch (error) {
      logger.error("Failed to update enrollment status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <PlayCircle className="w-5 h-5 text-green-600" />;
      case "PAUSED": return <PauseCircle className="w-5 h-5 text-yellow-600" />;
      case "COMPLETED": return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      default: return <Route className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "PAUSED": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "COMPLETED": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ABANDONED": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "INTERMEDIATE": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ADVANCED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "EXPERT": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const calculateProgress = (nodeProgress: NodeProgress[]) => {
    if (nodeProgress.length === 0) return 0;
    const completed = nodeProgress.filter(np => np.status === "COMPLETED").length;
    return (completed / nodeProgress.length) * 100;
  };

  const getNextNode = (enrollment: PathEnrollment) => {
    return enrollment.nodeProgress.find(np => 
      np.status === "NOT_STARTED" || np.status === "IN_PROGRESS"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Route className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check out our recommendations to start your learning journey
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Paths */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Learning Paths</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.filter(e => e.status === "ACTIVE").map((enrollment) => {
            const progress = calculateProgress(enrollment.nodeProgress);
            const nextNode = getNextNode(enrollment);
            
            return (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(enrollment.status)}
                        <Badge className={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateEnrollmentStatus(enrollment.id, "PAUSED")}
                          >
                            <PauseCircle className="w-4 h-4 mr-2" />
                            Pause Path
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateEnrollmentStatus(enrollment.id, "ABANDONED")}
                            className="text-red-600"
                          >
                            Abandon Path
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg mt-2">
                      {enrollment.path.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {enrollment.path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className={getDifficultyColor(enrollment.path.difficulty)}>
                        {enrollment.path.difficulty}
                      </Badge>
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{enrollment.path.estimatedDuration}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{enrollment.nodeProgress.filter(np => np.status === "COMPLETED").length}/{enrollment.path.nodes.length}</span>
                        </div>
                      </div>
                    </div>

                    {nextNode && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Next: {nextNode.node.name}
                        </p>
                        {nextNode.node.contentType === "COURSE" && nextNode.node.contentId && (
                          <Link href={`/courses/${nextNode.node.contentId}/learn`}>
                            <Button size="sm" className="w-full">
                              Continue Learning
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Other Paths */}
      {enrollments.filter(e => e.status !== "ACTIVE").length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Other Paths</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.filter(e => e.status !== "ACTIVE").map((enrollment) => {
              const progress = calculateProgress(enrollment.nodeProgress);
              
              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(enrollment.status)}
                          <Badge className={getStatusColor(enrollment.status)}>
                            {enrollment.status}
                          </Badge>
                        </div>
                        {enrollment.status === "PAUSED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateEnrollmentStatus(enrollment.id, "ACTIVE")}
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-2">
                        {enrollment.path.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      {enrollment.completedAt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                          Completed on {new Date(enrollment.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};