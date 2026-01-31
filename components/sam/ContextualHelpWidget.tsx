'use client';

/**
 * ContextualHelpWidget Component
 *
 * Provides smart contextual help based on the user's current location and activity.
 * Integrates with SAM AI to provide relevant tips and guidance.
 *
 * Features:
 * - Context-aware help tips
 * - Quick links to relevant documentation
 * - FAQ section for current context
 * - Integration with SAM AI for questions
 * - Keyboard shortcut support (?)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  HelpCircle,
  Lightbulb,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  Keyboard,
  Info,
  CheckCircle2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface HelpTip {
  id: string;
  title: string;
  description: string;
  category: 'tip' | 'feature' | 'shortcut' | 'warning';
  priority: 'high' | 'medium' | 'low';
  contextMatch: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface DocLink {
  id: string;
  title: string;
  url: string;
  description: string;
  icon?: string;
}

interface ContextualHelpData {
  tips: HelpTip[];
  faqs: FAQ[];
  docLinks: DocLink[];
  shortcuts: Array<{ key: string; description: string }>;
}

interface ContextualHelpWidgetProps {
  className?: string;
  /** Current page context for relevance */
  context?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Show keyboard shortcuts */
  showShortcuts?: boolean;
  /** Maximum items to show */
  maxItems?: number;
  /** Compact mode */
  compact?: boolean;
  /** Callback when help is requested */
  onHelpRequest?: (query: string) => void;
  /** Callback when SAM AI chat is opened */
  onOpenSAMChat?: () => void;
}

// ============================================================================
// DEFAULT HELP DATA
// ============================================================================

const DEFAULT_HELP_DATA: ContextualHelpData = {
  tips: [
    {
      id: '1',
      title: 'Track Your Learning Progress',
      description: 'Use the Learning Path widget to see your progress and discover what to learn next.',
      category: 'feature',
      priority: 'high',
      contextMatch: ['dashboard', 'learning'],
    },
    {
      id: '2',
      title: 'Set Daily Practice Goals',
      description: 'The Practice Timer helps you build consistent study habits. Try the Pomodoro technique!',
      category: 'tip',
      priority: 'medium',
      contextMatch: ['dashboard', 'practice'],
    },
    {
      id: '3',
      title: 'Ask SAM AI for Help',
      description: 'Click the SAM AI assistant button to get personalized learning guidance and answers.',
      category: 'feature',
      priority: 'high',
      contextMatch: ['dashboard', 'learning', 'course'],
    },
    {
      id: '4',
      title: 'Review with Spaced Repetition',
      description: 'The Spaced Repetition Calendar shows optimal review times based on memory science.',
      category: 'tip',
      priority: 'medium',
      contextMatch: ['dashboard', 'learning'],
    },
    {
      id: '5',
      title: 'Keyboard Shortcut: Quick Help',
      description: 'Press ? anywhere to open this contextual help panel quickly.',
      category: 'shortcut',
      priority: 'low',
      contextMatch: ['*'],
    },
  ],
  faqs: [
    {
      id: '1',
      question: 'How does the XP system work?',
      answer: 'Earn XP by completing lessons, quizzes, and daily goals. Level up to unlock new features and badges!',
      category: 'gamification',
      helpful: 42,
    },
    {
      id: '2',
      question: 'What is Spaced Repetition?',
      answer: 'A learning technique that schedules reviews at increasing intervals to optimize long-term memory retention.',
      category: 'learning',
      helpful: 38,
    },
    {
      id: '3',
      question: 'How do I connect with study buddies?',
      answer: 'Use the Study Buddy Finder to match with learners who have similar goals and schedules.',
      category: 'social',
      helpful: 25,
    },
    {
      id: '4',
      question: 'Can SAM AI help with specific topics?',
      answer: 'Yes! SAM can explain concepts, generate practice problems, and create personalized study plans.',
      category: 'ai',
      helpful: 56,
    },
  ],
  docLinks: [
    {
      id: '1',
      title: 'Getting Started Guide',
      url: '/docs/getting-started',
      description: 'Learn the basics of using Taxomind',
    },
    {
      id: '2',
      title: 'SAM AI Features',
      url: '/docs/sam-ai',
      description: 'Explore all SAM AI capabilities',
    },
    {
      id: '3',
      title: 'Practice System',
      url: '/docs/practice',
      description: 'Master the 10,000 hour practice tracker',
    },
  ],
  shortcuts: [
    { key: '?', description: 'Open help' },
    { key: 'Ctrl+K', description: 'Quick search' },
    { key: 'G then D', description: 'Go to dashboard' },
    { key: 'G then C', description: 'Go to courses' },
    { key: 'S', description: 'Open SAM AI' },
  ],
};

