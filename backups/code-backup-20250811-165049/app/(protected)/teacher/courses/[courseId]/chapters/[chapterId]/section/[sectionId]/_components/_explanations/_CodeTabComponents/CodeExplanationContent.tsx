"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { parseExplanationBlocks } from '../utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeExplanationContentProps {
  item: {
    code?: string | null;
    explanation?: string | null;
  };
}

export const CodeExplanationContent = ({ item }: CodeExplanationContentProps) => {
  const explanationBlocks = parseExplanationBlocks(item.explanation || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Code Section */}
      <div className="bg-gray-950 rounded-xl p-6 border border-gray-700 shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-400 text-sm ml-2 font-mono">code.js</span>
        </div>
        
        <div className="overflow-auto max-h-96">
          <SyntaxHighlighter
            language="javascript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              backgroundColor: 'transparent',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
            wrapLongLines={true}
          >
            {item.code || '// No code provided'}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Explanation
        </h4>
        
        <div className="prose prose-gray dark:prose-invert prose-sm max-w-none overflow-auto max-h-96">
          <ReactMarkdown
            className={cn(
              "text-gray-700 dark:text-gray-300",
              "prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
              "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
              "prose-code:text-blue-600 dark:prose-code:text-blue-400",
              "prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900",
              "prose-pre:text-sm prose-pre:leading-relaxed"
            )}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {item.explanation || 'No explanation provided.'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}; 