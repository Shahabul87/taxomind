"use client";

import { Section } from "@prisma/client";
import { useEffect, useState, useRef } from "react";
import { Grip, Pencil, Trash2, Loader2, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChapterSectionListProps {
  items: Section[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChapterSectionList = ({
  items,
  onReorder,
  onEdit,
  onDelete,
}: ChapterSectionListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [sections, setSections] = useState(items);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Section | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchedItemId, setTouchedItemId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSections(items);
  }, [items]);

  if (!isMounted) {
    return null;
  }

  // Helper function to mark an item as dragged
  const markItemAsDragged = (section: Section) => {
    const element = document.getElementById(`section-${section.id}`);
    if (element) {
      element.classList.add("ring-2", "ring-purple-400", "shadow-md");
    }
  };

  // Helper function to unmark a dragged item
  const unmarkDraggedItem = (section: Section | null) => {
    if (section) {
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        element.classList.remove("ring-2", "ring-purple-400", "shadow-md");
      }
    }
  };

  // Reorder sections helper function
  const reorderSections = (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    
    const draggedIndex = sections.findIndex(s => s.id === draggedId);
    const targetIndex = sections.findIndex(s => s.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const item = sections[draggedIndex];
    
    // Create new array with updated positions
    const newSections = [...sections];
    
    // Remove the dragged item
    newSections.splice(draggedIndex, 1);
    
    // Insert at the new position
    newSections.splice(targetIndex, 0, item);
    
    // Update state for immediate UI response
    setSections(newSections);
    
    // Create update data with all sections' positions
    const updateData = newSections.map((section, index) => ({
      id: section.id,
      position: index
    }));
    
    // Call the parent component's reorder function
    onReorder(updateData);
  };

  // Handle start dragging (HTML5 Drag and Drop)
  const handleDragStart = (e: React.DragEvent, section: Section) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", section.id);
    setDraggedItem(section);
    
    // Add a timeout to allow the draggedItem to be set before adding the dragging class
    setTimeout(() => markItemAsDragged(section), 0);
  };

  // Handle drag over (HTML5 Drag and Drop)
  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItem && draggedItem.id !== sectionId) {
      setDragOverItemId(sectionId);
    }
  };

  // Handle leaving drag area (HTML5 Drag and Drop)
  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  // Handle end of drag operation (HTML5 Drag and Drop)
  const handleDragEnd = () => {
    if (draggedItem) {
      unmarkDraggedItem(draggedItem);
    }
    
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  // Handle drop (HTML5 Drag and Drop)
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    reorderSections(draggedItem.id, targetId);
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent, section: Section) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchedItemId(section.id);
    
    // Start a timer to determine if this is a long press (for drag initiation)
    const longPressTimer = setTimeout(() => {
      setDraggedItem(section);
      markItemAsDragged(section);
      
      // Provide haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 300);
    
    // Store the timer in a data attribute to clear it if needed
    const element = e.currentTarget as HTMLElement;
    element.dataset.longPressTimer = String(longPressTimer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedItem || !touchStartY) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    // Find the element under the touch point
    const elementsAtPoint = document.elementsFromPoint(touch.clientX, currentY);
    
    for (const element of elementsAtPoint) {
      if (element.id.startsWith('section-')) {
        const sectionId = element.id.replace('section-', '');
        if (sectionId !== draggedItem.id) {
          setDragOverItemId(sectionId);
          break;
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear any long press timer
    const element = e.currentTarget as HTMLElement;
    const timer = element.dataset.longPressTimer;
    if (timer) {
      clearTimeout(Number(timer));
      delete element.dataset.longPressTimer;
    }
    
    if (draggedItem && dragOverItemId) {
      reorderSections(draggedItem.id, dragOverItemId);
    }
    
    // Clean up
    unmarkDraggedItem(draggedItem);
    setDraggedItem(null);
    setDragOverItemId(null);
    setTouchStartY(null);
    setTouchedItemId(null);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    // Clear any long press timer
    const element = e.currentTarget as HTMLElement;
    const timer = element.dataset.longPressTimer;
    if (timer) {
      clearTimeout(Number(timer));
      delete element.dataset.longPressTimer;
    }
    
    // Clean up
    unmarkDraggedItem(draggedItem);
    setDraggedItem(null);
    setDragOverItemId(null);
    setTouchStartY(null);
    setTouchedItemId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div ref={listRef} className="space-y-3">
      {sections.map((section) => {
        const isDragging = draggedItem?.id === section.id;
        const isDragOver = dragOverItemId === section.id;
        
        return (
          <div
            key={section.id}
            id={`section-${section.id}`}
            draggable
            onDragStart={(e) => handleDragStart(e, section)}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, section.id)}
            onTouchStart={(e) => handleTouchStart(e, section)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className={cn(
              "flex items-center gap-x-2",
              "bg-white dark:bg-slate-900",
              "border border-slate-200 dark:border-slate-700",
              "text-slate-900 dark:text-slate-100",
              "rounded-lg mb-3",
              "text-sm sm:text-base",
              "transition-all duration-200 ease-in-out",
              "touch-manipulation",
              isDragOver && !isDragging && "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10",
              section.isPublished && "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50"
            )}
          >
            <div
              className={cn(
                "px-2 py-3 border-r",
                "border-r-slate-200 dark:border-r-slate-700",
                "hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
                "rounded-l-lg transition cursor-grab active:cursor-grabbing",
                "flex items-center",
                "touch-manipulation",
                section.isPublished && "border-r-emerald-200/50 dark:border-r-emerald-800/50"
              )}
            >
              <Grip className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 px-2 py-2 truncate">
              {section.title}
            </div>
            <div className="ml-auto pr-2 flex items-center gap-x-2">
              {/* isFree Badge */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md",
                      section.isFree
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "bg-purple-50 dark:bg-purple-900/30"
                    )}>
                      {section.isFree ? (
                        <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        section.isFree
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-purple-700 dark:text-purple-300"
                      )}>
                        {section.isFree ? "Free" : "Premium"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{section.isFree ? "Free preview section" : "Premium section - requires enrollment"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Published Status Badge */}
              <Badge className={cn(
                "bg-slate-100 dark:bg-slate-800",
                "text-slate-700 dark:text-slate-300",
                "border-slate-200 dark:border-slate-700",
                section.isPublished && "bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50"
              )}>
                {section.isPublished ? "Published" : "Draft"}
              </Badge>

              {/* Edit Button with Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => onEdit(section.id)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        "text-slate-700 dark:text-slate-400",
                        "hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit section</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Delete Button with Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <AlertDialog>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "hover:bg-rose-50 dark:hover:bg-rose-500/10",
                            "text-rose-700 dark:text-rose-400",
                            "hover:text-rose-800 dark:hover:text-rose-300"
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete section</p>
                    </TooltipContent>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl text-slate-900 dark:text-white">
                      Delete Section
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600 dark:text-slate-300 text-base">
                      Are you sure you want to delete this section?
                      <br />
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={cn(
                      "bg-slate-100 dark:bg-slate-800",
                      "hover:bg-slate-200 dark:hover:bg-slate-700",
                      "border-slate-200 dark:border-slate-700",
                      "text-slate-900 dark:text-white"
                    )}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(section.id)}
                      className={cn(
                        "bg-rose-600 dark:bg-rose-600",
                        "hover:bg-rose-700 dark:hover:bg-rose-700",
                        "text-white border-0"
                      )}
                    >
                      {deletingId === section.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                  </AlertDialog>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      })}
    </div>
  );
};