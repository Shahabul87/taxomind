"use client";

import { FavoriteBlog as PrismaFavoriteBlog } from "@prisma/client";
import { useEffect, useState, useMemo } from "react";
import { 
  Pencil, 
  Trash, 
  Newspaper, 
  Calendar, 
  Layout, 
  ArrowUpDown,
  ExternalLink,
  Info,
  GridIcon,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Extend the Prisma type if needed
interface FavoriteBlog extends PrismaFavoriteBlog {}

interface FavoriteBlogListProps {
  items: FavoriteBlog[];
  userId: string;
  onEdit: (id: string, data: {
    title: string;
    platform: string;
    url: string;
    category?: string;
  }) => void;
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onDelete: (id: string) => void;
}

// Platform-specific color mappings with contrasting text colors
const platformColors = {
  "Medium": { 
    dotColor: "bg-green-500", 
    textColor: "text-green-700 dark:text-green-400",
    badgeBg: "bg-green-100 dark:bg-green-900/40", 
    badgeText: "text-green-800 dark:text-green-300",
  },
  "Substack": { 
    dotColor: "bg-orange-500", 
    textColor: "text-orange-700 dark:text-orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-900/40", 
    badgeText: "text-orange-800 dark:text-orange-300",
  },
  "Dev.to": { 
    dotColor: "bg-indigo-500", 
    textColor: "text-indigo-700 dark:text-indigo-400",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/40", 
    badgeText: "text-indigo-800 dark:text-indigo-300",
  },
  "Hashnode": { 
    dotColor: "bg-blue-500", 
    textColor: "text-blue-700 dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/40", 
    badgeText: "text-blue-800 dark:text-blue-300",
  },
  "WordPress": { 
    dotColor: "bg-purple-500", 
    textColor: "text-purple-700 dark:text-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/40", 
    badgeText: "text-purple-800 dark:text-purple-300",
  },
  "Ghost": { 
    dotColor: "bg-emerald-500", 
    textColor: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40", 
    badgeText: "text-emerald-800 dark:text-emerald-300",
  },
  "default": { 
    dotColor: "bg-gray-500", 
    textColor: "text-gray-700 dark:text-gray-400",
    badgeBg: "bg-gray-100 dark:bg-gray-800/40", 
    badgeText: "text-gray-800 dark:text-gray-300",
  }
};

// Get platform colors or use default if not found
const getPlatformColors = (platform: string) => {
  return platformColors[platform as keyof typeof platformColors] || platformColors.default;
};

// Blog item component for list view
const BlogItem = ({ 
  blog, 
  onEdit, 
  onDelete, 
  confirmDelete
}: { 
  blog: FavoriteBlog; 
  onEdit: (id: string, data: {
    title: string;
    platform: string;
    url: string;
    category?: string;
  }) => void;
  onDelete: (id: string) => void;
  confirmDelete: (id: string) => void;
}) => {
  // Get platform-specific colors
  const { dotColor, textColor, badgeBg, badgeText } = getPlatformColors(blog.platform);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center py-2.5 px-4 border-b",
        "border-gray-200/50 dark:border-gray-700/50",
        "hover:bg-gray-50/50 dark:hover:bg-gray-800/50",
        "transition-colors duration-150 group"
      )}
    >
      <div className={cn(
        "w-3 h-3 rounded-full mr-3", 
        dotColor
      )}></div>
      
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium flex-grow hover:underline truncate",
                "text-gray-900 dark:text-gray-100"
              )}
            >
              {blog.title}
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-4 max-w-sm" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{blog.title}</h4>
              <div className="flex flex-wrap gap-2">
                <span 
                  className={cn(
                    "text-xs py-1 px-2 rounded-full font-medium",
                    badgeBg,
                    badgeText
                  )}
                >
                  {blog.platform}
                </span>
                {blog.category && (
                  <span className="text-xs py-1 px-2 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                    {blog.category}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-blue-500 flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{blog.url}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className={cn("text-xs mr-4 font-medium", textColor)}>
        {blog.platform}
      </div>
      
      <div className="ml-auto flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onEdit(blog.id, {
            title: blog.title,
            platform: blog.platform,
            url: blog.url,
            category: blog.category || undefined,
          })}
          className="h-8 w-8 p-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => confirmDelete(blog.id)}
          className="h-8 w-8 p-0 text-red-600 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300"
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </motion.div>
  );
};

// Blog item component for grid view
const BlogGridItem = ({ 
  blog, 
  onEdit, 
  onDelete, 
  confirmDelete
}: { 
  blog: FavoriteBlog; 
  onEdit: (id: string, data: {
    title: string;
    platform: string;
    url: string;
    category?: string;
  }) => void;
  onDelete: (id: string) => void;
  confirmDelete: (id: string) => void;
}) => {
  // Get platform-specific colors
  const { dotColor, textColor, badgeBg, badgeText } = getPlatformColors(blog.platform);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex flex-col h-full p-4 border rounded-lg",
        "border-gray-200/70 dark:border-gray-700/70",
        "hover:border-gray-300 dark:hover:border-gray-600",
        "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
        "group transition-all duration-200"
      )}
    >
      <div className="flex items-center mb-2">
        <div className={cn(
          "w-3 h-3 rounded-full mr-2", 
          dotColor
        )}></div>
        <span className={cn("text-xs font-medium", textColor)}>
          {blog.platform}
        </span>
      </div>
      
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium mb-2 line-clamp-2 hover:underline",
                "text-gray-900 dark:text-gray-100 text-sm"
              )}
            >
              {blog.title}
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-4 max-w-sm" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{blog.title}</h4>
              <div className="flex flex-wrap gap-2">
                <span 
                  className={cn(
                    "text-xs py-1 px-2 rounded-full font-medium",
                    badgeBg,
                    badgeText
                  )}
                >
                  {blog.platform}
                </span>
                {blog.category && (
                  <span className="text-xs py-1 px-2 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                    {blog.category}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-blue-500 flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{blog.url}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex-grow"></div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onEdit(blog.id, {
            title: blog.title,
            platform: blog.platform,
            url: blog.url,
            category: blog.category || undefined,
          })}
          className="h-7 w-7 p-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => confirmDelete(blog.id)}
          className="h-7 w-7 p-0 text-red-600 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300"
        >
          <Trash className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </motion.div>
  );
};

