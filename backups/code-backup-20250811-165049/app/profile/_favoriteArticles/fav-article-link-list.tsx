"use client";

import { FavoriteArticle } from "@prisma/client";
import { useEffect, useState, useMemo } from "react";
import { 
  Pencil, 
  Trash, 
  FileText, 
  Calendar, 
  Layout, 
  ArrowUpDown,
  ExternalLink,
  Info
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
import { Badge } from "@/components/ui/badge";

interface FavoriteArticleListProps {
  items: FavoriteArticle[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string, data: {
    title: string;
    platform: string;
    url: string;
    category?: string;
  }) => void;
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
  "DEV Community": { 
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
  "TechCrunch": { 
    dotColor: "bg-emerald-500", 
    textColor: "text-emerald-700 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40", 
    badgeText: "text-emerald-800 dark:text-emerald-300",
  },
  "WIRED": { 
    dotColor: "bg-red-500", 
    textColor: "text-red-700 dark:text-red-400",
    badgeBg: "bg-red-100 dark:bg-red-900/40", 
    badgeText: "text-red-800 dark:text-red-300",
  },
  "The Verge": { 
    dotColor: "bg-purple-500", 
    textColor: "text-purple-700 dark:text-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/40", 
    badgeText: "text-purple-800 dark:text-purple-300",
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

// Article item component
const ArticleItem = ({ 
  article, 
  onEdit, 
  onDelete, 
  confirmDelete
}: { 
  article: FavoriteArticle; 
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
  const { dotColor, textColor, badgeBg, badgeText } = getPlatformColors(article.platform);
  
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
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium flex-grow hover:underline truncate",
                "text-gray-900 dark:text-gray-100"
              )}
            >
              {article.title}
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-4 max-w-sm" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{article.title}</h4>
              <div className="flex flex-wrap gap-2">
                <span 
                  className={cn(
                    "text-xs py-1 px-2 rounded-full font-medium",
                    badgeBg,
                    badgeText
                  )}
                >
                  {article.platform}
                </span>
                {article.category && (
                  <Badge variant="secondary" className="text-xs py-0.5 px-2">
                    {article.category}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {new Date(article.createdAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-blue-500 flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{article.url}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className={cn("text-xs mr-4 font-medium", textColor)}>
        {article.platform}
      </div>
      
      <div className="ml-auto flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onEdit(article.id, {
            title: article.title,
            platform: article.platform,
            url: article.url,
            category: article.category || undefined,
          })}
          className="h-8 w-8 p-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => confirmDelete(article.id)}
          className="h-8 w-8 p-0 text-red-600 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300"
        >
          <Trash className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </motion.div>
  );
};

export const FavoriteArticleList = ({
  items,
  onReorder,
  onEdit,
  onDelete,
}: FavoriteArticleListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [articles, setArticles] = useState<FavoriteArticle[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "title" | "platform">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Get unique platforms for legend
  const uniquePlatforms = useMemo(() => {
    if (!items || items.length === 0) return [];
    return Array.from(new Set(items.map(item => item.platform))).sort();
  }, [items]);

  useEffect(() => {
    setIsMounted(true);
    
    // Default sort by date (newest first)
    const sortedArticles = [...items].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setArticles(sortedArticles);
  }, [items]);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    sortArticles(articles, sortBy, newOrder);
  };

  const changeSort = (newSortBy: "date" | "title" | "platform") => {
    setSortBy(newSortBy);
    // If changing sort field, reset to default order for that field
    const defaultOrder = newSortBy === "date" ? "desc" : "asc";
    setSortOrder(defaultOrder);
    sortArticles(articles, newSortBy, defaultOrder);
  };

  const sortArticles = (
    articlesToSort: FavoriteArticle[], 
    by: "date" | "title" | "platform", 
    order: "asc" | "desc"
  ) => {
    const sorted = [...articlesToSort].sort((a, b) => {
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
    
    setArticles(sorted);
  };

  const confirmDelete = (id: string) => {
    setArticleToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (articleToDelete) {
      onDelete(articleToDelete);
      setShowDeleteModal(false);
      setArticleToDelete(null);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {sortBy === "date" && <Calendar className="h-4 w-4 mr-2" />}
                {sortBy === "title" && <FileText className="h-4 w-4 mr-2" />}
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
                <FileText className="h-4 w-4 mr-2" />
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
      
      <div className="border rounded-md border-gray-200 dark:border-gray-700 overflow-hidden">
        <AnimatePresence>
          {articles.map((article) => (
            <ArticleItem
              key={article.id}
              article={article}
              onEdit={onEdit}
              onDelete={onDelete}
              confirmDelete={confirmDelete}
            />
          ))}
        </AnimatePresence>
        
        {articles.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No articles found. Add some favorite articles to get started.
          </div>
        )}
      </div>

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
              Are you sure you want to delete this favorite article? This action cannot be undone.
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
