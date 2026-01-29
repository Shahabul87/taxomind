"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Search, Plus, X, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  variables: string[];
  isDefault: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesPopoverProps {
  onSelectTemplate: (content: string) => void;
  currentCategory?: string;
}

export const TemplatesPopover = ({
  onSelectTemplate,
  currentCategory,
}: TemplatesPopoverProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory || "all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Template creation/editing dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    variables: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const filterTemplates = useCallback(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages/templates");
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    let content = template.content;

    // Replace common variables with placeholders
    template.variables.forEach(variable => {
      const placeholder = `[${variable.replace("_", " ").toUpperCase()}]`;
      content = content.replace(`{{${variable}}}`, placeholder);
    });

    onSelectTemplate(content);
    setOpen(false);
  };

  const handleCreateTemplate = async () => {
    try {
      // Extract variables from content ({{variable_name}} format)
      const variableMatches = newTemplate.content.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = variableMatches.map(match =>
        match.replace(/\{\{|\}\}/g, "").trim()
      );

      const response = await fetch("/api/messages/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          variables,
        }),
      });

      if (response.ok) {
        fetchTemplates();
        setDialogOpen(false);
        setNewTemplate({
          title: "",
          content: "",
          category: "GENERAL",
          variables: [],
        });
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/messages/templates?id=${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
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
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-96 p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm
                     border-slate-200 dark:border-slate-700"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Message Templates
                </h3>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="text-xs text-blue-600 dark:text-blue-400"
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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

          {/* Templates List */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No templates found
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <AnimatePresence>
                  {filteredTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                               cursor-pointer group"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate mb-1">
                            {template.title}
                          </h4>
                          <Badge className={`${getCategoryColor(template.category)} text-white text-xs`}>
                            {template.category}
                          </Badge>
                        </div>

                        {!template.isDefault && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(template);
                                setDialogOpen(true);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {template.content}
                      </p>

                      {template.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable) => (
                            <Badge
                              key={variable}
                              variant="outline"
                              className="text-xs border-slate-300 dark:border-slate-600"
                            >
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm
                                  border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Title
              </label>
              <Input
                placeholder="Template title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Category
              </label>
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="QUESTION">Question</SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
                  <SelectItem value="FEEDBACK">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Content
                <span className="text-xs text-slate-500 ml-2">
                  (Use {`{{variable_name}}`} for placeholders)
                </span>
              </label>
              <Textarea
                placeholder="Template content with {{variables}}"
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="min-h-[150px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingTemplate(null);
                setNewTemplate({ title: "", content: "", category: "GENERAL", variables: [] });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplate.title || !newTemplate.content}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600
                       hover:to-indigo-600 text-white"
            >
              {editingTemplate ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
