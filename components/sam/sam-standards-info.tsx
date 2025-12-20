"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Shield,
  Award,
  BookOpen,
  Target,
  BarChart3,
  Brain,
  Globe,
  Sparkles,
  CheckCircle2,
  Info,
  Layers,
  GitBranch,
  TrendingUp,
  Zap,
  GraduationCap,
  FlaskConical,
  Fingerprint,
  Clock,
  LineChart,
  Lightbulb,
  Settings2,
  ArrowRight,
  Star,
  ChevronRight,
} from "lucide-react";

// Enhanced Analysis Features
interface AnalysisFeature {
  id: string;
  name: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const analysisFeatures: AnalysisFeature[] = [
  {
    id: "blooms",
    name: "Bloom's Taxonomy Analysis",
    description: "6-level cognitive complexity framework",
    details: [
      "Analyzes content across Remember, Understand, Apply, Analyze, Evaluate, Create levels",
      "Measures cognitive depth and progression through course content",
      "Identifies balance between lower and higher-order thinking skills",
      "Provides specific recommendations to enhance cognitive complexity",
    ],
    icon: <Brain className="w-5 h-5" />,
    color: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500/20 to-indigo-500/20",
  },
  {
    id: "dok",
    name: "Webb's DOK Integration",
    description: "4-level depth of knowledge framework",
    details: [
      "Level 1: Recall - Basic facts and simple procedures",
      "Level 2: Skill/Concept - Applying knowledge in routine situations",
      "Level 3: Strategic Thinking - Complex reasoning and planning",
      "Level 4: Extended Thinking - Investigation and real-world application",
    ],
    icon: <Layers className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "course-type",
    name: "Course-Type Adaptive Analysis",
    description: "Intelligent course classification system",
    details: [
      "Auto-detects 7 course types: Foundational, Intermediate, Advanced, Professional, Creative, Technical, Theoretical",
      "Provides ideal Bloom's distribution targets for each course type",
      "Measures alignment between course content and detected type",
      "Suggests optimizations based on course category",
    ],
    icon: <Settings2 className="w-5 h-5" />,
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "smart",
    name: "SMART Criteria Analysis",
    description: "Learning objective quality assessment",
    details: [
      "Specific - Clear and unambiguous objective statements",
      "Measurable - Observable outcomes with assessment criteria",
      "Achievable - Realistic within course constraints",
      "Relevant - Aligned with course goals and learner needs",
      "Time-bound - Clear completion expectations",
    ],
    icon: <Target className="w-5 h-5" />,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "deduplication",
    name: "Objective Deduplication",
    description: "Semantic similarity clustering",
    details: [
      "Identifies redundant or overlapping learning objectives",
      "Groups similar objectives into semantic clusters",
      "Recommends consolidation strategies",
      "Provides optimized objective lists",
    ],
    icon: <Fingerprint className="w-5 h-5" />,
    color: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
  {
    id: "assessment",
    name: "Assessment Quality Scoring",
    description: "Comprehensive evaluation metrics",
    details: [
      "Question variety analysis across multiple formats",
      "Difficulty progression measurement",
      "Bloom's taxonomy coverage in assessments",
      "Feedback quality and distractor effectiveness analysis",
    ],
    icon: <FlaskConical className="w-5 h-5" />,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    id: "historical",
    name: "Historical Trend Analysis",
    description: "Progress tracking over time",
    details: [
      "Tracks course improvements across analysis sessions",
      "Visualizes cognitive depth progression",
      "Monitors balance score improvements",
      "Content hashing for efficient caching",
    ],
    icon: <LineChart className="w-5 h-5" />,
    color: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-500/20 to-sky-500/20",
  },
];

// International Standards
interface Standard {
  name: string;
  shortName: string;
  description: string;
  application: string;
  icon: React.ReactNode;
  color: string;
}

const standards: Standard[] = [
  {
    name: "Bloom's Taxonomy",
    shortName: "Bloom's",
    description: "Six levels of cognitive complexity from Remember to Create",
    application: "Core framework for analyzing thinking skills progression",
    icon: <Brain className="w-5 h-5" />,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    name: "Webb's DOK",
    shortName: "DOK",
    description: "Four levels of depth of knowledge for cognitive rigor",
    application: "Complements Bloom's with knowledge depth analysis",
    icon: <Layers className="w-5 h-5" />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Quality Matters",
    shortName: "QM",
    description: "Nationally recognized quality assurance with 42 standards",
    application: "Ensures course design quality and alignment",
    icon: <Shield className="w-5 h-5" />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "ADDIE Model",
    shortName: "ADDIE",
    description: "Systematic instructional design process",
    application: "Guides course development through 5 phases",
    icon: <GitBranch className="w-5 h-5" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    name: "Kirkpatrick Model",
    shortName: "Kirkpatrick",
    description: "Four-level training evaluation framework",
    application: "Measures learning effectiveness to results",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    name: "ISO 21001:2018",
    shortName: "ISO",
    description: "International standard for educational organizations",
    application: "Quality management and learner satisfaction",
    icon: <Award className="w-5 h-5" />,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

// Analysis Pipeline Steps
const pipelineSteps = [
  {
    step: 1,
    title: "Content Extraction",
    description: "Parse course structure, objectives, chapters, and sections",
    icon: <BookOpen className="w-4 h-4" />,
    duration: "~2s",
  },
  {
    step: 2,
    title: "Cognitive Analysis",
    description: "Apply Bloom's Taxonomy and Webb's DOK frameworks",
    icon: <Brain className="w-4 h-4" />,
    duration: "~3s",
  },
  {
    step: 3,
    title: "Course Type Detection",
    description: "Classify and set adaptive targets",
    icon: <Settings2 className="w-4 h-4" />,
    duration: "~1s",
  },
  {
    step: 4,
    title: "Objective Analysis",
    description: "SMART criteria evaluation and deduplication",
    icon: <Target className="w-4 h-4" />,
    duration: "~2s",
  },
  {
    step: 5,
    title: "Assessment Quality",
    description: "Evaluate question variety and difficulty",
    icon: <FlaskConical className="w-4 h-4" />,
    duration: "~2s",
  },
  {
    step: 6,
    title: "Recommendations",
    description: "Generate prioritized improvement suggestions",
    icon: <Lightbulb className="w-4 h-4" />,
    duration: "~2s",
  },
];

export function SamStandardsInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200/50 dark:border-purple-800/50 hover:from-purple-500/20 hover:to-indigo-500/20 transition-all duration-300"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">How SAM Evaluates</span>
          <span className="sm:hidden">Info</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full min-h-0">
          {/* Header - Fixed */}
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent truncate">
                  SAM Enhanced Analysis Engine
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1 sm:line-clamp-none">
                  AI-powered course evaluation with 7 analysis engines
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Tabs defaultValue="features" className="w-full h-full flex flex-col">
              <div className="flex-shrink-0 sticky top-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-3 sm:px-6 py-3 sm:pt-4">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg sm:rounded-xl h-auto">
                  <TabsTrigger
                    value="features"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md sm:rounded-lg text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Features</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pipeline"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md sm:rounded-lg text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3"
                  >
                    <GitBranch className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Pipeline</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="standards"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md sm:rounded-lg text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3"
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Standards</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="metrics"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-md sm:rounded-lg text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3"
                  >
                    <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Metrics</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Features Tab */}
              <TabsContent value="features" className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {analysisFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "relative overflow-hidden cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl",
                          activeFeature === feature.id
                            ? "ring-2 ring-purple-500 shadow-purple-500/20"
                            : "hover:scale-[1.02]"
                        )}
                        onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                      >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", feature.gradient)} />
                        <CardHeader className="relative pb-2">
                          <div className="flex items-start justify-between">
                            <div className={cn("p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-sm", feature.color)}>
                              {feature.icon}
                            </div>
                            <ChevronRight className={cn(
                              "w-5 h-5 text-slate-400 transition-transform duration-300",
                              activeFeature === feature.id && "rotate-90"
                            )} />
                          </div>
                          <CardTitle className="text-base font-semibold mt-3">{feature.name}</CardTitle>
                          <CardDescription className="text-xs">{feature.description}</CardDescription>
                        </CardHeader>
                        <AnimatePresence>
                          {activeFeature === feature.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CardContent className="relative pt-0">
                                <ul className="space-y-2">
                                  {feature.details.map((detail, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <span>{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Pipeline Tab */}
              <TabsContent value="pipeline" className="flex-1 p-3 sm:p-6 mt-0">
                <div className="relative">
                  {/* Pipeline visual - only on larger screens */}
                  <div className="hidden md:block absolute left-[2.25rem] top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-500 via-indigo-500 to-cyan-500 rounded-full" />

                  <div className="space-y-3 sm:space-y-4">
                    {pipelineSteps.map((step, index) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredStep(step.step)}
                        onMouseLeave={() => setHoveredStep(null)}
                        className={cn(
                          "relative flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300",
                          hoveredStep === step.step
                            ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 shadow-lg"
                            : "bg-white/50 dark:bg-slate-800/50"
                        )}
                      >
                        {/* Step number */}
                        <div className={cn(
                          "relative z-10 flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300",
                          hoveredStep === step.step
                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        )}>
                          {step.step}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <h4 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 flex items-center gap-1 sm:gap-2">
                              <span className="hidden sm:inline">{step.icon}</span>
                              <span className="truncate">{step.title}</span>
                            </h4>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-none">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Total time */}
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg sm:rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        <span className="font-medium text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">Total Analysis Time</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-emerald-600">~12s</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1.5 sm:mt-2">
                      Smart caching reduces subsequent analyses to under 1 second
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Standards Tab */}
              <TabsContent value="standards" className="flex-1 p-3 sm:p-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {standards.map((standard, index) => (
                    <motion.div
                      key={standard.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit", standard.color)}>
                            {standard.icon}
                            <span className="font-semibold text-sm">{standard.shortName}</span>
                          </div>
                          <CardTitle className="text-sm font-medium mt-2">{standard.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {standard.description}
                          </p>
                          <div className="flex items-start gap-1.5 text-xs">
                            <ArrowRight className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{standard.application}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Standards count badge */}
                <div className="mt-6 flex justify-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full border border-purple-200/50 dark:border-purple-800/50">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-700 dark:text-purple-400">12+ International Standards Integrated</span>
                  </div>
                </div>
              </TabsContent>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="flex-1 p-3 sm:p-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Cognitive Metrics */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Cognitive Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Cognitive Depth", desc: "How deep learners engage with content", range: "0-100" },
                        { label: "Balance Score", desc: "Distribution across Bloom's levels", range: "0-100" },
                        { label: "Complexity Level", desc: "Overall difficulty assessment", range: "0-100" },
                        { label: "DOK Distribution", desc: "Webb's Depth of Knowledge spread", range: "L1-L4" },
                      ].map((metric, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-sm">{metric.label}</p>
                            <p className="text-xs text-slate-500">{metric.desc}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{metric.range}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quality Metrics */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        Quality Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "SMART Score", desc: "Learning objective quality", range: "0-100" },
                        { label: "Assessment Quality", desc: "Question variety & rigor", range: "0-100" },
                        { label: "Course Type Match", desc: "Alignment with detected type", range: "0-100%" },
                        { label: "Objective Clarity", desc: "How clear objectives are written", range: "0-100" },
                      ].map((metric, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-sm">{metric.label}</p>
                            <p className="text-xs text-slate-500">{metric.desc}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{metric.range}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Course Types */}
                  <Card className="md:col-span-2 border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-amber-600" />
                        Adaptive Course Types
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Each course type has optimized Bloom&apos;s distribution targets
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                        {[
                          { type: "Foundational", focus: "Remember/Understand" },
                          { type: "Intermediate", focus: "Apply/Analyze" },
                          { type: "Advanced", focus: "Evaluate/Create" },
                          { type: "Professional", focus: "Apply/Evaluate" },
                          { type: "Creative", focus: "Create/Evaluate" },
                          { type: "Technical", focus: "Apply/Analyze" },
                          { type: "Theoretical", focus: "Understand/Analyze" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center hover:shadow-md transition-all duration-300"
                          >
                            <p className="font-medium text-xs">{item.type}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{item.focus}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                <span className="hidden sm:inline">Powered by Claude AI with educational research foundations</span>
                <span className="sm:hidden">Powered by Claude AI</span>
              </div>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-[10px] sm:text-xs">
                v2.0 Enhanced
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SamStandardsBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-sm font-medium shadow-sm"
    >
      <Shield className="w-4 h-4" />
      <span className="hidden sm:inline">12+ International Standards</span>
      <span className="sm:hidden">Standards</span>
    </motion.div>
  );
}
