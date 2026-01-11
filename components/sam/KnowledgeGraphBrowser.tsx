'use client';

/**
 * KnowledgeGraphBrowser
 *
 * Interactive visualization component for exploring the knowledge graph.
 * Displays course concepts, their relationships, and user progress.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ChevronRight,
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
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
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

interface KnowledgeGraphBrowserProps {
  courseId?: string;
  initialConceptId?: string;
  onConceptSelect?: (conceptId: string) => void;
  showSearch?: boolean;
  showStats?: boolean;
  height?: string;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

const NODE_TYPE_COLORS: Record<string, string> = {
  Course: 'bg-purple-500',
  Chapter: 'bg-indigo-500',
  Section: 'bg-blue-500',
  Concept: 'bg-cyan-500',
  Topic: 'bg-teal-500',
  Skill: 'bg-emerald-500',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function GraphStats({ stats }: { stats: GraphData['stats'] }) {
  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-lg font-semibold">{stats.totalNodes}</div>
        <div className="text-xs text-muted-foreground">Concepts</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold">{stats.totalEdges}</div>
        <div className="text-xs text-muted-foreground">Connections</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-emerald-600">{stats.masteredCount}</div>
        <div className="text-xs text-muted-foreground">Mastered</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-blue-600">{stats.inProgressCount}</div>
        <div className="text-xs text-muted-foreground">Learning</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-500">{stats.notStartedCount}</div>
        <div className="text-xs text-muted-foreground">Not Started</div>
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
  const typeColor = NODE_TYPE_COLORS[node.type] ?? 'bg-gray-500';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-white',
              typeColor
            )}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{node.name}</h4>
              <Badge variant="outline" className="text-xs shrink-0">
                {node.type}
              </Badge>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {node.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className={cn('w-2 h-2 rounded-full', statusColor)} />
              <span className="text-xs text-muted-foreground capitalize">
                {node.status?.replace('_', ' ') ?? 'Not Started'}
              </span>
              {node.masteryLevel !== undefined && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {node.masteryLevel}% mastery
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function ConceptDetailsPanel({
  details,
  onClose,
  onNavigate,
}: {
  details: ConceptDetails;
  onClose: () => void;
  onNavigate: (conceptId: string) => void;
}) {
  const StatusIcon = STATUS_ICONS[(details.userProgress?.status as keyof typeof STATUS_ICONS) ?? 'not_started'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{details.entity.type}</Badge>
          <Button variant="ghost" size="sm" onClick={onClose}>
            &times;
          </Button>
        </div>
        <CardTitle className="text-lg">{details.entity.name}</CardTitle>
        {details.entity.description && (
          <CardDescription>{details.entity.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Progress */}
        {details.userProgress && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">
                {details.userProgress.status.replace('_', ' ')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  STATUS_COLORS[(details.userProgress.status as keyof typeof STATUS_COLORS) ?? 'not_started']
                )}
                style={{ width: `${details.userProgress.masteryLevel}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {details.userProgress.masteryLevel}% mastery
            </div>
          </div>
        )}

        {/* Connected Concepts */}
        {details.neighbors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Connected Concepts ({details.neighbors.length})
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {details.neighbors.map((neighbor) => (
                  <Button
                    key={neighbor.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => onNavigate(neighbor.id)}
                  >
                    <ArrowRight className="h-3 w-3 mr-2 shrink-0" />
                    <span className="truncate">{neighbor.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {neighbor.type}
                    </Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Recommendations */}
        {details.recommendations && details.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
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
      </CardContent>
    </Card>
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

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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

  // Create node position map for edge rendering
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
      className="relative overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg"
      style={{ height: '100%' }}
    >
      <svg
        width={width * zoom}
        height={height * zoom}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        {/* Render edges */}
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
                {edge.label && (
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Render nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = node.id === selectedNodeId;
            const statusColor = STATUS_COLORS[node.status ?? 'not_started'];
            const typeColor = NODE_TYPE_COLORS[node.type] ?? 'bg-gray-500';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onNodeClick(node.id)}
              >
                {/* Node circle */}
                <circle
                  r={isSelected ? 28 : 24}
                  className={cn(
                    'transition-all',
                    isSelected
                      ? 'fill-primary stroke-primary stroke-2'
                      : 'fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600'
                  )}
                />
                {/* Status indicator */}
                <circle
                  r={8}
                  cx={18}
                  cy={-18}
                  className={cn('transition-all', statusColor.replace('bg-', 'fill-'))}
                />
                {/* Mastery progress ring */}
                {node.masteryLevel !== undefined && node.masteryLevel > 0 && (
                  <circle
                    r={26}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeDasharray={`${(node.masteryLevel / 100) * 163} 163`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                    className={cn(
                      'transition-all',
                      statusColor.replace('bg-', 'text-')
                    )}
                  />
                )}
                {/* Node icon */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg"
                >
                  {node.type === 'Course' ? '📚' :
                   node.type === 'Chapter' ? '📖' :
                   node.type === 'Section' ? '📄' :
                   node.type === 'Skill' ? '⭐' : '💡'}
                </text>
                {/* Node label */}
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

export function KnowledgeGraphBrowser({
  courseId,
  initialConceptId,
  onConceptSelect,
  showSearch = true,
  showStats = true,
  height = '600px',
  className,
}: KnowledgeGraphBrowserProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialConceptId ?? null);
  const [conceptDetails, setConceptDetails] = useState<ConceptDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [isLoading, setIsLoading] = useState(!!courseId); // Only loading if courseId is provided
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [availableCourses, setAvailableCourses] = useState<Array<{id: string; title: string}>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available courses when no courseId is provided
  const fetchAvailableCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/courses?limit=20');
      if (response.ok) {
        const result = await response.json();
        if (result.courses) {
          setAvailableCourses(result.courses.map((c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title
          })));
        }
      }
    } catch {
      // Ignore errors fetching courses
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

      if (!response.ok) {
        throw new Error('Failed to fetch knowledge graph');
      }

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

      if (!response.ok) {
        throw new Error('Failed to fetch concept details');
      }

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
    },
    [fetchConceptDetails, onConceptSelect]
  );

  // Handle search input change with debounce
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
            <CardTitle>Knowledge Graph</CardTitle>
          </div>
          <CardDescription>
            Explore the connections between concepts in your courses
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center max-w-md">
            <Brain className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Course</h3>
            <p className="text-muted-foreground mb-6">
              Choose a course to explore its knowledge graph and see how concepts connect to each other.
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
              <div className="text-muted-foreground">
                <p className="mb-4">No courses available yet.</p>
                <Button variant="default" asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col', className)} style={{ height }}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Knowledge Graph</CardTitle>
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
                <TooltipContent>Refresh Graph</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {showStats && graphData?.stats && <GraphStats stats={graphData.stats} />}
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden pb-4">
        {/* Left Panel - Graph or List */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

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
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'graph' | 'list')} className="flex-1 flex flex-col">
              <TabsList className="shrink-0">
                <TabsTrigger value="graph" className="gap-2">
                  <Network className="h-4 w-4" />
                  Graph View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <Layers className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>
              <TabsContent value="graph" className="flex-1 mt-3">
                {graphData && (
                  <GraphCanvas
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    selectedNodeId={selectedNodeId}
                    onNodeClick={handleNodeClick}
                    zoom={zoom}
                  />
                )}
              </TabsContent>
              <TabsContent value="list" className="flex-1 mt-3">
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
                    {graphData?.nodes.map((node) => (
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
        </div>

        {/* Right Panel - Concept Details */}
        {selectedNodeId && (
          <div className="w-80 shrink-0">
            {isLoadingDetails ? (
              <Card className="h-full">
                <CardContent className="p-4 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : conceptDetails ? (
              <ConceptDetailsPanel
                details={conceptDetails}
                onClose={() => {
                  setSelectedNodeId(null);
                  setConceptDetails(null);
                }}
                onNavigate={handleNodeClick}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KnowledgeGraphBrowser;
