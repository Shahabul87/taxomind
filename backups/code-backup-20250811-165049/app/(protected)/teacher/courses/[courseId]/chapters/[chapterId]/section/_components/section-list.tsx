"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Grip, Pencil, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionListProps {
  items: {
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    isFree: boolean;
    chapterId: string;
    videoUrl: string | null;
    duration: number | null;
    type: string | null;
    isPreview: boolean | null;
    completionStatus: string | null;
    resourceUrls: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
}

interface SortableItemProps {
  section: SectionListProps['items'][0];
  onEdit: (id: string) => void;
}

function SortableItem({ section, onEdit }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

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
        section.isPublished && "bg-sky-100 border-sky-200 text-sky-700",
        isDragging && "opacity-50"
      )}
    >
      <div
        className="px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition cursor-grab"
        {...attributes}
        {...listeners}
      >
        <Grip className="h-5 w-5" />
      </div>
      <div className="flex-1 flex items-center justify-between px-2">
        <p>{section.title}</p>
        <div className="flex items-center gap-x-2">
          {section.isFree && (
            <Badge>
              Free
            </Badge>
          )}
          <Badge
            className={cn(
              "bg-slate-500",
              section.isPublished && "bg-sky-700"
            )}
          >
            {section.isPublished ? "Published" : "Draft"}
          </Badge>
          <button
            onClick={() => onEdit(section.id)}
            className="hover:opacity-75 transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const SectionList = ({
  items,
  onReorder,
  onEdit
}: SectionListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [sections, setSections] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSections(items);
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over?.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);

      const bulkUpdateData = newSections.map((section, index) => ({
        id: section.id,
        position: index
      }));

      onReorder(bulkUpdateData);
    }
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
      <SortableContext items={sections} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableItem
            key={section.id}
            section={section}
            onEdit={onEdit}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}