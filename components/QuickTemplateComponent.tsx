"use client";

import React, { useState, useMemo } from "react";
import { Search, Sparkles, Calculator, TrendingUp, Zap, BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MathRenderer from "@/components/MathRenderer";
import { cn } from "@/lib/utils";

export interface Template {
  id: string;
  title: string;
  equation: string;
  explanation: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  description?: string;
}

export interface QuickTemplateComponentProps {
  /** Array of templates to display */
  templates: Template[];
  /** Callback when a template is applied */
  onApplyTemplate: (template: Template) => void;
  /** Show search functionality */
  showSearch?: boolean;
  /** Show category filters */
  showCategoryFilter?: boolean;
  /** Maximum height of the component */
  maxHeight?: string;
  /** Custom CSS classes */
  className?: string;
  /** Title of the component */
  title?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  algebra: <Calculator className="h-4 w-4" />,
  calculus: <TrendingUp className="h-4 w-4" />,
  geometry: <Target className="h-4 w-4" />,
  trigonometry: <Zap className="h-4 w-4" />,
  statistics: <BookOpen className="h-4 w-4" />,
  physics: <Sparkles className="h-4 w-4" />,
};

const difficultyColors = {
  beginner: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  intermediate: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  advanced: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
};

export const QuickTemplateComponent: React.FC<QuickTemplateComponentProps> = ({
  templates,
  onApplyTemplate,
  showSearch = true,
  showCategoryFilter = true,
  maxHeight = "400px",
  className = "",
  title = "Quick Templates"
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)));
    return ["all", ...cats];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchQuery === "" ||
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  return (
    <Card className={cn(
      "border shadow-sm overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
      className
    )}>
      <CardHeader className="py-3 px-4 border-b bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredTemplates.length} templates
          </Badge>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Category Filter */}
        {showCategoryFilter && (
          <div className="flex flex-wrap gap-1 mt-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition-colors flex items-center gap-1",
                  selectedCategory === category
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {category !== "all" && categoryIcons[category]}
                {category === "all" ? "All" : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="p-3 space-y-2">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No templates found
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "group rounded-lg border transition-all duration-200 overflow-hidden",
                    "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50",
                    expandedTemplate === template.id && "ring-2 ring-purple-500/20 dark:ring-purple-500/30"
                  )}
                >
                  {/* Template Header */}
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedTemplate(
                      expandedTemplate === template.id ? null : template.id
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                            {template.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", difficultyColors[template.difficulty])}
                          >
                            {template.difficulty}
                          </Badge>
                        </div>

                        {/* Compact equation preview */}
                        <div className="text-xs font-mono p-2 rounded border text-center bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {template.equation.length > 50
                            ? template.equation.substring(0, 50) + "..."
                            : template.equation
                          }
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyTemplate(template);
                        }}
                        className="px-3 py-1 text-xs rounded transition-colors bg-purple-500 dark:bg-purple-600 text-white hover:bg-purple-600 dark:hover:bg-purple-700"
                      >
                        Use
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTemplate === template.id && (
                    <div className="border-t p-3 space-y-3 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/30">
                      {/* Rendered Equation */}
                      <div>
                        <div className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                          Rendered Equation:
                        </div>
                        <MathRenderer
                          equation={template.equation}
                          mode="block"
                          size="small"
                          theme="light"
                          className="border-0 shadow-none"
                        />
                      </div>

                      {/* Description */}
                      {template.description && (
                        <div>
                          <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                            Description:
                          </div>
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {template.description}
                          </p>
                        </div>
                      )}

                      {/* Explanation Preview */}
                      <div>
                        <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                          Explanation Preview:
                        </div>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                          {template.explanation.length > 100
                            ? template.explanation.substring(0, 100) + "..."
                            : template.explanation
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default QuickTemplateComponent; 