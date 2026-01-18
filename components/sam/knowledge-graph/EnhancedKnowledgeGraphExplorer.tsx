'use client';

/**
 * EnhancedKnowledgeGraphExplorer Component
 *
 * Comprehensive knowledge graph exploration with learning paths,
 * prerequisite analysis, and mastery tracking in a unified interface.
 *
 * Features:
 * - Interactive graph/list visualization
 * - Learning path generation with strategies
 * - Prerequisite analysis with gap detection
 * - Mastery tracking and progress
 * - Quick actions panel
 * - Concept details with recommendations
 *
 * @module components/sam/knowledge-graph
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  ArrowRight,
  Layers,
  Target,
  Brain,
  Sparkles,
  Filter,
  GitBranch,
  Route,
  ChevronRight,
  X,
  Play,
  GraduationCap,
  TrendingUp,
  Loader2,
  PanelRightOpen,
  PanelRightClose,
  Maximize2,
  Map,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LearningPathBuilder } from './LearningPathBuilder';
import { PrerequisiteAnalyzer } from './PrerequisiteAnalyzer';

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  bloomsLevel?: string;
  properties: Record<string, unknown>;
  masteryLevel?: number;
  status?: 'mastered' | 'in_progress' | 'not_started' | 'struggling';
  position?: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    masteredCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
}

interface ConceptDetails {
  entity: {
    id: string;
    name: string;
    type: string;
    description?: string;
    bloomsLevel?: string;
    properties: Record<string, unknown>;
  };
  neighbors: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    sourceId: string;
    targetId: string;
    weight: number;
  }>;
  userProgress?: {
    masteryLevel: number;
    status: string;
    lastAccessedAt?: string;
  };
  recommendations?: Array<{
    id: string;
    title: string;
    type: string;
    relevanceScore: number;
    reason: string;
  }>;
}

interface EnhancedKnowledgeGraphExplorerProps {
  courseId?: string;
  initialConceptId?: string;
  onConceptSelect?: (conceptId: string) => void;
  onStartLearning?: (conceptIds: string[]) => void;
  height?: string;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RELATIONSHIP_TYPES = [
  { value: 'all', label: 'All Relationships' },
  { value: 'prerequisite', label: 'Prerequisites' },
  { value: 'related_to', label: 'Related Concepts' },
  { value: 'part_of', label: 'Part Of' },
  { value: 'follows', label: 'Sequence' },
] as const;

type RelationshipType = typeof RELATIONSHIP_TYPES[number]['value'];

const STATUS_COLORS = {
  mastered: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  not_started: 'bg-gray-400',
  struggling: 'bg-amber-500',
};

const STATUS_ICONS = {
  mastered: CheckCircle2,
  in_progress: Clock,
  not_started: CircleDot,
  struggling: AlertCircle,
};

const BLOOMS_LEVELS = {
  REMEMBER: { label: 'Remember', color: 'bg-slate-500' },
  UNDERSTAND: { label: 'Understand', color: 'bg-blue-500' },
  APPLY: { label: 'Apply', color: 'bg-green-500' },
  ANALYZE: { label: 'Analyze', color: 'bg-amber-500' },
  EVALUATE: { label: 'Evaluate', color: 'bg-orange-500' },
  CREATE: { label: 'Create', color: 'bg-red-500' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function GraphStats({ stats }: { stats: GraphData['stats'] }) {
  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-gradient-to-r from-muted/30 to-muted/60 rounded-xl">
      <div className="text-center">
        <div className="text-xl font-bold">{stats.totalNodes}</div>
        <div className="text-[10px] text-muted-foreground">Concepts</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{stats.totalEdges}</div>
        <div className="text-[10px] text-muted-foreground">Links</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-emerald-600">{stats.masteredCount}</div>
        <div className="text-[10px] text-muted-foreground">Mastered</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-blue-600">{stats.inProgressCount}</div>
        <div className="text-[10px] text-muted-foreground">Learning</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold text-gray-500">{stats.notStartedCount}</div>
        <div className="text-[10px] text-muted-foreground">Pending</div>
      </div>
    </div>
  );
}

function NodeCard({
  node,
  isSelected,
  onClick,
}: {
  node: GraphNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const StatusIcon = STATUS_ICONS[node.status ?? 'not_started'];
  const statusColor = STATUS_COLORS[node.status ?? 'not_started'];
  const bloomsInfo = node.bloomsLevel
    ? BLOOMS_LEVELS[node.bloomsLevel as keyof typeof BLOOMS_LEVELS]
    : null;

  return (
    <div
      className={cn(
        'p-3 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-white',
            statusColor
          )}
        >
          <StatusIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{node.name}</h4>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {node.type}
            </Badge>
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {node.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            {bloomsInfo && (
              <Badge
                variant="outline"
                className={cn('text-[10px] text-white border-0', bloomsInfo.color)}
              >
                {bloomsInfo.label}
              </Badge>
            )}
            {node.masteryLevel !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <BarChart3 className="w-3 h-3" />
                {node.masteryLevel}%
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

function ConceptDetailsPanel({
  details,
  onClose,
  onNavigate,
  onAnalyzePrerequisites,
  onBuildPath,
}: {
  details: ConceptDetails;
  onClose: () => void;
  onNavigate: (conceptId: string) => void;
  onAnalyzePrerequisites: (conceptId: string) => void;
  onBuildPath: (conceptId: string) => void;
}) {
  const StatusIcon =
    STATUS_ICONS[(details.userProgress?.status as keyof typeof STATUS_ICONS) ?? 'not_started'];
  const statusColor =
    STATUS_COLORS[(details.userProgress?.status as keyof typeof STATUS_COLORS) ?? 'not_started'];
  const bloomsInfo = details.entity.bloomsLevel
    ? BLOOMS_LEVELS[details.entity.bloomsLevel as keyof typeof BLOOMS_LEVELS]
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{details.entity.type}</Badge>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-semibold">{details.entity.name}</h3>
        {details.entity.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {details.entity.description}
          </p>
        )}
        {bloomsInfo && (
          <Badge
            variant="outline"
            className={cn('mt-2 text-xs text-white border-0', bloomsInfo.color)}
          >
            {bloomsInfo.label}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* User Progress */}
          {details.userProgress && (
            <div className="p-3 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className="h-4 w-4" />
                <span className="text-sm font-medium capitalize">
                  {details.userProgress.status.replace('_', ' ')}
                </span>
              </div>
              <Progress
                value={details.userProgress.masteryLevel}
                className={cn('h-2', statusColor)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {details.userProgress.masteryLevel}% mastery
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => onBuildPath(details.entity.id)}
            >
              <Route className="h-4 w-4" />
              <span className="text-xs">Build Path</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-3 flex-col gap-1"
              onClick={() => onAnalyzePrerequisites(details.entity.id)}
            >
              <GitBranch className="h-4 w-4" />
              <span className="text-xs">Prerequisites</span>
            </Button>
          </div>

          {/* Connected Concepts */}
          {details.neighbors.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Layers className="h-3 h-3" />
                Connected ({details.neighbors.length})
              </h4>
              <div className="space-y-1">
                {details.neighbors.slice(0, 5).map((neighbor) => (
                  <button
                    key={neighbor.id}
                    className="w-full p-2 rounded-lg hover:bg-muted flex items-center justify-between text-left"
                    onClick={() => onNavigate(neighbor.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{neighbor.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {neighbor.type}
                    </Badge>
                  </button>
                ))}
                {details.neighbors.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{details.neighbors.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {details.recommendations && details.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Recommended Next
              </h4>
              <div className="space-y-2">
                {details.recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => onNavigate(rec.id)}
                  >
                    <div className="font-medium text-sm">{rec.title}</div>
                    <div className="text-xs text-muted-foreground">{rec.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Button */}
      <div className="p-4 border-t">
        <Button className="w-full" onClick={() => onBuildPath(details.entity.id)}>
          <Play className="h-4 w-4 mr-2" />
          Start Learning
        </Button>
      </div>
    </div>
  );
}

function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  zoom,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate canvas dimensions based on node positions
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 };

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const node of nodes) {
      const x = node.position?.x ?? 400;
      const y = node.position?.y ?? 300;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return {
      minX: minX - 100,
      minY: minY - 50,
      maxX: maxX + 100,
      maxY: maxY + 50,
    };
  }, [nodes]);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  // Create node position map
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const node of nodes) {
      map.set(node.id, {
        x: (node.position?.x ?? 400) - bounds.minX,
        y: (node.position?.y ?? 300) - bounds.minY,
      });
    }
    return map;
  }, [nodes, bounds]);

  return (
    <div
      ref={canvasRef}
      className="relative overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl"
      style={{ height: '100%' }}
    >
      <svg
        width={width * zoom}
        height={height * zoom}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Edges */}
        <g className="edges">
          {edges.map((edge) => {
            const source = nodePositions.get(edge.source);
            const target = nodePositions.get(edge.target);
            if (!source || !target) return null;

            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="currentColor"
                  strokeWidth={edge.weight * 2}
                  className="text-slate-300 dark:text-slate-600"
                  strokeOpacity={0.6}
                />
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = node.id === selectedNodeId;
            const statusColor = STATUS_COLORS[node.status ?? 'not_started'];

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onNodeClick(node.id)}
              >
                <circle
                  r={isSelected ? 28 : 24}
                  className={cn(
                    'transition-all',
                    isSelected
                      ? 'fill-primary stroke-primary stroke-2'
                      : 'fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600'
                  )}
                />
                <circle
                  r={8}
                  cx={18}
                  cy={-18}
                  className={cn('transition-all', statusColor.replace('bg-', 'fill-'))}
                />
                {node.masteryLevel !== undefined && node.masteryLevel > 0 && (
                  <circle
                    r={26}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeDasharray={`${(node.masteryLevel / 100) * 163} 163`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                    className={cn('transition-all', statusColor.replace('bg-', 'text-'))}
                  />
                )}
                <text textAnchor="middle" dominantBaseline="middle" className="text-lg">
                  {node.type === 'Course'
                    ? '📚'
                    : node.type === 'Chapter'
                    ? '📖'
                    : node.type === 'Section'
                    ? '📄'
                    : node.type === 'Skill'
                    ? '⭐'
                    : '💡'}
                </text>
                <text
                  y={40}
                  textAnchor="middle"
                  className="text-xs font-medium fill-foreground"
                >
                  {node.name.length > 20 ? `${node.name.slice(0, 20)}...` : node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedKnowledgeGraphExplorer({
  courseId,
  initialConceptId,
  onConceptSelect,
  onStartLearning,
  height = '700px',
  className,
}: EnhancedKnowledgeGraphExplorerProps) {
  // State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialConceptId ?? null);
  const [conceptDetails, setConceptDetails] = useState<ConceptDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [isLoading, setIsLoading] = useState(!!courseId);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [activeTab, setActiveTab] = useState<'explore' | 'paths' | 'prerequisites'>('explore');
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipType>('all');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string; title: string }>>(
    []
  );

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered graph data
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;
    if (relationshipFilter === 'all') return graphData;

    const filteredEdges = graphData.edges.filter(
      (edge) => edge.type.toLowerCase() === relationshipFilter.toLowerCase()
    );

    return {
      ...graphData,
      edges: filteredEdges,
    };
  }, [graphData, relationshipFilter]);

  // Fetch available courses
  const fetchAvailableCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/courses?limit=20');
      if (response.ok) {
        const result = await response.json();
        if (result.courses) {
          setAvailableCourses(
            result.courses.map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            }))
          );
        }
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    const targetCourseId = selectedCourseId || courseId;
    if (!targetCourseId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sam/knowledge-graph?action=course&courseId=${targetCourseId}&includeUserProgress=true`
      );

      if (!response.ok) throw new Error('Failed to fetch knowledge graph');

      const result = await response.json();
      if (result.success) {
        setGraphData(result.data.graph);
      } else {
        throw new Error(result.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, selectedCourseId]);

  // Fetch concept details
  const fetchConceptDetails = useCallback(async (conceptId: string) => {
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/sam/knowledge-graph?action=concept&conceptId=${conceptId}&includeUserProgress=true`
      );

      if (!response.ok) throw new Error('Failed to fetch concept details');

      const result = await response.json();
      if (result.success) {
        setConceptDetails(result.data);
      }
    } catch (err) {
      console.error('Error fetching concept details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Search entities
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/sam/knowledge-graph?action=search&query=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data.results);
      }
    } catch {
      // Ignore search errors
    }
  }, []);

  // Handle node selection
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      fetchConceptDetails(nodeId);
      onConceptSelect?.(nodeId);
      setShowSidePanel(true);
    },
    [fetchConceptDetails, onConceptSelect]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 300);
    },
    [handleSearch]
  );

  // Initial load
  useEffect(() => {
    if (courseId || selectedCourseId) {
      fetchGraphData();
    } else {
      fetchAvailableCourses();
    }
  }, [fetchGraphData, fetchAvailableCourses, courseId, selectedCourseId]);

  // Load initial concept details
  useEffect(() => {
    if (initialConceptId) {
      fetchConceptDetails(initialConceptId);
    }
  }, [initialConceptId, fetchConceptDetails]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('', className)} style={{ height }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('', className)} style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Graph</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchGraphData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No course selected state
  if (!courseId && !selectedCourseId && !isLoading) {
    return (
      <Card className={cn('', className)} style={{ height }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Knowledge Graph Explorer</CardTitle>
          </div>
          <CardDescription>
            Explore concepts, build learning paths, and analyze prerequisites
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center max-w-md">
            <Map className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
            <p className="text-muted-foreground mb-6">
              Choose a course to explore its knowledge graph
            </p>
            {availableCourses.length > 0 ? (
              <div className="space-y-2">
                {availableCourses.slice(0, 5).map((course) => (
                  <Button
                    key={course.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setIsLoading(true);
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {course.title}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No courses available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)} style={{ height }}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Knowledge Graph Explorer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={fetchGraphData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSidePanel(!showSidePanel)}
                  >
                    {showSidePanel ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showSidePanel ? 'Hide Panel' : 'Show Panel'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {graphData?.stats && <GraphStats stats={graphData.stats} />}
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden pb-4">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="explore" className="gap-2">
                <Network className="h-4 w-4" />
                Explore
              </TabsTrigger>
              <TabsTrigger value="paths" className="gap-2">
                <Route className="h-4 w-4" />
                Paths
              </TabsTrigger>
              <TabsTrigger value="prerequisites" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Prerequisites
              </TabsTrigger>
            </TabsList>

            {/* Explore Tab */}
            <TabsContent value="explore" className="flex-1 flex flex-col gap-3 mt-3">
              {/* Search and Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search concepts..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={relationshipFilter}
                  onValueChange={(v) => setRelationshipFilter(v as RelationshipType)}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Graph/List View */}
              {searchQuery && searchResults.length > 0 ? (
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4">
                    {searchResults.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isSelected={node.id === selectedNodeId}
                        onClick={() => handleNodeClick(node.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as 'graph' | 'list')}
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="shrink-0 w-fit">
                    <TabsTrigger value="graph" className="gap-2">
                      <Network className="h-4 w-4" />
                      Graph
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                      <Layers className="h-4 w-4" />
                      List
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="graph" className="flex-1 mt-3">
                    {filteredGraphData && (
                      <GraphCanvas
                        nodes={filteredGraphData.nodes}
                        edges={filteredGraphData.edges}
                        selectedNodeId={selectedNodeId}
                        onNodeClick={handleNodeClick}
                        zoom={zoom}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="list" className="flex-1 mt-3">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-4">
                        {filteredGraphData?.nodes.map((node) => (
                          <NodeCard
                            key={node.id}
                            node={node}
                            isSelected={node.id === selectedNodeId}
                            onClick={() => handleNodeClick(node.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            {/* Learning Paths Tab */}
            <TabsContent value="paths" className="flex-1 mt-3">
              {selectedCourseId && (
                <LearningPathBuilder
                  courseId={selectedCourseId}
                  onConceptClick={handleNodeClick}
                  onStartLearning={(path) =>
                    onStartLearning?.(path.path.map((c) => c.id))
                  }
                />
              )}
            </TabsContent>

            {/* Prerequisites Tab */}
            <TabsContent value="prerequisites" className="flex-1 mt-3">
              {selectedCourseId && (
                <PrerequisiteAnalyzer
                  courseId={selectedCourseId}
                  initialConceptId={selectedNodeId ?? undefined}
                  onConceptClick={handleNodeClick}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel - Concept Details */}
        {showSidePanel && selectedNodeId && (
          <div className="w-80 shrink-0 border-l">
            {isLoadingDetails ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : conceptDetails ? (
              <ConceptDetailsPanel
                details={conceptDetails}
                onClose={() => {
                  setSelectedNodeId(null);
                  setConceptDetails(null);
                }}
                onNavigate={handleNodeClick}
                onAnalyzePrerequisites={(id) => {
                  setActiveTab('prerequisites');
                  handleNodeClick(id);
                }}
                onBuildPath={(id) => {
                  setActiveTab('paths');
                }}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedKnowledgeGraphExplorer;
