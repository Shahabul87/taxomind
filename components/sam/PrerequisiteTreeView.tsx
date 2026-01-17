'use client';

/**
 * PrerequisiteTreeView Component
 *
 * Displays a hierarchical tree view of concept prerequisites.
 * Shows what needs to be learned before tackling a specific topic.
 *
 * Features:
 * - Expandable/collapsible tree structure
 * - Mastery status indicators
 * - Prerequisite depth levels
 * - Recommendations for next steps
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
import { Progress } from '@/components/ui/progress';
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
  ChevronRight,
  ChevronDown,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  RefreshCw,
  Target,
  ArrowRight,
  Lightbulb,
  BookOpen,
  Layers,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type MasteryStatus = 'mastered' | 'in_progress' | 'not_started' | 'struggling';

interface PrerequisiteNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  masteryLevel: number;
  status: MasteryStatus;
  depth: number;
  prerequisites: PrerequisiteNode[];
  isOptional?: boolean;
  estimatedTime?: number; // in minutes
}

interface PrerequisiteTreeData {
  rootConcept: {
    id: string;
    name: string;
    type: string;
    masteryLevel: number;
    status: MasteryStatus;
  };
  prerequisites: PrerequisiteNode[];
  stats: {
    totalPrerequisites: number;
    masteredCount: number;
    inProgressCount: number;
    notStartedCount: number;
    completionPercentage: number;
    estimatedTimeRemaining: number;
  };
  readyToStart: boolean;
  nextRecommendations: Array<{
    id: string;
    name: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface PrerequisiteTreeViewProps {
  conceptId?: string;
  courseId?: string;
  onConceptClick?: (conceptId: string) => void;
  showEstimatedTime?: boolean;
  expandedByDefault?: boolean;
  maxDepth?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  mastered: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: CheckCircle2,
    label: 'Mastered',
  },
  in_progress: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Clock,
    label: 'In Progress',
  },
  not_started: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    icon: CircleDot,
    label: 'Not Started',
  },
  struggling: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertCircle,
    label: 'Needs Help',
  },
};

const PRIORITY_COLORS = {
  high: 'text-red-500 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TreeStats({ stats }: { stats: PrerequisiteTreeData['stats'] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="text-sm font-medium">
          {stats.masteredCount}/{stats.totalPrerequisites} Prerequisites
        </span>
      </div>
      <Progress value={stats.completionPercentage} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <div className="font-semibold text-emerald-600">{stats.masteredCount}</div>
          <div className="text-muted-foreground">Mastered</div>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10">
          <div className="font-semibold text-blue-600">{stats.inProgressCount}</div>
          <div className="text-muted-foreground">Learning</div>
        </div>
        <div className="p-2 rounded-lg bg-gray-500/10">
          <div className="font-semibold text-gray-600">{stats.notStartedCount}</div>
          <div className="text-muted-foreground">Remaining</div>
        </div>
      </div>
      {stats.estimatedTimeRemaining > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <Clock className="h-4 w-4" />
          <span>~{Math.ceil(stats.estimatedTimeRemaining / 60)} hours to complete</span>
        </div>
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expandedByDefault,
  maxDepth,
  onNodeClick,
  showEstimatedTime,
}: {
  node: PrerequisiteNode;
  depth: number;
  expandedByDefault: boolean;
  maxDepth: number;
  onNodeClick?: (id: string) => void;
  showEstimatedTime?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(expandedByDefault && depth < maxDepth);
  const hasChildren = node.prerequisites.length > 0;
  const config = STATUS_CONFIG[node.status];
  const StatusIcon = config.icon;

  return (
    <div className="relative">
      {/* Connection line */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 w-px h-full bg-border"
          style={{ left: '-16px' }}
        />
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg border transition-colors',
            'hover:bg-muted/50 cursor-pointer',
            config.bgColor,
            config.borderColor,
            node.isOptional && 'border-dashed'
          )}
          onClick={() => onNodeClick?.(node.id)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && depth < maxDepth ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {/* Status icon */}
          <StatusIcon className={cn('h-4 w-4 shrink-0', config.color)} />

          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{node.name}</span>
              {node.isOptional && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Optional
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('text-xs', config.color)}>{config.label}</span>
              {node.masteryLevel > 0 && (
                <span className="text-xs text-muted-foreground">
                  {node.masteryLevel}% mastery
                </span>
              )}
              {showEstimatedTime && node.estimatedTime && node.status !== 'mastered' && (
                <span className="text-xs text-muted-foreground">
                  ~{node.estimatedTime}min
                </span>
              )}
            </div>
          </div>

          {/* Child count badge */}
          {hasChildren && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {node.prerequisites.length}
            </Badge>
          )}
        </div>

        {/* Child nodes */}
        {hasChildren && depth < maxDepth && (
          <CollapsibleContent>
            <div className="ml-6 mt-2 space-y-2 border-l-2 border-dashed pl-4">
              {node.prerequisites.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedByDefault={expandedByDefault}
                  maxDepth={maxDepth}
                  onNodeClick={onNodeClick}
                  showEstimatedTime={showEstimatedTime}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

function NextRecommendations({
  recommendations,
  onConceptClick,
}: {
  recommendations: PrerequisiteTreeData['nextRecommendations'];
  onConceptClick?: (id: string) => void;
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        Recommended Next Steps
      </h4>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.id}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
              PRIORITY_COLORS[rec.priority]
            )}
            onClick={() => onConceptClick?.(rec.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                #{idx + 1}
              </Badge>
              <span className="font-medium text-sm">{rec.name}</span>
              <Badge variant="outline" className="text-xs capitalize ml-auto">
                {rec.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{rec.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PrerequisiteTreeView({
  conceptId,
  courseId,
  onConceptClick,
  showEstimatedTime = true,
  expandedByDefault = true,
  maxDepth = 3,
  className,
}: PrerequisiteTreeViewProps) {
  const [treeData, setTreeData] = useState<PrerequisiteTreeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prerequisite tree data
  const fetchTreeData = useCallback(async () => {
    if (!conceptId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: 'prerequisites',
        conceptId,
        maxDepth: maxDepth.toString(),
      });
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(`/api/sam/knowledge-graph?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prerequisite tree');
      }

      const result = await response.json();
      if (result.success) {
        setTreeData(result.data);
      } else {
        throw new Error(result.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prerequisites');
    } finally {
      setIsLoading(false);
    }
  }, [conceptId, courseId, maxDepth]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Prerequisites</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTreeData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!treeData || !conceptId) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle>Prerequisite Tree</CardTitle>
          </div>
          <CardDescription>
            View the learning path and prerequisites for a concept
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Select a concept to see its prerequisites
          </p>
        </CardContent>
      </Card>
    );
  }

  const rootConfig = STATUS_CONFIG[treeData.rootConcept.status];
  const RootStatusIcon = rootConfig.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle>Prerequisite Tree</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchTreeData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Root concept */}
        <div
          className={cn(
            'p-3 rounded-lg border mt-3 cursor-pointer hover:bg-muted/50 transition-colors',
            rootConfig.bgColor,
            rootConfig.borderColor
          )}
          onClick={() => onConceptClick?.(treeData.rootConcept.id)}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                rootConfig.bgColor
              )}
            >
              <Target className={cn('h-5 w-5', rootConfig.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{treeData.rootConcept.name}</span>
                <Badge variant="outline" className="text-xs">
                  {treeData.rootConcept.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <RootStatusIcon className={cn('h-3 w-3', rootConfig.color)} />
                <span className={cn('text-xs', rootConfig.color)}>{rootConfig.label}</span>
                <span className="text-xs text-muted-foreground">
                  {treeData.rootConcept.masteryLevel}% mastery
                </span>
              </div>
            </div>
            {treeData.readyToStart && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Ready to Start
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        {treeData.stats.totalPrerequisites > 0 && <TreeStats stats={treeData.stats} />}

        {/* Prerequisite Tree */}
        {treeData.prerequisites.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Prerequisites ({treeData.prerequisites.length})
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {treeData.prerequisites.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    expandedByDefault={expandedByDefault}
                    maxDepth={maxDepth}
                    onNodeClick={onConceptClick}
                    showEstimatedTime={showEstimatedTime}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-medium">No Prerequisites</h4>
            <p className="text-sm text-muted-foreground">
              This concept has no prerequisites. You can start learning right away!
            </p>
          </div>
        )}

        {/* Recommendations */}
        <NextRecommendations
          recommendations={treeData.nextRecommendations}
          onConceptClick={onConceptClick}
        />
      </CardContent>
    </Card>
  );
}

export default PrerequisiteTreeView;