// ============================================================================
// HELPERS
// ============================================================================

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    tip: <Lightbulb className="h-4 w-4" />,
    feature: <Sparkles className="h-4 w-4" />,
    shortcut: <Keyboard className="h-4 w-4" />,
    warning: <Info className="h-4 w-4" />,
  };
  return icons[category] || <HelpCircle className="h-4 w-4" />;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    tip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    feature: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    shortcut: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TipCard({
  tip,
  compact,
}: {
  tip: HelpTip;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
        compact && 'p-2'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            getCategoryColor(tip.category)
          )}
        >
          {getCategoryIcon(tip.category)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white">
            {tip.title}
          </h4>
          {!compact && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tip.description}
            </p>
          )}
        </div>
        {tip.priority === 'high' && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            New
          </Badge>
        )}
      </div>
    </div>
  );
}

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {faq.question}
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {faq.answer}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {faq.helpful} found this helpful
            </span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContextualHelpWidget({
  className,
  context = 'dashboard',
  showSearch = true,
  showShortcuts = true,
  maxItems = 5,
  compact = false,
  onHelpRequest,
  onOpenSAMChat,
}: ContextualHelpWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpData, setHelpData] = useState<ContextualHelpData | null>(null);
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tips' | 'faq' | 'docs'>('tips');

  // Load default help data
  useEffect(() => {
    setHelpData(DEFAULT_HELP_DATA);
    setIsLoading(false);
  }, [context]);

  // Filter tips based on context
  const filteredTips = useMemo(() => {
    if (!helpData) return [];
    return helpData.tips
      .filter(
        (tip) =>
          tip.contextMatch.includes('*') ||
          tip.contextMatch.includes(context)
      )
      .filter(
        (tip) =>
          !searchQuery ||
          tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tip.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, maxItems);
  }, [helpData, context, searchQuery, maxItems]);

  // Filter FAQs based on search
  const filteredFAQs = useMemo(() => {
    if (!helpData) return [];
    return helpData.faqs
      .filter(
        (faq) =>
          !searchQuery ||
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, maxItems);
  }, [helpData, searchQuery, maxItems]);

  const toggleFAQ = useCallback((id: string) => {
    setOpenFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onHelpRequest?.(searchQuery);
    },
    [searchQuery, onHelpRequest]
  );

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-1 h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Contextual Help</CardTitle>
              <CardDescription className="text-xs">
                Tips and guidance for your current view
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenSAMChat}
                  className="gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask SAM</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open SAM AI for personalized help</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </form>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 rounded-lg border p-1">
          <Button
            variant={activeTab === 'tips' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tips')}
            className="flex-1"
          >
            <Lightbulb className="mr-1 h-3 w-3" />
            Tips
          </Button>
          <Button
            variant={activeTab === 'faq' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('faq')}
            className="flex-1"
          >
            <HelpCircle className="mr-1 h-3 w-3" />
            FAQ
          </Button>
          <Button
            variant={activeTab === 'docs' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('docs')}
            className="flex-1"
          >
            <BookOpen className="mr-1 h-3 w-3" />
            Docs
          </Button>
        </div>

        {/* Tab Content */}
        <ScrollArea className="h-[280px]">
          {activeTab === 'tips' && (
            <div className="space-y-2">
              {filteredTips.length > 0 ? (
                filteredTips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} compact={compact} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="mt-2 text-sm text-slate-500">
                    No tips for this context
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-1">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isOpen={openFAQs.has(faq.id)}
                    onToggle={() => toggleFAQ(faq.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <HelpCircle className="h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No matching FAQs found
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && helpData && (
            <div className="space-y-2">
              {helpData.docLinks.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Keyboard Shortcuts */}
        {showShortcuts && helpData && (
          <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/50">
            <h4 className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Keyboard className="h-3 w-3" />
              Keyboard Shortcuts
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {helpData.shortcuts.slice(0, 4).map((shortcut, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <kbd className="rounded border bg-white px-2 py-1 text-xs font-mono text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                        {shortcut.key}
                      </kbd>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{shortcut.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContextualHelpWidget;
