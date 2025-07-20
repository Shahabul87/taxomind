"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { cn } from '@/lib/utils';
import { SAMTipTapIntegration } from '@/components/sam/sam-tiptap-integration';
import { useSamAITutor } from '@/app/(protected)/teacher/_components/sam-ai-tutor-provider';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  ListOrdered,
  List,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Image as ImageIcon,
  Highlighter,
  Quote,
  RemoveFormatting,
  Paintbrush,
  Bot,
  Zap,
} from 'lucide-react';

// Optional extensions
let TextAlign;
let Highlight;
let TextStyle;
let Color;

try {
  TextAlign = require('@tiptap/extension-text-align').default;
} catch (e) {}

try {
  Highlight = require('@tiptap/extension-highlight').default;
} catch (e) {}

try {
  TextStyle = require('@tiptap/extension-text-style').default;
} catch (e) {}

try {
  Color = require('@tiptap/extension-color').default;
} catch (e) {}

const COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#000000' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
];

interface SAMEnhancedEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  editorClassName?: string;
  bubbleMenu?: boolean;
  simple?: boolean;
  samEnabled?: boolean;
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    formType?: string;
  };
}

export const SAMEnhancedEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  readOnly = false,
  editorClassName = "",
  bubbleMenu = true,
  simple = false,
  samEnabled = true,
  context
}: SAMEnhancedEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [samAssistanceCount, setSamAssistanceCount] = useState(0);
  const { trackInteraction, awardPoints } = useSamAITutor();
  
  // Build extensions list
  const extensions = [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer',
      }
    }),
    Placeholder.configure({
      placeholder,
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Underline,
    BulletList,
    OrderedList,
    ListItem,
  ];
  
  // Add optional extensions if available
  if (TextAlign) {
    extensions.push(
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      })
    );
  }
  
  if (Highlight) {
    extensions.push(Highlight);
  }
  
  if (TextStyle && Color) {
    extensions.push(TextStyle);
    extensions.push(Color);
  }
  
  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
          samEnabled && "border-l-4 border-l-blue-400 bg-blue-50/30 dark:bg-blue-900/10",
          editorClassName
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      
      // Track writing activity for SAM
      if (samEnabled) {
        trackInteraction('content_edited', {
          wordCount: editor.getText().split(' ').length,
          characterCount: editor.getText().length,
          formType: context?.formType,
        });
      }
    },
    editable: !readOnly,
  });
  
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SAM suggestion handler
  const handleSAMSuggestion = useCallback((suggestion: string) => {
    setSamAssistanceCount(prev => prev + 1);
    
    // Award points for using SAM assistance
    awardPoints(5, 'Used SAM AI assistance');
    
    trackInteraction('sam_suggestion_used', {
      suggestionLength: suggestion.length,
      assistanceCount: samAssistanceCount + 1,
      formType: context?.formType,
    });
  }, [samAssistanceCount, awardPoints, trackInteraction, context]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);
  
  const setTextColor = useCallback((color: string) => {
    if (!editor || !Color) return;
    
    if (color === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setColorPickerOpen(false);
  }, [editor]);
  
  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, callback: () => void) => {
    e.preventDefault();
    callback();
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  if (!editor) {
    return <div>Loading editor...</div>;
  }
  
  if (simple) {
    return (
      <div className="relative">
        {samEnabled && (
          <SAMTipTapIntegration 
            editor={editor} 
            onSuggestion={handleSAMSuggestion}
            context={context}
          />
        )}
        <EditorContent editor={editor} />
      </div>
    );
  }
  
  return (
    <div className="relative border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      {/* SAM Integration Panel */}
      {samEnabled && (
        <SAMTipTapIntegration 
          editor={editor} 
          onSuggestion={handleSAMSuggestion}
          context={context}
        />
      )}
      
      {/* Bubble Menu */}
      {!readOnly && bubbleMenu && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex flex-wrap bg-white dark:bg-gray-800 p-1 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 gap-1">
            {samEnabled && (
              <>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                  <Bot className="h-3 w-3" />
                  SAM: {samAssistanceCount} assists
                </div>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              </>
            )}
            
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBold().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('bold') }
              )}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleItalic().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('italic') }
              )}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleUnderline().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('underline') }
              )}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, setLink)}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('link') }
              )}
            >
              <LinkIcon className="h-4 w-4" />
            </button>
          </div>
        </BubbleMenu>
      )}
      
      {/* Main Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* SAM Status Indicator */}
          {samEnabled && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-md mr-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                SAM Enhanced
              </span>
              {samAssistanceCount > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  ({samAssistanceCount} assists)
                </span>
              )}
            </div>
          )}
          
          {/* Text style controls */}
          <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBold().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('bold') }
              )}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleItalic().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('italic') }
              )}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleUnderline().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('underline') }
              )}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            
            {/* Color picker */}
            {Color && TextStyle && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setColorPickerOpen(!colorPickerOpen);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                    colorPickerOpen && "bg-gray-200 dark:bg-gray-700"
                  )}
                  title="Text Color"
                >
                  <Paintbrush className="h-4 w-4" />
                </button>
                {colorPickerOpen && (
                  <div className="absolute z-50 mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-56">
                    <div className="grid grid-cols-5 gap-1">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setTextColor(color.value);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                          style={{ 
                            backgroundColor: color.value === 'inherit' ? 'transparent' : color.value,
                          }}
                          title={color.name}
                        >
                          {color.value === 'inherit' && <RemoveFormatting className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('heading', { level: 1 }) }
              )}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('heading', { level: 2 }) }
              )}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('heading', { level: 3 }) }
              )}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>
          
          {/* Lists and other formatting */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBulletList().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('bulletList') }
              )}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleOrderedList().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('orderedList') }
              )}
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, setLink)}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('link') }
              )}
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, addImage)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
};

export default SAMEnhancedEditor;