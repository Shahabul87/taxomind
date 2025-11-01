"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Highlighter,
  MessageSquare,
  Trash2,
  Edit,
  Check,
  X,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Annotation {
  id: string;
  text: string;
  note: string;
  color: string;
  range: {
    start: number;
    end: number;
    startContainer: string;
    endContainer: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationSystemProps {
  postId: string;
  userId?: string;
  enabled?: boolean;
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a", dark: "#facc15" },
  { name: "Green", value: "#86efac", dark: "#22c55e" },
  { name: "Blue", value: "#93c5fd", dark: "#3b82f6" },
  { name: "Pink", value: "#fbcfe8", dark: "#ec4899" },
  { name: "Purple", value: "#d8b4fe", dark: "#a855f7" },
];

export function AnnotationSystem({ postId, userId, enabled = true }: AnnotationSystemProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeNote, setActiveNote] = useState("");
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);

  // Load annotations from localStorage
  useEffect(() => {
    if (!enabled || !userId) return;

    const saved = localStorage.getItem(`annotations-${postId}-${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnnotations(
          parsed.map((a: any) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            updatedAt: new Date(a.updatedAt),
          }))
        );
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    }
  }, [postId, userId, enabled]);

  // Save annotations to localStorage
  useEffect(() => {
    if (!enabled || !userId) return;
    localStorage.setItem(`annotations-${postId}-${userId}`, JSON.stringify(annotations));
  }, [annotations, postId, userId, enabled]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowAnnotationMenu(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length === 0) return;

    // Get selection range
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setSelectionRange(range);
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowAnnotationMenu(true);
  }, [enabled]);

  // Add mouse up listener
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Create highlight annotation
  const createHighlight = (color: string, note?: string) => {
    if (!selectionRange || !selectedText) return;

    const annotation: Annotation = {
      id: `annotation-${Date.now()}`,
      text: selectedText,
      note: note || "",
      color,
      range: {
        start: selectionRange.startOffset,
        end: selectionRange.endOffset,
        startContainer: selectionRange.startContainer.textContent || "",
        endContainer: selectionRange.endContainer.textContent || "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAnnotations((prev) => [...prev, annotation]);
    applyHighlight(selectionRange, color, annotation.id);
    setShowAnnotationMenu(false);
    setActiveNote("");
    toast.success("Annotation created");
  };

  // Apply highlight to DOM
  const applyHighlight = (range: Range, color: string, id: string) => {
    const span = document.createElement("span");
    span.className = "annotation-highlight";
    span.setAttribute("data-annotation-id", id);
    span.style.backgroundColor = color;
    span.style.cursor = "pointer";
    span.style.borderRadius = "2px";
    span.style.padding = "2px 0";

    try {
      range.surroundContents(span);
    } catch (error) {
      console.error("Failed to apply highlight:", error);
    }
  };

  // Remove annotation
  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));

    // Remove highlight from DOM
    const elements = document.querySelectorAll(`[data-annotation-id="${id}"]`);
    elements.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    });

    toast.success("Annotation removed");
  };

  // Update annotation note
  const updateAnnotation = (id: string, note: string) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, note, updatedAt: new Date() } : a
      )
    );
    setEditingAnnotation(null);
    toast.success("Note updated");
  };

  // Export annotations
  const exportAnnotations = () => {
    const data = annotations.map((a) => ({
      text: a.text,
      note: a.note,
      date: a.createdAt.toISOString(),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations-${postId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Annotations exported");
  };

  if (!enabled) return null;

  return (
    <>
      {/* Annotation Menu */}
      {showAnnotationMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="space-y-3">
            {/* Color picker */}
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    selectedColor === color.value
                      ? "border-gray-900 dark:border-white scale-110"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            {/* Note input */}
            <Textarea
              placeholder="Add a note (optional)"
              value={activeNote}
              onChange={(e) => setActiveNote(e.target.value)}
              className="w-64 h-20 text-sm"
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => createHighlight(selectedColor, activeNote)}
                className="flex-1"
              >
                <Highlighter className="w-4 h-4 mr-2" />
                Highlight
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAnnotationMenu(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Annotations Sidebar */}
      {annotations.length > 0 && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shadow-lg">
                <StickyNote className="w-5 h-5" />
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {annotations.length}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="left"
              className="w-80 max-h-96 overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">My Annotations</h3>
                  <Button size="sm" variant="ghost" onClick={exportAnnotations}>
                    Export
                  </Button>
                </div>

                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
                  >
                    {/* Highlighted text */}
                    <div
                      className="p-2 rounded text-sm"
                      style={{ backgroundColor: annotation.color }}
                    >
                      &quot;{annotation.text}&quot;
                    </div>

                    {/* Note */}
                    {editingAnnotation === annotation.id ? (
                      <div className="space-y-2">
                        <Textarea
                          defaultValue={annotation.note}
                          className="text-sm"
                          rows={3}
                          id={`note-${annotation.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById(
                                `note-${annotation.id}`
                              ) as HTMLTextAreaElement;
                              updateAnnotation(annotation.id, textarea.value);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingAnnotation(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      annotation.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {annotation.note}
                        </p>
                      )
                    )}

                    {/* Timestamp and actions */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{annotation.createdAt.toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingAnnotation(annotation.id)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAnnotation(annotation.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Global styles for highlights */}
      <style jsx global>{`
        .annotation-highlight {
          transition: all 0.2s;
        }

        .annotation-highlight:hover {
          filter: brightness(0.9);
        }
      `}</style>
    </>
  );
}
