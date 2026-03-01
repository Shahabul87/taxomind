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
        "space-y-2 sm:space-y-3",
        "overflow-x-auto pb-2 sm:pb-4",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
        "scrollbar-track-transparent"
      )}
    >
      <div className="min-w-0 w-full">
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
                "flex items-stretch sm:items-center gap-0 mb-2 sm:mb-3",
                "bg-white/50 dark:bg-gray-900/50 border",
                "border-gray-200 dark:border-gray-700/50 rounded-lg sm:rounded-xl",
                "text-gray-900 dark:text-gray-100",
                "shadow-sm backdrop-blur-sm",
                "transition-all duration-200 ease-in-out",
                "touch-manipulation",
                "min-h-[52px] xs:min-h-[56px] sm:min-h-[60px]",
                chapter.isPublished && "bg-purple-50/50 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-500/30",
                isDragOver && !isDragging && "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10"
              )}
            >
              <div
                className={cn(
                  "px-1.5 xs:px-2 sm:px-3 py-2.5 xs:py-3 sm:py-4 border-r transition-colors flex-shrink-0",
                  "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                  "rounded-l-lg sm:rounded-l-xl cursor-grab active:cursor-grabbing",
                  "border-gray-200 dark:border-gray-700/50",
                  "touch-manipulation flex items-center",
                  "min-w-[36px] xs:min-w-[40px] sm:min-w-[48px]",
                  chapter.isPublished && "border-purple-200/50 dark:border-purple-500/30"
                )}
              >
                <Grip className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 xs:gap-2 sm:gap-0 px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 sm:py-0 min-w-0 overflow-hidden">
                <p className="text-xs sm:text-sm md:text-base font-medium line-clamp-2 sm:line-clamp-1 text-gray-900 dark:text-gray-100 flex-1 min-w-0 break-words leading-tight sm:leading-normal">
                  {chapter.title}
                </p>
                <div className="flex items-center gap-x-2 xs:gap-x-2.5 sm:gap-x-2 md:gap-x-3 flex-wrap sm:flex-nowrap flex-shrink-0">
                  {chapter.isFree ? (
                    <div className="flex items-center justify-center gap-x-0.5 xs:gap-x-1 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                      <Unlock className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium hidden md:inline">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-shrink-0">
                      <Lock className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  {chapter.status === 'generating' ? (
                    <Badge className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium min-w-[50px] xs:min-w-[60px] sm:min-w-[70px] text-center flex-shrink-0 bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/30 animate-pulse">
                      Generating...
                    </Badge>
                  ) : chapter.status === 'failed' ? (
                    <Badge className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium min-w-[50px] xs:min-w-[60px] sm:min-w-[70px] text-center flex-shrink-0 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-500/30">
                      Failed
                    </Badge>
                  ) : (
                    <Badge className={cn(
                      "px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-medium min-w-[50px] xs:min-w-[60px] sm:min-w-[70px] text-center flex-shrink-0",
                      chapter.isPublished
                        ? "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-500/30"
                        : "bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50"
                    )}>
                      {chapter.isPublished ? "Published" : "Draft"}
                    </Badge>
                  )}
                  <button
                    onClick={() => onEdit(chapter.id)}
                    disabled={chapter.status === 'generating'}
                    className={cn(
                      "flex items-center justify-center gap-x-0.5 xs:gap-x-1 px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-1 rounded-md flex-shrink-0",
                      "text-gray-700 dark:text-gray-300",
                      "hover:text-gray-900 dark:hover:text-gray-100",
                      "hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
                      "transition-colors",
                      "h-6 xs:h-7 sm:h-8",
                      chapter.status === 'generating' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Pencil className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium hidden lg:inline">Edit</span>
                  </button>
                  {onDelete && chapter.status !== 'generating' && (
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
          "flex items-center justify-center gap-x-0.5 xs:gap-x-1 px-1 xs:px-1.5 sm:px-2 py-0.5 xs:py-1 rounded-md flex-shrink-0",
          "text-rose-600 dark:text-rose-500",
          "hover:text-rose-700 dark:hover:text-rose-400",
          "hover:bg-rose-50/50 dark:hover:bg-rose-900/20",
          "transition-colors",
          "h-6 xs:h-7 sm:h-8"
        )}
      >
        <Trash2 className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" />
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium hidden lg:inline">Delete</span>
      </button>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-md mx-2 sm:mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-100">Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 break-words">
              Are you sure you want to delete &quot;{chapter.title}&quot;?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse xs:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full xs:w-auto text-xs sm:text-sm md:text-base h-9 sm:h-10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-500/20 w-full xs:w-auto text-xs sm:text-sm md:text-base h-9 sm:h-10"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};