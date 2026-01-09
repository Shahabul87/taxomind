"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Calendar, User, FileText, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  courseId?: string;
  category?: string;
  senderId?: string;
  hasAttachments?: boolean;
  priority?: string;
  unreadOnly?: boolean;
}

interface SearchResult {
  id: string;
  content: string;
  highlightedContent: string;
  createdAt: string;
  category: string;
  priority: string;
  read: boolean;
  User_Message_senderIdToUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
  Course: {
    id: string;
    title: string;
  } | null;
  MessageAttachment: any[];
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onMessageSelect: (messageId: string) => void;
}

export const SearchDialog = ({ open, onClose, onMessageSelect }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilters({});
      setResults([]);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        query,
        filters: JSON.stringify(filters),
        limit: "20",
      });

      const response = await fetch(`/api/messages/search?${params.toString()}`);
      const data = await response.json();

      setResults(data.messages || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "QUESTION":
        return "bg-gradient-to-r from-blue-500 to-indigo-500";
      case "ASSIGNMENT":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "TECHNICAL_ISSUE":
        return "bg-gradient-to-r from-orange-500 to-red-500";
      case "FEEDBACK":
        return "bg-gradient-to-r from-emerald-500 to-green-500";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 bg-white/95 dark:bg-slate-900/95
                                backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            Advanced Message Search
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search messages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                autoFocus
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-blue-50 dark:bg-blue-950/20" : ""}
            >
              <Filter className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600
                       hover:to-indigo-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 mt-4 p-4 bg-slate-50 dark:bg-slate-800/50
                              rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Category
                    </label>
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, category: value === "all" ? undefined : value })
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="QUESTION">Question</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
                        <SelectItem value="FEEDBACK">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                      Priority
                    </label>
                    <Select
                      value={filters.priority || "all"}
                      onValueChange={(value) =>
                        setFilters({ ...filters, priority: value === "all" ? undefined : value })
                      }
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.hasAttachments || false}
                        onCheckedChange={(checked) =>
                          setFilters({ ...filters, hasAttachments: checked as boolean })
                        }
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Has attachments
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters.unreadOnly || false}
                        onCheckedChange={(checked) =>
                          setFilters({ ...filters, unreadOnly: checked as boolean })
                        }
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Unread only
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          {total > 0 && (
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Found <span className="font-semibold text-slate-900 dark:text-white">{total}</span>{" "}
              {total === 1 ? "message" : "messages"}
            </div>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 px-6 pb-6 max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20
                            dark:to-indigo-950/20 rounded-xl mb-3">
                <Search className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                {query ? "No messages found" : "Start searching"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {query
                  ? "Try different keywords or adjust filters"
                  : "Enter a search term to find messages"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              <AnimatePresence>
                {results.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200
                             dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800
                             hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      onMessageSelect(result.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={result.User_Message_senderIdToUser.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          {result.User_Message_senderIdToUser.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {result.User_Message_senderIdToUser.name || "Unknown"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(result.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>

                        <div
                          className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2"
                          dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                        />

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category, priority and attachments not available in current Message model */}

                          {!result.read && (
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500
                                          rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
