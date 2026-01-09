"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Book, Video, Link as LinkIcon, Image as ImageIcon, File, Download, ExternalLink, Clock, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewResourceDialog } from "./new-resource-dialog";
import { ResourceCard } from "./resource-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ResourcesProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

export const Resources = ({ group, currentUser, isGroupMember }: ResourcesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const resourceTypes = [
    { value: "all", label: "All", icon: File },
    { value: "document", label: "Documents", icon: FileText },
    { value: "video", label: "Videos", icon: Video },
    { value: "image", label: "Images", icon: ImageIcon },
    { value: "link", label: "Links", icon: LinkIcon },
    { value: "book", label: "Books", icon: Book },
  ];

  const filteredResources = group.resources
    .filter((resource: any) => 
      (selectedType === "all" || resource.type === selectedType) &&
      (!searchQuery || 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Helper function to render the appropriate icon
  const getResourceIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "image":
        return <ImageIcon className="w-5 h-5" />;
      case "link":
        return <LinkIcon className="w-5 h-5" />;
      case "book":
        return <Book className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and filters */}
      <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-l-lg",
                  viewMode === "grid" 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-r-lg",
                  viewMode === "list" 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {isGroupMember && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue={selectedType} onValueChange={(value) => setSelectedType(value)} className="w-full">
          <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap">
            {resourceTypes.map((type) => (
              <TabsTrigger 
                key={type.value} 
                value={type.value}
                className={cn(
                  "flex items-center gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/20 dark:data-[state=active]:text-indigo-400",
                  "rounded-md"
                )}
              >
                <type.icon className="w-4 h-4" />
                <span>{type.label}</span>
                {type.value !== "all" && (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                    {group.resources.filter((r: any) => r.type === type.value).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Resources display */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <File className="w-16 h-16 mx-auto mb-6 text-indigo-300 dark:text-indigo-700" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No resources found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? "Try adjusting your search criteria."
                : "There are no resources in this category yet."}
            </p>
            
            {isGroupMember && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Resource
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 pl-2">
            Showing {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}
          </div>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource: any) => (
                <div 
                  key={resource.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* Resource preview */}
                  <div className={cn(
                    "aspect-video relative",
                    "flex items-center justify-center",
                    resource.type === "image" ? "bg-black/5 dark:bg-white/5" : "bg-indigo-50 dark:bg-indigo-900/20"
                  )}>
                    {resource.thumbnail ? (
                      <Image 
                        src={resource.thumbnail} 
                        alt={resource.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-indigo-500 dark:text-indigo-400">
                        {getResourceIcon(resource.type)}
                      </div>
                    )}
                    
                    <Badge className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-0">
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{resource.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={resource.author.image} />
                          <AvatarFallback className="text-xs">
                            {resource.author.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{resource.author.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>{formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4 pt-0 flex gap-2 justify-end">
                    {resource.url && (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </a>
                      </Button>
                    )}
                    {resource.fileUrl && (
                      <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <a href={resource.fileUrl} download>
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource: any) => (
                <div 
                  key={resource.id}
                  className="flex flex-col sm:flex-row bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* Thumbnail for list view */}
                  {(resource.thumbnail || resource.type === "image" || resource.type === "video") && (
                    <div className="sm:w-48 h-32 flex-shrink-0">
                      {resource.thumbnail ? (
                        <Image 
                          src={resource.thumbnail} 
                          alt={resource.title}
                          width={192}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400">
                          {getResourceIcon(resource.type)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0">
                            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{resource.description}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {resource.url && (
                          <Button variant="outline" size="sm" className="gap-1.5 h-8" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open
                            </a>
                          </Button>
                        )}
                        {resource.fileUrl && (
                          <Button variant="outline" size="sm" className="gap-1.5 h-8" asChild>
                            <a href={resource.fileUrl} download>
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={resource.author.image} />
                          <AvatarFallback className="text-xs">
                            {resource.author.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>Added by {resource.author.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>{formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <NewResourceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        groupId={group.id}
        currentUser={currentUser}
        onSuccess={() => {
          setIsDialogOpen(false);
          window.location.reload();
        }}
      />
    </motion.div>
  );
}; 