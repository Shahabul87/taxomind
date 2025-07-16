"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Award, 
  Ban, 
  Download, 
  Upload, 
  Share2,
  TrendingUp,
  Clock,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  FileText,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TemplatePreview } from "./template-preview";

interface AdminTemplate {
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

interface TemplateAnalytics {
  overview: {
    totalTemplates: number;
    totalUsage: number;
    averageUsage: number;
    period: string;
  };
  templates: AdminTemplate[];
  usageByType: Array<{
    contentType: string;
    templateCount: number;
    totalUsage: number;
  }>;
  usageByCategory: Array<{
    category: string;
    templateCount: number;
    totalUsage: number;
  }>;
  topAuthors: Array<{
    authorId: string;
    _sum: { usageCount: number };
    _count: { id: number };
    author: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }>;
  recentActivity: AdminTemplate[];
}

interface AdminTemplateManagerProps {
  className?: string;
}

export function AdminTemplateManager({ className }: AdminTemplateManagerProps) {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContentType, setSelectedContentType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "usageCount" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"templates" | "analytics" | "authors">("templates");
  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplate | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
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
    } catch (error) {
      toast.error("Failed to fetch templates");
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, selectedContentType, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchTemplates();
    fetchAnalytics();
  }, [fetchTemplates]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/templates/analytics");
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      } else {
        console.error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Failed to fetch analytics");
    }
  };

  const handleMakeOfficial = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOfficial: true })
      });

      if (response.ok) {
        toast.success("Template marked as official");
        fetchTemplates();
      } else {
        toast.error("Failed to mark template as official");
      }
    } catch (error) {
      toast.error("Failed to mark template as official");
    }
  };

  const handleTogglePublic = async (templateId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic })
      });

      if (response.ok) {
        toast.success(`Template ${!isPublic ? "made public" : "made private"}`);
        fetchTemplates();
      } else {
        toast.error("Failed to update template visibility");
      }
    } catch (error) {
      toast.error("Failed to update template visibility");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        toast.error("Failed to delete template");
      }
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleBulkExport = async () => {
    try {
      const templateIds = selectedTemplates.join(",");
      const response = await fetch(`/api/templates/export?templateIds=${templateIds}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Templates exported successfully");
      } else {
        toast.error("Failed to export templates");
      }
    } catch (error) {
      toast.error("Failed to export templates");
    }
  };

  const handleImportTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: data.templates || data })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Import completed: ${result.results.created} created, ${result.results.updated} updated, ${result.results.skipped} skipped`);
        fetchTemplates();
      } else {
        toast.error(result.error || "Failed to import templates");
      }
    } catch (error) {
      toast.error("Failed to import templates");
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Template Administration</h1>
            <p className="text-gray-600">Manage templates, authors, and analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportTemplates}
            className="hidden"
            id="import-templates"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("import-templates")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkExport}
            disabled={selectedTemplates.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export ({selectedTemplates.length})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "templates" | "analytics" | "authors")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
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
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="chapter">Chapter</SelectItem>
                      <SelectItem value="section">Section</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "createdAt" | "updatedAt" | "usageCount")}>
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
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No templates found
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedTemplates.includes(template.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTemplates([...selectedTemplates, template.id]);
                            } else {
                              setSelectedTemplates(selectedTemplates.filter(id => id !== template.id));
                            }
                          }}
                          className="rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{template.name}</h3>
                            {template.isOfficial && (
                              <Badge variant="default" className="bg-blue-600 text-white">
                                <Award className="h-3 w-3 mr-1" />
                                Official
                              </Badge>
                            )}
                            {template.isPublic && (
                              <Badge variant="outline">Public</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {template.author.name || template.author.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {template.contentType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {template.usageCount} uses
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(template.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {!template.isOfficial && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMakeOfficial(template.id)}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublic(template.id, template.isPublic)}
                        >
                          {template.isPublic ? <Ban className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &ldquo;{template.name}&rdquo;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Templates</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalTemplates}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Usage</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalUsage}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Usage</p>
                        <p className="text-2xl font-bold">{analytics.overview.averageUsage.toFixed(1)}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Authors</p>
                        <p className="text-2xl font-bold">{analytics.topAuthors.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Usage by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage by Content Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.usageByType.map(type => (
                      <div key={type.contentType} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{type.contentType}</p>
                          <p className="text-sm text-gray-600">{type.templateCount} templates</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{type.totalUsage}</p>
                          <p className="text-sm text-gray-600">uses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentActivity.map(template => (
                      <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-gray-600">
                            by {template.author.name || template.author.email} • {new Date(template.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{template.contentType}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="authors" className="space-y-4">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Top Authors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topAuthors.map(author => (
                    <div key={author.authorId} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{author.author?.name || author.author?.email}</p>
                          <p className="text-sm text-gray-600">{author._count.id} templates</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{author._sum.usageCount}</p>
                        <p className="text-sm text-gray-600">total uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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