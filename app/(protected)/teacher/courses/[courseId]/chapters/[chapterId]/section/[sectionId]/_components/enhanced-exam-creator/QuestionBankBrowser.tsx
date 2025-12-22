"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  Filter,
  SortAsc,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  List,
  FileText,
  Loader2,
  LayoutGrid,
  LayoutList,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  QuestionBankItem,
  QuestionBankFilters,
  GeneratedQuestion,
  BLOOMS_GUIDANCE,
  QUESTION_TYPE_INFO,
} from "./types";

interface QuestionBankBrowserProps {
  courseId: string;
  sectionId: string;
  onImportQuestions: (questions: GeneratedQuestion[]) => void;
}

const BLOOMS_ICONS: Record<BloomsLevel, React.ReactNode> = {
  REMEMBER: <Brain className="h-4 w-4" />,
  UNDERSTAND: <Lightbulb className="h-4 w-4" />,
  APPLY: <Wrench className="h-4 w-4" />,
  ANALYZE: <Search className="h-4 w-4" />,
  EVALUATE: <Scale className="h-4 w-4" />,
  CREATE: <Sparkles className="h-4 w-4" />,
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: <Calendar className="h-4 w-4" /> },
  { value: "oldest", label: "Oldest First", icon: <Calendar className="h-4 w-4" /> },
  { value: "points", label: "Points (High to Low)", icon: <Award className="h-4 w-4" /> },
  { value: "difficulty", label: "Difficulty", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "bloomsLevel", label: "Bloom&apos;s Level", icon: <Brain className="h-4 w-4" /> },
] as const;

const defaultFilters: QuestionBankFilters = {
  search: "",
  bloomsLevels: [],
  questionTypes: [],
  difficulties: [],
  minPoints: 0,
  maxPoints: 10,
  hasHints: null,
  sortBy: "newest",
};

