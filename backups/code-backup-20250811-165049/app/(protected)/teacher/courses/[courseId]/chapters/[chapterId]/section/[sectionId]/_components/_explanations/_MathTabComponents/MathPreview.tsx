"use client";

import Image from "next/image";
import { XCircle } from "lucide-react";
import ContentViewer from "@/components/tiptap/content-viewer";
import MathRenderer from "@/components/MathRenderer";
import "katex/dist/katex.min.css";

interface MathPreviewProps {
  title: string;
  editorMode: "equation" | "visual";
  equation: string;
  explanation: string;
  content: string;
  imageUrl: string;
  previewError: string | null;
}

export const MathPreview = ({
  title,
  editorMode,
  equation,
  explanation,
  content,
  imageUrl,
  previewError
}: MathPreviewProps) => {
  if (previewError) {
    return (
      <div className="flex items-center justify-center h-full text-red-300">
        <XCircle className="h-5 w-5 mr-2" />
        <span>{previewError}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-xl font-bold text-white mb-6">
          {title}
        </h3>
      )}
      
      {/* Two Column Layout for Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {/* Left Column - Equation/Image */}
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            {editorMode === "equation" ? "Mathematical Equation" : "Equation Image"}
          </h4>
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-lg border border-amber-400/30 p-6">
            {editorMode === "equation" && equation ? (
              <div className="w-full">
                <MathRenderer 
                  equation={equation} 
                  mode="block"
                  size="large"
                  theme="light"
                  className="w-full"
                />
              </div>
            ) : editorMode === "visual" && imageUrl ? (
              <div className="rounded-lg shadow-sm max-w-full overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={title}
                  width={200}
                  height={200}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="w-16 h-16 mx-auto mb-3 bg-amber-400/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-amber-300">
                    {editorMode === "equation" ? "∫" : "🖼️"}
                  </span>
                </div>
                <p className="text-sm">
                  {editorMode === "equation" ? "No equation entered" : "No image uploaded"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Explanation */}
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            Explanation
          </h4>
          <div className="flex-1 bg-gradient-to-br from-slate-800/30 to-slate-700/30 rounded-lg border border-amber-400/30 p-1">
            <div className="h-full bg-slate-700/40 rounded-md p-4 overflow-y-auto max-h-[350px]">
              {editorMode === "equation" && explanation ? (
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </div>
              ) : editorMode === "visual" && content ? (
                <div className="text-gray-200 leading-relaxed prose prose-sm prose-invert max-w-none">
                  <ContentViewer content={content} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-400">
                  <div>
                    <div className="w-12 h-12 mx-auto mb-3 bg-amber-400/20 rounded-full flex items-center justify-center">
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
    </div>
  );
}; 