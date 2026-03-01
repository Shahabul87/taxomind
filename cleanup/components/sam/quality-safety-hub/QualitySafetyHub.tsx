"use client";

/**
 * QualitySafetyHub
 *
 * A unified quality and safety hub that combines content quality validation,
 * bias detection, accessibility metrics, language safety, and academic integrity
 * into a cohesive content quality assurance experience.
 *
 * Phase 6 of the engine merge plan - integrating QualityGatesEngine,
 * FairnessAuditor, AccessibilityChecker, and IntegrityEngine.
 *
 * @module components/sam/quality-safety-hub
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Scale,
  FileCheck,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Bot,
  MessageSquareWarning,
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

// Import existing quality and safety components
import { QualityScoreDashboard } from "@/components/sam/QualityScoreDashboard";
import { BiasDetectionReport } from "@/components/sam/BiasDetectionReport";
import { AccessibilityMetricsWidget } from "@/components/sam/AccessibilityMetricsWidget";
import { DiscouragingLanguageAlert } from "@/components/sam/DiscouragingLanguageAlert";
import { IntegrityChecker } from "@/components/sam/IntegrityChecker";

export interface QualitySafetyHubProps {
  contentId?: string;
  courseId?: string;
  className?: string;
  compact?: boolean;
  defaultTab?: "overview" | "quality" | "fairness" | "accessibility" | "integrity";
  onQualityValidated?: (result: { passed: boolean; score: number }) => void;
  onBiasDetected?: (result: { fairnessLevel: string; score: number }) => void;
  onIntegrityChecked?: (result: { isClean: boolean }) => void;
}

interface SafetyMetric {
  id: string;
  label: string;
  value: number | string;
  status?: "passing" | "warning" | "failing" | "checking";
  icon: typeof Shield;
}

const SAFETY_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    description: "Quick safety and quality summary",
  },
  {
    id: "quality",
    label: "Quality",
    icon: FileCheck,
    description: "Content quality validation",
  },
  {
    id: "fairness",
    label: "Fairness",
    icon: Scale,
    description: "Bias detection and fairness audit",
  },
  {
    id: "accessibility",
    label: "Access",
    icon: Eye,
    description: "Readability and accessibility",
  },
  {
    id: "integrity",
    label: "Integrity",
    icon: ShieldCheck,
    description: "Academic integrity verification",
  },
] as const;

type TabId = typeof SAFETY_TABS[number]["id"];

export function QualitySafetyHub({
  contentId,
  courseId,
  className,
  compact = false,
  defaultTab = "overview",
  onQualityValidated,
  onBiasDetected,
  onIntegrityChecked,
}: QualitySafetyHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [integrityDialogOpen, setIntegrityDialogOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  // Quick metrics for overview
  const quickMetrics: SafetyMetric[] = [
    {
      id: "quality",
      label: "Quality Score",
      value: "Ready",
      status: "passing",
      icon: FileCheck,
    },
    {
      id: "fairness",
      label: "Fairness",
      value: "Audit",
      status: "checking",
      icon: Scale,
    },
    {
      id: "accessibility",
      label: "Accessibility",
      value: "Check",
      status: "checking",
      icon: Eye,
    },
    {
      id: "integrity",
      label: "Integrity",
      value: "Verify",
      status: "checking",
      icon: ShieldCheck,
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
                onClick={() => setActiveTab("quality")}
                className="gap-2"
              >
                <FileCheck className="h-4 w-4 text-blue-500" />
                Quality
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Validate content quality with 6 gates
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("fairness")}
                className="gap-2"
              >
                <Scale className="h-4 w-4 text-purple-500" />
                Fairness
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Check for bias and ensure fairness
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIntegrityDialogOpen(true)}
                className="gap-2"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Integrity
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Verify academic integrity
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Integrity Checker Dialog */}
        <Dialog open={integrityDialogOpen} onOpenChange={setIntegrityDialogOpen}>
          <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
            <IntegrityChecker compact={false} />
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
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Quality &amp; Safety Hub
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Ensure content quality, fairness, accessibility, and academic integrity
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Safety First
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 dark:bg-slate-800/50 p-1 h-auto flex-wrap">
            {SAFETY_TABS.map((tab) => {
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
                        metric.status === "passing" ? "text-emerald-500" :
                        metric.status === "warning" ? "text-amber-500" :
                        metric.status === "failing" ? "text-red-500" : "text-blue-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                      {metric.status === "passing" && (
                        <CheckCircle2 className="inline h-3 w-3 ml-1 text-emerald-500" />
                      )}
                      {metric.status === "warning" && (
                        <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Access Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Quality Gates Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("quality")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Content Quality Gates
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      6-gate validation system
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span className="text-slate-600 dark:text-slate-300">Accuracy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-emerald-500" />
                    <span className="text-slate-500">Bloom&apos;s Alignment</span>
                  </div>
                </div>
              </motion.div>

              {/* Bias Detection Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("fairness")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Fairness &amp; Bias Audit
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Comprehensive bias detection
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  {["Demographic", "Cognitive", "Cultural"].map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Accessibility & Language Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Accessibility Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("accessibility")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Accessibility Metrics
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Readability and text analysis
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Grade Level
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Reading Ease
                  </Badge>
                </div>
              </motion.div>

              {/* Language Safety Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("accessibility")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <MessageSquareWarning className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Language Safety
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Discouraging language detection
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Sentiment
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Alternatives
                  </Badge>
                </div>
              </motion.div>
            </div>

            {/* Integrity Quick Access */}
            <motion.div
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
              onClick={() => setActiveTab("integrity")}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Academic Integrity Verification
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Plagiarism detection, AI content detection, and consistency analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Detection
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("quality")}>
                  <FileCheck className="h-4 w-4" />
                  Validate Content
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("fairness")}>
                  <Scale className="h-4 w-4" />
                  Run Fairness Audit
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setActiveTab("integrity")}>
                  <ShieldCheck className="h-4 w-4" />
                  Check Integrity
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Quality Gates Tab */}
          <TabsContent value="quality" className="p-4">
            <QualityScoreDashboard
              className="w-full"
              onValidationComplete={(result) => {
                onQualityValidated?.({ passed: result.passed, score: result.overallScore });
              }}
            />
          </TabsContent>

          {/* Fairness Tab */}
          <TabsContent value="fairness" className="p-4">
            <BiasDetectionReport
              contentId={contentId}
              courseId={courseId}
              className="w-full"
            />
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Accessibility Metrics */}
              <div className="p-4 border-r border-slate-200 dark:border-slate-700">
                <AccessibilityMetricsWidget
                  compact={false}
                  className="min-h-[300px]"
                />
              </div>
              {/* Language Safety */}
              <div className="p-4">
                <DiscouragingLanguageAlert
                  compact={false}
                  showScore={true}
                  className="min-h-[300px]"
                />
              </div>
            </div>
          </TabsContent>

          {/* Integrity Tab */}
          <TabsContent value="integrity" className="p-4">
            <IntegrityChecker
              compact={false}
              className="w-full"
              onCheckComplete={(result) => {
                const isClean = result.overallRisk === "low";
                onIntegrityChecked?.({ isClean });
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Integrity Dialog for expanded view */}
      <Dialog open={integrityDialogOpen} onOpenChange={setIntegrityDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
          <IntegrityChecker compact={false} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default QualitySafetyHub;
