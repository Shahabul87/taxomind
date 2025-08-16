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
import { Grip, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChaptersListProps {
  items: Chapter[];
}

// Sortable item component
const SortableItem = ({ 
  chapter 
}: { 
  chapter: Chapter
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: chapter.id,
    data: {
      chapter
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
        chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700",
        isDragging && "border-blue-400"
      )}
      ref={setNodeRef}
      style={style}
    >
      <div
        className={cn(
          "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition",
          chapter.isPublished && "border-r-sky-200 hover:bg-sky-200"
        )}
        {...attributes}
        {...listeners}
      >
        <Grip className="h-5 w-5" />
      </div>
      {chapter.title}
      <div className="ml-auto pr-2 flex items-center gap-x-2">
        {chapter.isFree && <Badge>Free</Badge>}
        <Badge className={cn("bg-slate-500", chapter.isPublished && "bg-sky-700")}>
          {chapter.isPublished ? "Published" : "Draft"}
        </Badge>
        <span className="flex items-center justify-between cursor-pointer hover:opacity-75 transition">
          <Pencil className="w-4 h-4 cursor-pointer hover:opacity-75 transition mr-1" /> Edit
        </span>
      </div>
    </div>
  );
};

export const ChaptersListCourseHome = ({ items }: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  // Prepare sensors for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ID array for sortable context
  const chapterIds = useMemo(() => chapters.map((chapter) => chapter.id), [chapters]);

  // Find active item for drag overlay
  const activeChapter = useMemo(() => {
    if (!activeId) return null;
    return chapters.find((chapter) => chapter.id === activeId) || null;
  }, [activeId, chapters]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
    const newIndex = chapters.findIndex((chapter) => chapter.id === over.id);

    if (oldIndex === newIndex) return;

    // Create new array with updated order
    const newChapters = arrayMove(chapters, oldIndex, newIndex);
    
    // Update state for immediate UI response
    setChapters(newChapters);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
        <div>
          {chapters.map((chapter) => (
            <SortableItem
              key={chapter.id}
              chapter={chapter}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay - shows a preview of the dragged item */}
      <DragOverlay adjustScale={true}>
        {activeChapter && (
          <div className="opacity-70">
            <SortableItem
              chapter={activeChapter}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
