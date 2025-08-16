import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "./types";

interface CodePreviewSectionProps {
  form: UseFormReturn<{
    code: string;
    explanation: string;
  }>;
  codeBlocks: CodeBlock[];
  mode: 'edit' | 'preview';
  setMode: (mode: 'edit' | 'preview') => void;
}

export const CodePreviewSection = ({
  form,
  codeBlocks,
  mode,
  setMode
}: CodePreviewSectionProps) => {
  return (
    <div className="space-y-3 h-64 overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
          Preview
        </h3>
        <div className="flex gap-1">
          <Button
            type="button"
            onClick={() => setMode('edit')}
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            Edit
          </Button>
          <Button
            type="button"
            onClick={() => setMode('preview')}
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            Preview
          </Button>
        </div>
      </div>

      {mode === 'preview' && (
        <div className="border rounded border-gray-300 dark:border-gray-600 p-4 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 h-full overflow-y-auto shadow-sm">
          {codeBlocks.map((block, index) => (
            <div key={block.id} className="mb-6 last:mb-0">
              <h5 className="text-sm font-medium mb-3 text-center text-gray-800 dark:text-gray-200 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 py-2 rounded-lg">
                Block {index + 1}
              </h5>
              
              {/* Two Column Layout for Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column - Code */}
                <div className="space-y-2">
                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Code ({block.language})
                  </h6>
                  {block.code ? (
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto border border-gray-700 shadow-sm">
                      <code>{block.code}</code>
                    </pre>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-700 dark:to-gray-600 p-3 rounded text-xs text-gray-600 dark:text-gray-400 italic border border-gray-300 dark:border-gray-600">
                      No code added yet
                    </div>
                  )}
                </div>
                
                {/* Right Column - Explanation */}
                <div className="space-y-2">
                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    Explanation
                  </h6>
                  {block.explanation ? (
                    <div className="prose prose-xs prose-gray dark:prose-invert max-w-none bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 p-3 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 shadow-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {block.explanation}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded text-xs text-gray-600 dark:text-gray-400 italic border border-gray-300 dark:border-gray-600">
                      No explanation added yet
                    </div>
                  )}
                </div>
              </div>
              
              {/* Separator between blocks */}
              {index < codeBlocks.length - 1 && (
                <div className="border-t border-gray-300 dark:border-gray-600 mt-4"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 