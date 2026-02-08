"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
  createdAt: string | Date;
  updatedAt: string | Date;
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

  const handleDragEnd = (event: DragEndEvent) => {
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
        "flex items-center gap-x-2 border rounded-md mb-4 text-sm",
        chapter.isPublished
          ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/30 dark:text-violet-300"
          : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "px-2 py-3 rounded-l-md transition cursor-grab",
          chapter.isPublished
            ? "hover:bg-violet-100 dark:hover:bg-violet-500/20"
            : "hover:bg-slate-200 dark:hover:bg-slate-700"
        )}
        aria-roledescription="sortable"
        aria-label={`Drag to reorder: ${chapter.title}`}
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
            chapter.isPublished
              ? "bg-violet-600 hover:bg-violet-700"
              : "bg-slate-500 hover:bg-slate-600"
          )}
        >
          {chapter.isPublished ? "Published" : "Draft"}
        </Badge>
        <button
          onClick={() => onEdit(chapter.id)}
          aria-label={`Edit chapter: ${chapter.title}`}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          <Pencil className="w-4 h-4 cursor-pointer hover:opacity-75 transition" />
        </button>
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
