import React, { useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Code2 } from "lucide-react";

interface CodeExplanationEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  isSubmitting: boolean;
  blockId: string;
}

export const CodeExplanationEditor = ({
  content,
  onUpdate,
  isSubmitting,
  blockId
}: CodeExplanationEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editable: !isSubmitting,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border rounded border-gray-300 dark:border-gray-600 h-full flex flex-col bg-white dark:bg-gray-900 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={cn(
              "h-7 w-7 p-0 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300",
              editor?.isActive('bold') && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            )}
          >
            <strong className="text-xs">B</strong>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={cn(
              "h-7 w-7 p-0 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-600 hover:text-purple-700 dark:text-gray-400 dark:hover:text-purple-300",
              editor?.isActive('italic') && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            )}
          >
            <em className="text-xs">I</em>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleCode().run()}
            className={cn(
              "h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-600 hover:text-green-700 dark:text-gray-400 dark:hover:text-green-300",
              editor?.isActive('code') && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            )}
          >
            <Code2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm prose-gray dark:prose-invert max-w-none p-3 flex-1 overflow-y-auto text-gray-800 dark:text-gray-200 text-sm leading-relaxed"
      />
    </div>
  );
}; 