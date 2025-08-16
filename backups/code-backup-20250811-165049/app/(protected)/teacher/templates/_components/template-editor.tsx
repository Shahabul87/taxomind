"use client";

import React, { useState, useCallback, useRef } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GripVertical, 
  Type, 
  FileText, 
  Video, 
  Image, 
  Code, 
  List, 
  Quote, 
  Trash2,
  Plus,
  Eye,
  Save,
  Copy,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ContentBlock {
  id: string;
  type: "text" | "heading" | "paragraph" | "video" | "image" | "code" | "list" | "quote" | "divider" | "custom";
  content: any;
  settings?: {
    alignment?: "left" | "center" | "right";
    size?: "small" | "medium" | "large";
    style?: string;
    className?: string;
  };
}

export interface TemplateData {
  id?: string;
  name: string;
  description?: string;
  contentType: string;
  category?: string;
  tags: string[];
  blocks: ContentBlock[];
  metadata?: {
    version: string;
    author?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

interface TemplateEditorProps {
  initialData?: TemplateData;
  onSave: (data: TemplateData) => Promise<void>;
  onPreview?: (data: TemplateData) => void;
  className?: string;
}

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: Type, description: "Add a heading" },
  { type: "paragraph", label: "Paragraph", icon: FileText, description: "Add text content" },
  { type: "video", label: "Video", icon: Video, description: "Embed video content" },
  { type: "image", label: "Image", icon: Image, description: "Add image" },
  { type: "code", label: "Code", icon: Code, description: "Code block" },
  { type: "list", label: "List", icon: List, description: "Bulleted or numbered list" },
  { type: "quote", label: "Quote", icon: Quote, description: "Quote or callout" },
  { type: "divider", label: "Divider", icon: Settings, description: "Section divider" }
];

// Sortable Block Component
function SortableBlock({ block, onUpdate, onDelete }: { 
  block: ContentBlock; 
  onUpdate: (block: ContentBlock) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow",
        isDragging && "shadow-lg ring-2 ring-blue-500"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 p-1 opacity-0 group-hover:opacity-100 cursor-grab hover:bg-gray-100 rounded transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(block.id)}
        className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Block Content */}
      <div className="ml-6 mr-6">
        <BlockEditor block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// Block Editor Component
function BlockEditor({ block, onUpdate }: { 
  block: ContentBlock; 
  onUpdate: (block: ContentBlock) => void;
}) {
  const handleContentChange = (content: any) => {
    onUpdate({ ...block, content });
  };

  const handleSettingsChange = (settings: any) => {
    onUpdate({ ...block, settings: { ...block.settings, ...settings } });
  };

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium">Heading</Label>
            <Select
              value={block.settings?.size || "medium"}
              onValueChange={(size) => handleSettingsChange({ size })}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">H3</SelectItem>
                <SelectItem value="medium">H2</SelectItem>
                <SelectItem value="large">H1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            value={block.content?.text || ""}
            onChange={(e) => handleContentChange({ text: e.target.value })}
            placeholder="Enter heading text..."
            className="font-medium"
            data-form="template-heading"
          />
        </div>
      );

    case "paragraph":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <Label className="text-sm font-medium">Paragraph</Label>
          </div>
          <Textarea
            value={block.content?.text || ""}
            onChange={(e) => handleContentChange({ text: e.target.value })}
            placeholder="Enter paragraph text..."
            rows={4}
            data-form="template-paragraph"
          />
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-purple-600" />
            <Label className="text-sm font-medium">Video</Label>
          </div>
          <Input
            value={block.content?.url || ""}
            onChange={(e) => handleContentChange({ url: e.target.value })}
            placeholder="Enter video URL..."
            data-form="template-video-url"
          />
          <Input
            value={block.content?.title || ""}
            onChange={(e) => handleContentChange({ ...block.content, title: e.target.value })}
            placeholder="Video title (optional)..."
            data-form="template-video-title"
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <Label className="text-sm font-medium">Image</Label>
          </div>
          <Input
            value={block.content?.url || ""}
            onChange={(e) => handleContentChange({ url: e.target.value })}
            placeholder="Enter image URL..."
          />
          <Input
            value={block.content?.alt || ""}
            onChange={(e) => handleContentChange({ ...block.content, alt: e.target.value })}
            placeholder="Alt text..."
          />
        </div>
      );

    case "code":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-gray-600" />
            <Label className="text-sm font-medium">Code Block</Label>
            <Select
              value={block.content?.language || "javascript"}
              onValueChange={(language) => handleContentChange({ ...block.content, language })}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={block.content?.code || ""}
            onChange={(e) => handleContentChange({ ...block.content, code: e.target.value })}
            placeholder="Enter code..."
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      );

    case "list":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-indigo-600" />
            <Label className="text-sm font-medium">List</Label>
            <Select
              value={block.content?.listType || "bullet"}
              onValueChange={(listType) => handleContentChange({ ...block.content, listType })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullet">Bullet</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={block.content?.items?.join('\n') || ""}
            onChange={(e) => handleContentChange({ 
              ...block.content, 
              items: e.target.value.split('\n').filter(item => item.trim()) 
            })}
            placeholder="Enter list items (one per line)..."
            rows={4}
          />
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-amber-600" />
            <Label className="text-sm font-medium">Quote</Label>
          </div>
          <Textarea
            value={block.content?.text || ""}
            onChange={(e) => handleContentChange({ ...block.content, text: e.target.value })}
            placeholder="Enter quote text..."
            rows={3}
          />
          <Input
            value={block.content?.author || ""}
            onChange={(e) => handleContentChange({ ...block.content, author: e.target.value })}
            placeholder="Author (optional)..."
          />
        </div>
      );

    case "divider":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <Label className="text-sm font-medium">Divider</Label>
            <Select
              value={block.content?.style || "line"}
              onValueChange={(style) => handleContentChange({ style })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="space">Space</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="py-2 text-sm text-gray-500">
            Visual divider between content sections
          </div>
        </div>
      );

    default:
      return (
        <div className="text-sm text-gray-500">
          Unknown block type: {block.type}
        </div>
      );
  }
}

