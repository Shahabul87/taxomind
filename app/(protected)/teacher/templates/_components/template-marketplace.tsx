"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logger } from '@/lib/logger';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Heart, 
  Share2, 
  Award, 
  TrendingUp,
  Clock,
  User,
  Tag,
  ChevronRight,
  Grid3x3,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TemplatePreview } from "./template-preview";
import { TemplateData } from "./template-editor";

interface Template {
  id: string;
  name: string;
  description?: string;
  contentType: string;
  category?: string;
  tags: string[];
  isPublic: boolean;
  isOfficial: boolean;
  usageCount: number;
  author: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
  templateData: any;
}

interface TemplateMarketplaceProps {
  onApplyTemplate?: (template: Template) => void;
  onViewTemplate?: (template: Template) => void;
  className?: string;
}

export function TemplateMarketplace({ 
  onApplyTemplate, 
  onViewTemplate, 
  className 
}: TemplateMarketplaceProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [contentTypes, setContentTypes] = useState<{ name: string; count: number }[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedContentType, setSelectedContentType] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "usageCount" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"browse" | "trending" | "official">("browse");
  
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
        ...(selectedContentType !== "all" && { contentType: selectedContentType }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/templates?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch templates");
      }
    } catch (error: any) {
      toast.error("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, selectedContentType, selectedCategory, searchQuery]);

  const applyFilters = useCallback(() => {
    let filtered = templates;

    // Apply active tab filter
    if (activeTab === "trending") {
      filtered = filtered.filter(t => t.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount);
    } else if (activeTab === "official") {
      filtered = filtered.filter(t => t.isOfficial);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Apply content type filter
    if (selectedContentType !== "all") {
      filtered = filtered.filter(template => template.contentType === selectedContentType);
    }

    // Apply tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(template => 
        selectedTags.some(tag => template.tags.includes(tag))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedContentType, selectedTags, activeTab]);

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [fetchTemplates]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/templates/categories");
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories);
        setContentTypes(data.contentTypes);
        setPopularTags(data.popularTags);
      }
    } catch (error: any) {
      logger.error("Failed to fetch categories");
    }
  };

  const handleApplyTemplate = async (template: Template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    } else {
      toast.success(`Template "${template.name}" applied successfully`);
    }
  };

  const handleViewTemplate = (template: Template) => {
    if (onViewTemplate) {
      onViewTemplate(template);
    } else {
      setPreviewTemplate(template);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{template.name}</CardTitle>
              {template.isOfficial && (
                <Badge variant="default" className="bg-blue-600 text-white">
                  <Award className="h-3 w-3 mr-1" />
                  Official
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span>{template.author.name || template.author.email}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{new Date(template.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Download className="h-3 w-3" />
              <span>{template.usageCount}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{template.contentType}</Badge>
          {template.category && (
            <Badge variant="secondary">{template.category}</Badge>
          )}
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        )}

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewTemplate(template)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => handleApplyTemplate(template)}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTemplateListItem = (template: Template) => (
    <Card key={template.id} className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{template.name}</h3>
              {template.isOfficial && (
                <Badge variant="default" className="bg-blue-600 text-white">
                  <Award className="h-3 w-3 mr-1" />
                  Official
                </Badge>
              )}
              <Badge variant="outline">{template.contentType}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {template.author.name || template.author.email}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {template.usageCount} uses
              </span>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-1">
                {template.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewTemplate(template)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => handleApplyTemplate(template)}
            >
              <Download className="h-4 w-4 mr-2" />
              Use
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Template Marketplace</h1>
          <p className="text-gray-600">Discover and use templates created by the community</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contentTypes.map(type => (
                    <SelectItem key={type.name} value={type.name}>
                      {type.name} ({type.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "createdAt" | "usageCount" | "updatedAt")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest</SelectItem>
                  <SelectItem value="usageCount">Most Used</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="updatedAt">Updated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {popularTags.map(({ tag, count }) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "browse" | "trending" | "official")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="official">
            <Award className="h-4 w-4 mr-2" />
            Official
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Templates Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No templates found matching your criteria</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}>
              {filteredTemplates.map(template => 
                viewMode === "grid" 
                  ? renderTemplateCard(template)
                  : renderTemplateListItem(template)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending">
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}>
            {filteredTemplates.map(template => 
              viewMode === "grid" 
                ? renderTemplateCard(template)
                : renderTemplateListItem(template)
            )}
          </div>
        </TabsContent>

        <TabsContent value="official">
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}>
            {filteredTemplates.map(template => 
              viewMode === "grid" 
                ? renderTemplateCard(template)
                : renderTemplateListItem(template)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
            </DialogHeader>
            <TemplatePreview
              templateData={{
                name: previewTemplate.name,
                description: previewTemplate.description,
                contentType: previewTemplate.contentType,
                category: previewTemplate.category,
                tags: previewTemplate.tags,
                blocks: JSON.parse(previewTemplate.templateData)?.blocks || [],
                metadata: {
                  version: "1.0.0",
                  author: previewTemplate.author.name || previewTemplate.author.email,
                  createdAt: new Date(previewTemplate.createdAt),
                  updatedAt: new Date(previewTemplate.updatedAt)
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}