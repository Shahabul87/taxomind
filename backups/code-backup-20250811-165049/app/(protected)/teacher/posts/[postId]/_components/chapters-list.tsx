"use client";

import { Chapter } from "@prisma/client";
import { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { motion, AnimatePresence } from "framer-motion";

interface ChaptersListProps {
  items: Chapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableChapterItem({
  chapter,
  onEdit,
  onDelete
}: {
  chapter: Chapter;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-x-2 bg-gray-800/50 border border-gray-700/50 text-gray-200",
        "rounded-lg mb-4 text-sm",
        "hover:bg-gray-800/70 transition-colors duration-200",
        chapter.isPublished && "bg-purple-500/5 border-purple-500/20"
      )}
    >
      <div
        className={cn(
          "px-2 py-3 border-r border-r-gray-700/50 hover:bg-gray-700/50 rounded-l-lg transition-colors",
          "cursor-grab"
        )}
        {...attributes}
        {...listeners}
      >
        <Grip
          className="h-5 w-5 text-gray-500"
        />
      </div>
      <div className="flex-1 px-2">
        {chapter.title}
      </div>
      <div className="flex items-center gap-x-2 pr-2">
        <Badge
          variant={chapter.isPublished ? "success" : "secondary"}
          className="text-xs"
        >
          {chapter.isPublished ? "Published" : "Draft"}
        </Badge>
        <Button
          onClick={() => onEdit(chapter.id)}
          variant="ghost"
          className="h-auto p-1.5 hover:bg-gray-700/50"
        >
          <Pencil className="h-4 w-4 text-purple-400" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto p-1.5 hover:bg-red-500/10 group"
            >
              <Trash2 className="h-4 w-4 text-red-400 group-hover:text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Chapter?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete the chapter
                and all its content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(chapter.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ChaptersList({
  items,
  onReorder,
  onEdit,
  onDelete
}: ChaptersListProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  if (!isMounted) {
    return null;
  }

  const activeChapter = activeId ? chapters.find(chapter => chapter.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = chapters.findIndex(item => item.id === active.id);
    const newIndex = chapters.findIndex(item => item.id === over.id);

    const newChapters = arrayMove(chapters, oldIndex, newIndex);
    setChapters(newChapters);

    const startIndex = Math.min(oldIndex, newIndex);
    const endIndex = Math.max(oldIndex, newIndex);
    const updatedChapters = newChapters.slice(startIndex, endIndex + 1);

    const bulkUpdateData = updatedChapters.map((chapter) => ({
      id: chapter.id,
      position: newChapters.findIndex((item) => item.id === chapter.id)
    }));

    onReorder(bulkUpdateData);
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={chapters.map(chapter => chapter.id)}
        strategy={verticalListSortingStrategy}
      >
        {chapters.map((chapter) => (
          <SortableChapterItem
            key={chapter.id}
            chapter={chapter}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeChapter && (
          <div
            className={cn(
              "flex items-center gap-x-2 bg-gray-800/80 border border-gray-700/50 text-gray-200",
              "rounded-lg mb-4 text-sm shadow-lg",
              activeChapter.isPublished && "bg-purple-500/10 border-purple-500/30"
            )}
          >
            <div
              className="px-2 py-3 border-r border-r-gray-700/50 rounded-l-lg"
            >
              <Grip
                className="h-5 w-5 text-gray-500"
              />
            </div>
            <div className="flex-1 px-2">
              {activeChapter.title}
            </div>
            <div className="flex items-center gap-x-2 pr-2">
              <Badge
                variant={activeChapter.isPublished ? "success" : "secondary"}
                className="text-xs"
              >
                {activeChapter.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
} 