export function TemplateEditor({ 
  initialData, 
  onSave, 
  onPreview, 
  className 
}: TemplateEditorProps) {
  const [templateData, setTemplateData] = useState<TemplateData>(() => ({
    name: initialData?.name || "",
    description: initialData?.description || "",
    contentType: initialData?.contentType || "course",
    category: initialData?.category || "",
    tags: initialData?.tags || [],
    blocks: initialData?.blocks || [],
    metadata: initialData?.metadata || { version: "1.0.0" }
  }));

  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTemplateData(prev => ({
        ...prev,
        blocks: arrayMove(
          prev.blocks,
          prev.blocks.findIndex(block => block.id === active.id),
          prev.blocks.findIndex(block => block.id === over.id)
        )
      }));
    }
    
    setActiveId(null);
  };

  const addBlock = useCallback((type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      settings: {
        alignment: "left",
        size: "medium"
      }
    };

    setTemplateData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  }, []);

  const updateBlock = useCallback((updatedBlock: ContentBlock) => {
    setTemplateData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === updatedBlock.id ? updatedBlock : block
      )
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setTemplateData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  }, []);

  const addTag = useCallback(() => {
    if (newTag.trim() && !templateData.tags.includes(newTag.trim())) {
      setTemplateData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  }, [newTag, templateData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTemplateData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(templateData);
      toast.success("Template saved successfully");
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(templateData);
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
                data-form="template-name"
              />
            </div>
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select
                value={templateData.contentType}
                onValueChange={(contentType) => setTemplateData(prev => ({ ...prev, contentType }))}
              >
                <SelectTrigger data-form="template-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="chapter">Chapter</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={2}
              data-form="template-description"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={templateData.category}
              onChange={(e) => setTemplateData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Template category..."
              data-form="template-category"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {templateData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                data-form="template-tag"
              />
              <Button onClick={addTag} size="sm">Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Content Blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BLOCK_TYPES.map(blockType => {
              const Icon = blockType.icon;
              return (
                <Button
                  key={blockType.type}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => addBlock(blockType.type as ContentBlock["type"])}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{blockType.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Template Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templateData.blocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content blocks yet. Add blocks above to start building your template.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={templateData.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {templateData.blocks.map(block => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                    />
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeId ? (
                  <div className="p-4 bg-white border rounded-lg shadow-lg opacity-90">
                    Dragging block...
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {templateData.blocks.length} block{templateData.blocks.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getDefaultContent(type: ContentBlock["type"]) {
  switch (type) {
    case "heading":
      return { text: "New Heading" };
    case "paragraph":
      return { text: "Enter your paragraph text here..." };
    case "video":
      return { url: "", title: "" };
    case "image":
      return { url: "", alt: "" };
    case "code":
      return { code: "", language: "javascript" };
    case "list":
      return { items: ["Item 1", "Item 2", "Item 3"], listType: "bullet" };
    case "quote":
      return { text: "Enter quote text...", author: "" };
    case "divider":
      return { style: "line" };
    default:
      return {};
  }
}