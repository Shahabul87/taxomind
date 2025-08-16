"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Import additional extensions conditionally to avoid runtime errors
let TextAlign, Table, TableRow, TableCell, TableHeader, Highlight, TextStyle, Color;

try {
  // Try to dynamically import extensions if available
  TextAlign = require('@tiptap/extension-text-align').default;
} catch (e) {
  // Extension not available
}

try {
  TextStyle = require('@tiptap/extension-text-style').default;
} catch (e) {
  // Extension not available
}

try {
  Color = require('@tiptap/extension-color').default;
} catch (e) {
  // Extension not available
}

try {
  Highlight = require('@tiptap/extension-highlight').default;
} catch (e) {
  // Extension not available
}

interface ContentViewerProps {
  content: string;
  className?: string;
}

export const ContentViewer = ({ content, className }: ContentViewerProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Collect extensions that are definitely available
  const extensions = [
    StarterKit,
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        class: 'text-blue-500 underline cursor-pointer',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Image,
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
  
  // Add text color support
  if (TextStyle && Color) {
    extensions.push(TextStyle);
    extensions.push(Color);
  }
  
  // Add highlight support if available
  if (Highlight) {
    extensions.push(
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-100 dark:bg-yellow-800/30 px-1 rounded',
        },
      })
    );
  }
  
  const editor = useEditor({
    extensions,
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none p-0",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
          "[&_p]:mb-3 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3",
          "[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3",
          "[&_li]:mb-1",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:dark:border-gray-700 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:dark:text-gray-300 [&_blockquote]:mb-3",
          "[&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline",
          "[&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm",
          "[&_img]:max-w-full [&_img]:rounded-md [&_img]:my-3",
          "[&_table]:border-collapse [&_table]:w-full [&_table]:my-3 [&_table]:border [&_table]:border-gray-300 [&_table]:dark:border-gray-700",
          "[&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:font-semibold [&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-700",
          "[&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-700 [&_td]:py-2 [&_td]:px-3",
          className
        ),
      },
    },
  });
  
  // Set content when it changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [editor, content]);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  return (
    <div className="content-viewer">
      {editor && <EditorContent editor={editor} />}
    </div>
  );
};

export default ContentViewer; 