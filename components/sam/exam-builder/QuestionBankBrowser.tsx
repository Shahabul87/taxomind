"use client";

/**
 * QuestionBankBrowser
 *
 * Searchable, filterable question bank browser with drag-and-drop
 * selection for exam building.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  Check,
  X,
  ChevronDown,
  Brain,
  Lightbulb,
  Wrench,
  Scale,
  Sparkles,
  Clock,
  BarChart3,
  GripVertical,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";

// Bloom's level metadata
const BLOOMS_META: Record<
  BloomsLevel,
  { icon: typeof Brain; color: string; bgColor: string; label: string }
> = {
  REMEMBER: { icon: Brain, color: "text-slate-400", bgColor: "bg-slate-500", label: "Remember" },
  UNDERSTAND: { icon: Lightbulb, color: "text-blue-400", bgColor: "bg-blue-500", label: "Understand" },
  APPLY: { icon: Wrench, color: "text-emerald-400", bgColor: "bg-emerald-500", label: "Apply" },
  ANALYZE: { icon: Search, color: "text-amber-400", bgColor: "bg-amber-500", label: "Analyze" },
  EVALUATE: { icon: Scale, color: "text-purple-400", bgColor: "bg-purple-500", label: "Evaluate" },
  CREATE: { icon: Sparkles, color: "text-rose-400", bgColor: "bg-rose-500", label: "Create" },
};

const DIFFICULTY_META: Record<
  QuestionDifficulty,
  { color: string; bgColor: string; label: string }
> = {
  EASY: { color: "text-green-400", bgColor: "bg-green-500/20", label: "Easy" },
  MEDIUM: { color: "text-yellow-400", bgColor: "bg-yellow-500/20", label: "Medium" },
  HARD: { color: "text-red-400", bgColor: "bg-red-500/20", label: "Hard" },
};

const QUESTION_TYPES: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_IN_BLANK: "Fill in Blank",
  MATCHING: "Matching",
  ORDERING: "Ordering",
};

export interface BankQuestion {
  id: string;
  text: string;
  type: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  topic?: string;
  tags: string[];
  usageCount: number;
  avgTimeSpent: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation?: string;
}

export interface QuestionBankBrowserProps {
  questions: BankQuestion[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  maxSelections?: number;
  className?: string;
}

export function QuestionBankBrowser({
  questions,
  selectedIds,
  onSelectionChange,
  onLoadMore,
  onRefresh,
  hasMore = false,
  isLoading = false,
  maxSelections,
  className,
}: QuestionBankBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    bloomsLevels: BloomsLevel[];
    difficulties: QuestionDifficulty[];
    types: QuestionType[];
  }>({
    bloomsLevels: [],
    difficulties: [],
    types: [],
  });
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "alphabetical">("recent");
  const [previewQuestion, setPreviewQuestion] = useState<BankQuestion | null>(null);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(query) ||
          q.tags.some((t) => t.toLowerCase().includes(query)) ||
          q.topic?.toLowerCase().includes(query)
      );
    }

    // Bloom's level filter
    if (filters.bloomsLevels.length > 0) {
      result = result.filter((q) => filters.bloomsLevels.includes(q.bloomsLevel));
    }

    // Difficulty filter
    if (filters.difficulties.length > 0) {
      result = result.filter((q) => filters.difficulties.includes(q.difficulty));
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter((q) => filters.types.includes(q.type));
    }

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "alphabetical":
        result.sort((a, b) => a.text.localeCompare(b.text));
        break;
      default:
        // Keep original order (recent)
        break;
    }

    return result;
  }, [questions, searchQuery, filters, sortBy]);

  // Toggle question selection
  const toggleSelection = useCallback(
    (questionId: string) => {
      const isSelected = selectedIds.includes(questionId);

      if (isSelected) {
        onSelectionChange(selectedIds.filter((id) => id !== questionId));
      } else {
        if (maxSelections && selectedIds.length >= maxSelections) {
          return; // Max reached
        }
        onSelectionChange([...selectedIds, questionId]);
      }
    },
    [selectedIds, onSelectionChange, maxSelections]
  );

  // Select all filtered
  const selectAllFiltered = useCallback(() => {
    const newIds = filteredQuestions
      .slice(0, maxSelections ? maxSelections - selectedIds.length : undefined)
      .map((q) => q.id)
      .filter((id) => !selectedIds.includes(id));

    onSelectionChange([...selectedIds, ...newIds]);
  }, [filteredQuestions, selectedIds, onSelectionChange, maxSelections]);

  // Clear selection
  const clearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Active filters count
  const activeFiltersCount =
    filters.bloomsLevels.length + filters.difficulties.length + filters.types.length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-none space-y-4 pb-4">
        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "border-slate-700 bg-slate-900/50 text-slate-300",
                  activeFiltersCount > 0 && "border-purple-500/50"
                )}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-purple-500 text-white text-xs px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-slate-900 border-slate-700"
            >
              <DropdownMenuLabel className="text-slate-400">
                Bloom&apos;s Level
              </DropdownMenuLabel>
              {(Object.keys(BLOOMS_META) as BloomsLevel[]).map((level) => {
                const meta = BLOOMS_META[level];
                const Icon = meta.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={level}
                    checked={filters.bloomsLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      setFilters((f) => ({
                        ...f,
                        bloomsLevels: checked
                          ? [...f.bloomsLevels, level]
                          : f.bloomsLevels.filter((l) => l !== level),
                      }));
                    }}
                    className="text-slate-200"
                  >
                    <Icon className={cn("mr-2 h-4 w-4", meta.color)} />
                    {meta.label}
                  </DropdownMenuCheckboxItem>
                );
              })}

              <DropdownMenuSeparator className="bg-slate-700" />

              <DropdownMenuLabel className="text-slate-400">Difficulty</DropdownMenuLabel>
              {(Object.keys(DIFFICULTY_META) as QuestionDifficulty[]).map((diff) => {
                const meta = DIFFICULTY_META[diff];
                return (
                  <DropdownMenuCheckboxItem
                    key={diff}
                    checked={filters.difficulties.includes(diff)}
                    onCheckedChange={(checked) => {
                      setFilters((f) => ({
                        ...f,
                        difficulties: checked
                          ? [...f.difficulties, diff]
                          : f.difficulties.filter((d) => d !== diff),
                      }));
                    }}
                    className="text-slate-200"
                  >
                    <span className={cn("mr-2 h-2 w-2 rounded-full inline-block", meta.bgColor)} />
                    {meta.label}
                  </DropdownMenuCheckboxItem>
                );
              })}

              <DropdownMenuSeparator className="bg-slate-700" />

              <DropdownMenuLabel className="text-slate-400">Question Type</DropdownMenuLabel>
              {(Object.entries(QUESTION_TYPES) as [QuestionType, string][]).map(([type, label]) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.types.includes(type)}
                  onCheckedChange={(checked) => {
                    setFilters((f) => ({
                      ...f,
                      types: checked
                        ? [...f.types, type]
                        : f.types.filter((t) => t !== type),
                    }));
                  }}
                  className="text-slate-200"
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}

              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <button
                    onClick={() =>
                      setFilters({ bloomsLevels: [], difficulties: [], types: [] })
                    }
                    className="w-full px-2 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 text-left"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-slate-300">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="recent" className="text-slate-200">Most Recent</SelectItem>
              <SelectItem value="popular" className="text-slate-200">Most Popular</SelectItem>
              <SelectItem value="alphabetical" className="text-slate-200">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Selection Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              {filteredQuestions.length} questions
              {searchQuery || activeFiltersCount > 0
                ? ` (filtered from ${questions.length})`
                : ""}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-400 font-medium">
              {selectedIds.length} selected
              {maxSelections && ` / ${maxSelections}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllFiltered}
              disabled={
                filteredQuestions.length === 0 ||
                (maxSelections !== undefined && selectedIds.length >= maxSelections)
              }
              className="text-slate-400 hover:text-slate-200 h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add All
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-red-400 hover:text-red-300 h-7 text-xs"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Question List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          <AnimatePresence mode="popLayout">
            {filteredQuestions.map((question, index) => {
              const isSelected = selectedIds.includes(question.id);
              const bloomsMeta = BLOOMS_META[question.bloomsLevel];
              const diffMeta = DIFFICULTY_META[question.difficulty];
              const BloomsIcon = bloomsMeta.icon;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group relative rounded-xl border p-4 transition-all cursor-pointer",
                    isSelected
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-700"
                  )}
                  onClick={() => toggleSelection(question.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-none pt-0.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(question.id)}
                        className={cn(
                          "border-slate-600",
                          isSelected && "border-purple-500 bg-purple-500"
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-slate-200 line-clamp-2">{question.text}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-none h-7 w-7 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewQuestion(question);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Bloom's Level */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-xs",
                            bloomsMeta.bgColor + "/20",
                            bloomsMeta.color
                          )}
                        >
                          <BloomsIcon className="mr-1 h-3 w-3" />
                          {bloomsMeta.label}
                        </Badge>

                        {/* Difficulty */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent text-xs",
                            diffMeta.bgColor,
                            diffMeta.color
                          )}
                        >
                          {diffMeta.label}
                        </Badge>

                        {/* Type */}
                        <span className="text-xs text-slate-500">
                          {QUESTION_TYPES[question.type]}
                        </span>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 ml-auto">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {question.usageCount} uses
                          </span>
                          {question.avgTimeSpent > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(question.avgTimeSpent / 60)}m avg
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {question.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {question.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {question.tags.length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{question.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load More */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
                className="border-slate-700 text-slate-300"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredQuestions.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No questions found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                {searchQuery || activeFiltersCount > 0
                  ? "Try adjusting your search or filters"
                  : "Add questions to your bank to get started"}
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ bloomsLevels: [], difficulties: [], types: [] });
                  }}
                  className="mt-4 text-purple-400"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Question Preview Dialog */}
      <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Question Preview</DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <div className="space-y-4">
              {/* Question Text */}
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-slate-200">{previewQuestion.text}</p>
              </div>

              {/* Options (if multiple choice) */}
              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-400">Options:</span>
                  {previewQuestion.options.map((option, i) => (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        option.isCorrect
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-slate-700 bg-slate-800/30"
                      )}
                    >
                      <span className="text-slate-500 text-sm">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className="text-slate-200 text-sm">{option.text}</span>
                      {option.isCorrect && (
                        <Check className="ml-auto h-4 w-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation */}
              {previewQuestion.explanation && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm font-medium text-blue-400">Explanation:</span>
                  <p className="text-sm text-slate-300 mt-1">{previewQuestion.explanation}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                <Badge className={cn(BLOOMS_META[previewQuestion.bloomsLevel].bgColor)}>
                  {BLOOMS_META[previewQuestion.bloomsLevel].label}
                </Badge>
                <Badge variant="outline" className={DIFFICULTY_META[previewQuestion.difficulty].color}>
                  {DIFFICULTY_META[previewQuestion.difficulty].label}
                </Badge>
                <span className="text-sm text-slate-500">
                  {QUESTION_TYPES[previewQuestion.type]}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuestionBankBrowser;
