"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Grip, Pencil } from "lucide-react";
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
import { Trash2 } from "lucide-react";

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
  const [chapters, setChapters] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  // Initialize sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    setChapters((chapters) => {
      const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
      const newIndex = chapters.findIndex((chapter) => chapter.id === over.id);
      
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      
      const updateData = newChapters.map((chapter, index) => ({
        id: chapter.id,
        position: index,
      }));
      
      onReorder(updateData);
      
      return newChapters;
    });
  };
  
  if (!isMounted) {
    return null;
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={chapters.map(chapter => chapter.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-y-2">
          {chapters.map((chapter) => (
            <SortableChapterItem 
              key={chapter.id}
              chapter={chapter}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default PostChapterList;

interface SortableChapterItemProps {
  chapter: PostChapter;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SortableChapterItem = ({
  chapter,
  onEdit,
  onDelete
}: SortableChapterItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
        chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="px-2 py-3 hover:bg-slate-300 rounded-l-md transition"
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
        <Pencil
          onClick={() => onEdit(chapter.id)}
          className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-500"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete chapter</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
                Delete Chapter
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this chapter? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-gray-600 dark:text-gray-300">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(chapter.id)}
                className="bg-rose-500 text-white hover:bg-rose-600 dark:hover:bg-rose-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}; 