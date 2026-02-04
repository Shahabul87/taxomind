'use client';

/**
 * TemplateSelector
 *
 * Allows users to browse and select pre-built question templates
 * organized by subject area. Selected templates pre-fill the exam
 * creation form and can be expanded with AI generation.
 */

import { useState, useMemo } from 'react';
import {
  Code2,
  FlaskConical,
  Calculator,
  Briefcase,
  Shield,
  BookOpen,
  ChevronRight,
  Check,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  type QuestionTemplate,
  type TemplateCategory,
  TEMPLATE_CATEGORIES,
} from '@/lib/sam/self-assessment/templates';

// ============================================================================
// Types
// ============================================================================

interface TemplateSelectorProps {
  onSelectTemplate: (template: QuestionTemplate) => void;
  className?: string;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, typeof Code2> = {
  Code2,
  FlaskConical,
  Calculator,
  Briefcase,
  Shield,
  BookOpen,
  Layers: Code2, // fallback
  Microscope: FlaskConical,
  Atom: FlaskConical,
  BarChart3: Calculator,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] ?? BookOpen;
}

// ============================================================================
// Bloom's Level Labels
// ============================================================================

const BLOOMS_LABELS: Record<string, { label: string; color: string }> = {
  REMEMBER: { label: 'Remember', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  UNDERSTAND: { label: 'Understand', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  APPLY: { label: 'Apply', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  ANALYZE: { label: 'Analyze', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  EVALUATE: { label: 'Evaluate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  CREATE: { label: 'Create', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

// ============================================================================
// Component
// ============================================================================

export function TemplateSelector({
  onSelectTemplate,
  className,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Filter templates based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return TEMPLATE_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return TEMPLATE_CATEGORIES.map((cat) => ({
      ...cat,
      templates: cat.templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      ),
    })).filter((cat) => cat.templates.length > 0);
  }, [searchQuery]);

  // Active category
  const activeCategory = selectedCategory
    ? filteredCategories.find((c) => c.id === selectedCategory) ?? filteredCategories[0]
    : filteredCategories[0];

  const handleSelectTemplate = (template: QuestionTemplate) => {
    setSelectedTemplateId(template.id);
    onSelectTemplate(template);
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          Question Templates
        </CardTitle>
        <CardDescription className="text-xs">
          Start with a pre-built template and customize, or let AI expand it
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5"
            >
              <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {filteredCategories.map((cat) => {
            const isActive =
              (selectedCategory === null && cat.id === filteredCategories[0]?.id) ||
              selectedCategory === cat.id;
            const Icon = getIcon(cat.icon);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border',
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="w-3 h-3" />
                {cat.name}
                <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">
                  {cat.templates.length}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Template List */}
        {activeCategory ? (
          <ScrollArea className="max-h-[320px]">
            <div className="space-y-2 pr-2">
              {activeCategory.templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const TemplateIcon = getIcon(template.icon);

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      isSelected
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <TemplateIcon
                          className={cn('w-4 h-4 mt-0.5 shrink-0', template.color)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {template.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                    </div>

                    {/* Template Meta */}
                    <div className="flex items-center gap-2 mt-2 ml-6">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {template.questions.length} sample questions
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        {template.defaultQuestionCount} default
                      </Badge>
                    </div>

                    {/* Bloom's Distribution Preview */}
                    <div className="flex gap-1 mt-2 ml-6 flex-wrap">
                      {Object.entries(template.bloomsDistribution)
                        .filter(([, pct]) => pct > 0)
                        .map(([level, pct]) => {
                          const info = BLOOMS_LABELS[level];
                          return (
                            <span
                              key={level}
                              className={cn(
                                'text-[9px] px-1.5 py-0 rounded-full font-medium',
                                info?.color ?? 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {info?.label ?? level} {pct}%
                            </span>
                          );
                        })}
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 mt-1.5 ml-6 flex-wrap">
                      {template.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] text-slate-400 dark:text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">
            No templates match your search.
          </p>
        )}

        {/* AI Expand Hint */}
        {selectedTemplateId && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Template selected. Enable AI Generation to expand sample questions into a full exam.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TemplateSelector;
