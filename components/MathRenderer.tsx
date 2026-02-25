"use client";

import React, { useState, useEffect } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { AlertCircle, Copy, Eye, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';
import "katex/dist/katex.min.css";
import { createRichSanitizedMarkup } from '@/lib/utils/sanitize-html';

// Custom CSS to ensure equations are always visible
const katexStyles = `
  .math-renderer-container .katex {
    color: #000000 !important;
  }
  .math-renderer-container .katex * {
    color: #000000 !important;
  }
  .math-renderer-container .katex-html {
    color: #000000 !important;
  }
  .math-renderer-container .mord,
  .math-renderer-container .mop,
  .math-renderer-container .mbin,
  .math-renderer-container .mrel,
  .math-renderer-container .mpunct,
  .math-renderer-container .mopen,
  .math-renderer-container .mclose {
    color: #000000 !important;
  }
  
  /* Dark theme support */
  .math-renderer-dark .katex {
    color: #ffffff !important;
  }
  .math-renderer-dark .katex * {
    color: #ffffff !important;
  }
  .math-renderer-dark .katex-html {
    color: #ffffff !important;
  }
  .math-renderer-dark .mord,
  .math-renderer-dark .mop,
  .math-renderer-dark .mbin,
  .math-renderer-dark .mrel,
  .math-renderer-dark .mpunct,
  .math-renderer-dark .mopen,
  .math-renderer-dark .mclose {
    color: #ffffff !important;
  }
`;

export type MathTheme = "light" | "dark" | "auto";
export type MathSize = "small" | "medium" | "large" | "xlarge";
export type MathDisplayMode = "inline" | "block";

export interface MathRendererProps {
  /** The LaTeX equation string to render */
  equation: string;
  /** Display mode - inline or block */
  mode?: MathDisplayMode;
  /** Size of the rendered equation */
  size?: MathSize;
  /** Theme for the equation */
  theme?: MathTheme;
  /** Additional CSS classes */
  className?: string;
  /** Show error details when rendering fails */
  showErrorDetails?: boolean;
  /** Enable copy to clipboard functionality */
  enableCopy?: boolean;
  /** Show LaTeX source toggle */
  showSourceToggle?: boolean;
  /** Show mode toggle (inline/block) */
  showModeToggle?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Callback when rendering succeeds */
  onRenderSuccess?: () => void;
  /** Callback when rendering fails */
  onRenderError?: (error: Error) => void;
  /** Callback when equation is copied */
  onCopy?: () => void;
}

const sizeClasses: Record<MathSize, string> = {
  small: "text-sm",
  medium: "text-base", 
  large: "text-lg",
  xlarge: "text-xl"
};

const sizeStyles: Record<MathSize, React.CSSProperties> = {
  small: { fontSize: '0.9em', lineHeight: '1.4' },
  medium: { fontSize: '1.1em', lineHeight: '1.5' },
  large: { fontSize: '1.3em', lineHeight: '1.6' },
  xlarge: { fontSize: '1.5em', lineHeight: '1.7' }
};

export const MathRenderer: React.FC<MathRendererProps> = ({
  equation,
  mode = "block",
  size = "medium",
  theme = "light",
  className = "",
  showErrorDetails = true,
  enableCopy = false,
  showSourceToggle = false,
  showModeToggle = false,
  errorMessage,
  loading = false,
  onRenderSuccess,
  onRenderError,
  onCopy
}) => {
  const [currentMode, setCurrentMode] = useState<MathDisplayMode>(mode);
  const [showSource, setShowSource] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean up the equation string
  const cleanedEquation = equation?.trim() || "";

  // Reset error when equation changes
  useEffect(() => {
    setRenderError(null);
  }, [equation]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanedEquation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (error: any) {
      logger.error("Failed to copy equation:", error);
    }
  };

  // Create fallback equation display
  const createFallbackDisplay = (equation: string): string => {
    return equation
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\pm/g, '±')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\leq/g, '≤')
      .replace(/\\geq/g, '≥')
      .replace(/\\neq/g, '≠')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\gamma/g, 'γ')
      .replace(/\\delta/g, 'δ')
      .replace(/\\pi/g, 'π')
      .replace(/\\theta/g, 'θ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\sum/g, '∑')
      .replace(/\\int/g, '∫')
      .replace(/\\infty/g, '∞')
      .replace(/\^(\w+)/g, '^$1')
      .replace(/_(\w+)/g, '_$1');
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-500">Rendering equation...</span>
      </div>
    );
  }

  // Empty state
  if (!cleanedEquation) {
    return (
      <div className={cn("p-4 text-center text-gray-400 italic border-2 border-dashed border-gray-300 rounded-lg", className)}>
        <div className="text-2xl mb-2">📐</div>
        <p className="text-sm">No equation provided</p>
      </div>
    );
  }

  // Determine theme classes
  const isDark = theme === "dark" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const themeClass = isDark ? "math-renderer-dark" : "math-renderer-container";

  // Render equation
  const renderEquation = () => {
    try {
      const MathComponent = currentMode === "block" ? BlockMath : InlineMath;
      const result = <MathComponent math={cleanedEquation} />;
      
      // Call success callback
      if (onRenderSuccess && !renderError) {
        onRenderSuccess();
      }
      
      return result;
    } catch (error: any) {
      const renderErr = error as Error;
      setRenderError(renderErr);
      onRenderError?.(renderErr);
      throw error;
    }
  };

  // Error state
  if (renderError) {
    return (
      <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div className="text-red-700 font-medium">
            {errorMessage || "Failed to render equation"}
          </div>
        </div>
        
        {/* Fallback display */}
        <div className="bg-white border border-red-200 rounded p-3 mb-3">
          <div className="text-sm text-gray-600 mb-1">Simplified display:</div>
          <div className={cn("font-mono text-center", sizeClasses[size])}>
            {createFallbackDisplay(cleanedEquation)}
          </div>
        </div>

        {/* Raw equation */}
        <div className="bg-gray-50 border rounded p-2">
          <div className="text-xs text-gray-500 mb-1">LaTeX source:</div>
          <div className="font-mono text-xs text-gray-700 break-all">
            {cleanedEquation}
          </div>
        </div>

        {showErrorDetails && (
          <div className="mt-3 text-xs text-red-600">
            Error: {renderError.message}
          </div>
        )}

        <button
          onClick={() => setRenderError(null)}
          className="mt-3 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Try again
        </button>
      </div>
    );
  }

  // Main render
  try {
    return (
      <>
        <style dangerouslySetInnerHTML={createRichSanitizedMarkup(katexStyles)} />
        <div className={cn("bg-white rounded-lg border shadow-sm overflow-hidden", className)}>
          {/* Controls */}
          {(enableCopy || showSourceToggle || showModeToggle) && (
            <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showModeToggle && (
                  <button
                    onClick={() => setCurrentMode(currentMode === "block" ? "inline" : "block")}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {currentMode === "block" ? "Inline" : "Block"}
                  </button>
                )}
                {showSourceToggle && (
                  <button
                    onClick={() => setShowSource(!showSource)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    {showSource ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showSource ? "Hide" : "Show"} Source
                  </button>
                )}
              </div>
              
              {enableCopy && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    "text-xs px-2 py-1 rounded transition-colors flex items-center gap-1",
                    copied 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          )}

          {/* Equation Display */}
          <div className="p-6">
            <div className="text-center">
              <div 
                className={cn(
                  themeClass,
                  "bg-gray-50 p-4 rounded-lg border",
                  isDark && "bg-gray-800 border-gray-600"
                )}
                style={sizeStyles[size]}
              >
                {renderEquation()}
              </div>
            </div>

            {/* Source Display */}
            {showSourceToggle && showSource && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">LaTeX Source:</div>
                <div className="font-mono text-sm bg-gray-50 p-3 rounded border break-all">
                  {cleanedEquation}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch (error: any) {
    const renderErr = error as Error;
    setRenderError(renderErr);
    onRenderError?.(renderErr);
    return null; // Will re-render with error state
  }
};

// Export additional utilities
export const validateLatex = (equation: string): { valid: boolean; error?: string } => {
  try {
    // Basic validation - check for balanced braces
    const openBraces = (equation.match(/\{/g) || []).length;
    const closeBraces = (equation.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return { valid: false, error: "Unmatched braces" };
    }
    
    // Check for common invalid patterns
    if (equation.includes("\\")) {
      // Valid LaTeX command structure
      return { valid: true };
    }
    
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: (error as Error).message };
  }
};

export default MathRenderer; 