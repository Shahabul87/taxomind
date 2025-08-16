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
  /** Theme */
  theme?: "light" | "dark";
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
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-yellow-100 text-yellow-700 border-yellow-200", 
  advanced: "bg-red-100 text-red-700 border-red-200"
};

export const QuickTemplateComponent: React.FC<QuickTemplateComponentProps> = ({
  templates,
  onApplyTemplate,
  showSearch = true,
  showCategoryFilter = true,
  maxHeight = "400px",
  className = "",
  title = "Quick Templates",
  theme = "light"
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

  const isDark = theme === "dark";

  return (
    <Card className={cn(
      "border shadow-sm overflow-hidden",
      isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200",
      className
    )}>
      <CardHeader className={cn(
        "py-3 px-4 border-b",
        isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-sm font-bold flex items-center gap-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <Sparkles className="h-4 w-4 text-amber-400" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredTemplates.length} templates
          </Badge>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 text-sm",
                isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300"
              )}
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
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : isDark 
                      ? "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
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
              <div className={cn(
                "text-center py-8 text-sm",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No templates found
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "group rounded-lg border transition-all duration-200 overflow-hidden",
                    isDark 
                      ? "border-slate-600 bg-slate-800/50 hover:bg-slate-700/50" 
                      : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50",
                    expandedTemplate === template.id && "ring-2 ring-blue-500/20"
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
                          <h4 className={cn(
                            "font-medium text-sm truncate",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
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
                        <div className={cn(
                          "text-xs font-mono p-2 rounded border text-center",
                          isDark ? "bg-slate-900 border-slate-600 text-slate-300" : "bg-white border-gray-200 text-gray-700"
                        )}>
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
                        className={cn(
                          "px-3 py-1 text-xs rounded transition-colors",
                          isDark
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        )}
                      >
                        Use
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"
                        )}>
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTemplate === template.id && (
                    <div className={cn(
                      "border-t p-3 space-y-3",
                      isDark ? "border-slate-600 bg-slate-900/30" : "border-gray-200 bg-white/50"
                    )}>
                      {/* Rendered Equation */}
                      <div>
                        <div className={cn(
                          "text-xs font-medium mb-2",
                          isDark ? "text-gray-300" : "text-gray-600"
                        )}>
                          Rendered Equation:
                        </div>
                        <MathRenderer
                          equation={template.equation}
                          mode="block"
                          size="small"
                          theme={theme}
                          className="border-0 shadow-none"
                        />
                      </div>

                      {/* Description */}
                      {template.description && (
                        <div>
                          <div className={cn(
                            "text-xs font-medium mb-1",
                            isDark ? "text-gray-300" : "text-gray-600"
                          )}>
                            Description:
                          </div>
                          <p className={cn(
                            "text-xs leading-relaxed",
                            isDark ? "text-gray-300" : "text-gray-600"
                          )}>
                            {template.description}
                          </p>
                        </div>
                      )}

                      {/* Explanation Preview */}
                      <div>
                        <div className={cn(
                          "text-xs font-medium mb-1",
                          isDark ? "text-gray-300" : "text-gray-600"
                        )}>
                          Explanation Preview:
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          isDark ? "text-gray-300" : "text-gray-600"
                        )}>
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