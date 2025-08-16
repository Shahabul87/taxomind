"use client";

import React, { useState, useCallback, useRef } from 'react';
// Fallback to simple drag-drop if library is not available in runtime/build
import { DragDrop } from '@/components/ui/drag-drop';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logger } from '@/lib/logger';
import { 
  Plus, Save, Eye, Trash2, Copy, Move, Settings, 
  FileText, Image, Video, Code, CheckCircle, Download,
  Zap, AlertCircle, MoreHorizontal, GripVertical,
  Search, Filter, Layout, Palette, Play
} from 'lucide-react';
import { Template, TemplateBlock, templateEngine } from '@/lib/content-templates/template-engine';
import { BlockRenderer } from '@/lib/content-templates/block-library';
import { toast } from 'sonner';

interface TemplateBuilderProps {
  initialTemplate?: Template;
  onSave?: (template: Template) => void;
  onCancel?: () => void;
}

const BLOCK_TYPES = [
  { type: 'heading', icon: FileText, label: 'Heading', description: 'Section titles and headings' },
  { type: 'text', icon: FileText, label: 'Text', description: 'Rich text content' },
  { type: 'image', icon: Image, label: 'Image', description: 'Images with captions' },
  { type: 'video', icon: Video, label: 'Video', description: 'Video content' },
  { type: 'code', icon: Code, label: 'Code', description: 'Code blocks with syntax highlighting' },
  { type: 'quiz', icon: CheckCircle, label: 'Quiz', description: 'Interactive quizzes' },
  { type: 'interactive', icon: Zap, label: 'Interactive', description: 'Interactive elements' },
  { type: 'download', icon: Download, label: 'Download', description: 'File downloads' },
  { type: 'callout', icon: AlertCircle, label: 'Callout', description: 'Important notices' },
  { type: 'divider', icon: MoreHorizontal, label: 'Divider', description: 'Section separators' },
  { type: 'list', icon: FileText, label: 'List', description: 'Bulleted or numbered lists' },
  { type: 'table', icon: Layout, label: 'Table', description: 'Data tables' },
  { type: 'embed', icon: Palette, label: 'Embed', description: 'External content' }
];

