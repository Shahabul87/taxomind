"use client";

/**
 * HandwritingCanvas
 *
 * Touch-friendly canvas for handwriting input with pressure sensitivity,
 * undo/redo, and recognition capabilities.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Palette,
  Minus,
  Plus,
  Download,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface HandwritingCanvasProps {
  onCanvasSubmit: (imageBlob: Blob) => void;
  isProcessing?: boolean;
  recognizedText?: string;
  width?: number;
  height?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const COLORS = [
  { name: "Black", value: "#1e293b" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

export function HandwritingCanvas({
  onCanvasSubmit,
  isProcessing = false,
  recognizedText,
  width = 600,
  height = 400,
  className,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const lastPointRef = useRef<Point | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw all strokes
    [...strokes, currentStroke].filter(Boolean).forEach((stroke) => {
      if (!stroke || stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const prevPoint = stroke.points[i - 1];

        // Smooth curve using quadratic bezier
        const midX = (prevPoint.x + point.x) / 2;
        const midY = (prevPoint.y + point.y) / 2;

        ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
      }

      ctx.stroke();
    });
  }, [strokes, currentStroke, width, height]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Get position from event
  const getPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
          pressure: (touch as Touch & { force?: number }).force || 0.5,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: 0.5,
      };
    },
    []
  );

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getPosition(e);

      setIsDrawing(true);
      lastPointRef.current = point;

      const strokeColor = tool === "eraser" ? "#ffffff" : color;
      const strokeWidth = tool === "eraser" ? brushSize * 3 : brushSize;

      setCurrentStroke({
        points: [point],
        color: strokeColor,
        width: strokeWidth,
      });
    },
    [getPosition, tool, color, brushSize]
  );

  // Continue drawing
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();

      const point = getPosition(e);

      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, point],
        };
      });

      lastPointRef.current = point;
    },
    [isDrawing, currentStroke, getPosition]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (currentStroke && currentStroke.points.length > 1) {
      // Save to undo stack
      setUndoStack((prev) => [...prev, strokes]);
      setRedoStack([]);

      // Add stroke to strokes array
      setStrokes((prev) => [...prev, currentStroke]);
    }

    setIsDrawing(false);
    setCurrentStroke(null);
    lastPointRef.current = null;
  }, [currentStroke, strokes]);

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousStrokes = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes(previousStrokes);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack, strokes]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextStrokes = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes(nextStrokes);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, strokes]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes([]);
  }, [strokes]);

  // Submit canvas
  const submitCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a clean version without grid
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    // White background
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, width, height);

    // Draw strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      exportCtx.strokeStyle = stroke.color;
      exportCtx.lineWidth = stroke.width;
      exportCtx.lineCap = "round";
      exportCtx.lineJoin = "round";

      exportCtx.beginPath();
      exportCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const prevPoint = stroke.points[i - 1];
        const midX = (prevPoint.x + point.x) / 2;
        const midY = (prevPoint.y + point.y) / 2;
        exportCtx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
      }

      exportCtx.stroke();
    });

    // Convert to blob
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCanvasSubmit(blob);
        }
      },
      "image/png",
      1.0
    );
  }, [strokes, width, height, onCanvasSubmit]);

  // Download canvas
  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "handwriting.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const hasContent = strokes.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
        {/* Tools */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === "pen" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setTool("pen")}
                  className={cn(
                    "h-9 w-9",
                    tool === "pen"
                      ? "bg-violet-500 hover:bg-violet-600"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Pen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pen</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={tool === "eraser" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setTool("eraser")}
                  className={cn(
                    "h-9 w-9",
                    tool === "eraser"
                      ? "bg-slate-600 hover:bg-slate-500"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eraser</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <div
                  className="h-5 w-5 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-slate-800 border-slate-700">
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform hover:scale-110",
                      color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Brush Size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-3 text-slate-400">
                <div
                  className="rounded-full bg-current"
                  style={{ width: brushSize * 2, height: brushSize * 2 }}
                />
                <span className="ml-2 text-xs">{brushSize}px</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 bg-slate-800 border-slate-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Brush Size</span>
                  <span className="text-sm text-white">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  onValueChange={([v]) => setBrushSize(v)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex gap-1">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={cn(
                        "flex-1 h-8 rounded flex items-center justify-center",
                        brushSize === size
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      )}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{ width: size, height: size }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="h-9 w-9 text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="h-9 w-9 text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearCanvas}
                  disabled={!hasContent}
                  className="h-9 w-9 text-slate-400 hover:text-rose-400 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFullscreen(true)}
                  className="h-9 w-9 text-slate-400 hover:text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-slate-700/50 bg-white"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-300">Recognizing handwriting...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasContent && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-50">
              <Pen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Start writing or drawing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCanvas}
                  disabled={!hasContent}
                  className="border-slate-600 hover:bg-slate-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as PNG</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button
          onClick={submitCanvas}
          disabled={!hasContent || isProcessing}
          className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? "Processing..." : "Recognize Text"}
        </Button>
      </div>

      {/* Recognition Result */}
      <AnimatePresence>
        {recognizedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Recognized Text</span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{recognizedText}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Handwriting Canvas</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white rounded-lg overflow-hidden">
              {/* In fullscreen, we would create a larger canvas - simplified for now */}
              <p className="text-center py-8 text-slate-500">
                Fullscreen editing coming soon
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
