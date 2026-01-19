"use client";

/**
 * CareerGrowthHub
 *
 * A unified career and professional growth hub that combines career tracking,
 * certification progress, portfolio management, and skill-to-certification mapping
 * into a cohesive professional development experience.
 *
 * Phase 5 of the engine merge plan - integrating CareerProgressEngine,
 * CertificationEngine, and PortfolioEngine.
 *
 * @module components/sam/career-growth-hub
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Award,
  FileText,
  Target,
  ChevronRight,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Shield,
  Zap,
  Star,
  Trophy,
  Activity,
  Map,
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

// Import existing career and certification components
import { CareerProgressWidget } from "@/components/sam/CareerProgressWidget";
import { CertificationProgressWidget } from "@/components/sam/certification/CertificationProgressWidget";
import { PortfolioExport } from "@/components/sam/portfolio-export/PortfolioExport";
import { SkillToCertificationMap } from "@/components/sam/certification/SkillToCertificationMap";

export interface CareerGrowthHubProps {
  userId?: string;
  className?: string;
  compact?: boolean;
  defaultTab?: "overview" | "career" | "certifications" | "portfolio";
  onCertificationSelect?: (certId: string) => void;
  onViewCertifications?: () => void;
  onViewPortfolio?: () => void;
  onAddProject?: () => void;
}

interface CareerMetric {
  id: string;
  label: string;
  value: number | string;
  trend?: "up" | "down" | "stable";
  status?: "active" | "growing" | "ready";
  icon: typeof Briefcase;
}

const CAREER_TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    description: "Quick career growth summary",
  },
  {
    id: "career",
    label: "Career",
    icon: Briefcase,
    description: "Career progress and readiness",
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    description: "Track and plan certifications",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: FileText,
    description: "Manage and export your portfolio",
  },
] as const;

type TabId = typeof CAREER_TABS[number]["id"];

export function CareerGrowthHub({
  userId,
  className,
  compact = false,
  defaultTab = "overview",
  onCertificationSelect,
  onViewCertifications,
  onViewPortfolio,
  onAddProject,
}: CareerGrowthHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  // Quick metrics for overview
  const quickMetrics: CareerMetric[] = [
    {
      id: "readiness",
      label: "Career Ready",
      value: "85%",
      status: "ready",
      icon: Target,
    },
    {
      id: "certifications",
      label: "Certifications",
      value: "Active",
      trend: "up",
      icon: Award,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      value: "Growing",
      status: "growing",
      icon: FileText,
    },
    {
      id: "skills",
      label: "Skills Mapped",
      value: "12",
      status: "active",
      icon: Map,
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
                onClick={() => setActiveTab("career")}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4 text-indigo-500" />
                Career
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Track career progress and readiness
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("certifications")}
                className="gap-2"
              >
                <Award className="h-4 w-4 text-amber-500" />
                Certifications
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Manage certifications and skill mapping
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPortfolioDialogOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4 text-emerald-500" />
                Portfolio
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View and export your portfolio
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Portfolio Export Dialog */}
        <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
          <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
            <PortfolioExport />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full mode - card with tabs
  return (
    <Card className={cn("overflow-hidden border-slate-200 dark:border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-900/20 dark:to-amber-900/20 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-600 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Career &amp; Professional Growth Hub
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Track certifications, build your portfolio, and accelerate career growth
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Professional
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 dark:bg-slate-800/50 p-1 h-auto flex-wrap">
            {CAREER_TABS.map((tab) => {
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
                        metric.status === "ready" ? "text-emerald-500" :
                        metric.status === "growing" ? "text-blue-500" :
                        metric.status === "active" ? "text-indigo-500" : "text-slate-500"
                      )} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                      {metric.trend && (
                        <Zap className={cn(
                          "inline h-3 w-3 ml-1",
                          metric.trend === "up" ? "text-emerald-500" : "text-slate-400"
                        )} />
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Access Panels */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Career Progress Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("career")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Career Progress
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Track readiness, skills, and milestones
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300">Readiness Score</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-slate-500">Growth Track</span>
                  </div>
                </div>
              </motion.div>

              {/* Certifications Quick View */}
              <motion.div
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                onClick={() => setActiveTab("certifications")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Certifications
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Progress tracking and skill mapping
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  {["In Progress", "Completed", "Recommended"].map((status) => (
                    <Badge
                      key={status}
                      variant="outline"
                      className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Portfolio Quick Access */}
            <motion.div
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
              onClick={() => setActiveTab("portfolio")}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Portfolio &amp; Export
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Showcase your work, export for job applications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    PDF / LinkedIn
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50/50 to-amber-50/50 dark:from-indigo-900/10 dark:to-amber-900/10 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={onAddProject}>
                  <FileText className="h-4 w-4" />
                  Add Project
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={onViewCertifications}>
                  <GraduationCap className="h-4 w-4" />
                  Start Certification
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setPortfolioDialogOpen(true)}>
                  <Trophy className="h-4 w-4" />
                  Export Portfolio
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Career Progress Tab */}
          <TabsContent value="career" className="p-4">
            <CareerProgressWidget
              compact={false}
              onViewCertifications={onViewCertifications}
              onViewPortfolio={onViewPortfolio}
              onAddProject={onAddProject}
            />
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="p-0">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Certification Progress */}
              <div className="p-4 border-r border-slate-200 dark:border-slate-700">
                <CertificationProgressWidget
                  compact={false}
                  onViewAll={onViewCertifications}
                />
              </div>
              {/* Skill to Certification Map */}
              <div className="p-4">
                <SkillToCertificationMap
                  userId={userId}
                  compact={false}
                  onCertificationSelect={onCertificationSelect}
                />
              </div>
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="p-4">
            <PortfolioExport
              compact={false}
              defaultTab="preview"
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Portfolio Export Dialog for expanded view */}
      <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <PortfolioExport defaultTab="export" />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default CareerGrowthHub;
