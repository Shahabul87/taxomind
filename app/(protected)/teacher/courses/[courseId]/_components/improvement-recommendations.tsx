"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Lightbulb,
  Target,
  BookOpen,
  Users,
  FileText,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'content' | 'structure' | 'activity';
  title: string;
  description: string;
  examples: string[];
}

interface ImprovementPlan {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  timeline: string;
}

interface ImprovementRecommendationsProps {
  recommendations: Recommendation[];
  improvementPlan?: ImprovementPlan;
  onImplement: (recommendation: Recommendation) => void;
}

export function ImprovementRecommendations({ 
  recommendations, 
  improvementPlan,
  onImplement 
}: ImprovementRecommendationsProps) {
  const [implementedItems, setImplementedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("all");

  const markAsImplemented = (title: string) => {
    setImplementedItems(prev => new Set(prev).add(title));
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 dark:border-red-800';
      case 'medium':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content':
        return <FileText className="h-4 w-4" />;
      case 'structure':
        return <BookOpen className="h-4 w-4" />;
      case 'activity':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredRecommendations = activeTab === "all" 
    ? recommendations 
    : recommendations.filter(r => r.priority === activeTab);

  const progress = Math.round((implementedItems.size / recommendations.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-6 backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Implementation Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {implementedItems.size} of {recommendations.length} recommendations implemented
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {progress}%
              </p>
            </div>
          </div>
          <div className="w-full bg-white/30 dark:bg-gray-700/30 rounded-full h-3 backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg"
            />
          </div>
        </div>
      </Card>

      {/* Improvement Timeline */}
      {improvementPlan && (
        <Card className="p-6 backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Improvement Roadmap
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 p-4 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/20">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100/80 text-red-800 dark:bg-red-900/50 dark:text-red-400 backdrop-blur-sm">
                  Immediate
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({improvementPlan.immediate.length} items)
                </span>
              </div>
              <p className="text-sm">Start within 24-48 hours</p>
            </div>
            
            <div className="space-y-2 p-4 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/20">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400 backdrop-blur-sm">
                  Short Term
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({improvementPlan.shortTerm.length} items)
                </span>
              </div>
              <p className="text-sm">Complete within 1-2 weeks</p>
            </div>
            
            <div className="space-y-2 p-4 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 border-white/20">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100/80 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 backdrop-blur-sm">
                  Long Term
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({improvementPlan.longTerm.length} items)
                </span>
              </div>
              <p className="text-sm">Complete within 4-6 weeks</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong>Timeline:</strong> {improvementPlan.timeline}
          </p>
        </Card>
      )}

      {/* Recommendations List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">
            All ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="high" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">
            High ({recommendations.filter(r => r.priority === 'high').length})
          </TabsTrigger>
          <TabsTrigger value="medium" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">
            Medium ({recommendations.filter(r => r.priority === 'medium').length})
          </TabsTrigger>
          <TabsTrigger value="low" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">
            Low ({recommendations.filter(r => r.priority === 'low').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredRecommendations.map((rec, index) => {
            const isImplemented = implementedItems.has(rec.title);
            
            return (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  "p-6 transition-all backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl hover:bg-white/80 dark:hover:bg-slate-800/80",
                  getPriorityColor(rec.priority),
                  isImplemented && "opacity-60"
                )}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                          {getPriorityIcon(rec.priority)}
                          {getTypeIcon(rec.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-semibold text-lg",
                            isImplemented && "line-through"
                          )}>
                            {rec.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-700/50 border-white/30">
                              {rec.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-700/50 border-white/30">
                              {rec.priority} priority
                            </Badge>
                            {isImplemented && (
                              <Badge className="bg-green-100/80 text-green-800 dark:bg-green-900/50 dark:text-green-400 text-xs backdrop-blur-sm">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Implemented
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rec.description}
                    </p>

                    {/* Examples */}
                    {rec.examples.length > 0 && (
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border-white/20">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Examples:
                        </h5>
                        <ul className="space-y-1">
                          {rec.examples.map((example, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!isImplemented && (
                        <>
                          <Button
                            onClick={() => {
                              onImplement(rec);
                              markAsImplemented(rec.title);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Implement with SAM
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => markAsImplemented(rec.title)}
                            className="bg-white/60 dark:bg-slate-800/60 border-white/30 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as Done
                          </Button>
                        </>
                      )}
                      {isImplemented && (
                        <Button
                          variant="ghost"
                          onClick={() => setImplementedItems(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(rec.title);
                            return newSet;
                          })}
                          className="bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50"
                        >
                          Undo
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {filteredRecommendations.length === 0 && (
            <Card className="p-12 text-center backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-xl">
              <p className="text-gray-500">No recommendations in this category</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="p-6 backdrop-blur-md bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border-white/20 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              Ready to enhance your course?
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Let SAM guide you through implementing these recommendations
            </p>
          </div>
          <Button
            onClick={() => onImplement(recommendations[0])}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}