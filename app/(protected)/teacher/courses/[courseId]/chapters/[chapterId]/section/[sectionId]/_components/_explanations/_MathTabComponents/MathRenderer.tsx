"use client";

import React from "react";
import { BlockMath, InlineMath } from "react-katex";
import { logger } from '@/lib/logger';
import "katex/dist/katex.min.css";

// Custom CSS to ensure equations are always visible
const katexStyles = `
  .katex-equation-container .katex {
    color: #000000 !important;
  }
  .katex-equation-container .katex * {
    color: #000000 !important;
  }
  .katex-equation-container .katex-html {
    color: #000000 !important;
  }
  .katex-equation-container .mord,
  .katex-equation-container .mop,
  .katex-equation-container .mbin,
  .katex-equation-container .mrel,
  .katex-equation-container .mpunct,
  .katex-equation-container .mopen,
  .katex-equation-container .mclose {
    color: #000000 !important;
  }
`;

interface MathRendererProps {
  equation: string;
  isBlockMode?: boolean;
  className?: string;
}

export const MathRenderer = ({ 
  equation, 
  isBlockMode = false, 
  className = "" 
}: MathRendererProps) => {
  if (!equation || equation.trim() === "") {
    return (
      <div className={`p-4 text-center text-gray-400 italic ${className}`}>
        No equation to display
      </div>
    );
  }

  // Clean up the equation string
  const cleanedEquation = equation.trim();

  try {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: katexStyles }} />
        <div className={`bg-white p-6 rounded-lg border shadow-sm ${className}`}>
          <div className="text-center">
            <div 
              className="katex-equation-container bg-gray-50 p-4 rounded-lg border" 
              style={{ 
                fontSize: '1.2em', 
                lineHeight: '1.5', 
                color: '#000000' 
              }}
            >
              {isBlockMode ? (
                <BlockMath math={cleanedEquation} />
              ) : (
                <InlineMath math={cleanedEquation} />
              )}
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    logger.error("KaTeX rendering error:", error);
    // If KaTeX fails to render, show error state with raw equation
    return (
      <div className={`bg-red-50 border border-red-200 p-4 rounded-lg ${className}`}>
        <div className="text-red-600 text-sm font-medium mb-2">
          Unable to render equation
        </div>
        <div className="text-sm text-gray-700 font-mono bg-white p-2 rounded border mb-2">
          {cleanedEquation}
        </div>
        
        {/* Manual fallback rendering */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mt-3">
          <div className="text-blue-700 text-sm font-medium mb-1">Fallback Display:</div>
          <div className="text-lg font-mono text-center bg-white p-2 rounded border">
            {cleanedEquation.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                           .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                           .replace(/\\pm/g, '±')
                           .replace(/\^(\w+)/g, '^$1')
                           .replace(/_(\w+)/g, '_$1')}
          </div>
        </div>
        
        <div className="text-xs text-red-500 mt-2">
          Please check your LaTeX syntax. Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }
};

// Advanced version with more features
interface AdvancedMathRendererProps {
  equation: string;
  title?: string;
  description?: string;
  showRawEquation?: boolean;
  allowToggleMode?: boolean;
}

export const AdvancedMathRenderer = ({ 
  equation, 
  title,
  description,
  showRawEquation = false,
  allowToggleMode = true
}: AdvancedMathRendererProps) => {
  const [isBlockMode, setIsBlockMode] = React.useState(true);

  if (!equation || equation.trim() === "") {
    return (
      <div className="bg-slate-100 p-6 rounded-lg text-center">
        <div className="text-gray-400 text-lg mb-2">📝</div>
        <div className="text-gray-500">No equation added yet</div>
      </div>
    );
  }

  const cleanedEquation = equation.trim();

  try {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: katexStyles }} />
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          {(title || allowToggleMode) && (
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                )}
                {allowToggleMode && (
                  <button
                    onClick={() => setIsBlockMode(!isBlockMode)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {isBlockMode ? "Inline" : "Block"} Mode
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Equation Display */}
          <div className="p-6">
            <div className="text-center">
              <div 
                className="katex-equation-container bg-gray-50 p-4 rounded-lg border"
                style={{ 
                  fontSize: '1.4em', 
                  lineHeight: '1.6',
                  color: '#000000'
                }}
              >
                {isBlockMode ? (
                  <BlockMath math={cleanedEquation} />
                ) : (
                  <InlineMath math={cleanedEquation} />
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                {description}
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch (error) {
    logger.error("Advanced KaTeX rendering error:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-red-500">⚠️</div>
          <div className="text-red-700 font-medium">Equation Rendering Error</div>
        </div>
        <div className="bg-white p-3 rounded border font-mono text-sm mb-3">
          {cleanedEquation}
        </div>
        
        {/* Better fallback display */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <div className="text-blue-700 text-sm font-medium mb-1">Simplified Display:</div>
          <div className="text-lg text-center bg-white p-2 rounded border">
            {cleanedEquation.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                           .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                           .replace(/\\pm/g, '±')
                           .replace(/\^(\w+)/g, '^$1')
                           .replace(/_(\w+)/g, '_$1')}
          </div>
        </div>
        
        <div className="text-xs text-red-600 mt-2">
          KaTeX Error: {error instanceof Error ? error.message : 'Unknown rendering error'}. Please check your LaTeX syntax.
        </div>
      </div>
    );
  }
}; 