"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Grip, Pencil, Trash2 } from "lucide-react";
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
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface PostChapter {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  isFree: boolean;
  postId: string;
}

interface PostChapterListProps {
  items: PostChapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PostChapterList = ({
  items,
  onReorder,
  onEdit,
  onDelete
}: PostChapterListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState<PostChapter[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  
  // Store reference to onReorder to avoid issues with stale closure
  const onReorderRef = useRef(onReorder);
  
  // Update ref when onReorder changes
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedItemId(id);
    // Set data to prevent Firefox from requiring data transfer
    e.dataTransfer.setData('text/plain', id);
    // Set element appearance during drag
    e.currentTarget.classList.add('opacity-50');
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (id !== draggedItemId) {
      setDragOverItemId(id);
    }
  }, [draggedItemId]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-100', 'dark:bg-gray-800');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-800');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-800');
    
    if (!draggedItemId || draggedItemId === id) return;

    const oldIndex = chapters.findIndex((chapter) => chapter.id === draggedItemId);
    const newIndex = chapters.findIndex((chapter) => chapter.id === id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Create a new array with the reordered items
    const newChapters = [...chapters];
    const [movedItem] = newChapters.splice(oldIndex, 1);
    newChapters.splice(newIndex, 0, movedItem);
    
    setChapters(newChapters);
    
    // Use setTimeout to ensure state updates complete before calling onReorder
    setTimeout(() => {
      // Prepare update data for the server
      const updateData = newChapters.map((chapter, index) => ({
        id: chapter.id,
        position: index,
      }));
      
      // Use ref to avoid stale closure issues
      onReorderRef.current(updateData);
    }, 0);
    
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [chapters, draggedItemId]);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);
  
  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-2">
      {chapters.map((chapter) => (
        <div
          key={chapter.id}
          draggable
          onDragStart={(e) => handleDragStart(e, chapter.id)}
          onDragOver={(e) => handleDragOver(e, chapter.id)}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, chapter.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm relative transition-all duration-200",
            chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700",
            draggedItemId === chapter.id && "opacity-50",
            dragOverItemId === chapter.id && "border-purple-500 border-2"
          )}
        >
          <div 
            className="px-2 py-3 hover:bg-slate-300 rounded-l-md transition cursor-move flex items-center"
          >
            <Grip className="h-5 w-5" />
          </div>
          <div className="flex-1 font-medium py-3">
            {chapter.title}
          </div>
          <div className="ml-auto pr-2 flex items-center gap-x-2">
            {chapter.isFree && (
              <Badge>
                Free
              </Badge>
            )}
            <Badge
              className={cn(
                "bg-slate-500",
                chapter.isPublished && "bg-sky-700"
              )}
            >
              {chapter.isPublished ? "Published" : "Draft"}
            </Badge>
            
            {/* Enhanced Edit Button with Better Contrast */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-md bg-violet-400/20 group-hover:bg-violet-400/50 dark:bg-violet-500/30 dark:group-hover:bg-violet-500/50 group-hover:blur-sm transition-all duration-300"></div>
              <Button
                onClick={() => onEdit(chapter.id)}
                size="sm"
                className={cn(
                  "relative z-10 h-8 w-8 p-0 rounded-md border transition-all duration-300",
                  "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-900",
                  "text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300",
                  "border-violet-200 hover:border-violet-300 dark:border-violet-700 dark:hover:border-violet-600",
                  "shadow-sm hover:shadow"
                )}
              >
                <Pencil className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                <span className="sr-only">Edit chapter</span>
              </Button>
            </div>
            
            {/* Enhanced Delete Dialog with Better Contrast */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-md bg-rose-400/20 group-hover:bg-rose-400/50 dark:bg-rose-500/30 dark:group-hover:bg-rose-500/50 group-hover:blur-sm transition-all duration-300"></div>
                  <Button 
                    size="sm"
                    className={cn(
                      "relative z-10 h-8 w-8 p-0 rounded-md border transition-all duration-300",
                      "bg-white/80 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-900",
                      "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300",
                      "border-rose-200 hover:border-rose-300 dark:border-rose-700 dark:hover:border-rose-600",
                      "shadow-sm hover:shadow"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="sr-only">Delete chapter</span>
                  </Button>
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 to-rose-50/10 dark:from-rose-900/10 dark:to-rose-900/5 pointer-events-none"></div>
                <div className="relative z-10">
                  <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <AlertDialogTitle className="text-gray-900 dark:text-gray-100 text-lg">
                        Delete Chapter
                      </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete this chapter? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300">
                      Cancel
                    </AlertDialogCancel>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-md bg-gradient-to-r from-rose-500 to-rose-600 opacity-70 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all duration-300"></div>
                      <AlertDialogAction
                        onClick={() => onDelete(chapter.id)}
                        className="relative bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-900 text-rose-600 dark:text-rose-500 border-0 z-10"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostChapterList; 