export function TemplateBuilder({ 
  initialTemplate, 
  onSave, 
  onCancel 
}: TemplateBuilderProps) {
  const [template, setTemplate] = useState<Partial<Template>>(
    initialTemplate || {
      name: '',
      description: '',
      category: '',
      tags: [],
      difficulty: 'beginner',
      estimatedTime: 60,
      blocks: [],
      prerequisites: [],
      learningObjectives: []
    }
  );

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<TemplateBlock | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const dragConstraints = useRef(null);

  // Block Management
  const addBlock = useCallback((blockType: string) => {
    const newBlock: TemplateBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockType as any,
      content: getDefaultBlockContent(blockType),
      metadata: {
        title: `New ${blockType} block`,
        category: getBlockCategory(blockType)
      }
    };

    setTemplate(prev => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock]
    }));

    setSelectedBlock(newBlock.id);
    toast.success(`${blockType} block added`);
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<TemplateBlock>) => {
    setTemplate(prev => ({
      ...prev,
      blocks: (prev.blocks || []).map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    }));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: (prev.blocks || []).filter(block => block.id !== blockId)
    }));
    
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }
    
    toast.success('Block deleted');
  }, [selectedBlock]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = template.blocks?.find(b => b.id === blockId);
    if (blockToDuplicate) {
      const duplicatedBlock: TemplateBlock = {
        ...blockToDuplicate,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          ...blockToDuplicate.metadata,
          title: `${blockToDuplicate.metadata?.title || ''} (Copy)`
        }
      };
      
      const blockIndex = template.blocks!.findIndex(b => b.id === blockId);
      const newBlocks = [...(template.blocks || [])];
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      
      setTemplate(prev => ({ ...prev, blocks: newBlocks }));
      toast.success('Block duplicated');
    }
  }, [template.blocks]);

  // Drag and Drop
  const onReorder = useCallback((items: TemplateBlock[]) => {
    setTemplate(prev => ({ ...prev, blocks: items }));
  }, []);

  // Template Actions
  const saveTemplate = async () => {
    try {
      if (!template.name || !template.description || !template.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      const savedTemplate = await templateEngine.createTemplate(template as any);
      onSave?.(savedTemplate);
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error('Failed to save template');
      logger.error(error);
    }
  };

  const previewTemplate = () => {
    setPreviewMode(!previewMode);
  };

  // Block Content Defaults
  function getDefaultBlockContent(blockType: string): any {
    const defaults: Record<string, any> = {
      heading: { text: 'Your heading here', level: 2 },
      text: { text: 'Your text content here...' },
      image: { src: '', alt: '', caption: '' },
      video: { url: '', title: 'Video Title' },
      code: { code: '// Your code here', language: 'javascript' },
      quiz: { title: 'Quiz Title', questions: [] },
      interactive: { type: 'simulation', title: 'Interactive Element' },
      download: { title: 'Downloads', files: [] },
      callout: { type: 'info', title: 'Important Note', content: 'Your message here' },
      divider: { style: 'line', spacing: 'normal' },
      list: { type: 'unordered', items: ['Item 1', 'Item 2', 'Item 3'] },
      table: { headers: ['Column 1', 'Column 2'], rows: [['Row 1 Col 1', 'Row 1 Col 2']] },
      embed: { url: '', title: 'Embedded Content' }
    };
    
    return defaults[blockType] || {};
  }

  function getBlockCategory(blockType: string): string {
    const categories: Record<string, string> = {
      heading: 'text', text: 'text', list: 'text',
      image: 'media', video: 'media', embed: 'media',
      code: 'interactive', quiz: 'assessment', interactive: 'interactive',
      download: 'resource', callout: 'layout', divider: 'layout', table: 'layout'
    };
    
    return categories[blockType] || 'other';
  }

  // Filtered blocks for sidebar
  const filteredBlockTypes = BLOCK_TYPES.filter(blockType => {
    const matchesSearch = blockType.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blockType.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           getBlockCategory(blockType.type) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedBlockData = template.blocks?.find(b => b.id === selectedBlock);

  if (previewMode) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{template.name || 'Template Preview'}</h1>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Exit Preview
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {template.blocks?.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar - Block Library */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Block Library</h2>
          
          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="layout">Layout</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredBlockTypes.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <Button
                  key={blockType.type}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => addBlock(blockType.type)}
                >
                  <Icon className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{blockType.label}</div>
                    <div className="text-xs text-gray-500">
                      {blockType.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <Input
                placeholder="Template name..."
                value={template.name || ''}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="text-xl font-semibold border-none px-0 focus-visible:ring-0"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={previewTemplate}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button onClick={saveTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* Template Metadata */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Template Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Template description..."
                          value={template.description || ''}
                          onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={template.category || ''} 
                            onValueChange={(value) => setTemplate(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="programming">Programming</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="language">Language</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="difficulty">Difficulty</Label>
                          <Select 
                            value={template.difficulty || 'beginner'} 
                            onValueChange={(value) => setTemplate(prev => ({ ...prev, difficulty: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Blocks */}
                <div className="space-y-4">
                  <DragDrop
                    items={template.blocks || []}
                    onReorder={onReorder}
                    renderItem={(block, index) => (
                      <div
                        className={`group relative ${
                          selectedBlock === block.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <div className="ml-8">
                          <BlockRenderer 
                            block={block} 
                            editable={true}
                            onEdit={() => {
                              setEditingBlock(block);
                              setShowBlockDialog(true);
                            }}
                            onDelete={deleteBlock}
                          />
                        </div>
                        {selectedBlock === block.id && (
                          <div className="absolute top-2 right-2 flex gap-1 bg-white shadow-lg rounded-md p-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingBlock(block); setShowBlockDialog(true); }}>
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  />
                  {(!template.blocks || template.blocks.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <Layout className="mx-auto h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No blocks yet</h3>
                      <p>Add blocks from the library to start building your template</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedBlockData && (
            <div className="w-80 border-l bg-white">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Block Properties</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {selectedBlockData.type} Block
                </p>
              </div>
              
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="block-title">Block Title</Label>
                    <Input
                      id="block-title"
                      value={selectedBlockData.metadata?.title || ''}
                      onChange={(e) => updateBlock(selectedBlockData.id, {
                        metadata: { ...selectedBlockData.metadata, title: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="block-description">Description</Label>
                    <Textarea
                      id="block-description"
                      value={selectedBlockData.metadata?.description || ''}
                      onChange={(e) => updateBlock(selectedBlockData.id, {
                        metadata: { ...selectedBlockData.metadata, description: e.target.value }
                      })}
                    />
                  </div>

                  <Separator />

                  {/* Block-specific settings would go here */}
                  <div className="text-sm text-gray-500">
                    Block-specific settings for {selectedBlockData.type} blocks would appear here
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Block Edit Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>
              Configure the settings for this {editingBlock?.type} block
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Block editing form would go here */}
            <div className="text-sm text-gray-500">
              Advanced block editing interface would be implemented here
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowBlockDialog(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}