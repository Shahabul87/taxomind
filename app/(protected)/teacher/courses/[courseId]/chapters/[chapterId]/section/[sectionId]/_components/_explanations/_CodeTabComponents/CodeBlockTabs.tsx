import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from 'next/dynamic';
// Lazy-load Monaco editor on client only to keep bundles lean
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Eye } from "lucide-react";
const SyntaxHighlighter: any = dynamic(() =>
  import('react-syntax-highlighter/dist/esm/prism-async-light').then((m: any) => m.default),
  { ssr: false }
);
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CodeBlock, languageOptions } from "./types";
import { CodeExplanationEditor } from "./CodeExplanationEditor";

interface CodeBlockTabsProps {
  codeBlocks: CodeBlock[];
  activeBlockId: string;
  setActiveBlockId: (id: string) => void;
  updateBlockCode: (id: string, code: string) => void;
  updateBlockExplanation: (id: string, explanation: string) => void;
  updateBlockLanguage: (id: string, language: string) => void;
  addCodeBlock: () => void;
  removeCodeBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  isSubmitting: boolean;
  title: string;
  setTitle: (title: string) => void;
  onReset: () => void;
  mode: 'edit' | 'preview';
  setMode: (mode: 'edit' | 'preview') => void;
}

export const CodeBlockTabs = ({
  codeBlocks,
  updateBlockCode,
  updateBlockExplanation,
  updateBlockLanguage,
  isSubmitting,
  title,
  setTitle,
  onReset,
  mode,
  setMode
}: CodeBlockTabsProps) => {
  // Use first block since we're simplifying to single block
  const block = codeBlocks[0] || { id: '', code: '', explanation: '', language: 'typescript' };

  return (
    <div className="space-y-6">
      {/* Header with title input and action buttons */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Code Block Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter code block title..."
              className="text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
          
          <div className="flex items-center gap-2 pt-6">
            <Button
              type="button"
              onClick={onReset}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              type="button"
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <Eye className="h-3 w-3 mr-1" />
              {mode === 'edit' ? 'Preview' : 'Edit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {mode === 'edit' ? (
          /* Edit Mode - Two Column Layout: Code and Explanation */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column - Code Section */}
            <div className="flex flex-col space-y-3 min-h-[500px]">
              {/* Code header with language selector */}
              <div className="flex items-center justify-between flex-shrink-0">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Code
                </h4>
                <Select value={block.language} onValueChange={(value) => updateBlockLanguage(block.id, value)}>
                  <SelectTrigger className="w-40 h-8 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Code Editor */}
              <div className="flex-1 min-h-[450px] border rounded border-gray-300 dark:border-gray-600 overflow-hidden">
                <Editor
                  height="450px"
                  language={block.language}
                  value={block.code}
                  onChange={(value) => updateBlockCode(block.id, value || '')}
                  theme="vs-dark"
                  beforeMount={(monaco) => {
                    // Disable TypeScript diagnostics to prevent red squiggly lines
                    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                      noSemanticValidation: true,
                      noSyntaxValidation: false, // Keep basic syntax validation
                      noSuggestionDiagnostics: true,
                    });
                    
                    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                      noSemanticValidation: true,
                      noSyntaxValidation: false,
                      noSuggestionDiagnostics: true,
                    });
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    padding: { top: 15, bottom: 15 },
                    // Additional options to reduce validation
                    quickSuggestions: false,
                    parameterHints: { enabled: false },
                    suggestOnTriggerCharacters: false,
                    acceptSuggestionOnEnter: "off",
                    tabCompletion: "off",
                    wordBasedSuggestions: "off",
                  }}
                />
              </div>
            </div>

            {/* Right Column - Explanation Section */}
            <div className="flex flex-col space-y-3 min-h-[500px]">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Explanation
              </h4>

              <div className="flex-1 min-h-[450px]">
                <CodeExplanationEditor
                  content={block.explanation}
                  onUpdate={(content) => updateBlockExplanation(block.id, content)}
                  isSubmitting={isSubmitting}
                  blockId={block.id}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode - Formatted display */
          <div className="border rounded-lg border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20">
            {/* Preview Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center">
                {title || "Untitled Code Block"}
              </h3>
            </div>

            {/* Preview Content */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-gray-200 dark:divide-gray-700">
              {/* Code Preview */}
              <div className="max-h-[600px] overflow-auto">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Code ({block.language})
                  </h4>
                </div>
                {block.code ? (
                  <SyntaxHighlighter
                    language={block.language || "typescript"}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      height: 'calc(100% - 40px)',
                      minHeight: 'calc(100% - 40px)',
                      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    }}
                    showLineNumbers
                    lineNumberStyle={{
                      fontSize: '11px',
                      color: '#6b7280'
                    }}
                  >
                    {block.code}
                  </SyntaxHighlighter>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 italic">
                    No code added yet
                  </div>
                )}
              </div>

              {/* Explanation Preview */}
              <div className="max-h-[600px] overflow-auto bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-pink-900/10">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Explanation
                  </h4>
                </div>
                {block.explanation ? (
                  <div className="p-4 prose prose-sm prose-gray dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        img: ({ node, ...props }) => (
                          <div className="my-2 flex justify-center">
                            <Image 
                              src={props.src || ''}
                              alt={props.alt || "Explanation image"}
                              width={256}
                              height={128}
                              className="max-h-32 rounded shadow-sm max-w-full h-auto" 
                            />
                          </div>
                        ),
                        p: ({ node, ...props }) => <p {...props} className="text-sm leading-relaxed mb-2" />,
                        h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-semibold mb-3" />,
                        h2: ({ node, ...props }) => <h2 {...props} className="text-md font-semibold mb-2" />,
                        h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-medium mb-2" />,
                        code: ({ node, ...props }) => <code {...props} className="text-sm bg-purple-100 dark:bg-purple-900/30 px-1 rounded" />,
                        ul: ({ node, ...props }) => <ul {...props} className="text-sm space-y-1 mb-2" />,
                        ol: ({ node, ...props }) => <ol {...props} className="text-sm space-y-1 mb-2" />,
                      }}
                    >
                      {block.explanation}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 italic">
                    No explanation added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
