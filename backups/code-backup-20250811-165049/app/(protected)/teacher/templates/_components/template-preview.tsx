"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Code, 
  List, 
  Quote, 
  Minus,
  Eye,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentBlock, TemplateData } from "./template-editor";

interface TemplatePreviewProps {
  templateData: TemplateData;
  onClose?: () => void;
  className?: string;
}

export function TemplatePreview({ templateData, onClose, className }: TemplatePreviewProps) {
  const renderBlock = (block: ContentBlock) => {
    const alignment = block.settings?.alignment || "left";
    const size = block.settings?.size || "medium";

    switch (block.type) {
      case "heading":
        const HeadingTag = size === "large" ? "h1" : size === "medium" ? "h2" : "h3";
        return (
          <HeadingTag
            className={cn(
              "font-bold",
              size === "large" && "text-3xl",
              size === "medium" && "text-2xl",
              size === "small" && "text-xl",
              alignment === "center" && "text-center",
              alignment === "right" && "text-right"
            )}
          >
            {block.content?.text || "Untitled Heading"}
          </HeadingTag>
        );

      case "paragraph":
        return (
          <p
            className={cn(
              "text-gray-700 leading-relaxed",
              alignment === "center" && "text-center",
              alignment === "right" && "text-right"
            )}
          >
            {block.content?.text || "No content provided."}
          </p>
        );

      case "video":
        return (
          <div className={cn("space-y-2", alignment === "center" && "text-center")}>
            {block.content?.title && (
              <h4 className="font-semibold text-lg">{block.content.title}</h4>
            )}
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-500">
                <Video className="h-6 w-6" />
                <span>Video: {block.content?.url || "No URL provided"}</span>
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div className={cn("space-y-2", alignment === "center" && "text-center")}>
            <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center min-h-48">
              {block.content?.url ? (
                <Image 
                  src={block.content.url} 
                  alt={block.content.alt || "Template content image"} 
                  width={500}
                  height={300}
                  className="max-w-full max-h-48 object-contain rounded"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <ImageIcon className="h-6 w-6" />
                  <span>Image placeholder</span>
                </div>
              )}
            </div>
            {block.content?.alt && (
              <p className="text-sm text-gray-500 italic">{block.content.alt}</p>
            )}
          </div>
        );

      case "code":
        return (
          <div className="space-y-2">
            {block.content?.language && (
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium text-gray-600">
                  {block.content.language}
                </span>
              </div>
            )}
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm font-mono">
                {block.content?.code || "// No code provided"}
              </code>
            </pre>
          </div>
        );

      case "list":
        const ListComponent = block.content?.listType === "number" ? "ol" : "ul";
        return (
          <ListComponent
            className={cn(
              "space-y-1",
              block.content?.listType === "number" ? "list-decimal" : "list-disc",
              "list-inside",
              alignment === "center" && "text-center",
              alignment === "right" && "text-right"
            )}
          >
            {block.content?.items?.map((item: string, index: number) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            )) || <li className="text-gray-500 italic">No items provided</li>}
          </ListComponent>
        );

      case "quote":
        return (
          <blockquote
            className={cn(
              "border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 italic",
              alignment === "center" && "text-center",
              alignment === "right" && "text-right"
            )}
          >
            <p className="text-gray-700">
              &ldquo;{block.content?.text || 'No quote text provided'}&rdquo;
            </p>
            {block.content?.author && (
              <footer className="text-gray-500 text-sm mt-2">
                — {block.content.author}
              </footer>
            )}
          </blockquote>
        );

      case "divider":
        const style = block.content?.style || "line";
        return (
          <div className="flex justify-center py-4">
            {style === "line" && <hr className="w-full border-gray-300" />}
            {style === "dots" && (
              <div className="flex gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              </div>
            )}
            {style === "space" && <div className="h-8"></div>}
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
            Unknown block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <CardTitle>Template Preview</CardTitle>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Template Meta Info */}
          <div className="space-y-2 pt-4">
            <div>
              <h3 className="text-lg font-semibold">{templateData.name}</h3>
              {templateData.description && (
                <p className="text-gray-600 text-sm">{templateData.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Type: {templateData.contentType}</span>
              {templateData.category && (
                <span>Category: {templateData.category}</span>
              )}
              <span>Blocks: {templateData.blocks.length}</span>
            </div>
            
            {templateData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {templateData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {templateData.blocks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content blocks to preview</p>
              </div>
            ) : (
              templateData.blocks.map((block, index) => (
                <div key={block.id} className="group">
                  {/* Block Preview */}
                  <div className="relative">
                    {/* Block Type Indicator */}
                    <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                        {block.type === "heading" && <Type className="h-3 w-3 text-blue-600" />}
                        {block.type === "paragraph" && <FileText className="h-3 w-3 text-green-600" />}
                        {block.type === "video" && <Video className="h-3 w-3 text-purple-600" />}
                        {block.type === "image" && <ImageIcon className="h-3 w-3 text-orange-600" />}
                        {block.type === "code" && <Code className="h-3 w-3 text-gray-600" />}
                        {block.type === "list" && <List className="h-3 w-3 text-indigo-600" />}
                        {block.type === "quote" && <Quote className="h-3 w-3 text-amber-600" />}
                        {block.type === "divider" && <Minus className="h-3 w-3 text-gray-600" />}
                      </div>
                    </div>
                    
                    {/* Block Content */}
                    <div className="pl-4">
                      {renderBlock(block)}
                    </div>
                  </div>
                  
                  {/* Block Separator */}
                  {index < templateData.blocks.length - 1 && (
                    <div className="h-px bg-gray-200 my-6 opacity-50"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}