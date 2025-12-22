"use client";

import { Chapter } from "@prisma/client";
import { useEffect, useState } from "react";
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
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
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

interface ChaptersListProps {
  items: Chapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableChapterItem({
  chapter,
  onEdit,
  onDelete,
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
    isDragging,
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
        "flex items-center gap-x-2",
        "bg-white dark:bg-slate-900/50",
        "border border-slate-200/80 dark:border-slate-800",
        "text-slate-700 dark:text-slate-200",
        "rounded-lg mb-3",
        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        "transition-colors duration-200",
        chapter.isPublished &&
          "bg-[#87A878]/5 border-[#87A878]/20 dark:bg-[#87A878]/10"
      )}
    >
      <div
        className={cn(
          "px-3 py-3 border-r border-slate-200/80 dark:border-slate-700",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "rounded-l-lg transition-colors",
          "cursor-grab"
        )}
        {...attributes}
        {...listeners}
      >
        <Grip className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>

      <div className="flex-1 px-2 py-2.5 font-[family-name:var(--font-body)] text-sm">
        {chapter.title}
      </div>

      <div className="flex items-center gap-x-2 pr-3">
        <Badge
          variant={chapter.isPublished ? "success" : "secondary"}
          className={cn(
            "text-xs font-[family-name:var(--font-ui)]",
            chapter.isPublished
              ? "bg-[#87A878]/10 text-[#87A878] border-[#87A878]/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}
        >
          {chapter.isPublished ? "Published" : "Draft"}
        </Badge>

        <Button
          onClick={() => onEdit(chapter.id)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-[#C65D3B]/10"
        >
          <Pencil className="h-3.5 w-3.5 text-[#C65D3B]" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-rose-500/10 group"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400 group-hover:text-rose-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-800 dark:text-white font-[family-name:var(--font-display)]">
                Delete Chapter?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
                This action cannot be undone. This will permanently delete the
                chapter and all its content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-[family-name:var(--font-ui)]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(chapter.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-[family-name:var(--font-ui)]"
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
  onDelete,
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

  const activeChapter = activeId
    ? chapters.find((chapter) => chapter.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = chapters.findIndex((item) => item.id === active.id);
    const newIndex = chapters.findIndex((item) => item.id === over.id);

    const newChapters = arrayMove(chapters, oldIndex, newIndex);
    setChapters(newChapters);

    const startIndex = Math.min(oldIndex, newIndex);
    const endIndex = Math.max(oldIndex, newIndex);
    const updatedChapters = newChapters.slice(startIndex, endIndex + 1);

    const bulkUpdateData = updatedChapters.map((chapter) => ({
      id: chapter.id,
      position: newChapters.findIndex((item) => item.id === chapter.id),
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
        items={chapters.map((chapter) => chapter.id)}
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
              "flex items-center gap-x-2",
              "bg-white dark:bg-slate-800",
              "border border-slate-300 dark:border-slate-600",
              "text-slate-700 dark:text-slate-200",
              "rounded-lg shadow-lg",
              activeChapter.isPublished &&
                "bg-[#87A878]/10 border-[#87A878]/30"
            )}
          >
            <div className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 rounded-l-lg">
              <Grip className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-1 px-2 py-2.5 font-[family-name:var(--font-body)] text-sm">
              {activeChapter.title}
            </div>
            <div className="flex items-center gap-x-2 pr-3">
              <Badge
                variant={activeChapter.isPublished ? "success" : "secondary"}
                className={cn(
                  "text-xs font-[family-name:var(--font-ui)]",
                  activeChapter.isPublished
                    ? "bg-[#87A878]/10 text-[#87A878]"
                    : "bg-slate-100 text-slate-500"
                )}
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
