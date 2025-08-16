"use client";

import { ProfileLink } from "@prisma/client";
import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Grip, Pencil, Trash, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";

interface ProfileLinkListProps {
  items: ProfileLink[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Individual sortable item component
const SortableItem = ({ 
  link, 
  onEdit, 
  onDelete, 
  confirmDelete 
}: { 
  link: ProfileLink; 
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  confirmDelete: (id: string) => void;
}) => {
  const { gradientStart, gradientEnd, iconPath } = getPlatformStyle(link.platform);
  
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-xl overflow-hidden ${isDragging ? 'z-50' : ''}`}
      ref={setNodeRef}
      style={style}
    >
      {/* Glass card */}
      <div className={cn(
        "relative bg-slate-900/40 backdrop-blur-md border border-white/10",
        "shadow-[0_2px_10px_rgba(0,0,0,0.15)]",
        "overflow-hidden rounded-xl transition-all duration-300",
        "hover:bg-slate-900/60 hover:border-white/20",
        "group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        isDragging && "border-purple-500/30 bg-slate-900/70"
      )}>
        {/* Platform-specific gradient accent */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradientStart} ${gradientEnd}`}></div>
        
        <div className="flex items-center">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "p-4 cursor-move transition-colors",
              "text-slate-400 hover:text-white",
              "flex items-center justify-center"
            )}
          >
            <Grip className="h-5 w-5" />
          </div>
          
          {/* Platform Icon and Info */}
          <div className="flex gap-3 items-center flex-grow p-3">
            {/* Platform Icon */}
            <div className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full",
              "flex items-center justify-center",
              `bg-gradient-to-br ${gradientStart} ${gradientEnd}`,
              "shadow-md"
            )}>
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-white"
                fill="currentColor"
              >
                <path d={iconPath} />
              </svg>
            </div>
            
            {/* Platform Info */}
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "font-semibold text-base text-white truncate",
                `bg-clip-text text-transparent bg-gradient-to-r ${gradientStart} ${gradientEnd}`
              )}>
                {link.platform}
              </span>
              
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center mt-1 text-sm text-slate-400 hover:text-white truncate max-w-[200px] sm:max-w-md"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{link.url}</span>
              </a>
            </div>
          </div>
          
          {/* Added Date */}
          <div className="hidden sm:flex items-center pr-2">
            <div className="text-xs text-slate-500 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 px-2 py-1 rounded-full">
              {new Date(link.createdAt).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-3 flex items-center gap-1 sm:gap-2">
            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(link.id)}
              className={cn(
                "relative flex items-center justify-center",
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
                "text-slate-400 hover:text-white",
                "bg-white/5 hover:bg-white/10 backdrop-blur-sm",
                "border border-white/10 hover:border-purple-500/50",
                "transition-all duration-200",
                "overflow-hidden"
              )}
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit</span>
            </motion.button>
            
            {/* Delete Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => confirmDelete(link.id)}
              className={cn(
                "relative flex items-center justify-center",
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
                "text-slate-400 hover:text-red-400",
                "bg-white/5 hover:bg-red-500/10 backdrop-blur-sm",
                "border border-white/10 hover:border-red-500/50",
                "transition-all duration-200",
                "overflow-hidden"
              )}
            >
              <Trash className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Platform-specific styling and icons
const getPlatformStyle = (platform: string) => {
  const platformLower = platform.toLowerCase();
  
  if (platformLower.includes("twitter") || platformLower.includes("x")) {
    return {
      gradientStart: "from-blue-400",
      gradientEnd: "to-blue-600",
      iconPath: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z",
    };
  } else if (platformLower.includes("facebook")) {
    return {
      gradientStart: "from-blue-600",
      gradientEnd: "to-blue-800",
      iconPath: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
    };
  } else if (platformLower.includes("instagram")) {
    return {
      gradientStart: "from-pink-500",
      gradientEnd: "to-yellow-500",
      iconPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    };
  } else if (platformLower.includes("linkedin")) {
    return {
      gradientStart: "from-blue-500",
      gradientEnd: "to-blue-700",
      iconPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    };
  } else if (platformLower.includes("github")) {
    return {
      gradientStart: "from-gray-700",
      gradientEnd: "to-gray-900",
      iconPath: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    };
  } else if (platformLower.includes("youtube")) {
    return {
      gradientStart: "from-red-600",
      gradientEnd: "to-red-700",
      iconPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    };
  } else if (platformLower.includes("tiktok")) {
    return {
      gradientStart: "from-pink-500",
      gradientEnd: "to-gray-900",
      iconPath: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    };
  } else if (platformLower.includes("pinterest")) {
    return {
      gradientStart: "from-red-500",
      gradientEnd: "to-red-700",
      iconPath: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 2.567-1.645 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z",
    };
  } else {
    return {
      gradientStart: "from-purple-600",
      gradientEnd: "to-pink-600",
      iconPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z",
    };
  }
};

export const ProfileLinkList = ({
  items,
  onReorder,
  onEdit,
  onDelete,
}: ProfileLinkListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [profileLinks, setProfileLinks] = useState<ProfileLink[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setProfileLinks(
      [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    );
  }, [items]);

  // Create debounced reorder function to prevent excessive server calls
  const debouncedReorder = useCallback(
    (updateData: { id: string; position: number }[]) => {
      const debouncedFn = debounce(() => {
        onReorder(updateData);
      }, 500);
      debouncedFn();
    },
    [onReorder]
  );

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
  const itemIds = useMemo(() => profileLinks.map((link) => link.id), [profileLinks]);

  // Find active item for drag overlay
  const activeLink = useMemo(() => {
    if (!activeId) return null;
    return profileLinks.find((link) => link.id === activeId) || null;
  }, [activeId, profileLinks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) return;

    // Find the indexes for the source and destination
    const oldIndex = profileLinks.findIndex((link) => link.id === active.id);
    const newIndex = profileLinks.findIndex((link) => link.id === over.id);

    if (oldIndex === newIndex) return;

    // Create the new array with the updated order
    const newLinks = arrayMove(profileLinks, oldIndex, newIndex);
    
    // Update local state immediately for responsiveness
    setProfileLinks(newLinks);

    // Calculate the range of items that actually changed position
    const startIndex = Math.min(oldIndex, newIndex);
    const endIndex = Math.max(oldIndex, newIndex);
    
    // Collect only the links that actually changed position
    const changedLinks = newLinks.slice(startIndex, endIndex + 1);
    
    // Prepare data for the API call - only for links that changed
    const bulkUpdateData = changedLinks.map((link, idx) => ({
      id: link.id,
      position: startIndex + idx,
    }));

    // Send the update to the backend with debouncing
    debouncedReorder(bulkUpdateData);
  };

  const confirmDelete = (id: string) => {
    setLinkToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (linkToDelete) {
      onDelete(linkToDelete);
      setShowDeleteModal(false);
      setLinkToDelete(null);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
            <AnimatePresence>
              {profileLinks.map((link) => (
                <SortableItem
                  key={link.id}
                  link={link}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  confirmDelete={confirmDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        {/* Drag overlay - shows a preview of the dragged item */}
        <DragOverlay adjustScale={true}>
          {activeLink && (
            <div className="opacity-70">
              <SortableItem
                link={activeLink}
                onEdit={onEdit}
                onDelete={onDelete}
                confirmDelete={confirmDelete}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "p-6 rounded-2xl max-w-md w-full mx-4",
              "bg-slate-900 backdrop-blur-xl",
              "border border-slate-800",
              "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)]"
            )}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Confirm Deletion
                </h2>
                <p className="text-slate-400 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-6">
              Are you sure you want to permanently delete this social link?
            </p>
            
            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className={cn(
                  "flex-1 rounded-xl h-12",
                  "bg-transparent border-slate-700",
                  "text-slate-300 hover:text-white",
                  "hover:bg-slate-800 hover:border-slate-600"
                )}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className={cn(
                  "flex-1 rounded-xl h-12",
                  "bg-red-600 hover:bg-red-700 border-0",
                  "text-white font-medium"
                )}
              >
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
