"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  ArrowRight, 
  Type, 
  Undo, 
  Redo, 
  Trash2, 
  Download,
  Upload,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingPath {
  id: string;
  type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'text';
  points: { x: number; y: number }[];
  color: string;
  width: number;
  text?: string;
  userId: string;
  timestamp: Date;
}

interface CollaborationWhiteboardProps {
  sessionId: string;
  userId: string;
  userName: string;
  onPathAdded?: (path: DrawingPath) => void;
  className?: string;
}

export function CollaborationWhiteboard({
  sessionId,
  userId,
  userName,
  onPathAdded,
  className
}: CollaborationWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'text'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(3);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [history, setHistory] = useState<DrawingPath[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Colors palette
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Configure context
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushWidth;

    contextRef.current = context;

    // Clear canvas with white background
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [brushWidth, color]);

  // Update canvas context when color or brush width changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushWidth;
    }
  }, [color, brushWidth]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;

    setIsDrawing(true);
    const pos = getMousePos(e);

    const newPath: DrawingPath = {
      id: `path-${Date.now()}-${Math.random()}`,
      type: tool,
      points: [pos],
      color,
      width: brushWidth,
      userId,
      timestamp: new Date()
    };

    setCurrentPath(newPath);

    if (tool === 'pen' || tool === 'eraser') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(pos.x, pos.y);
    }
  }, [tool, color, brushWidth, userId, getMousePos]);

  // Continue drawing
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !currentPath) return;

    const pos = getMousePos(e);
    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, pos]
    };
    setCurrentPath(updatedPath);

    if (tool === 'pen') {
      contextRef.current.globalCompositeOperation = 'source-over';
      contextRef.current.lineTo(pos.x, pos.y);
      contextRef.current.stroke();
    } else if (tool === 'eraser') {
      contextRef.current.globalCompositeOperation = 'destination-out';
      contextRef.current.lineTo(pos.x, pos.y);
      contextRef.current.stroke();
    }
  }, [isDrawing, currentPath, tool, getMousePos]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentPath) return;

    setIsDrawing(false);
    
    // Add path to history
    const newPaths = [...paths, currentPath];
    setPaths(newPaths);
    
    // Update history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPaths);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Notify parent component
    if (onPathAdded) {
      onPathAdded(currentPath);
    }

    setCurrentPath(null);

    // Reset composite operation
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = 'source-over';
    }
  }, [isDrawing, currentPath, paths, history, historyIndex, onPathAdded]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    contextRef.current.fillStyle = '#FFFFFF';
    contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    
    setPaths([]);
    setCurrentPath(null);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Redraw canvas from paths
  const redrawCanvas = useCallback((pathsToDraw: DrawingPath[]) => {
    if (!contextRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;

    // Clear canvas
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    pathsToDraw.forEach((path) => {
      if (path.points.length < 2) return;

      context.strokeStyle = path.color;
      context.lineWidth = path.width;
      context.globalCompositeOperation = path.type === 'eraser' ? 'destination-out' : 'source-over';

      context.beginPath();
      context.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        context.lineTo(path.points[i].x, path.points[i].y);
      }

      context.stroke();
    });

    // Reset to default
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = color;
    context.lineWidth = brushWidth;
  }, [color, brushWidth]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPaths(history[newIndex]);
      redrawCanvas(history[newIndex]);
    }
  }, [historyIndex, history, redrawCanvas]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPaths(history[newIndex]);
      redrawCanvas(history[newIndex]);
    }
  }, [historyIndex, history, redrawCanvas]);

  // Download canvas as image
  const downloadCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${sessionId}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  }, [sessionId]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Collaboration Whiteboard</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadCanvas}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Tools */}
          <div className="flex items-center gap-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'arrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('arrow')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-500" />
            <div className="flex items-center gap-1">
              {colors.map((colorOption) => (
                <button
                  key={colorOption}
                  onClick={() => setColor(colorOption)}
                  className={cn(
                    "w-6 h-6 rounded border-2 transition-all",
                    color === colorOption ? "border-gray-900 scale-110" : "border-gray-300"
                  )}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded border-2 border-gray-300"
              />
            </div>
          </div>

          {/* Brush Width */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Size:</span>
            <Slider
              value={[brushWidth]}
              onValueChange={(value) => setBrushWidth(value[0])}
              max={20}
              min={1}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-8">{brushWidth}px</span>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Status */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)} | 
          Color: {color} | 
          Size: {brushWidth}px
        </span>
        <span>
          {paths.length} strokes | 
          Connected to session {sessionId.slice(-6)}
        </span>
      </div>
    </div>
  );
}