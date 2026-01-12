'use client';

/**
 * MemorySearchPanel
 *
 * Search interface for SAM memory system.
 * Allows users to search across embeddings, long-term memories, and conversations.
 *
 * Features:
 * - Multi-type search (embeddings, memories, conversations)
 * - Filter by course, tags, memory type
 * - Score-based result ranking
 * - Click to expand result details
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Search,
  Brain,
  MessageSquare,
  Database,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Tag,
  BookOpen,
  Filter,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useSAMMemory } from '@sam-ai/react';
import type { MemorySearchResult, MemorySearchOptions } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface MemorySearchPanelProps {
  className?: string;
  /** Pre-filter by course */
  courseId?: string;
  /** Maximum results to display */
  maxResults?: number;
  /** Show filters panel */
  showFilters?: boolean;
  /** Callback when result is selected */
  onResultSelect?: (result: MemorySearchResult) => void;
  /** Compact mode for embedding in other components */
  compact?: boolean;
}

type SearchType = 'embeddings' | 'memories' | 'conversations';

interface SearchFilters {
  minScore?: number;
  courseId?: string;
  tags?: string[];
  memoryTypes?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MEMORY_TYPES = [
  'INTERACTION',
  'LEARNING_EVENT',
  'STRUGGLE_POINT',
  'PREFERENCE',
  'FEEDBACK',
  'CONTEXT',
  'CONCEPT',
  'SKILL',
] as const;

const SEARCH_TYPE_ICONS: Record<SearchType, typeof Brain> = {
  embeddings: Database,
  memories: Brain,
  conversations: MessageSquare,
};

const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  embeddings: 'Embeddings',
  memories: 'Long-term Memories',
  conversations: 'Conversations',
};

const SEARCH_TYPE_DESCRIPTIONS: Record<SearchType, string> = {
  embeddings: 'Search vector embeddings from course content',
  memories: 'Search your stored learning memories',
  conversations: 'Search past conversation history',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SearchResultCard({
  result,
  searchType,
  expanded,
  onToggle,
  onSelect,
}: {
  result: MemorySearchResult;
  searchType: SearchType;
  expanded: boolean;
  onToggle: () => void;
  onSelect?: (result: MemorySearchResult) => void;
}) {
  const scorePercent = Math.round((result.score || 0) * 100);
  const scoreColor =
    scorePercent >= 80
      ? 'text-green-600 bg-green-50'
      : scorePercent >= 60
        ? 'text-amber-600 bg-amber-50'
        : 'text-gray-600 bg-gray-50';

  const Icon = SEARCH_TYPE_ICONS[searchType];
  const metadata = result.metadata || {};

  return (
    <div
      className={cn(
        'border rounded-lg transition-colors',
        expanded
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full p-3 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {(metadata.title as string) || result.id.slice(0, 12)}
                </p>
                <Badge variant="outline" className={cn('text-xs', scoreColor)}>
                  {scorePercent}%
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {result.content?.slice(0, 150)}
                {(result.content?.length ?? 0) > 150 ? '...' : ''}
              </p>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-3">
              {/* Full content */}
              <div>
                <Label className="text-xs text-gray-500">Content</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {result.content}
                </p>
              </div>

              {/* Metadata */}
              {Object.keys(metadata).length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Metadata</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Object.entries(metadata).map(([key, value]) => {
                      if (key === 'title') return null;
                      return (
                        <Badge
                          key={key}
                          variant="secondary"
                          className="text-xs"
                        >
                          {key}: {String(value).slice(0, 30)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {onSelect && (
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(result)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Use in Context
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClear,
  courseId: fixedCourseId,
}: {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClear: () => void;
  courseId?: string;
}) {
  const hasFilters =
    filters.minScore !== undefined ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.memoryTypes && filters.memoryTypes.length > 0) ||
    (filters.courseId && !fixedCourseId);

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Min Score */}
        <div>
          <Label className="text-xs">Min Similarity</Label>
          <Select
            value={filters.minScore?.toString() || 'any'}
            onValueChange={(v) =>
              onChange({
                ...filters,
                minScore: v === 'any' ? undefined : parseFloat(v),
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="0.9">90%+</SelectItem>
              <SelectItem value="0.8">80%+</SelectItem>
              <SelectItem value="0.7">70%+</SelectItem>
              <SelectItem value="0.5">50%+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Memory Type */}
        <div>
          <Label className="text-xs">Memory Type</Label>
          <Select
            value={filters.memoryTypes?.[0] || 'any'}
            onValueChange={(v) =>
              onChange({
                ...filters,
                memoryTypes: v === 'any' ? undefined : [v],
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">All Types</SelectItem>
              {MEMORY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searchType, query }: { searchType: SearchType; query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100">
        No results found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
        {query
          ? `No ${SEARCH_TYPE_LABELS[searchType].toLowerCase()} match "${query}"`
          : `Enter a search query to find ${SEARCH_TYPE_LABELS[searchType].toLowerCase()}`}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MemorySearchPanel({
  className,
  courseId,
  maxResults = 20,
  showFilters = true,
  onResultSelect,
  compact = false,
}: MemorySearchPanelProps) {
  // State
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('memories');
  const [filters, setFilters] = useState<SearchFilters>({ courseId });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Hooks
  const {
    searchMemories,
    searchResults,
    isSearching,
    error,
    clearSearchResults,
    clearError,
  } = useSAMMemory({ debug: false });

  // Handlers
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    clearError();
    const searchOptions: MemorySearchOptions = {
      topK: maxResults,
      ...filters,
    };

    await searchMemories(query, searchType, searchOptions);
  }, [query, searchType, filters, maxResults, searchMemories, clearError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ courseId });
  }, [courseId]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    clearSearchResults();
    setExpandedId(null);
  }, [clearSearchResults]);

  // Memoized values
  const hasResults = searchResults.length > 0;
  const hasActiveFilters =
    filters.minScore !== undefined ||
    (filters.memoryTypes && filters.memoryTypes.length > 0);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <CardTitle className={compact ? 'text-base' : undefined}>
            Memory Search
          </CardTitle>
        </div>
        {!compact && (
          <CardDescription>
            Search your learning memories, conversations, and embeddings
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Type Tabs */}
        <Tabs
          value={searchType}
          onValueChange={(v) => setSearchType(v as SearchType)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            {(Object.keys(SEARCH_TYPE_LABELS) as SearchType[]).map((type) => {
              const Icon = SEARCH_TYPE_ICONS[type];
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="text-xs sm:text-sm"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {compact
                    ? type.charAt(0).toUpperCase() + type.slice(1, 3)
                    : SEARCH_TYPE_LABELS[type].split(' ')[0]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Search description */}
          {!compact && (
            <p className="text-xs text-gray-500 mt-2">
              {SEARCH_TYPE_DESCRIPTIONS[searchType]}
            </p>
          )}
        </Tabs>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${SEARCH_TYPE_LABELS[searchType].toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-8"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          {showFilters && (
            <Button
              variant={hasActiveFilters ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && showFilterPanel && (
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            courseId={courseId}
          />
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Results */}
        <ScrollArea className={compact ? 'h-[240px]' : 'h-[400px]'}>
          {isSearching ? (
            <LoadingState />
          ) : hasResults ? (
            <div className="space-y-2 pr-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              {searchResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  searchType={searchType}
                  expanded={expandedId === result.id}
                  onToggle={() =>
                    setExpandedId(expandedId === result.id ? null : result.id)
                  }
                  onSelect={onResultSelect}
                />
              ))}
            </div>
          ) : (
            <EmptyState searchType={searchType} query={query} />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default MemorySearchPanel;
