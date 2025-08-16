"use client";

import { useEffect, useState, useRef } from "react";
import { Grip, Pencil, Lock, Unlock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface ChaptersListProps {
  items: {
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    isFree: boolean;
    courseId: string;
    description: string | null;
    courseGoals: string | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
    resources: string | null;
  }[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
};

export const ChaptersList = ({
  items,
  onReorder,
  onEdit,
  onDelete
}: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);
  const [draggedItem, setDraggedItem] = useState<ChaptersListProps["items"][0] | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchedItemId, setTouchedItemId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  if (!isMounted) {
    return null;
  }

  // Helper function to mark an item as dragged
  const markItemAsDragged = (chapter: ChaptersListProps["items"][0]) => {
    const element = document.getElementById(`chapter-${chapter.id}`);
    if (element) {
      element.classList.add("ring-2", "ring-purple-400", "shadow-md");
    }
  };

  // Helper function to unmark a dragged item
  const unmarkDraggedItem = (chapter: ChaptersListProps["items"][0] | null) => {
    if (chapter) {
      const element = document.getElementById(`chapter-${chapter.id}`);
      if (element) {
        element.classList.remove("ring-2", "ring-purple-400", "shadow-md");
      }
    }
  };

  // Reorder chapters helper function
  const reorderChapters = (draggedId: string, targetId: string) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    
    const draggedIndex = chapters.findIndex(c => c.id === draggedId);
    const targetIndex = chapters.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const item = chapters[draggedIndex];
    
    // Create new array with updated positions
    const newChapters = [...chapters];
    
    // Remove the dragged item
    newChapters.splice(draggedIndex, 1);
    
    // Insert at the new position
    newChapters.splice(targetIndex, 0, item);
    
    // Update state for immediate UI response
    setChapters(newChapters);
    
    // Create update data with all chapters' positions
    const updateData = newChapters.map((chapter, index) => ({
      id: chapter.id,
      position: index
    }));
    
    // Call the parent component's reorder function
    onReorder(updateData);
  };

  // Handle start dragging (HTML5 Drag and Drop)
  const handleDragStart = (e: React.DragEvent, chapter: ChaptersListProps["items"][0]) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", chapter.id);
    setDraggedItem(chapter);
    
    // Add a timeout to allow the draggedItem to be set before adding the dragging class
    setTimeout(() => markItemAsDragged(chapter), 0);
  };

  // Handle drag over (HTML5 Drag and Drop)
  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItem && draggedItem.id !== chapterId) {
      setDragOverItemId(chapterId);
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
    
    reorderChapters(draggedItem.id, targetId);
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent, chapter: ChaptersListProps["items"][0]) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchedItemId(chapter.id);
    
    // Start a timer to determine if this is a long press (for drag initiation)
    const longPressTimer = setTimeout(() => {
      setDraggedItem(chapter);
      markItemAsDragged(chapter);
      
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
      if (element.id.startsWith('chapter-')) {
        const chapterId = element.id.replace('chapter-', '');
        if (chapterId !== draggedItem.id) {
          setDragOverItemId(chapterId);
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
      reorderChapters(draggedItem.id, dragOverItemId);
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

  return (
    <div 
      ref={listRef}
      className={cn(
        "space-y-3",
        "overflow-x-auto pb-4",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
        "scrollbar-track-transparent"
      )}
    >
      <div className="min-w-[600px] sm:min-w-full">
        {chapters.map((chapter) => {
          const isDragging = draggedItem?.id === chapter.id;
          const isDragOver = dragOverItemId === chapter.id;
          
          return (
            <div
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, chapter)}
              onDragOver={(e) => handleDragOver(e, chapter.id)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, chapter.id)}
              onTouchStart={(e) => handleTouchStart(e, chapter)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className={cn(
                "flex items-center gap-x-2 mb-3",
                "bg-white/50 dark:bg-gray-900/50 border",
                "border-gray-200 dark:border-gray-700/50 rounded-xl",
                "text-gray-900 dark:text-gray-100",
                "shadow-sm backdrop-blur-sm",
                "transition-all duration-200 ease-in-out",
                "touch-manipulation",
                chapter.isPublished && "bg-purple-50/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-500/30",
                isDragOver && !isDragging && "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10"
              )}
            >
              <div
                className={cn(
                  "px-3 py-4 border-r transition-colors",
                  "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                  "rounded-l-xl cursor-grab active:cursor-grabbing",
                  "border-gray-200 dark:border-gray-700/50",
                  "touch-manipulation",
                  chapter.isPublished && "border-purple-200/50 dark:border-purple-500/30"
                )}
              >
                <Grip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 flex items-center justify-between px-2">
                <p className="text-sm sm:text-base font-medium line-clamp-1 text-gray-900 dark:text-gray-100 min-w-[120px]">
                  {chapter.title}
                </p>
                <div className="flex items-center gap-x-2 sm:gap-x-3">
                  {chapter.isFree ? (
                    <div className="flex items-center justify-center gap-x-1 text-emerald-700 dark:text-emerald-400 min-w-[40px]">
                      <Unlock className="h-4 w-4" />
                      <span className="text-xs font-medium hidden sm:inline">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-w-[40px]">
                      <Lock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <Badge className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium min-w-[70px] text-center",
                    chapter.isPublished 
                      ? "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-500/30"
                      : "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50"
                  )}>
                    {chapter.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <button
                    onClick={() => onEdit(chapter.id)}
                    className={cn(
                      "flex items-center justify-center gap-x-1.5 px-2 py-1 rounded-md min-w-[40px]",
                      "text-gray-700 dark:text-gray-300",
                      "hover:text-gray-900 dark:hover:text-gray-100",
                      "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                      "transition-colors"
                    )}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">Edit</span>
                  </button>
                  {onDelete && (
                    <ChapterDeleteButton 
                      chapter={chapter}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Chapter delete button with confirmation dialog
const ChapterDeleteButton = ({ 
  chapter,
  onDelete
}: { 
  chapter: ChaptersListProps["items"][0];
  onDelete: (id: string) => void;
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(chapter.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className={cn(
          "flex items-center justify-center gap-x-1.5 px-2 py-1 rounded-md min-w-[40px]",
          "text-rose-600 dark:text-rose-500",
          "hover:text-rose-700 dark:hover:text-rose-400",
          "hover:bg-rose-50/50 dark:hover:bg-rose-900/20",
          "transition-colors"
        )}
      >
        <Trash2 className="h-4 w-4" />
        <span className="text-xs sm:text-sm font-medium hidden sm:inline">Delete</span>
      </button>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{chapter.title}&quot;?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-500/20"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};