export function QuestionBankBrowser({
  courseId,
  sectionId,
  onImportQuestions,
}: QuestionBankBrowserProps) {
  const [filters, setFilters] = useState<QuestionBankFilters>(defaultFilters);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch questions from the bank
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        courseId,
        sectionId,
        search: filters.search,
        sortBy: filters.sortBy,
        minPoints: filters.minPoints.toString(),
        maxPoints: filters.maxPoints.toString(),
      });

      if (filters.bloomsLevels.length > 0) {
        params.set("bloomsLevels", filters.bloomsLevels.join(","));
      }
      if (filters.questionTypes.length > 0) {
        params.set("questionTypes", filters.questionTypes.join(","));
      }
      if (filters.difficulties.length > 0) {
        params.set("difficulties", filters.difficulties.join(","));
      }
      if (filters.hasHints !== null) {
        params.set("hasHints", filters.hasHints.toString());
      }

      const response = await fetch(`/api/question-bank?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, sectionId, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleBloomsLevel = (level: BloomsLevel) => {
    setFilters((prev) => ({
      ...prev,
      bloomsLevels: prev.bloomsLevels.includes(level)
        ? prev.bloomsLevels.filter((l) => l !== level)
        : [...prev.bloomsLevels, level],
    }));
  };

  const toggleQuestionType = (type: QuestionType) => {
    setFilters((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type],
    }));
  };

  const toggleDifficulty = (diff: QuestionDifficulty) => {
    setFilters((prev) => ({
      ...prev,
      difficulties: prev.difficulties.includes(diff)
        ? prev.difficulties.filter((d) => d !== diff)
        : [...prev.difficulties, diff],
    }));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(questions.map((q) => q.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch("/api/question-bank/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        onImportQuestions(data.questions);
        clearSelection();
      }
    } catch (error) {
      console.error("Error importing questions:", error);
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const activeFilterCount =
    filters.bloomsLevels.length +
    filters.questionTypes.length +
    filters.difficulties.length +
    (filters.hasHints !== null ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10"
              />
            </div>

            {/* Filter Button */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-violet-500">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filters</h4>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  {/* Bloom&apos;s Levels */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">
                      Bloom&apos;s Level
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(BLOOMS_GUIDANCE) as BloomsLevel[]).map((level) => {
                        const guidance = BLOOMS_GUIDANCE[level];
                        const isActive = filters.bloomsLevels.includes(level);
                        return (
                          <Badge
                            key={level}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer text-xs",
                              isActive && guidance.bgColor,
                              isActive && guidance.color
                            )}
                            onClick={() => toggleBloomsLevel(level)}
                          >
                            {guidance.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">
                      Question Type
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(QUESTION_TYPE_INFO) as QuestionType[]).map((type) => {
                        const info = QUESTION_TYPE_INFO[type];
                        const isActive = filters.questionTypes.includes(type);
                        return (
                          <Badge
                            key={type}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer text-xs",
                              isActive && "bg-blue-500"
                            )}
                            onClick={() => toggleQuestionType(type)}
                          >
                            {info.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">
                      Difficulty
                    </Label>
                    <div className="flex gap-2">
                      {(["EASY", "MEDIUM", "HARD"] as QuestionDifficulty[]).map((diff) => {
                        const isActive = filters.difficulties.includes(diff);
                        const colors = {
                          EASY: isActive
                            ? "bg-green-500 text-white"
                            : "border-green-300 text-green-600",
                          MEDIUM: isActive
                            ? "bg-yellow-500 text-white"
                            : "border-yellow-300 text-yellow-600",
                          HARD: isActive
                            ? "bg-red-500 text-white"
                            : "border-red-300 text-red-600",
                        };
                        return (
                          <Badge
                            key={diff}
                            variant={isActive ? "default" : "outline"}
                            className={cn("cursor-pointer", colors[diff])}
                            onClick={() => toggleDifficulty(diff)}
                          >
                            {diff}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Has Hints */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500">
                      Has Hints
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={filters.hasHints === true ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            hasHints: prev.hasHints === true ? null : true,
                          }))
                        }
                      >
                        Yes
                      </Button>
                      <Button
                        variant={filters.hasHints === false ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            hasHints: prev.hasHints === false ? null : false,
                          }))
                        }
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, sortBy: option.value }))
                    }
                    className={cn(
                      filters.sortBy === option.value && "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                    {filters.sortBy === option.value && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="rounded-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Active filters:</span>
              {filters.bloomsLevels.map((level) => (
                <Badge
                  key={level}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {BLOOMS_GUIDANCE[level].name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleBloomsLevel(level)}
                  />
                </Badge>
              ))}
              {filters.questionTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {QUESTION_TYPE_INFO[type].label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleQuestionType(type)}
                  />
                </Badge>
              ))}
              {filters.difficulties.map((diff) => (
                <Badge
                  key={diff}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {diff}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleDifficulty(diff)}
                  />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-violet-500">{selectedIds.size} selected</Badge>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <Button
                    onClick={handleImport}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import Selected
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions List */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="font-semibold text-lg">No questions found</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                Try adjusting your filters or create new questions to add to the bank.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
                  : "divide-y divide-slate-100 dark:divide-slate-800"
              )}>
                {questions.map((question, index) => {
                  const guidance = BLOOMS_GUIDANCE[question.bloomsLevel];
                  const typeInfo = QUESTION_TYPE_INFO[question.questionType];
                  const isSelected = selectedIds.has(question.id);
                  const isExpanded = expandedId === question.id;

                  if (viewMode === "grid") {
                    return (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all cursor-pointer",
                          isSelected
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        )}
                        onClick={() => toggleSelection(question.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded-md", guidance.bgColor, guidance.color)}>
                              {BLOOMS_ICONS[question.bloomsLevel]}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <Checkbox checked={isSelected} />
                        </div>
                        <p className="text-sm line-clamp-3 mb-3">{question.question}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {question.points} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {question.successRate !== null
                                ? `${Math.round(question.successRate * 100)}%`
                                : "N/A"}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              question.difficulty === "EASY" && "border-green-300 text-green-600",
                              question.difficulty === "MEDIUM" && "border-yellow-300 text-yellow-600",
                              question.difficulty === "HARD" && "border-red-300 text-red-600"
                            )}
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "p-4 transition-all",
                        isSelected && "bg-violet-50 dark:bg-violet-950/20"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(question.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn("p-1 rounded", guidance.bgColor, guidance.color)}>
                                    {BLOOMS_ICONS[question.bloomsLevel]}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>{guidance.name}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Badge variant="outline" className="text-xs">
                              {typeInfo.label}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                question.difficulty === "EASY" && "border-green-300 text-green-600",
                                question.difficulty === "MEDIUM" && "border-yellow-300 text-yellow-600",
                                question.difficulty === "HARD" && "border-red-300 text-red-600"
                              )}
                            >
                              {question.difficulty}
                            </Badge>
                            {question.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p
                            className={cn(
                              "text-sm",
                              isExpanded ? "" : "line-clamp-2"
                            )}
                          >
                            {question.question}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {question.points} points
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {question.successRate !== null
                                ? `${Math.round(question.successRate * 100)}% success`
                                : "No data"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Used {question.usageCount} times
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedId(isExpanded ? null : question.id)}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{questions.length}</p>
            <p className="text-sm text-slate-500">Total Questions</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {new Set(questions.map((q) => q.bloomsLevel)).size}
            </p>
            <p className="text-sm text-slate-500">Bloom&apos;s Levels</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {questions.reduce((sum, q) => sum + q.points, 0)}
            </p>
            <p className="text-sm text-slate-500">Total Points</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{selectedIds.size}</p>
            <p className="text-sm text-slate-500">Selected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
