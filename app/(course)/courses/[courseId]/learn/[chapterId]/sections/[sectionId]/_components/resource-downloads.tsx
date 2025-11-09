"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  Eye,
  Share2,
  MoreVertical,
  Search,
  Filter,
  FolderDown,
  Check,
  X,
  Loader2,
  ExternalLink,
  Copy,
  Info,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { useAnalytics, ANALYTICS_EVENTS } from "./learning-analytics-tracker";

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "pdf" | "doc" | "image" | "video" | "audio" | "code" | "spreadsheet" | "archive" | "other";
  url: string;
  size?: number; // in bytes
  downloadCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  isRequired?: boolean;
  category?: string;
}

interface ResourceDownloadsProps {
  resources: Resource[];
  sectionId: string;
  courseId: string;
  chapterId: string;
  onDownload?: (resource: Resource) => void;
}

// File type icon mapping
const getFileIcon = (type: string) => {
  const icons: Record<string, any> = {
    pdf: FileText,
    doc: FileText,
    image: FileImage,
    video: FileVideo,
    audio: FileAudio,
    code: FileCode,
    spreadsheet: FileSpreadsheet,
    archive: FileArchive,
    other: File,
  };
  return icons[type] || File;
};

// File type colors
const getFileTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    pdf: "text-red-500",
    doc: "text-blue-500",
    image: "text-green-500",
    video: "text-purple-500",
    audio: "text-orange-500",
    code: "text-yellow-500",
    spreadsheet: "text-emerald-500",
    archive: "text-indigo-500",
    other: "text-gray-500",
  };
  return colors[type] || "text-gray-500";
};

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export function ResourceDownloads({
  resources = [],
  sectionId,
  courseId,
  chapterId,
  onDownload,
}: ResourceDownloadsProps) {
  const { mode, canAccessContent, isEnrolled } = useLearningMode();
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize analytics
  const analytics = useAnalytics({
    courseId,
    chapterId,
    sectionId,
    contentType: "resources",
  });

  // Get unique categories and types
  const categories = ["all", ...Array.from(new Set(resources.map(r => r.category).filter(Boolean)))];
  const types = ["all", ...Array.from(new Set(resources.map(r => r.type)))];

  // Filter resources based on search and filters
  const filteredResources = resources.filter(resource => {
    const matchesSearch = !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesType = selectedType === "all" || resource.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    const category = resource.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  // Handle single resource download
  const handleDownloadResource = async (resource: Resource) => {
    if (!canAccessContent) {
      toast.error("Please enroll in the course to download resources");
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [resource.id]: 0 }));
    setIsDownloading(true);

    try {
      // Track download event
      analytics.trackContentInteraction(ANALYTICS_EVENTS.CONTENT_DOWNLOADED, {
        resourceId: resource.id,
        resourceType: resource.type,
        resourceTitle: resource.title,
      });

      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(prev => ({ ...prev, [resource.id]: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create download link
      const link = document.createElement("a");
      link.href = resource.url;
      link.download = resource.title;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded: ${resource.title}`);
      onDownload?.(resource);

      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const updated = { ...prev };
          delete updated[resource.id];
          return updated;
        });
      }, 2000);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download resource");
      setDownloadProgress(prev => {
        const updated = { ...prev };
        delete updated[resource.id];
        return updated;
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle batch download
  const handleBatchDownload = async () => {
    if (!canAccessContent) {
      toast.error("Please enroll in the course to download resources");
      return;
    }

    if (selectedResources.size === 0) {
      toast.error("Please select resources to download");
      return;
    }

    const resourcesToDownload = resources.filter(r => selectedResources.has(r.id));

    toast.info(`Downloading ${resourcesToDownload.length} resources...`);

    for (const resource of resourcesToDownload) {
      await handleDownloadResource(resource);
      // Add delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Clear selection after batch download
    setSelectedResources(new Set());
    toast.success(`Downloaded ${resourcesToDownload.length} resources`);
  };

  // Handle resource preview
  const handlePreview = (resource: Resource) => {
    if (!canAccessContent && !mode.includes("preview")) {
      toast.error("Please enroll in the course to preview resources");
      return;
    }

    // Track preview event
    analytics.trackContentInteraction(ANALYTICS_EVENTS.CONTENT_VIEWED, {
      resourceId: resource.id,
      resourceType: resource.type,
      action: "preview",
    });

    setPreviewResource(resource);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedResources.size === filteredResources.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(filteredResources.map(r => r.id)));
    }
  };

  // Handle individual resource selection
  const handleResourceSelect = (resourceId: string) => {
    const newSelection = new Set(selectedResources);
    if (newSelection.has(resourceId)) {
      newSelection.delete(resourceId);
    } else {
      newSelection.add(resourceId);
    }
    setSelectedResources(newSelection);
  };

  // Copy link to clipboard
  const handleCopyLink = async (resource: Resource) => {
    try {
      await navigator.clipboard.writeText(resource.url);
      toast.success("Link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Calculate total size of selected resources
  const totalSelectedSize = resources
    .filter(r => selectedResources.has(r.id))
    .reduce((total, r) => total + (r.size || 0), 0);

  if (resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Resources</CardTitle>
          <CardDescription>No resources available for this section</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderDown className="h-5 w-5" />
                Learning Resources
              </CardTitle>
              <CardDescription className="mt-1">
                Download course materials and supplementary resources
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {resources.length} {resources.length === 1 ? "Resource" : "Resources"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category || "all")}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mr-2",
                          selectedCategory === category ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {(category || "all").charAt(0).toUpperCase() + (category || "all").slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <File className="h-4 w-4 mr-2" />
                    Type
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {types.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setSelectedType(type)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mr-2",
                          selectedType === type ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Batch Actions */}
          {filteredResources.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedResources.size === filteredResources.length && filteredResources.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedResources.size > 0
                    ? `${selectedResources.size} selected (${formatFileSize(totalSelectedSize)})`
                    : "Select all"}
                </span>
              </div>
              {selectedResources.size > 0 && (
                <Button
                  size="sm"
                  onClick={handleBatchDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Download Selected
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Resources List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {Object.entries(groupedResources).map(([category, categoryResources]) => (
                <div key={category} className="space-y-2">
                  {Object.keys(groupedResources).length > 1 && (
                    <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-1">
                      {category}
                    </h3>
                  )}
                  <div className="space-y-2">
                    {categoryResources.map((resource) => {
                      const Icon = getFileIcon(resource.type);
                      const progress = downloadProgress[resource.id];
                      const isDownloading = progress !== undefined;

                      return (
                        <div
                          key={resource.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            selectedResources.has(resource.id) && "bg-muted/50"
                          )}
                        >
                          <Checkbox
                            checked={selectedResources.has(resource.id)}
                            onCheckedChange={() => handleResourceSelect(resource.id)}
                          />

                          <Icon className={cn("h-8 w-8", getFileTypeColor(resource.type))} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium truncate">{resource.title}</h4>
                                {resource.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {resource.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(resource.size)}
                                  </span>
                                  {resource.downloadCount && (
                                    <span className="text-xs text-muted-foreground">
                                      {resource.downloadCount} downloads
                                    </span>
                                  )}
                                  {resource.isRequired && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                  {resource.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePreview(resource)}
                                  title="Preview"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadResource(resource)}
                                  disabled={isDownloading}
                                  title="Download"
                                >
                                  {isDownloading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handlePreview(resource)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadResource(resource)}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopyLink(resource)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(resource.url, "_blank")}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open in New Tab
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {isDownloading && (
                              <Progress value={progress} className="mt-2 h-1" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredResources.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No resources found</p>
                  {searchQuery && (
                    <p className="text-sm mt-1">
                      Try adjusting your search or filters
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Resource Preview</DialogTitle>
            <DialogDescription>
              {previewResource?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto">
            {previewResource?.type === "pdf" && (
              <iframe
                src={previewResource.url}
                className="w-full h-[60vh]"
                title={previewResource.title}
              />
            )}

            {previewResource?.type === "image" && (
              <img
                src={previewResource.url}
                alt={previewResource.title}
                className="w-full h-auto"
              />
            )}

            {previewResource?.type === "video" && (
              <video
                src={previewResource.url}
                controls
                className="w-full h-auto"
                title={previewResource.title}
              />
            )}

            {previewResource?.type === "audio" && (
              <audio
                src={previewResource.url}
                controls
                className="w-full"
                title={previewResource.title}
              />
            )}

            {(previewResource?.type === "doc" ||
              previewResource?.type === "code" ||
              previewResource?.type === "spreadsheet" ||
              previewResource?.type === "archive" ||
              previewResource?.type === "other") && (
              <div className="text-center py-12">
                <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={() => handleDownloadResource(previewResource)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to View
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewResource(null)}>
              Close
            </Button>
            <Button onClick={() => previewResource && handleDownloadResource(previewResource)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}