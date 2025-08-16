"use client";

import { Chapter } from "@prisma/client";
import { useEffect, useState } from "react";
import { Grip, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChaptersListProps {
  items: Chapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
}

export const ChaptersList = ({
  items,
  onReorder,
  onEdit
}: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);
  const [draggedItem, setDraggedItem] = useState<Chapter | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  if (!isMounted) {
    return null;
  }

  // Handle start dragging
  const handleDragStart = (e: React.DragEvent, chapter: Chapter) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem(chapter);
    
    // Add a timeout to allow the draggedItem to be set before adding the dragging class
    setTimeout(() => {
      const element = document.getElementById(`chapter-${chapter.id}`);
      if (element) {
        element.classList.add("ring-2", "ring-slate-400", "shadow-md");
      }
    }, 0);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItem && draggedItem.id !== chapterId) {
      setDragOverItemId(chapterId);
    }
  };

  // Handle leaving drag area
  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  // Handle end of drag operation
  const handleDragEnd = () => {
    if (draggedItem) {
      const element = document.getElementById(`chapter-${draggedItem.id}`);
      if (element) {
        element.classList.remove("ring-2", "ring-slate-400", "shadow-md");
      }
    }
    
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    const oldIndex = chapters.findIndex(c => c.id === draggedItem.id);
    const newIndex = chapters.findIndex(c => c.id === targetId);
    
    if (oldIndex === newIndex) return;
    
    // Create new array with updated positions
    const newChapters = [...chapters];
    
    // Remove the dragged item
    newChapters.splice(oldIndex, 1);
    
    // Insert at the new position
    newChapters.splice(newIndex, 0, draggedItem);
    
    // Update state for immediate UI response
    setChapters(newChapters);
    
    // Create update data with all chapters' positions
    const updateData = newChapters.map((chapter, index) => ({
      id: chapter.id,
      position: index
    }));
    
    // Call the parent component's reorder function
    onReorder(updateData);
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  return (
    <div className="space-y-2 pb-4">
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
            className={cn(
              "flex items-center gap-x-2 mb-4 text-sm bg-slate-200 border-slate-200 border rounded-md text-slate-700",
              chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700",
              isDragOver && !isDragging && "border-slate-400 bg-slate-100"
            )}
          >
            <div
              className={cn(
                "px-2 py-3 border-r rounded-l-md",
                "hover:bg-slate-300 cursor-grab active:cursor-grabbing",
                "transition-colors duration-150 ease-in-out",
                chapter.isPublished && "border-r-sky-200 hover:bg-sky-200"
              )}
            >
              <Grip className="h-5 w-5" />
            </div>
            <div className="flex-1 flex items-center">
              <span>{chapter.title}</span>
              <div className="ml-auto pr-2 flex items-center gap-x-2">
                {chapter.isFree && (
                  <Badge>
                    Free
                  </Badge>
                )}
                <Badge className={cn(
                  "bg-slate-500",
                  chapter.isPublished && "bg-sky-700"
                )}>
                  {chapter.isPublished ? "Published" : "Draft"}
                </Badge>
                <span
                  className="flex items-center justify-between cursor-pointer hover:opacity-75 transition"
                  onClick={() => onEdit(chapter.id)}
                >
                  <Pencil className="w-4 h-4 cursor-pointer hover:opacity-75 transition mr-1" />
                  Edit
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}