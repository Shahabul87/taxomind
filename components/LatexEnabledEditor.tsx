"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";
import { cn } from "@/lib/utils";

export interface LatexEnabledEditorProps {
  /** Current value of the editor */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum height */
  minHeight?: string;
  /** Maximum height */
  maxHeight?: string;
  /** Show LaTeX help */
  showHelp?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Show live preview */
  showPreview?: boolean;
}

export const LatexEnabledEditor: React.FC<LatexEnabledEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your explanation here...",
  minHeight = "200px",
  maxHeight = "400px",
  showHelp = true,
  disabled = false,
  className = "",
  showPreview = true
}) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const insertLatexCommand = useCallback((command: string) => {
    const textarea = document.querySelector('textarea[data-latex-editor="true"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + command + value.slice(end);
    
    onChange(newValue);
    
    // Focus and set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + command.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [value, onChange]);

  // Parse content to render LaTeX inline
  const renderPreview = useMemo(() => {
    if (!value.trim()) {
      return (
        <div className="text-gray-400 dark:text-gray-500 italic p-4">
          No content to preview
        </div>
      );
    }

    // Split content by LaTeX patterns
    const parts = value.split(/(\$[^$]+\$|\\\([^\\]+\\\))/g);

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none p-4">
        {parts.map((part, index) => {
          // Check if this part is LaTeX
          if (part.startsWith('$') && part.endsWith('$')) {
            const equation = part.slice(1, -1);
            return (
              <span key={index} className="inline-block mx-1">
                <MathRenderer
                  equation={equation}
                  mode="inline"
                  size="small"
                  theme="light"
                  className="border-0 shadow-none bg-transparent p-0"
                />
              </span>
            );
          } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
            const equation = part.slice(2, -2);
            return (
              <span key={index} className="inline-block mx-1">
                <MathRenderer
                  equation={equation}
                  mode="inline"
                  size="small"
                  theme="light"
                  className="border-0 shadow-none bg-transparent p-0"
                />
              </span>
            );
          } else {
            // Regular text - preserve line breaks
            return (
              <span key={index}>
                {part.split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </span>
            );
          }
        })}
      </div>
    );
  }, [value]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Editor Tabs */}
      {showPreview ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger
              value="write"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <Edit className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            >
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="mt-3">
            <Textarea
              data-latex-editor="true"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="font-mono text-sm resize-none bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{
                minHeight,
                maxHeight,
                height: minHeight
              }}
            />
            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Use $equation$ for inline LaTeX or regular text for explanations
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div
              className="border rounded-md overflow-y-auto bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
              style={{
                minHeight,
                maxHeight
              }}
            >
              {renderPreview}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          <Textarea
            data-latex-editor="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="font-mono text-sm resize-none bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            style={{
              minHeight,
              maxHeight,
              height: minHeight
            }}
          />
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Use $equation$ for inline LaTeX or regular text for explanations
          </div>
        </div>
      )}
    </div>
  );
};

export default LatexEnabledEditor; 