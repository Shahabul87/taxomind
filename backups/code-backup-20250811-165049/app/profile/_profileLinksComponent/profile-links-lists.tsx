"use client";

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

interface ProfileLinksListPageProps {
  items: {
    id: string;
    platform: string;
    url: string;
    position: number | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  }[];
  onEdit: (id: string) => void;
  onReorder: (updateData: { id: string; position: number }[]) => void;
}

// Sortable item component
const SortableItem = ({ 
  link, 
  onEdit 
}: { 
  link: ProfileLinksListPageProps['items'][0];
  onEdit: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: link.id,
    data: {
      link
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
        "flex items-center gap-x-2 bg-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
        isDragging ? "border-blue-400 bg-slate-100" : "border-slate-200"
      )}
      ref={setNodeRef}
      style={style}
    >
      <div
        className="px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition"
        {...attributes}
        {...listeners}
      >
        <Grip className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{link.platform}</div>
        <div className="text-xs text-gray-500">{link.url}</div>
      </div>
      <span className="flex items-center cursor-pointer hover:opacity-75 transition p-2 mr-2" 
            onClick={() => onEdit(link.id)}>
        <Pencil className="w-4 h-4 mr-1" /> Edit
      </span>
    </div>
  );
};

export const ProfileLinksListPage = ({
  items,
  onReorder,
  onEdit
}: ProfileLinksListPageProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [links, setLinks] = useState(items);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setLinks(items);
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
  const linkIds = useMemo(() => links.map((link) => link.id), [links]);

  // Find active item for drag overlay
  const activeLink = useMemo(() => {
    if (!activeId) return null;
    return links.find((link) => link.id === activeId) || null;
  }, [activeId, links]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((link) => link.id === active.id);
    const newIndex = links.findIndex((link) => link.id === over.id);

    if (oldIndex === newIndex) return;

    // Create new array with updated order
    const newLinks = arrayMove(links, oldIndex, newIndex);
    
    // Update state for immediate UI response
    setLinks(newLinks);

    // Prepare data for the API call - only update changed items
    const startIndex = Math.min(oldIndex, newIndex);
    const endIndex = Math.max(oldIndex, newIndex);
    const updatedLinks = newLinks.slice(startIndex, endIndex + 1);

    const bulkUpdateData = updatedLinks.map((link) => ({
      id: link.id,
      position: newLinks.findIndex((item) => item.id === link.id)
    }));

    // Send the update to the backend
    onReorder(bulkUpdateData);
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
      <SortableContext items={linkIds} strategy={verticalListSortingStrategy}>
        <div>
          {links.map((link) => (
            <SortableItem
              key={link.id}
              link={link}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay - shows a preview of the dragged item */}
      <DragOverlay adjustScale={true}>
        {activeLink && (
          <div className="opacity-70">
            <SortableItem
              link={activeLink}
              onEdit={onEdit}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};