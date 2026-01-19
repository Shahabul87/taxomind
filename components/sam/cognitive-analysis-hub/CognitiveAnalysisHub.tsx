"use client";

/**
 * CognitiveAnalysisHub
 *
 * A unified cognitive analysis hub that combines cognitive load monitoring,
 * metacognition reflection, knowledge graph exploration, and performance metrics
 * into a cohesive learning intelligence experience.
 *
 * Phase 2 of the engine merge plan - integrating CognitiveLoadEngine,
 * KnowledgeGraphEngine, and MetacognitionEngine.
 *
 * @module components/sam/cognitive-analysis-hub
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  Network,
  Lightbulb,
  BarChart3,
  ChevronRight,
  Sparkles,
  Activity,
  Target,
  Compass,
  Eye,
  Gauge,
  TrendingUp,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import existing cognitive components
import { CognitiveLoadMonitor } from "@/components/sam/CognitiveLoadMonitor";
import { MetacognitionPanel } from "@/components/sam/MetacognitionPanel";
import { EnhancedKnowledgeGraphExplorer } from "@/components/sam/knowledge-graph";

export interface CognitiveAnalysisHubProps {
  userId?: string;
  sessionId?: string;
  courseId?: string;
  sectionId?: string;
  compact?: boolean;
  className?: string;
  defaultTab?: "overview" | "cognitive-load" | "metacognition" | "knowledge-graph";
}

interface CognitiveMetric {
  id: string;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  status?: "good" | "warning" | "critical";
  icon: typeof Brain;
}

const ANALYSIS_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    description: "Quick cognitive health summary",
  },
  {
    id: "cognitive-load",
    label: "Load Monitor",
    icon: Gauge,
    description: "Real-time cognitive load tracking",
  },
  {
    id: "metacognition",
    label: "Reflection",
    icon: Lightbulb,
    description: "Self-reflection and study habits",
  },
  {
    id: "knowledge-graph",
    label: "Knowledge Map",
    icon: Network,
    description: "Explore concept relationships",
  },
] as const;

type TabId = typeof ANALYSIS_TABS[number]["id"];

export function CognitiveAnalysisHub({
  userId,
  sessionId = "default-session",
  courseId,
  sectionId,
  compact = false,
  className,
  defaultTab = "overview",
}: CognitiveAnalysisHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [knowledgeGraphOpen, setKnowledgeGraphOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  const handleExpandPanel = useCallback((panelId: string) => {
    setExpandedPanel(expandedPanel === panelId ? null : panelId);
  }, [expandedPanel]);

  // Quick metrics for overview
  const quickMetrics: CognitiveMetric[] = [
    {
      id: "cognitive-load",
      label: "Cognitive Load",
      value: "Optimal",
      status: "good",
      icon: Gauge,
    },
    {
      id: "metacognition",
      label: "Self-Awareness",
      value: "Active",
      status: "good",
      icon: Lightbulb,
    },
    {
      id: "knowledge-coverage",
      label: "Knowledge Coverage",
      value: "Growing",
      trend: "up",
      icon: Network,
    },
    {
      id: "learning-efficiency",
      label: "Learning Efficiency",
      value: "Adaptive",
      icon: TrendingUp,
    },
  ];

  // Compact mode - just quick action buttons
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("cognitive-load")}
                className="gap-2"
              >
                <Gauge className="h-4 w-4 text-blue-500" />
                Load Monitor
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Track your cognitive load in real-time
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("metacognition")}
                className="gap-2"
              >
                <Lightbulb className="h-4 w-4 text-purple-500" />
                Reflect
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Self-reflection and metacognition tools
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKnowledgeGraphOpen(true)}
                className="gap-2"
              >
                <Network className="h-4 w-4 text-green-500" />
                Knowledge Map
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Explore your knowledge graph
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Knowledge Graph Dialog */}
        <Dialog open={knowledgeGraphOpen} onOpenChange={setKnowledgeGraphOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <EnhancedKnowledgeGraphExplorer
              userId={userId}
              courseId={courseId}
              className="h-full"
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full mode - card with tabs
  return (
    <Card className={cn("overflow-hidden border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Cognitive Analysis Hub
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Monitor cognitive load, reflect on learning, and explore knowledge
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 dark:bg-slate-800/50 p-1 h-auto flex-wrap">
            {ANALYSIS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn(
                        "h-4 w-4",
                        metric.status === "good" ? "text-green-500" :
                        metric.status === "warning" ? "text-yellow-500" :
                        metric.status === "critical" ? "text-red-500" : "text-blue-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                      {metric.trend && (
                        <TrendingUp className={cn(
                          "inline h-3 w-3 ml-1",
                          metric.trend === "up" ? "text-green-500" : "text-red-500 rotate-180"
                        )} />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Access Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Cognitive Load Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("cognitive-load")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Cognitive Load Monitor
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time mental workload tracking
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-slate-600 dark:text-slate-300">Optimal Zone</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-500">Active Monitoring</span>
                  </div>
                </div>
              </motion.div>

              {/* Metacognition Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("metacognition")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Metacognition &amp; Reflection
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Self-awareness and study habits
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  {["Before", "During", "After"].map((phase) => (
                    <Badge
                      key={phase}
                      variant="outline"
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                    >
                      {phase}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Knowledge Graph Quick Access */}
            <motion.div
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer"
              onClick={() => setActiveTab("knowledge-graph")}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Network className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Knowledge Graph Explorer
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Visualize concept relationships, learning paths, and prerequisites
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Learning Paths
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Cognitive Load Tab */}
          <TabsContent value="cognitive-load" className="p-4">
            <CognitiveLoadMonitor
              sessionId={sessionId}
              courseId={courseId}
              sectionId={sectionId}
              autoRefresh={true}
              refreshInterval={30000}
            />
          </TabsContent>

          {/* Metacognition Tab */}
          <TabsContent value="metacognition" className="p-4">
            <MetacognitionPanel
              sessionId={sessionId}
              className="border-0 shadow-none"
            />
          </TabsContent>

          {/* Knowledge Graph Tab */}
          <TabsContent value="knowledge-graph" className="p-0">
            <div className="h-[500px]">
              <EnhancedKnowledgeGraphExplorer
                userId={userId}
                courseId={courseId}
                className="h-full rounded-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Knowledge Graph Dialog for expanded view */}
      <Dialog open={knowledgeGraphOpen} onOpenChange={setKnowledgeGraphOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <EnhancedKnowledgeGraphExplorer
            userId={userId}
            courseId={courseId}
            className="h-full"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CognitiveAnalysisHub;
