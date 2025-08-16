"use client";

import Image from "next/image";
import { ExplanationItem } from "../types";
import MathRenderer from "@/components/MathRenderer";

interface MathExplanationContentProps {
  item: ExplanationItem;
}

export const MathExplanationContent = ({ item }: MathExplanationContentProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      {/* Two Column Layout - Equation and Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 min-h-[300px]">
        {/* Left Column - Equation/Image */}
        <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Display equation if in equation mode and equation exists */}
          {item.mode === "equation" && item.equation && item.equation.trim() ? (
            <div className="w-full">
              <MathRenderer 
                equation={item.equation} 
                mode="block"
                size="medium"
                theme="auto"
                className="w-full border-0 shadow-none bg-transparent"
              />
            </div>
          ) : 
          /* Display image if in visual mode and image exists */
          item.mode === "visual" && item.imageUrl && item.imageUrl.trim() ? (
            <div className="w-full h-full rounded-lg shadow-sm overflow-hidden">
              <Image 
                src={item.imageUrl} 
                alt={item.heading || "Math equation"} 
                className="w-full h-full object-contain rounded-lg" 
                style={{ minHeight: '200px', width: '100%', height: '100%' }}
                width={800}
                height={600}
                priority
              />
            </div>
          ) : 
          /* Fallback - show equation if available */
          item.equation && item.equation.trim() ? (
            <div className="w-full">
              <MathRenderer 
                equation={item.equation} 
                mode="block"
                size="medium"
                theme="auto"
                className="w-full border-0 shadow-none bg-transparent"
              />
            </div>
          ) : 
          /* Another fallback - show image if available */
          item.imageUrl && item.imageUrl.trim() ? (
            <div className="w-full h-full rounded-lg shadow-sm overflow-hidden">
              <Image 
                src={item.imageUrl} 
                alt={item.heading || "Math equation"} 
                width={800}
                height={600}
                className="w-full h-full object-contain rounded-lg" 
                style={{ minHeight: '200px', width: '100%', height: '100%' }}
                priority
              />
            </div>
          ) : (
            /* No content available */
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm">No equation or image available</p>
            </div>
          )}
        </div>

        {/* Right Column - Explanation */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
          <div className="h-full bg-white dark:bg-gray-800 rounded-md p-4 overflow-y-auto max-h-[250px] scrollbar-hide">
            {item.explanation && item.explanation.trim() ? (
              <div 
                className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-purple-600 dark:prose-code:text-purple-400"
                dangerouslySetInnerHTML={{ __html: item.explanation }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-xl">📝</span>
                  </div>
                  <p className="text-sm">No explanation provided</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 