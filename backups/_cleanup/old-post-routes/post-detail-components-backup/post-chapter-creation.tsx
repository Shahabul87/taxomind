"use client";

import { PostChapterSection } from "@prisma/client";
import { useEffect, useState } from "react";
import { Grip, Pencil, Trash } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PostChaptersListProps {
  items: PostChapterSection[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PostChaptersListPage = ({
  items,
  onReorder,
  onEdit,
  onDelete
}: PostChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);
  const [draggedItem, setDraggedItem] = useState<PostChapterSection | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  // Helper function to mark an item as dragged
  const markItemAsDragged = (chapter: PostChapterSection) => {
    const dragItem = document.getElementById(`chapter-${chapter.id}`);
    if (dragItem) {
      dragItem.classList.add('opacity-50', 'border-dashed');
    }
  };

  // Helper function to remove dragged styling
  const unmarkDraggedItem = (chapter: PostChapterSection) => {
    const dragItem = document.getElementById(`chapter-${chapter.id}`);
    if (dragItem) {
      dragItem.classList.remove('opacity-50', 'border-dashed');
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
  const handleDragStart = (e: React.DragEvent, chapter: PostChapterSection) => {
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

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-2">
      {chapters.map((chapter) => (
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
            "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
            chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700",
            dragOverItemId === chapter.id && "border-dashed border-2 border-blue-400"
          )}
        >
          <div
            className={cn(
              "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition cursor-move",
              chapter.isPublished && "border-r-sky-200 hover:bg-sky-200"
            )}
          >
            <Grip className="h-5 w-5" />
          </div>
          <div className="flex-1 font-medium py-3">
            {chapter.title}
          </div>
          <div className="ml-auto flex items-center gap-x-2 pr-2">
            <Badge
              className={cn(
                "bg-slate-500",
                chapter.isPublished && "bg-sky-700"
              )}
            >
              {chapter.isPublished ? "Published" : "Draft"}
            </Badge>
            <Pencil
              onClick={() => onEdit(chapter.id)}
              className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
            />
            <Trash
              onClick={() => onDelete(chapter.id)}
              className="w-4 h-4 cursor-pointer hover:opacity-75 transition text-red-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
};