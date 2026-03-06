"use client";

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
// BulletList, OrderedList, and ListItem are already included in StarterKit
import { useCallback, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
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
  Table as TableIcon,
  Highlighter,
  Quote,
  RemoveFormatting,
  Paintbrush,
  Loader2,
} from 'lucide-react';

import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';

// Array of colors for the color picker
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

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  editorClassName?: string;
  bubbleMenu?: boolean;
  simple?: boolean;
}

export const TipTapEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  readOnly = false,
  editorClassName = "",
  bubbleMenu = true,
  simple = false
}: EditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // Build our extensions list based on what's available
  // Note: StarterKit already includes BulletList, OrderedList, and ListItem
  // so we don't need to add them separately to avoid duplicate extension warnings
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
    Subscript,
    Superscript,
    // Removed BulletList, OrderedList, ListItem - already included in StarterKit
  ];
  
  // Add optional extensions if they're available
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
  
  // Add text color support if available
  if (TextStyle && Color) {
    extensions.push(TextStyle);
    extensions.push(Color);
  }
  
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false, // Prevent SSR hydration mismatches
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4",
          editorClassName
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editable: !readOnly,
  });
  
  // Set content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);
  
  // Set up client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = useCallback(() => {
    if (!editor) return;

    // Create a choice dialog
    const choice = window.confirm(
      'Click OK to upload an image file, or Cancel to enter an image URL'
    );

    if (choice) {
      // Upload file - trigger file input
      fileInputRef.current?.click();
    } else {
      // Enter URL
      const url = window.prompt('Image URL');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor]);

  const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file size (10MB max - matches API limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }

    setIsImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle the API response format: { uploadedFiles: [{ url, publicId }] }
      const imageUrl = data.uploadedFiles?.[0]?.url || data.secure_url;

      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      console.error('[IMAGE_UPLOAD_ERROR]', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsImageUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [editor]);
  
  // Apply text color
  const setTextColor = useCallback((color: string) => {
    if (!editor || !Color) return;
    
    if (color === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setColorPickerOpen(false);
  }, [editor]);
  
  // Prevent button clicks from submitting the form
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
    return <EditorContent editor={editor} />;
  }
  
  return (
    <div className="relative border border-gray-200 dark:border-gray-700 rounded-md">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      {!readOnly && bubbleMenu && (
        <div>
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              duration: 100,
              // Append to body to avoid removeChild errors when parent unmounts (e.g., dialogs/portals)
              appendTo: () => document.body,
            }}
          >
          <div className="flex flex-wrap bg-white dark:bg-gray-800 p-1 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 gap-1">
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
            {Color && TextStyle && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setColorPickerOpen(!colorPickerOpen);
                  }}
                  className={cn(
                    "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                    colorPickerOpen && "bg-gray-200 dark:bg-gray-700"
                  )}
                >
                  <Paintbrush className="h-4 w-4" />
                </button>
              </div>
            )}
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
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBulletList().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('bulletList') }
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleOrderedList().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('orderedList') }
              )}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
        </BubbleMenu>
        </div>
      )}
      
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-md">
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
            {Highlight && (
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHighlight().run())}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                  { "bg-gray-200 dark:bg-gray-700": editor.isActive('highlight') }
                )}
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </button>
            )}
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
          
          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
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
          </div>
          
          {/* Alignment */}
          {TextAlign && (
            <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setTextAlign('left').run())}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                  { "bg-gray-200 dark:bg-gray-700": editor.isActive({ textAlign: 'left' }) }
                )}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setTextAlign('center').run())}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                  { "bg-gray-200 dark:bg-gray-700": editor.isActive({ textAlign: 'center' }) }
                )}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setTextAlign('right').run())}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                  { "bg-gray-200 dark:bg-gray-700": editor.isActive({ textAlign: 'right' }) }
                )}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setTextAlign('justify').run())}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                  { "bg-gray-200 dark:bg-gray-700": editor.isActive({ textAlign: 'justify' }) }
                )}
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Special formatting */}
          <div className="flex gap-1 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
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
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBlockquote().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('blockquote') }
              )}
              title="Block Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleCodeBlock().run())}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                { "bg-gray-200 dark:bg-gray-700": editor.isActive('codeBlock') }
              )}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
          
          {/* Advanced features */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, addImage)}
              disabled={isImageUploading}
              className={cn(
                "p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700",
                isImageUploading && "opacity-50 cursor-not-allowed"
              )}
              title={isImageUploading ? "Uploading..." : "Insert Image"}
            >
              {isImageUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => handleButtonClick(e, () => editor.chain().focus().unsetAllMarks().clearNodes().run())}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Clear Formatting"
            >
              <RemoveFormatting className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor; 
