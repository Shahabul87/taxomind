"use client";

import { Section } from "@prisma/client";
import { useEffect, useState, useRef } from "react";
import { Grip, Pencil, Trash2, Loader2 } from "lucide-react";
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
              "bg-white/50 dark:bg-gray-900/40",
              "border border-gray-200 dark:border-gray-700/50",
              "text-gray-900 dark:text-gray-200",
              "rounded-lg mb-4",
              "text-sm sm:text-base",
              "transition-all duration-200 ease-in-out",
              "touch-manipulation",
              isDragOver && !isDragging && "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10",
              section.isPublished && "bg-sky-50/50 dark:bg-sky-900/20 border-sky-200/50 dark:border-sky-800/50"
            )}
          >
            <div
              className={cn(
                "px-2 py-3 border-r",
                "border-r-gray-200 dark:border-r-gray-700/50",
                "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                "rounded-l-lg transition cursor-grab active:cursor-grabbing",
                "flex items-center",
                "touch-manipulation",
                section.isPublished && "border-r-sky-200/50 dark:border-r-sky-800/50"
              )}
            >
              <Grip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 px-2 py-2 truncate">
              {section.title}
            </div>
            <div className="ml-auto pr-2 flex items-center gap-x-2">
              <Badge className={cn(
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-700 dark:text-gray-300",
                "border-gray-200 dark:border-gray-700",
                section.isPublished && "bg-sky-50 dark:bg-sky-900 text-sky-700 dark:text-sky-300 border-sky-200/50 dark:border-sky-800/50"
              )}>
                {section.isPublished ? "Published" : "Draft"}
              </Badge>
              <Button
                onClick={() => onEdit(section.id)}
                variant="ghost"
                size="sm"
                className={cn(
                  "hover:bg-purple-50 dark:hover:bg-purple-500/10",
                  "text-purple-700 dark:text-purple-400",
                  "hover:text-purple-800 dark:hover:text-purple-300"
                )}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
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
                <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl text-gray-900 dark:text-white">
                      Delete Section
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300 text-base">
                      Are you sure you want to delete this section?
                      <br />
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        This action cannot be undone.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={cn(
                      "bg-gray-100 dark:bg-gray-800",
                      "hover:bg-gray-200 dark:hover:bg-gray-700",
                      "border-gray-200 dark:border-gray-700",
                      "text-gray-900 dark:text-white"
                    )}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(section.id)}
                      className={cn(
                        "bg-rose-500 dark:bg-rose-600",
                        "hover:bg-rose-600 dark:hover:bg-rose-700",
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
            </div>
          </div>
        );
      })}
    </div>
  );
};