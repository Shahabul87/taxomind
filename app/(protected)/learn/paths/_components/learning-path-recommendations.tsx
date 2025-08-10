"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Sparkles, TrendingUp, Brain, Target, BookOpen, 
  Clock, ChevronRight, X, Check, RotateCcw,
  Award, Zap, AlertCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import toast from "react-hot-toast";

interface PathNode {
  id: string;
  name: string;
  description: string;
  contentType: "COURSE" | "SKILL" | "ASSESSMENT" | "PROJECT";
  contentId?: string;
  order: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  estimatedDuration: number;
  nodes: PathNode[];
}

interface Recommendation {
  id: string;
  reason: string;
  score: number;
  priority: number;
  basedOn: string;
  path: LearningPath;
  interactions: Array<{ action: string; createdAt: string }>;
}

export const LearningPathRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPath, setSelectedPath] = useState<Recommendation | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/learning-paths/recommend");
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      logger.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await axios.post("/api/learning-paths/recommend");
      if (response.data.success) {
        toast.success("New recommendations generated!");
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      logger.error("Failed to generate recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  };

  const handleInteraction = async (recommendationId: string, action: string) => {
    try {
      await axios.post(`/api/learning-paths/recommendations/${recommendationId}/interact`, {
        action
      });

      if (action === "ACCEPTED") {
        toast.success("Enrolled in learning path!");
        setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
      } else if (action === "REJECTED") {
        setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
      } else if (action === "DEFERRED") {
        toast.success("We'll remind you later");
        // Move to end of list
        setRecommendations(prev => {
          const deferred = prev.find(r => r.id === recommendationId);
          const others = prev.filter(r => r.id !== recommendationId);
          return deferred ? [...others, deferred] : others;
        });
      }

      setSelectedPath(null);
    } catch (error) {
      logger.error("Failed to record interaction:", error);
      toast.error("Failed to process action");
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

  const getRecommendationIcon = (basedOn: string) => {
    switch (basedOn) {
      case "PERFORMANCE_BASED": return <TrendingUp className="w-5 h-5" />;
      case "SKILL_GAP": return <AlertCircle className="w-5 h-5" />;
      case "INTEREST_BASED": return <Sparkles className="w-5 h-5" />;
      case "SEQUENTIAL": return <ChevronRight className="w-5 h-5" />;
      case "REMEDIAL": return <Target className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getRecommendationColor = (basedOn: string) => {
    switch (basedOn) {
      case "PERFORMANCE_BASED": return "from-blue-500 to-indigo-600";
      case "SKILL_GAP": return "from-orange-500 to-red-600";
      case "INTEREST_BASED": return "from-purple-500 to-pink-600";
      case "SEQUENTIAL": return "from-green-500 to-teal-600";
      case "REMEDIAL": return "from-yellow-500 to-orange-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommended Learning Paths
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered recommendations based on your learning journey
          </p>
        </div>
        <Button
          onClick={generateNewRecommendations}
          disabled={generating}
          variant="outline"
          className="flex items-center gap-2"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Generate New
        </Button>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete some courses or take assessments to get personalized recommendations
            </p>
            <Button onClick={generateNewRecommendations} disabled={generating}>
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card 
                className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPath(recommendation)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getRecommendationColor(recommendation.basedOn)} text-white flex items-center justify-center`}>
                      {getRecommendationIcon(recommendation.basedOn)}
                    </div>
                    <Badge className={getDifficultyColor(recommendation.path.difficulty)}>
                      {recommendation.path.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">
                    {recommendation.path.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {recommendation.reason}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{recommendation.path.estimatedDuration}h</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{recommendation.path.nodes.length} steps</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Match Score</span>
                      <span className="font-medium">{Math.round(recommendation.score * 100)}%</span>
                    </div>
                    <Progress value={recommendation.score * 100} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(recommendation.id, "ACCEPTED");
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Start Path
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInteraction(recommendation.id, "DEFERRED");
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Path Detail Modal */}
      <AnimatePresence>
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPath(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedPath.path.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedPath.path.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedPath(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge className={getDifficultyColor(selectedPath.path.difficulty)}>
                      {selectedPath.path.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{selectedPath.path.estimatedDuration} hours</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Zap className="w-4 h-4" />
                      <span>{Math.round(selectedPath.score * 100)}% match</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getRecommendationIcon(selectedPath.basedOn)}
                      <span className="font-medium">Why this path?</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPath.reason}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Learning Journey</h4>
                    <div className="space-y-3">
                      {selectedPath.path.nodes.map((node, index) => (
                        <div key={node.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{node.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {node.description}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {node.contentType}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t dark:border-gray-800 flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleInteraction(selectedPath.id, "ACCEPTED")}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Start This Learning Path
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleInteraction(selectedPath.id, "DEFERRED")}
                >
                  Remind Me Later
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleInteraction(selectedPath.id, "REJECTED")}
                >
                  Not Interested
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};