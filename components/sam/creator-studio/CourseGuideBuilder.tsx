"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Loader2,
  RefreshCw,
  Download,
  ExternalLink,
  TrendingUp,
  Target,
  BarChart3,
  Award,
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseGuideBuilderProps {
  className?: string;
  compact?: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface CourseGuide {
  courseId: string;
  courseTitle: string;
  generatedAt: string;
  metrics: {
    depth: {
      overallDepth: number;
      contentRichness: number;
      conceptCoverage: number;
    };
    engagement: {
      overallEngagement: number;
      interactivityScore: number;
      multimediaUsage: number;
    };
    marketAcceptance: {
      overallAcceptance: number;
      competitivePosition: number;
      demandAlignment: number;
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  successPrediction: {
    successProbability: number;
    confidenceLevel: number;
    riskFactors: string[];
  };
  comparison?: {
    topPerformers: Array<{
      title: string;
      score: number;
    }>;
    averageInCategory: number;
  };
}

export function CourseGuideBuilder({ className, compact = false }: CourseGuideBuilderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [guide, setGuide] = useState<CourseGuide | null>(null);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeProjections, setIncludeProjections] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("metrics");

  // Search for user's courses
  const searchCourses = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }

    try {
      const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}&limit=10`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.courses || []);
      }
    } catch (error) {
      console.error("Failed to search courses:", error);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCourses(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCourses]);

  const generateGuide = useCallback(async () => {
    if (!selectedCourse) {
      toast.error("Please select a course first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/sam/course-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          includeComparison,
          includeProjections,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGuide({
          courseId: selectedCourse.id,
          courseTitle: selectedCourse.title,
          generatedAt: result.metadata?.generatedAt || new Date().toISOString(),
          metrics: result.data.metrics,
          recommendations: result.data.recommendations || {
            immediate: [],
            shortTerm: [],
            longTerm: [],
          },
          successPrediction: result.data.successPrediction || {
            successProbability: 0,
            confidenceLevel: 0,
            riskFactors: [],
          },
          comparison: result.data.comparison,
        });
        toast.success("Course guide generated successfully!");
      } else {
        throw new Error(result.error || "Failed to generate guide");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate course guide");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, includeComparison, includeProjections]);

  const exportGuide = useCallback(async (format: "json" | "html") => {
    if (!selectedCourse || !guide) return;

    if (format === "json") {
      const blob = new Blob([JSON.stringify(guide, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `course-guide-${selectedCourse.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      try {
        const response = await fetch(
          `/api/sam/course-guide?courseId=${selectedCourse.id}&format=html`
        );
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `course-guide-${selectedCourse.id}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error("Failed to export HTML guide");
      }
    }
  }, [selectedCourse, guide]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return "bg-green-100";
    if (score >= 0.6) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (compact) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Course Guide</CardTitle>
              <CardDescription>Analyze course performance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => setExpandedSection("search")}>
            <Search className="h-4 w-4 mr-2" />
            Select Course to Analyze
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Course Guide Builder</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Generate comprehensive course guides with AI-powered insights
              </CardDescription>
            </div>
          </div>
          {guide && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => exportGuide("json")} className="text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportGuide("html")} className="text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                HTML
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Course Selection */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg border bg-slate-50/50">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Search Your Courses</Label>
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              <Input
                placeholder="Search by course title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {courses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Select a course</Label>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course);
                        setSearchQuery(course.title);
                        setCourses([]);
                      }}
                      className={cn(
                        "w-full text-left p-2 rounded-lg transition-colors",
                        "hover:bg-blue-50 border",
                        selectedCourse?.id === course.id
                          ? "bg-blue-100 border-blue-300"
                          : "bg-white border-transparent"
                      )}
                    >
                      <p className="font-medium text-sm truncate">{course.title}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {selectedCourse && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Selected Course</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse(null);
                    setSearchQuery("");
                    setGuide(null);
                  }}
                  className="text-xs text-blue-600"
                >
                  Clear
                </Button>
              </div>
              <p className="mt-1 text-sm text-blue-800 truncate">{selectedCourse.title}</p>
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={includeComparison} onCheckedChange={setIncludeComparison} />
              <Label className="text-xs sm:text-sm">Include Market Comparison</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={includeProjections} onCheckedChange={setIncludeProjections} />
              <Label className="text-xs sm:text-sm">Include Success Projections</Label>
            </div>
          </div>

          <Button
            onClick={generateGuide}
            disabled={isLoading || !selectedCourse}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                Generating Guide...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Generate Course Guide
              </>
            )}
          </Button>
        </div>

        {/* Generated Guide Display */}
        <AnimatePresence>
          {guide && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                    <span className="text-[10px] sm:text-xs text-blue-600 font-medium">Depth</span>
                  </div>
                  <p className={cn("text-xl sm:text-2xl font-bold", getScoreColor(guide.metrics.depth.overallDepth))}>
                    {Math.round(guide.metrics.depth.overallDepth * 100)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Engagement</span>
                  </div>
                  <p className={cn("text-2xl font-bold", getScoreColor(guide.metrics.engagement.overallEngagement))}>
                    {Math.round(guide.metrics.engagement.overallEngagement * 100)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">Market Fit</span>
                  </div>
                  <p className={cn("text-2xl font-bold", getScoreColor(guide.metrics.marketAcceptance.overallAcceptance))}>
                    {Math.round(guide.metrics.marketAcceptance.overallAcceptance * 100)}%
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">Success</span>
                  </div>
                  <p className={cn("text-2xl font-bold", getScoreColor(guide.successPrediction.successProbability))}>
                    {Math.round(guide.successPrediction.successProbability * 100)}%
                  </p>
                </div>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-auto">
                  <TabsTrigger value="metrics" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                    <span className="hidden xs:inline">Metrics</span>
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                    <span className="hidden xs:inline">Actions</span>
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                    <span className="hidden xs:inline">Risks</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="mt-4 space-y-4">
                  {/* Depth Metrics */}
                  <div className="p-4 rounded-lg border bg-white">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Content Depth Analysis
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Content Richness</span>
                          <span className={getScoreColor(guide.metrics.depth.contentRichness)}>
                            {Math.round(guide.metrics.depth.contentRichness * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.depth.contentRichness * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Concept Coverage</span>
                          <span className={getScoreColor(guide.metrics.depth.conceptCoverage)}>
                            {Math.round(guide.metrics.depth.conceptCoverage * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.depth.conceptCoverage * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="p-4 rounded-lg border bg-white">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      Engagement Analysis
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Interactivity Score</span>
                          <span className={getScoreColor(guide.metrics.engagement.interactivityScore)}>
                            {Math.round(guide.metrics.engagement.interactivityScore * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.engagement.interactivityScore * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Multimedia Usage</span>
                          <span className={getScoreColor(guide.metrics.engagement.multimediaUsage)}>
                            {Math.round(guide.metrics.engagement.multimediaUsage * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.engagement.multimediaUsage * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Market Metrics */}
                  <div className="p-4 rounded-lg border bg-white">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Market Position
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Competitive Position</span>
                          <span className={getScoreColor(guide.metrics.marketAcceptance.competitivePosition)}>
                            {Math.round(guide.metrics.marketAcceptance.competitivePosition * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.marketAcceptance.competitivePosition * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Demand Alignment</span>
                          <span className={getScoreColor(guide.metrics.marketAcceptance.demandAlignment)}>
                            {Math.round(guide.metrics.marketAcceptance.demandAlignment * 100)}%
                          </span>
                        </div>
                        <Progress value={guide.metrics.marketAcceptance.demandAlignment * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="mt-4 space-y-4">
                  {guide.recommendations.immediate.length > 0 && (
                    <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                      <h4 className="font-medium mb-2 text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Immediate Actions
                      </h4>
                      <ul className="space-y-2">
                        {guide.recommendations.immediate.map((rec, i) => (
                          <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {guide.recommendations.shortTerm.length > 0 && (
                    <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
                      <h4 className="font-medium mb-2 text-yellow-700 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Short-Term Improvements
                      </h4>
                      <ul className="space-y-2">
                        {guide.recommendations.shortTerm.map((rec, i) => (
                          <li key={i} className="text-sm text-yellow-600 flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {guide.recommendations.longTerm.length > 0 && (
                    <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                      <h4 className="font-medium mb-2 text-green-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Long-Term Strategy
                      </h4>
                      <ul className="space-y-2">
                        {guide.recommendations.longTerm.map((rec, i) => (
                          <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="risks" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-orange-600" />
                        Success Prediction
                      </h4>
                      <Badge className={cn(getScoreBg(guide.successPrediction.successProbability), "border-0")}>
                        {Math.round(guide.successPrediction.successProbability * 100)}% Likely
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span>{Math.round(guide.successPrediction.confidenceLevel * 100)}%</span>
                      </div>
                      <Progress value={guide.successPrediction.confidenceLevel * 100} className="h-2" />
                    </div>

                    {guide.successPrediction.riskFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-red-700">Risk Factors</h5>
                        <ul className="space-y-2">
                          {guide.successPrediction.riskFactors.map((risk, i) => (
                            <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {guide.comparison && (
                    <div className="p-4 rounded-lg border bg-white">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Market Comparison
                      </h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Category Average:{" "}
                        <span className="font-medium">
                          {Math.round(guide.comparison.averageInCategory * 100)}%
                        </span>
                      </p>

                      {guide.comparison.topPerformers.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-slate-500 mb-2">Top Performers</h5>
                          <div className="space-y-2">
                            {guide.comparison.topPerformers.slice(0, 3).map((performer, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate">{performer.title}</span>
                                <Badge variant="outline">{Math.round(performer.score * 100)}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Generated timestamp */}
              <p className="text-xs text-center text-slate-400">
                Guide generated at {new Date(guide.generatedAt).toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
