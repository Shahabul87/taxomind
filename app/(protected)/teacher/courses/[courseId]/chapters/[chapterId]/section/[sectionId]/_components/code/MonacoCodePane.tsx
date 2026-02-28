"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { editor } from "monaco-editor";
import type {
  MonacoCodePaneProps,
  LineRange,
  LineExplanation,
} from "./code-explanation.types";
import {
  isLineInRange,
  getExplanationColor,
  getExplanationBorderColor,
} from "./code-explanation.types";

import { MonacoEditor as Editor } from "@/components/lazy-imports";

/**
 * Monaco Editor pane with line selection support
 *
 * Features:
 * - Click on line numbers to select single line
 * - Click and drag to select line range
 * - Visual indicators for lines with explanations
 * - Highlights selected range
 */
export function MonacoCodePane({
  code,
  language,
  explanations = [],
  selectedRange,
  onCodeChange,
  onLineSelect,
  onExplanationHover,
  readOnly = false,
}: MonacoCodePaneProps) {
  // Ensure explanations is always a stable array reference
  const safeExplanations = useMemo(() => explanations || [], [explanations]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef<number | null>(null);

  /**
   * Apply decorations to highlight explained lines and selected range
   */
  const applyDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const decorations: editor.IModelDeltaDecoration[] = [];

    // Add decorations for each explanation (colored background)
    safeExplanations.forEach((exp, index) => {
      decorations.push({
        range: new monaco.Range(exp.lineStart, 1, exp.lineEnd, 1),
        options: {
          isWholeLine: true,
          className: `explanation-highlight-${index}`,
          glyphMarginClassName: "explanation-gutter-marker",
          minimap: {
            color: getExplanationBorderColor(index),
            position: 1,
          },
          overviewRuler: {
            color: getExplanationBorderColor(index),
            position: 4,
          },
        },
      });

      // Add gutter decoration (dot marker)
      decorations.push({
        range: new monaco.Range(exp.lineStart, 1, exp.lineStart, 1),
        options: {
          glyphMarginClassName: "explanation-gutter-dot",
          glyphMarginHoverMessage: { value: `**${exp.title}**\nLines ${exp.lineStart}-${exp.lineEnd}` },
        },
      });
    });

    // Add decoration for selected range (yellow highlight)
    if (selectedRange) {
      decorations.push({
        range: new monaco.Range(
          selectedRange.start,
          1,
          selectedRange.end,
          1
        ),
        options: {
          isWholeLine: true,
          className: "selected-line-highlight",
          minimap: {
            color: "rgba(250, 204, 21, 0.5)",
            position: 1,
          },
        },
      });
    }

    // Apply decorations
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations
    );
  }, [safeExplanations, selectedRange]);

  // Update decorations when explanations or selection changes
  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  /**
   * Handle editor mount - set up event listeners
   */
  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add CSS styles for decorations
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        /* Explanation highlight backgrounds */
        ${safeExplanations
          .map(
            (_, index) => `
          .explanation-highlight-${index} {
            background-color: ${getExplanationColor(index)} !important;
            border-left: 3px solid ${getExplanationBorderColor(index)} !important;
          }
        `
          )
          .join("")}

        /* Selected line highlight */
        .selected-line-highlight {
          background-color: rgba(250, 204, 21, 0.3) !important;
          border-left: 3px solid rgba(250, 204, 21, 0.8) !important;
        }

        /* Gutter marker dot */
        .explanation-gutter-dot {
          background: radial-gradient(circle, #3b82f6 30%, transparent 30%);
          cursor: pointer;
        }

        /* Gutter marker for explained lines */
        .explanation-gutter-marker {
          background-color: rgba(59, 130, 246, 0.2);
        }

        /* Make line numbers clickable */
        .monaco-editor .margin-view-overlays .line-numbers {
          cursor: pointer;
        }
      `;
      document.head.appendChild(styleElement);

      // Handle mouse down on gutter (line numbers)
      editor.onMouseDown((e) => {
        const target = e.target;

        // Check if clicked on line numbers or gutter
        if (
          target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
        ) {
          const lineNumber = target.position?.lineNumber;
          if (lineNumber) {
            isSelectingRef.current = true;
            selectionStartRef.current = lineNumber;
            onLineSelect({ start: lineNumber, end: lineNumber });
          }
        }
      });

      // Handle mouse move for drag selection
      editor.onMouseMove((e) => {
        if (!isSelectingRef.current || selectionStartRef.current === null) return;

        const target = e.target;
        const lineNumber = target.position?.lineNumber;

        if (lineNumber) {
          const start = Math.min(selectionStartRef.current, lineNumber);
          const end = Math.max(selectionStartRef.current, lineNumber);
          onLineSelect({ start, end });
        }
      });

      // Handle mouse up to end selection
      editor.onMouseUp(() => {
        isSelectingRef.current = false;
        selectionStartRef.current = null;
      });

      // Handle mouse leave to end selection if mouse leaves editor
      editor.onMouseLeave(() => {
        if (isSelectingRef.current) {
          isSelectingRef.current = false;
          selectionStartRef.current = null;
        }
      });

      // Handle hover over lines to show explanation preview
      editor.onMouseMove((e) => {
        if (isSelectingRef.current) return;

        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          // Find if this line has an explanation
          const explanation = safeExplanations.find((exp) =>
            isLineInRange(lineNumber, { start: exp.lineStart, end: exp.lineEnd })
          );
          onExplanationHover(explanation || null);
        }
      });

      // Clear hover when mouse leaves
      editor.onMouseLeave(() => {
        onExplanationHover(null);
      });

      // Initial decorations
      applyDecorations();
    },
    [safeExplanations, onLineSelect, onExplanationHover, applyDecorations]
  );

  /**
   * Handle editor before mount - configure Monaco settings
   */
  const handleBeforeMount = useCallback(
    (monaco: typeof import("monaco-editor")) => {
      // Disable ALL diagnostics to prevent red squiggly lines
      // This is for code explanation purposes, not actual code editing
      // Use type assertion since monaco.languages.typescript is marked deprecated but still works
      const tsLanguages = monaco.languages as unknown as {
        typescript?: {
          typescriptDefaults?: {
            setDiagnosticsOptions: (options: {
              noSemanticValidation: boolean;
              noSyntaxValidation: boolean;
              noSuggestionDiagnostics: boolean;
            }) => void;
          };
          javascriptDefaults?: {
            setDiagnosticsOptions: (options: {
              noSemanticValidation: boolean;
              noSyntaxValidation: boolean;
              noSuggestionDiagnostics: boolean;
            }) => void;
          };
        };
        json?: {
          jsonDefaults?: {
            setDiagnosticsOptions?: (options: {
              validate: boolean;
              allowComments: boolean;
              schemaValidation: string;
            }) => void;
          };
        };
      };

      tsLanguages.typescript?.typescriptDefaults?.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      tsLanguages.typescript?.javascriptDefaults?.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });

      // Disable validation for JSON as well
      tsLanguages.json?.jsonDefaults?.setDiagnosticsOptions?.({
        validate: false,
        allowComments: true,
        schemaValidation: "ignore",
      });
    },
    []
  );

  /**
   * Highlight a specific line range (called when hovering over explanation)
   */
  const highlightLines = useCallback((range: LineRange | null) => {
    if (!editorRef.current) return;

    if (range) {
      editorRef.current.revealLineInCenter(range.start);
    }
  }, []);

  // Expose highlight function via ref if needed
  useEffect(() => {
    if (selectedRange) {
      highlightLines(selectedRange);
    }
  }, [selectedRange, highlightLines]);

  return (
    <div className="relative h-full w-full">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">
          {language.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
          Click line numbers to select
        </span>
      </div>

      {/* Editor */}
      <div className="pt-10 h-full">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          theme="vs-dark"
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: true, scale: 1 },
            fontSize: 14,
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            wordWrap: "off",
            scrollBeyondLastLine: false,
            scrollbar: {
              horizontal: "auto",
              vertical: "auto",
              horizontalScrollbarSize: 10,
              verticalScrollbarSize: 10,
            },
            padding: { top: 10, bottom: 10 },
            quickSuggestions: false,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: "off",
            tabCompletion: "off",
            wordBasedSuggestions: "off",
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            // Disable validation markers (red squiggly lines)
            renderValidationDecorations: "off",
          }}
        />
      </div>

      {/* Selection indicator */}
      {selectedRange && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-yellow-500/20 border-t border-yellow-500/30 text-xs text-yellow-200">
          Selected: Lines {selectedRange.start}
          {selectedRange.start !== selectedRange.end &&
            ` - ${selectedRange.end}`}
        </div>
      )}
    </div>
  );
}
