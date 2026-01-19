"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  GitCompare,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DepthAnalyzerProps {
  className?: string;
  compact?: boolean;
}

interface Course {
  id: string;
  title: string;
}

interface BloomsDistribution {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

interface DepthAnalysis {
  courseId: string;
  analyzedAt: string;
  cognitiveDepth: number;
  balance: number;
  bloomsDistribution: BloomsDistribution;
  gapAnalysis: Array<{
    area: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendation: string;
  }>;
  skillsMatrix: Array<{
    skill: string;
    coverage: number;
    depth: number;
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

interface HistoricalSnapshot {
  analyzedAt: string;
  cognitiveDepth: number;
  balance: number;
}

const BLOOMS_COLORS: Record<keyof BloomsDistribution, { bg: string; text: string; label: string }> = {
  remember: { bg: "bg-red-100", text: "text-red-700", label: "Remember" },
  understand: { bg: "bg-orange-100", text: "text-orange-700", label: "Understand" },
  apply: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Apply" },
  analyze: { bg: "bg-green-100", text: "text-green-700", label: "Analyze" },
  evaluate: { bg: "bg-blue-100", text: "text-blue-700", label: "Evaluate" },
  create: { bg: "bg-purple-100", text: "text-purple-700", label: "Create" },
};

export function DepthAnalyzer({ className, compact = false }: DepthAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [analysis, setAnalysis] = useState<DepthAnalysis | null>(null);
  const [historicalTrends, setHistoricalTrends] = useState<HistoricalSnapshot[]>([]);
  const [analysisDepth, setAnalysisDepth] = useState<"basic" | "detailed" | "comprehensive">("detailed");
  const [forceReanalyze, setForceReanalyze] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  // Define fetchHistoricalTrends first so it can be used in runAnalysis
  const fetchHistoricalTrends = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(
        `/api/sam/enhanced-depth-analysis?endpoint=trends&courseId=${courseId}&limit=10`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setHistoricalTrends(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch historical trends:", error);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!selectedCourse) {
      toast.error("Please select a course first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/sam/enhanced-depth-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          data: {
            courseId: selectedCourse.id,
            forceReanalyze,
            includeHistoricalSnapshot: true,
            analysisDepth,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis({
          courseId: result.data.courseId,
          analyzedAt: result.data.analyzedAt || new Date().toISOString(),
          cognitiveDepth: result.data.cognitiveDepth,
          balance: result.data.balance,
          bloomsDistribution: result.data.bloomsDistribution,
          gapAnalysis: result.data.gapAnalysis || [],
          skillsMatrix: result.data.skillsMatrix || [],
          recommendations: result.data.recommendations || {
            immediate: [],
            shortTerm: [],
            longTerm: [],
          },
        });
        toast.success("Depth analysis completed!");

        // Fetch historical trends
        fetchHistoricalTrends(selectedCourse.id);
      } else {
        throw new Error(result.error?.message || "Analysis failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze course depth");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourse, forceReanalyze, analysisDepth, fetchHistoricalTrends]);

  const getDepthLabel = (depth: number): string => {
    if (depth >= 0.8) return "Excellent";
    if (depth >= 0.6) return "Good";
    if (depth >= 0.4) return "Moderate";
    return "Needs Improvement";
  };

  const getDepthColor = (depth: number): string => {
    if (depth >= 0.8) return "text-green-600";
    if (depth >= 0.6) return "text-blue-600";
    if (depth >= 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-700 border-0">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700 border-0">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-700 border-0">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (compact) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Depth Analyzer</CardTitle>
              <CardDescription>Bloom&apos;s Taxonomy analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Analyze Course Depth
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Content Depth Analyzer</CardTitle>
              <CardDescription>
                Analyze course cognitive depth with Bloom&apos;s Taxonomy and Webb&apos;s DOK
              </CardDescription>
            </div>
          </div>
          {analysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Selection */}
        <div className="space-y-4 p-4 rounded-lg border bg-slate-50/50">
          <div className="space-y-2">
            <Label>Search Your Courses</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by course title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {courses.length > 0 && (
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
                      "hover:bg-emerald-50 border",
                      selectedCourse?.id === course.id
                        ? "bg-emerald-100 border-emerald-300"
                        : "bg-white border-transparent"
                    )}
                  >
                    <p className="font-medium text-sm truncate">{course.title}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedCourse && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Selected Course</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse(null);
                    setSearchQuery("");
                    setAnalysis(null);
                  }}
                  className="text-xs text-emerald-600"
                >
                  Clear
                </Button>
              </div>
              <p className="mt-1 text-sm text-emerald-800 truncate">{selectedCourse.title}</p>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Analysis Depth</Label>
              <Select value={analysisDepth} onValueChange={(v) => setAnalysisDepth(v as typeof analysisDepth)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch checked={forceReanalyze} onCheckedChange={setForceReanalyze} />
                <Label className="text-sm">Force Re-analyze</Label>
              </div>
            </div>
          </div>

          <Button
            onClick={runAnalysis}
            disabled={isLoading || !selectedCourse}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Course Depth
              </>
            )}
          </Button>
        </div>

        {/* Historical Trends Sidebar */}
        <AnimatePresence>
          {showHistory && historicalTrends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-lg border bg-slate-50"
            >
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Historical Trends
              </h4>
              <div className="space-y-2">
                {historicalTrends.slice(0, 5).map((snapshot, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-white">
                    <span className="text-slate-600">
                      {new Date(snapshot.analyzedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={getDepthColor(snapshot.cognitiveDepth)}>
                        Depth: {Math.round(snapshot.cognitiveDepth * 100)}%
                      </span>
                      {i > 0 && (
                        snapshot.cognitiveDepth > historicalTrends[i - 1].cognitiveDepth ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : snapshot.cognitiveDepth < historicalTrends[i - 1].cognitiveDepth ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Overview Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Cognitive Depth</span>
                  </div>
                  <p className={cn("text-3xl font-bold", getDepthColor(analysis.cognitiveDepth))}>
                    {Math.round(analysis.cognitiveDepth * 100)}%
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {getDepthLabel(analysis.cognitiveDepth)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Balance Score</span>
                  </div>
                  <p className={cn("text-3xl font-bold", getDepthColor(analysis.balance))}>
                    {Math.round(analysis.balance * 100)}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {analysis.balance >= 0.7 ? "Well Balanced" : "Needs Balancing"}
                  </p>
                </div>
              </div>

              {/* Bloom's Distribution */}
              <div className="p-4 rounded-lg border bg-white">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Bloom&apos;s Taxonomy Distribution
                </h4>
                <div className="space-y-3">
                  {(Object.entries(analysis.bloomsDistribution) as [keyof BloomsDistribution, number][]).map(
                    ([level, value]) => {
                      const config = BLOOMS_COLORS[level];
                      return (
                        <div key={level}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={config.text}>{config.label}</span>
                            <span className={config.text}>{Math.round(value * 100)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value * 100}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={cn("h-full rounded-full", config.bg.replace("100", "400"))}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Visual Key */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-600">
                  <p className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Lower-order: Remember, Understand, Apply | Higher-order: Analyze, Evaluate, Create
                  </p>
                </div>
              </div>

              {/* Detailed Tabs */}
              <Tabs defaultValue="gaps" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="gaps">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Gaps
                  </TabsTrigger>
                  <TabsTrigger value="skills">
                    <Target className="h-4 w-4 mr-2" />
                    Skills
                  </TabsTrigger>
                  <TabsTrigger value="actions">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="gaps" className="mt-4 space-y-3">
                  {analysis.gapAnalysis.length > 0 ? (
                    analysis.gapAnalysis.map((gap, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm">{gap.area}</span>
                          {getSeverityBadge(gap.severity)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{gap.description}</p>
                        <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                          💡 {gap.recommendation}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No significant gaps detected!</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skills" className="mt-4 space-y-3">
                  {analysis.skillsMatrix.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.skillsMatrix.slice(0, 8).map((skill, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{skill.skill}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Coverage: {Math.round(skill.coverage * 100)}%
                              </Badge>
                              <Badge className={cn(
                                skill.depth >= 0.7 ? "bg-green-100 text-green-700" :
                                skill.depth >= 0.4 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700",
                                "border-0"
                              )}>
                                Depth: {Math.round(skill.depth * 100)}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={skill.coverage * 100} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="h-8 w-8 mx-auto mb-2" />
                      <p>No skills matrix available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-3">
                  {analysis.recommendations.immediate.length > 0 && (
                    <div className="p-3 rounded-lg border-2 border-red-200 bg-red-50">
                      <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Immediate Actions
                      </h5>
                      <ul className="space-y-1">
                        {analysis.recommendations.immediate.map((rec, i) => (
                          <li key={i} className="text-sm text-red-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations.shortTerm.length > 0 && (
                    <div className="p-3 rounded-lg border-2 border-yellow-200 bg-yellow-50">
                      <h5 className="font-medium text-yellow-700 mb-2">Short-Term Improvements</h5>
                      <ul className="space-y-1">
                        {analysis.recommendations.shortTerm.map((rec, i) => (
                          <li key={i} className="text-sm text-yellow-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations.longTerm.length > 0 && (
                    <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                      <h5 className="font-medium text-green-700 mb-2">Long-Term Strategy</h5>
                      <ul className="space-y-1">
                        {analysis.recommendations.longTerm.map((rec, i) => (
                          <li key={i} className="text-sm text-green-600">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendations.immediate.length === 0 &&
                   analysis.recommendations.shortTerm.length === 0 &&
                   analysis.recommendations.longTerm.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No specific recommendations at this time</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Timestamp */}
              <p className="text-xs text-center text-slate-400">
                Analysis completed at {new Date(analysis.analyzedAt).toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