export const FavoriteBlogList = ({
  items,
  userId,
  onEdit,
  onReorder,
  onDelete
}: FavoriteBlogListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [blogs, setBlogs] = useState<FavoriteBlog[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "title" | "platform">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Get unique platforms for legend
  const uniquePlatforms = useMemo(() => {
    if (!items || items.length === 0) return [];
    return Array.from(new Set(items.map(item => item.platform))).sort();
  }, [items]);

  useEffect(() => {
    setIsMounted(true);
    
    // Default sort by date (newest first)
    const sortedBlogs = [...items].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setBlogs(sortedBlogs);
  }, [items]);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    sortBlogs(blogs, sortBy, newOrder);
  };

  const changeSort = (newSortBy: "date" | "title" | "platform") => {
    setSortBy(newSortBy);
    // If changing sort field, reset to default order for that field
    const defaultOrder = newSortBy === "date" ? "desc" : "asc";
    setSortOrder(defaultOrder);
    sortBlogs(blogs, newSortBy, defaultOrder);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "grid" : "list");
  };

  const sortBlogs = (
    blogsToSort: FavoriteBlog[], 
    by: "date" | "title" | "platform", 
    order: "asc" | "desc"
  ) => {
    const sorted = [...blogsToSort].sort((a, b) => {
      if (by === "date") {
        return order === "asc" 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (by === "title") {
        return order === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (by === "platform") {
        return order === "asc"
          ? a.platform.localeCompare(b.platform)
          : b.platform.localeCompare(a.platform);
      }
      return 0;
    });
    
    setBlogs(sorted);
  };

  const confirmDelete = (id: string) => {
    setBlogToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (blogToDelete) {
      onDelete(blogToDelete);
      setShowDeleteModal(false);
      setBlogToDelete(null);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <Info className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Hover over titles to see details or click to open
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleViewMode}
            className="h-8 px-2"
          >
            {viewMode === "list" ? (
              <>
                <GridIcon className="h-4 w-4 mr-1.5" />
                <span>Grid</span>
              </>
            ) : (
              <>
                <List className="h-4 w-4 mr-1.5" />
                <span>List</span>
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {sortBy === "date" && <Calendar className="h-4 w-4 mr-2" />}
                {sortBy === "title" && <Newspaper className="h-4 w-4 mr-2" />}
                {sortBy === "platform" && <Layout className="h-4 w-4 mr-2" />}
                {sortBy === "date" && "Date"}
                {sortBy === "title" && "Title"}
                {sortBy === "platform" && "Platform"}
                <ArrowUpDown className={cn(
                  "h-4 w-4 ml-2 transition-transform",
                  sortOrder === "desc" && "rotate-180"
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeSort("date")}>
                <Calendar className="h-4 w-4 mr-2" />
                Date Added
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeSort("title")}>
                <Newspaper className="h-4 w-4 mr-2" />
                Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeSort("platform")}>
                <Layout className="h-4 w-4 mr-2" />
                Platform
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSortOrder}
            className="h-8 w-8 p-0"
          >
            <ArrowUpDown className={cn(
              "h-4 w-4 transition-transform",
              sortOrder === "desc" && "rotate-180"
            )} />
          </Button>
        </div>
      </div>
      
      {uniquePlatforms.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
          <div className="w-full text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Platforms:
          </div>
          {uniquePlatforms.map(platform => {
            const { dotColor, textColor } = getPlatformColors(platform);
            return (
              <div key={platform} className="flex items-center gap-1.5 text-xs">
                <div className={cn("w-2.5 h-2.5 rounded-full", dotColor)}></div>
                <span className={cn(textColor, "font-medium")}>{platform}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {viewMode === "list" ? (
        <div className="border rounded-md border-gray-200 dark:border-gray-700 overflow-hidden">
          <AnimatePresence>
            {blogs.map((blog) => (
              <BlogItem
                key={blog.id}
                blog={blog}
                onEdit={onEdit}
                onDelete={onDelete}
                confirmDelete={confirmDelete}
              />
            ))}
          </AnimatePresence>
          
          {blogs.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No blogs found. Add some favorite blogs to get started.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {blogs.map((blog) => (
              <BlogGridItem
                key={blog.id}
                blog={blog}
                onEdit={onEdit}
                onDelete={onDelete}
                confirmDelete={confirmDelete}
              />
            ))}
          </AnimatePresence>
          
          {blogs.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 border rounded-md border-gray-200 dark:border-gray-700">
              No blogs found. Add some favorite blogs to get started.
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              "p-6 rounded-xl max-w-md w-full mx-4",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "shadow-xl"
            )}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this favorite blog? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 dark:bg-rose-500 hover:bg-red-700 dark:hover:bg-rose-600 text-white"
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
