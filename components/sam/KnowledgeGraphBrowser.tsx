'use client';

/**
 * KnowledgeGraphBrowser
 *
 * Interactive visualization component for exploring the knowledge graph.
 * Displays course concepts, their relationships, and user progress.
 *
 * Features:
 * - Pan & zoom with mouse gestures and touch support
 * - Node dragging for manual repositioning
 * - Focus mode to highlight connected nodes
 * - Mini-map for navigation in large graphs
 * - Keyboard navigation for accessibility
 * - Start Learning action button
 * - Unified controls toolbar
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
  Brain,
  Sparkles,
  Filter,
  GitBranch,
  Move,
  Focus,
  Map as MapIcon,
  Play,
  Hand,
  MousePointer,
  RotateCcw,
  Keyboard,
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
  isFiltered?: boolean;
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
  onStartLearning?: (conceptId: string) => void;
  showSearch?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  height?: string;
  className?: string;
}

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

type InteractionMode = 'select' | 'pan';

// Relationship type definitions - values must match API response types (lowercase)
const RELATIONSHIP_TYPES = [
  { value: 'all', label: 'All Relationships', description: 'Show all connections' },
  { value: 'prerequisite_of', label: 'Prerequisites', description: 'Required prior knowledge' },
  { value: 'related_to', label: 'Related Concepts', description: 'Connected topics' },
  { value: 'part_of', label: 'Part Of', description: 'Hierarchical structure' },
  { value: 'follows', label: 'Sequence', description: 'Learning order' },
  { value: 'teaches', label: 'Teaches', description: 'Concepts taught' },
  { value: 'requires', label: 'Requires', description: 'Required knowledge' },
  { value: 'similar_to', label: 'Similar', description: 'Similar concepts' },
] as const;

type RelationshipFilterType = (typeof RELATIONSHIP_TYPES)[number]['value'];

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

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.001;
const NODE_RADIUS = 28;

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
              <h4 className="font-medium text-slate-900 dark:text-white truncate">{node.name}</h4>
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
              <span className="text-xs font-medium text-muted-foreground">{masteryLevel}% mastery</span>
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
  onStartLearning,
}: {
  details: ConceptDetails;
  onClose: () => void;
  onNavigate: (conceptId: string) => void;
  onStartLearning?: (conceptId: string) => void;
}) {
  const status = (details.userProgress?.status as keyof typeof STATUS_ICONS) ?? 'not_started';
  const StatusIcon = STATUS_ICONS[status];
  const masteryLevel = details.userProgress?.masteryLevel ?? 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <CardHeader className="pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {details.entity.type}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <span className="text-lg">&times;</span>
          </Button>
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
          {details.entity.name}
        </CardTitle>
        {details.entity.description && (
          <CardDescription className="line-clamp-3">{details.entity.description}</CardDescription>
        )}
      </CardHeader>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 p-4">
          {/* Start Learning Button */}
          {onStartLearning && (
            <Button
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              onClick={() => onStartLearning(details.entity.id)}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Learning
            </Button>
          )}

          {/* User Progress - Always show */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full transition-all', STATUS_COLORS[status])}
                style={{ width: `${masteryLevel}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{masteryLevel}% mastery</div>
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
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.reason}</div>
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

// ============================================================================
// MINI-MAP COMPONENT
// ============================================================================

function MiniMap({
  nodes,
  edges,
  nodePositions,
  viewTransform,
  bounds,
  containerSize,
  selectedNodeId,
  connectedNodeIds,
  focusMode,
  onViewportClick,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodePositions: Map<string, { x: number; y: number }>;
  viewTransform: ViewTransform;
  bounds: { width: number; height: number };
  containerSize: { width: number; height: number };
  selectedNodeId: string | null;
  connectedNodeIds: Set<string>;
  focusMode: boolean;
  onViewportClick: (x: number, y: number) => void;
}) {
  const miniMapRef = useRef<SVGSVGElement>(null);
  const MINI_MAP_WIDTH = 150;
  const MINI_MAP_HEIGHT = 100;

  const scale = Math.min(MINI_MAP_WIDTH / bounds.width, MINI_MAP_HEIGHT / bounds.height);

  // Calculate viewport rectangle in mini-map coordinates
  const viewportWidth = (containerSize.width / viewTransform.scale) * scale;
  const viewportHeight = (containerSize.height / viewTransform.scale) * scale;
  const viewportX = (-viewTransform.x / viewTransform.scale) * scale;
  const viewportY = (-viewTransform.y / viewTransform.scale) * scale;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / scale) * viewTransform.scale - containerSize.width / 2;
    const y = ((e.clientY - rect.top) / scale) * viewTransform.scale - containerSize.height / 2;
    onViewportClick(-x, -y);
  };

  return (
    <div className="absolute bottom-3 right-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-10">
      <svg
        ref={miniMapRef}
        width={MINI_MAP_WIDTH}
        height={MINI_MAP_HEIGHT}
        className="cursor-pointer"
        onClick={handleClick}
      >
        {/* Background */}
        <rect width={MINI_MAP_WIDTH} height={MINI_MAP_HEIGHT} fill="transparent" />

        {/* Edges */}
        <g>
          {edges.map((edge) => {
            const source = nodePositions.get(edge.source);
            const target = nodePositions.get(edge.target);
            if (!source || !target) return null;

            return (
              <line
                key={edge.id}
                x1={source.x * scale}
                y1={source.y * scale}
                x2={target.x * scale}
                y2={target.y * scale}
                stroke="#cbd5e1"
                strokeWidth={0.5}
                strokeOpacity={0.5}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = node.id === selectedNodeId;
            const isConnected = connectedNodeIds.has(node.id);
            const isDimmed = focusMode && selectedNodeId && !isSelected && !isConnected;

            return (
              <circle
                key={node.id}
                cx={pos.x * scale}
                cy={pos.y * scale}
                r={3}
                fill={isSelected ? '#6366f1' : isConnected ? '#818cf8' : '#94a3b8'}
                opacity={isDimmed ? 0.3 : 1}
              />
            );
          })}
        </g>

        {/* Viewport indicator */}
        <rect
          x={Math.max(0, viewportX)}
          y={Math.max(0, viewportY)}
          width={Math.min(viewportWidth, MINI_MAP_WIDTH - viewportX)}
          height={Math.min(viewportHeight, MINI_MAP_HEIGHT - viewportY)}
          fill="rgba(99, 102, 241, 0.1)"
          stroke="#6366f1"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// GRAPH CONTROLS TOOLBAR
// ============================================================================

function GraphControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onResetView,
  interactionMode,
  onInteractionModeChange,
  focusMode,
  onFocusModeToggle,
  showMiniMap,
  onMiniMapToggle,
  onRefresh,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onResetView: () => void;
  interactionMode: InteractionMode;
  onInteractionModeChange: (mode: InteractionMode) => void;
  focusMode: boolean;
  onFocusModeToggle: () => void;
  showMiniMap: boolean;
  onMiniMapToggle: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Interaction Mode Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={interactionMode === 'select' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onInteractionModeChange('select')}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select Mode (V)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={interactionMode === 'pan' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onInteractionModeChange('pan')}
            >
              <Hand className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pan Mode (H)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      {/* Zoom Controls */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out (-)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <span className="text-xs text-muted-foreground w-12 text-center font-medium">
        {Math.round(zoom * 100)}%
      </span>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In (+)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      {/* View Controls */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitToView}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to View (F)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View (R)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      {/* Feature Toggles */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={focusMode ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onFocusModeToggle}
            >
              <Focus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Focus Mode (G)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showMiniMap ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onMiniMapToggle}
            >
              <MapIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mini-map (M)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh Graph</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// ENHANCED GRAPH CANVAS
// ============================================================================

function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  focusMode,
  showMiniMap,
  interactionMode,
  viewTransform,
  onViewTransformChange,
  customPositions,
  onNodeDrag,
  focusedNodeIndex,
  onStartLearning,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  focusMode: boolean;
  showMiniMap: boolean;
  interactionMode: InteractionMode;
  viewTransform: ViewTransform;
  onViewTransformChange: (transform: ViewTransform) => void;
  customPositions: Map<string, { x: number; y: number }>;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  focusedNodeIndex: number;
  onStartLearning?: (conceptId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Calculate node positions - use custom positions or generate layout
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const nodeCount = nodes.length;

    if (nodeCount === 0) return map;

    // Build adjacency for better ordering
    const nodeConnections = new Map<string, number>();
    for (const edge of edges) {
      nodeConnections.set(edge.source, (nodeConnections.get(edge.source) ?? 0) + 1);
      nodeConnections.set(edge.target, (nodeConnections.get(edge.target) ?? 0) + 1);
    }

    // Group nodes by type for hierarchical layout
    const nodesByType = new Map<string, GraphNode[]>();
    for (const node of nodes) {
      const existing = nodesByType.get(node.type) ?? [];
      existing.push(node);
      nodesByType.set(node.type, existing);
    }

    // Layer order
    const layerOrder = ['Course', 'Chapter', 'Section', 'Concept', 'Topic', 'Skill'];
    const layerOrderSet = new Set(layerOrder);

    let yOffset = 80;
    const layerHeight = 140;
    const horizontalSpacing = 160;

    for (const layerType of layerOrder) {
      const nodesInLayer = nodesByType.get(layerType) ?? [];
      if (nodesInLayer.length === 0) continue;

      // Sort nodes in layer by connections
      nodesInLayer.sort((a, b) => {
        const aConns = nodeConnections.get(a.id) ?? 0;
        const bConns = nodeConnections.get(b.id) ?? 0;
        return bConns - aConns;
      });

      const layerWidth = nodesInLayer.length * horizontalSpacing;
      let xOffset = Math.max(100, 400 - layerWidth / 2);

      for (const node of nodesInLayer) {
        // Use custom position if available
        if (customPositions.has(node.id)) {
          map.set(node.id, customPositions.get(node.id)!);
        } else {
          map.set(node.id, {
            x: xOffset + Math.random() * 20 - 10,
            y: yOffset + Math.random() * 20 - 10,
          });
        }
        xOffset += horizontalSpacing;
      }

      yOffset += layerHeight;
    }

    // Handle any remaining nodes not in standard layers
    for (const [type, layerNodes] of nodesByType) {
      if (layerOrderSet.has(type)) continue;

      for (const node of layerNodes) {
        if (!map.has(node.id)) {
          if (customPositions.has(node.id)) {
            map.set(node.id, customPositions.get(node.id)!);
          } else {
            map.set(node.id, {
              x: 200 + Math.random() * 400,
              y: yOffset + Math.random() * 100,
            });
          }
        }
      }
      yOffset += layerHeight;
    }

    return map;
  }, [nodes, edges, customPositions]);

  // Calculate canvas bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { width: 800, height: 500 };

    let minX = Infinity,
      minY = Infinity,
      maxX = 0,
      maxY = 0;
    for (const pos of nodePositions.values()) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    }

    return {
      width: Math.max(800, maxX - minX + 200),
      height: Math.max(500, maxY - minY + 200),
    };
  }, [nodes.length, nodePositions]);

  // Get connected nodes for focus mode
  const connectedNodeIds = useMemo(() => {
    const connected = new Set<string>();
    if (!selectedNodeId) return connected;

    connected.add(selectedNodeId);
    for (const edge of edges) {
      if (edge.source === selectedNodeId) {
        connected.add(edge.target);
      }
      if (edge.target === selectedNodeId) {
        connected.add(edge.source);
      }
    }
    return connected;
  }, [selectedNodeId, edges]);

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewTransform.scale * (1 + delta)));

      // Zoom towards mouse position
      const scaleRatio = newScale / viewTransform.scale;
      const newX = mouseX - (mouseX - viewTransform.x) * scaleRatio;
      const newY = mouseY - (mouseY - viewTransform.y) * scaleRatio;

      onViewTransformChange({ x: newX, y: newY, scale: newScale });
    },
    [viewTransform, onViewTransformChange]
  );

  // Handle pan start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start panning with middle mouse button or in pan mode
      if (e.button === 1 || (e.button === 0 && interactionMode === 'pan')) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y });
      }
    },
    [interactionMode, viewTransform]
  );

  // Handle pan move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        onViewTransformChange({
          ...viewTransform,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (draggingNodeId) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale - dragOffset.x;
        const y = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale - dragOffset.y;
        onNodeDrag(draggingNodeId, x, y);
      }
    },
    [isPanning, panStart, viewTransform, onViewTransformChange, draggingNodeId, dragOffset, onNodeDrag]
  );

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // Handle node drag start
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (interactionMode === 'select') {
        e.stopPropagation();
        const pos = nodePositions.get(nodeId);
        if (!pos) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
        const mouseY = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;

        setDraggingNodeId(nodeId);
        setDragOffset({ x: mouseX - pos.x, y: mouseY - pos.y });
      }
    },
    [interactionMode, nodePositions, viewTransform]
  );

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setPanStart({ x: touch.clientX - viewTransform.x, y: touch.clientY - viewTransform.y });
        setIsPanning(true);
      }
    },
    [viewTransform]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isPanning) {
        const touch = e.touches[0];
        onViewTransformChange({
          ...viewTransform,
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
      } else if (e.touches.length === 2) {
        // Pinch to zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        // Store initial distance and implement pinch zoom logic
        // This is a simplified version
      }
    },
    [isPanning, panStart, viewTransform, onViewTransformChange]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Render cursor style based on mode
  const cursorStyle = useMemo(() => {
    if (draggingNodeId) return 'grabbing';
    if (isPanning) return 'grabbing';
    if (interactionMode === 'pan') return 'grab';
    return 'default';
  }, [draggingNodeId, isPanning, interactionMode]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
      style={{ cursor: cursorStyle }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Arrow marker definitions */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
          <marker id="arrowhead-dimmed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" opacity="0.3" />
          </marker>
          {/* Glow filter for hover/selected nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render edges */}
        <g className="edges">
          {edges.map((edge) => {
            const source = nodePositions.get(edge.source);
            const target = nodePositions.get(edge.target);
            if (!source || !target) return null;

            const isConnectedToSelected = selectedNodeId === edge.source || selectedNodeId === edge.target;
            const isDimmed = focusMode && selectedNodeId && !isConnectedToSelected;

            // Calculate line to stop at node edge
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) return null;

            const startX = source.x + (dx / length) * NODE_RADIUS;
            const startY = source.y + (dy / length) * NODE_RADIUS;
            const endX = target.x - (dx / length) * (NODE_RADIUS + 5);
            const endY = target.y - (dy / length) * (NODE_RADIUS + 5);

            return (
              <g key={edge.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isConnectedToSelected ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={isConnectedToSelected ? 3 : 2}
                  strokeOpacity={isDimmed ? 0.15 : isConnectedToSelected ? 1 : 0.6}
                  markerEnd={
                    isDimmed
                      ? 'url(#arrowhead-dimmed)'
                      : isConnectedToSelected
                        ? 'url(#arrowhead-selected)'
                        : 'url(#arrowhead)'
                  }
                  className="transition-all duration-200"
                />
                {/* Edge label */}
                {edge.label && !isDimmed && (
                  <text
                    x={(startX + endX) / 2}
                    y={(startY + endY) / 2 - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 dark:fill-slate-400 pointer-events-none"
                    opacity={isDimmed ? 0.3 : 1}
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
          {nodes.map((node, index) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isSelected = node.id === selectedNodeId;
            const isConnected = connectedNodeIds.has(node.id);
            const isDimmed = focusMode && selectedNodeId && !isSelected && !isConnected;
            const isFiltered = node.isFiltered;
            const isHovered = node.id === hoveredNodeId;
            const isFocusedByKeyboard = index === focusedNodeIndex;
            const statusColor = STATUS_COLORS[node.status ?? 'not_started'];

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={cn('cursor-pointer transition-all duration-200')}
                style={{ opacity: isDimmed || isFiltered ? 0.3 : 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node.id);
                }}
                onDoubleClick={() => onNodeDoubleClick?.(node.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                tabIndex={0}
                role="button"
                aria-label={`${node.name} - ${node.status ?? 'not started'}`}
              >
                {/* Node shadow */}
                <circle r={32} fill="rgba(0,0,0,0.1)" cx={2} cy={2} />

                {/* Node background */}
                <circle
                  r={isSelected || isHovered ? 32 : NODE_RADIUS}
                  fill={isSelected ? '#6366f1' : '#ffffff'}
                  stroke={
                    isFocusedByKeyboard
                      ? '#f97316'
                      : isSelected
                        ? '#4f46e5'
                        : isHovered
                          ? '#6366f1'
                          : '#e2e8f0'
                  }
                  strokeWidth={isFocusedByKeyboard ? 4 : isSelected ? 3 : 2}
                  filter={isHovered || isSelected ? 'url(#glow)' : undefined}
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
                    stroke={
                      statusColor.replace('bg-', '').includes('emerald')
                        ? '#10b981'
                        : statusColor.replace('bg-', '').includes('blue')
                          ? '#3b82f6'
                          : statusColor.replace('bg-', '').includes('amber')
                            ? '#f59e0b'
                            : '#9ca3af'
                    }
                    strokeWidth={4}
                    strokeDasharray={`${(node.masteryLevel / 100) * 163} 163`}
                    strokeLinecap="round"
                    transform="rotate(-90)"
                    opacity={0.8}
                  />
                )}

                {/* Node icon */}
                <text textAnchor="middle" dominantBaseline="middle" className="text-lg select-none">
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

                {/* Node label */}
                <text
                  y={48}
                  textAnchor="middle"
                  fill={isSelected ? '#4f46e5' : '#475569'}
                  className="text-[11px] font-medium pointer-events-none select-none"
                >
                  {node.name.length > 18 ? `${node.name.slice(0, 18)}...` : node.name}
                </text>

                {/* Hover action button */}
                {isHovered && onStartLearning && !isDimmed && (
                  <g
                    transform="translate(25, -25)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartLearning(node.id);
                    }}
                    className="cursor-pointer"
                  >
                    <circle r={12} fill="#6366f1" stroke="#ffffff" strokeWidth={2} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      className="text-xs font-bold"
                    >
                      ▶
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Mini-map */}
      {showMiniMap && (
        <MiniMap
          nodes={nodes}
          edges={edges}
          nodePositions={nodePositions}
          viewTransform={viewTransform}
          bounds={bounds}
          containerSize={containerSize}
          selectedNodeId={selectedNodeId}
          connectedNodeIds={connectedNodeIds}
          focusMode={focusMode}
          onViewportClick={(x, y) => onViewTransformChange({ ...viewTransform, x, y })}
        />
      )}

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded flex items-center gap-1">
        <Keyboard className="h-3 w-3" />
        <span>Tab: Navigate • Enter: Select • Esc: Deselect</span>
      </div>
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
  onStartLearning,
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
  const [isLoading, setIsLoading] = useState(!!courseId);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [availableCourses, setAvailableCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilterType>('all');

  // New state for enhanced features
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');
  const [focusMode, setFocusMode] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [customNodePositions, setCustomNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter edges based on relationship type
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;
    if (relationshipFilter === 'all') return graphData;

    const filteredEdges = graphData.edges.filter((edge) => edge.type === relationshipFilter);

    const connectedNodeIds = new Set<string>();
    for (const edge of filteredEdges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }

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
        totalEdges: filteredEdges.length,
      },
    };
  }, [graphData, relationshipFilter]);

  // Fetch available courses when no courseId is provided
  const fetchAvailableCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/enrollments/my-courses');
      if (response.ok) {
        const result = await response.json();
        const courses = result.data || result.courses || [];
        if (Array.isArray(courses) && courses.length > 0) {
          setAvailableCourses(
            courses.map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            }))
          );
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
        // Reset view when loading new graph
        setViewTransform({ x: 50, y: 50, scale: 1 });
        setCustomNodePositions(new Map());
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

      // Update focused index
      const index = filteredGraphData?.nodes.findIndex((n) => n.id === nodeId) ?? -1;
      setFocusedNodeIndex(index);
    },
    [fetchConceptDetails, onConceptSelect, filteredGraphData]
  );

  // Handle node double click (start learning)
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      onStartLearning?.(nodeId);
    },
    [onStartLearning]
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

  // Handle node drag
  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setCustomNodePositions((prev) => {
      const next = new Map(prev);
      next.set(nodeId, { x, y });
      return next;
    });
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setViewTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_ZOOM, prev.scale * 1.2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_ZOOM, prev.scale / 1.2),
    }));
  }, []);

  const handleFitToView = useCallback(() => {
    // Reset to default view that shows all nodes
    setViewTransform({ x: 50, y: 50, scale: 0.8 });
  }, []);

  const handleResetView = useCallback(() => {
    setViewTransform({ x: 50, y: 50, scale: 1 });
    setCustomNodePositions(new Map());
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if graph view is active and not in an input
      if (viewMode !== 'graph' || e.target instanceof HTMLInputElement) return;

      const nodes = filteredGraphData?.nodes ?? [];
      if (nodes.length === 0) return;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setFocusedNodeIndex((prev) => (prev <= 0 ? nodes.length - 1 : prev - 1));
          } else {
            setFocusedNodeIndex((prev) => (prev >= nodes.length - 1 ? 0 : prev + 1));
          }
          break;
        case 'Enter':
          if (focusedNodeIndex >= 0 && focusedNodeIndex < nodes.length) {
            handleNodeClick(nodes[focusedNodeIndex].id);
          }
          break;
        case 'Escape':
          setSelectedNodeId(null);
          setConceptDetails(null);
          setFocusedNodeIndex(-1);
          break;
        case 'v':
        case 'V':
          setInteractionMode('select');
          break;
        case 'h':
        case 'H':
          setInteractionMode('pan');
          break;
        case 'g':
        case 'G':
          setFocusMode((prev) => !prev);
          break;
        case 'm':
        case 'M':
          setShowMiniMap((prev) => !prev);
          break;
        case 'f':
        case 'F':
          handleFitToView();
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            handleResetView();
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    filteredGraphData,
    focusedNodeIndex,
    handleNodeClick,
    handleFitToView,
    handleResetView,
    handleZoomIn,
    handleZoomOut,
  ]);

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
          <CardDescription>Explore the connections between concepts in your courses</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-center max-w-xl w-full px-4">
            {/* Animated Brain Icon */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full" />
              <Brain className="absolute inset-0 m-auto h-10 w-10 text-primary" />
            </div>

            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Select a Course</h3>
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
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Click to explore knowledge graph
                        </p>
                      </div>
                      <ChevronRight className="flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30">
                <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No enrolled courses found.</p>
                <Button
                  variant="default"
                  asChild
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
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
    <Card className={cn('flex flex-col', className)} style={{ height }} ref={containerRef}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Knowledge Graph</CardTitle>
          </div>

          {/* Graph Controls Toolbar */}
          {viewMode === 'graph' && filteredGraphData && (
            <GraphControls
              zoom={viewTransform.scale}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToView={handleFitToView}
              onResetView={handleResetView}
              interactionMode={interactionMode}
              onInteractionModeChange={setInteractionMode}
              focusMode={focusMode}
              onFocusModeToggle={() => setFocusMode((prev) => !prev)}
              showMiniMap={showMiniMap}
              onMiniMapToggle={() => setShowMiniMap((prev) => !prev)}
              onRefresh={fetchGraphData}
            />
          )}
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
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'graph' | 'list')}
              className="flex-1 flex flex-col"
            >
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
                    onNodeDoubleClick={handleNodeDoubleClick}
                    focusMode={focusMode}
                    showMiniMap={showMiniMap}
                    interactionMode={interactionMode}
                    viewTransform={viewTransform}
                    onViewTransformChange={setViewTransform}
                    customPositions={customNodePositions}
                    onNodeDrag={handleNodeDrag}
                    focusedNodeIndex={focusedNodeIndex}
                    onStartLearning={onStartLearning}
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
                  setFocusedNodeIndex(-1);
                }}
                onNavigate={handleNodeClick}
                onStartLearning={onStartLearning}
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KnowledgeGraphBrowser;
