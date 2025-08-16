"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Code2, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface CodeBlock {
  code: string;
  explanation: string;
  language?: string;
}

interface DisplayExplanationsProps {
  items: {
    id: string;
    heading: string | null;
    code: string | null;
    explanation: string | null;
  }[];
  onCreateClick: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

// Helper function to parse code blocks
const parseCodeBlocks = (code: string | null, explanation: string | null): CodeBlock[] => {
  if (!code || !explanation) return [];
  
  const codeBlocks = code.split(/\/\/ Next Code Block\n\n/);
  const explanationBlocks = explanation.split(/<hr \/>/);
  
  return codeBlocks.map((code, index) => ({
    code: code.trim(),
    explanation: explanationBlocks[index] ? explanationBlocks[index].trim() : '',
    language: detectLanguage(code),
  }));
};

// Helper to detect code language
const detectLanguage = (code: string): string => {
  if (code.includes('function') || code.includes('const') || code.includes('let')) return 'javascript';
  if (code.includes('import') && code.includes('from')) return 'typescript';
  if (code.includes('<div') || code.includes('</div>')) return 'html';
  if (code.includes('class') && code.includes('{')) return 'css';
  if (code.includes('def ') || code.includes('import ') && !code.includes('from')) return 'python';
  return 'typescript';
};

export const DisplayExplanations = ({ 
  items, 
  onCreateClick, 
  onEdit,
  onDelete 
}: DisplayExplanationsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, number>>({});

  // Initialize expanded state for all items
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    const initialExpandedBlocks: Record<string, number> = {};
    
    items.forEach(item => {
      initialExpandedState[item.id] = false;
      initialExpandedBlocks[item.id] = 0; // Show first block by default
    });
    
    setExpandedItems(initialExpandedState);
    setExpandedBlocks(initialExpandedBlocks);
  }, [items]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDelete(id);
      toast.success("Explanation deleted successfully");
    } catch (error: any) {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
          <Code2 className="h-8 w-8 text-gray-500 dark:text-gray-400 mb-3" />
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
            No Explanations Yet
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-3">
            Add your first code explanation
          </p>
          <Button
            onClick={onCreateClick}
            size="sm"
            className="h-8 px-3 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
          >
            Add Explanation
          </Button>
        </div>
      ) : (
        items.map((item) => {
          const codeBlocks = parseCodeBlocks(item.code, item.explanation);
          const currentBlockIndex = expandedBlocks[item.id] || 0;
          const currentBlock = codeBlocks[currentBlockIndex] || { code: '', explanation: '' };
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded border border-gray-300 dark:border-gray-600 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              {/* Header with controls */}
              <div className="flex justify-between items-center bg-gradient-to-r from-gray-100 via-blue-100 to-indigo-100 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/30 p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Code2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.heading}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => toggleExpand(item.id)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
                  >
                    {expandedItems[item.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button
                    onClick={() => onEdit(item.id)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ConfirmModal 
                    onConfirm={() => handleDelete(item.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-600 hover:text-red-700 dark:text-gray-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </ConfirmModal>
                </div>
              </div>
              
              {/* Block navigation (if multiple blocks) */}
              {expandedItems[item.id] && codeBlocks.length > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Block {currentBlockIndex + 1} of {codeBlocks.length}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => setExpandedBlocks(prev => ({
                        ...prev,
                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                      }))}
                      variant="outline"
                      size="sm"
                      disabled={currentBlockIndex === 0}
                      className="h-6 px-2 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Prev
                    </Button>
                    <Button
                      onClick={() => setExpandedBlocks(prev => ({
                        ...prev,
                        [item.id]: Math.min(codeBlocks.length - 1, (prev[item.id] || 0) + 1)
                      }))}
                      variant="outline"
                      size="sm"
                      disabled={currentBlockIndex === codeBlocks.length - 1}
                      className="h-6 px-2 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Content area */}
              {expandedItems[item.id] && (
                <div className="h-96 overflow-hidden">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-gray-200 dark:divide-gray-700 h-full">
                    {/* Code section */}
                    <div className="h-full overflow-auto bg-gray-900">
                      <SyntaxHighlighter
                        language={currentBlock.language || "typescript"}
                        style={atomDark}
                        customStyle={{
                          margin: 0,
                          padding: '12px',
                          fontSize: '12px',
                          lineHeight: '1.4',
                          height: '100%',
                          minHeight: '100%',
                          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                        }}
                        showLineNumbers
                        lineNumberStyle={{
                          fontSize: '10px',
                          color: '#6b7280'
                        }}
                      >
                        {currentBlock.code || '// No code available'}
                      </SyntaxHighlighter>
                    </div>

                    {/* Explanation section */}
                    <div className="p-3 overflow-auto h-full bg-gradient-to-br from-white via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-pink-900/10">
                      <div className="prose prose-xs prose-gray dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
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
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            ),
                            p: ({ node, ...props }) => {
                              return <p {...props} className="text-xs leading-relaxed" />;
                            },
                            h1: ({ node, ...props }) => <h1 {...props} className="text-sm font-semibold mb-2" />,
                            h2: ({ node, ...props }) => <h2 {...props} className="text-xs font-semibold mb-1" />,
                            h3: ({ node, ...props }) => <h3 {...props} className="text-xs font-medium mb-1" />,
                            code: ({ node, ...props }) => <code {...props} className="text-xs bg-purple-100 dark:bg-purple-900/30 px-1 rounded" />,
                            ul: ({ node, ...props }) => <ul {...props} className="text-xs space-y-1" />,
                            ol: ({ node, ...props }) => <ol {...props} className="text-xs space-y-1" />,
                          }}
                        >
                          {currentBlock.explanation || 'No explanation available.'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}; 