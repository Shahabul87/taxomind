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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Filter,
  GitBranch,
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
  showFilters?: boolean;
  height?: string;
  className?: string;
}

// Relationship type definitions - values must match API response types
const RELATIONSHIP_TYPES = [
  { value: 'all', label: 'All Relationships', description: 'Show all connections' },
  { value: 'PREREQUISITE_OF', label: 'Prerequisites', description: 'Required prior knowledge' },
  { value: 'RELATED_TO', label: 'Related Concepts', description: 'Connected topics' },
  { value: 'PART_OF', label: 'Part Of', description: 'Hierarchical structure' },
  { value: 'FOLLOWS', label: 'Sequence', description: 'Learning order' },
  { value: 'TEACHES', label: 'Teaches', description: 'Concepts taught' },
] as const;

type RelationshipFilterType = typeof RELATIONSHIP_TYPES[number]['value'];

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
  const status = node.status ?? 'not_started';
  const StatusIcon = STATUS_ICONS[status];
  const statusColor = STATUS_COLORS[status];
  const typeColor = NODE_TYPE_COLORS[node.type] ?? 'bg-gray-500';
  const masteryLevel = node.masteryLevel ?? 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md border-slate-200 dark:border-slate-700',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white',
              typeColor
            )}
          >
            <BookOpen className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                {node.name}
              </h4>
              <Badge variant="outline" className="text-xs shrink-0 capitalize">
                {node.type}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 min-h-[2rem]">
              {node.description || 'No description available'}
            </p>

            {/* Status Row - Always visible */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColor)} />
                <span className="text-xs text-muted-foreground capitalize">
                  {status.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {masteryLevel}% mastery
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-2" />
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
  const status = (details.userProgress?.status as keyof typeof STATUS_ICONS) ?? 'not_started';
  const StatusIcon = STATUS_ICONS[status];
  const masteryLevel = details.userProgress?.masteryLevel ?? 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <CardHeader className="pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">{details.entity.type}</Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <span className="text-lg">&times;</span>
          </Button>
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
          {details.entity.name}
        </CardTitle>
        {details.entity.description && (
          <CardDescription className="line-clamp-3">
            {details.entity.description}
          </CardDescription>
        )}
      </CardHeader>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 p-4">
          {/* User Progress - Always show */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium capitalize">
                {status.replace('_', ' ')}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  STATUS_COLORS[status]
                )}
                style={{ width: `${masteryLevel}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {masteryLevel}% mastery
            </div>
          </div>

          {/* Connected Concepts */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Connected Concepts ({details.neighbors.length})</span>
              </h4>
            </div>
            {details.neighbors.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                {details.neighbors.map((neighbor) => (
                  <button
                    key={neighbor.id}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-hidden"
                    onClick={() => onNavigate(neighbor.id)}
                  >
                    <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-sm truncate flex-1 min-w-0">{neighbor.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No connected concepts
              </div>
            )}
          </div>

          {/* Recommendations */}
          {details.recommendations && details.recommendations.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>Recommended Next</span>
                </h4>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {details.recommendations.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors overflow-hidden"
                    onClick={() => onNavigate(rec.id)}
                  >
                    <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                      {rec.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {rec.reason}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>
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

  // Calculate node positions - use API positions or generate grid layout
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const nodeCount = nodes.length;

    if (nodeCount === 0) return map;

    // Check if any node has valid position from API
    const hasValidPositions = nodes.some(
      (n) => n.position && n.position.x !== 400 && n.position.y !== 300
    );

    if (hasValidPositions) {
      // Use API-provided positions
      for (const node of nodes) {
        map.set(node.id, {
          x: node.position?.x ?? 400,
          y: node.position?.y ?? 300,
        });
      }
    } else {
      // Generate hierarchical grid layout
      const cols = Math.ceil(Math.sqrt(nodeCount));
      const horizontalSpacing = 180;
      const verticalSpacing = 140;
      const startX = 100;
      const startY = 80;

      // Build adjacency for better ordering
      const nodeConnections = new Map<string, number>();
      for (const edge of edges) {
        nodeConnections.set(edge.source, (nodeConnections.get(edge.source) ?? 0) + 1);
        nodeConnections.set(edge.target, (nodeConnections.get(edge.target) ?? 0) + 1);
      }

      // Sort nodes: more connected nodes first (they'll be at top)
      const sortedNodes = [...nodes].sort((a, b) => {
        const aConns = nodeConnections.get(a.id) ?? 0;
        const bConns = nodeConnections.get(b.id) ?? 0;
        return bConns - aConns;
      });

      sortedNodes.forEach((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        // Add slight offset for visual variety
        const offsetX = (row % 2) * (horizontalSpacing / 4);
        map.set(node.id, {
          x: startX + col * horizontalSpacing + offsetX,
          y: startY + row * verticalSpacing,
        });
      });
    }

    return map;
  }, [nodes, edges]);

  // Calculate canvas bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { width: 800, height: 500 };

    let maxX = 0, maxY = 0;
    for (const pos of nodePositions.values()) {
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    return {
      width: Math.max(800, maxX + 150),
      height: Math.max(500, maxY + 120),
    };
  }, [nodes.length, nodePositions]);

  return (
    <div
      ref={canvasRef}
      className="relative overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
      style={{ height: '100%' }}
    >
      <svg
        width={bounds.width * zoom}
        height={bounds.height * zoom}
        viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        style={{ minWidth: '100%', minHeight: '100%' }}
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#94a3b8"
            />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6366f1"
            />
          </marker>
        </defs>

        {/* Render edges with arrows */}
        <g className="edges">
          {edges.map((edge) => {
            const source = nodePositions.get(edge.source);
            const target = nodePositions.get(edge.target);
            if (!source || !target) return null;

            const isConnectedToSelected =
              selectedNodeId === edge.source || selectedNodeId === edge.target;

            // Calculate line to stop at node edge (radius 30)
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const nodeRadius = 30;

            // Adjust start and end points to node edges
            const startX = source.x + (dx / length) * nodeRadius;
            const startY = source.y + (dy / length) * nodeRadius;
            const endX = target.x - (dx / length) * (nodeRadius + 5);
            const endY = target.y - (dy / length) * (nodeRadius + 5);

            return (
              <g key={edge.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isConnectedToSelected ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={isConnectedToSelected ? 3 : 2}
                  strokeOpacity={isConnectedToSelected ? 1 : 0.6}
                  markerEnd={isConnectedToSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                  className="transition-all duration-200"
                />
                {/* Edge label */}
                {edge.label && (
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 dark:fill-slate-400 pointer-events-none"
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
            const isFiltered = (node as GraphNode & { isFiltered?: boolean }).isFiltered;
            const statusColor = STATUS_COLORS[node.status ?? 'not_started'];

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onNodeClick(node.id)}
                style={{ opacity: isFiltered ? 0.3 : 1 }}
              >
                {/* Node shadow */}
                <circle
                  r={32}
                  fill="rgba(0,0,0,0.1)"
                  cx={2}
                  cy={2}
                />
                {/* Node background */}
                <circle
                  r={isSelected ? 32 : 28}
                  fill={isSelected ? '#6366f1' : '#ffffff'}
                  stroke={isSelected ? '#4f46e5' : '#e2e8f0'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200"
                />
                {/* Status indicator dot */}
                <circle
                  r={8}
                  cx={20}
                  cy={-20}
                  className={cn('transition-all', statusColor.replace('bg-', 'fill-'))}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                {/* Mastery progress ring */}
                {node.masteryLevel !== undefined && node.masteryLevel > 0 && (
                  <circle
                    r={26}
                    fill="none"
                    stroke={statusColor.replace('bg-', '').includes('emerald') ? '#10b981' :
                            statusColor.replace('bg-', '').includes('blue') ? '#3b82f6' :
                            statusColor.replace('bg-', '').includes('amber') ? '#f59e0b' : '#9ca3af'}
                    strokeWidth={4}
                    strokeDasharray={`${(node.masteryLevel / 100) * 163} 163`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                    opacity={0.8}
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
                  y={48}
                  textAnchor="middle"
                  fill={isSelected ? '#4f46e5' : '#475569'}
                  className="text-[11px] font-medium pointer-events-none"
                >
                  {node.name.length > 18 ? `${node.name.slice(0, 18)}...` : node.name}
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
  showFilters = true,
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
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilterType>('all');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter edges based on relationship type
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;
    if (relationshipFilter === 'all') return graphData;

    // Match edge type exactly (API returns uppercase like PREREQUISITE_OF)
    const filteredEdges = graphData.edges.filter(
      (edge) => edge.type === relationshipFilter
    );

    // Get nodes that are still connected after filtering
    const connectedNodeIds = new Set<string>();
    for (const edge of filteredEdges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }

    // Keep all nodes but mark unconnected ones (dim opacity if not connected)
    const filteredNodes = graphData.nodes.map((node) => ({
      ...node,
      isFiltered: filteredEdges.length > 0 && !connectedNodeIds.has(node.id),
    }));

    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges,
      stats: {
        ...graphData.stats,
        // Update connection count for filtered view
        totalEdges: filteredEdges.length,
      },
    };
  }, [graphData, relationshipFilter]);

  // Fetch available courses when no courseId is provided
  // Uses enrolled courses API to show user's actual enrolled courses
  const fetchAvailableCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/enrollments/my-courses');
      if (response.ok) {
        const result = await response.json();
        // The API returns { success: true, data: [...courses] }
        const courses = result.data || result.courses || [];
        if (Array.isArray(courses) && courses.length > 0) {
          setAvailableCourses(courses.map((c: { id: string; title: string }) => ({
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
          <div className="text-center max-w-xl w-full px-4">
            {/* Animated Brain Icon */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full" />
              <Brain className="absolute inset-0 m-auto h-10 w-10 text-primary" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
              Select a Course
            </h3>
            <p className="text-muted-foreground mb-8 text-sm">
              Choose a course to explore its knowledge graph and see how concepts connect to each other.
            </p>

            {availableCourses.length > 0 ? (
              <div className="space-y-3">
                {availableCourses.slice(0, 5).map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setIsLoading(true);
                    }}
                    className="group w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      {/* Course Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Click to explore knowledge graph
                        </p>
                      </div>

                      {/* Arrow Icon */}
                      <ChevronRight className="flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No enrolled courses found.</p>
                <Button variant="default" asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  <Link href="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Link>
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
        {/* Relationship Filter */}
        {showFilters && graphData && (
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
            <Select
              value={relationshipFilter}
              onValueChange={(value) => setRelationshipFilter(value as RelationshipFilterType)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {relationshipFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                {filteredGraphData?.edges.length ?? 0} connections
              </Badge>
            )}
          </div>
        )}
        {showStats && graphData?.stats && <GraphStats stats={graphData.stats} />}
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden pb-4">
        {/* Left Panel - Graph or List */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          {showSearch && (
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 w-full"
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
        </div>

        {/* Right Panel - Concept Details */}
        {selectedNodeId && (
          <div className="w-80 shrink-0 overflow-hidden">
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
