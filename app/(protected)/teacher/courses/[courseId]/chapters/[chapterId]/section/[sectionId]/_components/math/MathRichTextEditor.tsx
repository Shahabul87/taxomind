'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Bold,
  Italic,
  List,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MathRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const MathRichTextEditor = ({ value, onChange, disabled }: MathRichTextEditorProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const insertMarkup = (before: string, after: string) => {
    const textarea = document.querySelector('textarea[name="rich-text"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end) || 'text';
    const newText = localValue.substring(0, start) + before + selectedText + after + localValue.substring(end);

    setLocalValue(newText);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border rounded-t-lg bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkup('**', '**')}
          disabled={disabled}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkup('*', '*')}
          disabled={disabled}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkup('`', '`')}
          disabled={disabled}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkup('$', '$')}
          disabled={disabled}
          title="Inline LaTeX"
        >
          <span className="text-sm font-mono">$...$</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkup('\n- ', '')}
          disabled={disabled}
          title="List"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        name="rich-text"
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Write your explanation here... Use inline LaTeX: $x^2 + y^2 = r^2$"
        className="min-h-[150px] rounded-t-none"
      />

      <p className="text-xs text-muted-foreground">
        Markdown supported: **bold**, *italic*, `code`, $inline LaTeX$, - lists
      </p>
    </div>
  );
};
