"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Play,
  Terminal,
  FileCode,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Note: Install Prism.js for syntax highlighting
// npm install prismjs @types/prismjs
// Import in your layout: import 'prismjs/themes/prism-tomorrow.css';

interface CodeExplanation {
  id: string;
  title: string;
  code: string;
  explanation?: string;
  language?: string;
  output?: string;
  runnable?: boolean;
}

interface CodeSyntaxHighlighterProps {
  code: CodeExplanation;
  isCompleted: boolean;
  canMarkComplete: boolean;
  onMarkComplete: (id: string) => void;
}

export function CodeSyntaxHighlighter({
  code,
  isCompleted,
  canMarkComplete,
  onMarkComplete,
}: CodeSyntaxHighlighterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "output">("code");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code.code);
    toast.success("Code copied to clipboard!");
  };

  const downloadCode = () => {
    const blob = new Blob([code.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${code.title.toLowerCase().replace(/\s+/g, "-")}.${
      code.language || "txt"
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const getLanguageLabel = () => {
    const languageMap: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
      csharp: "C#",
      go: "Go",
      rust: "Rust",
      sql: "SQL",
      html: "HTML",
      css: "CSS",
      jsx: "React JSX",
      tsx: "React TSX",
    };
    return languageMap[code.language || ""] || code.language || "Plain Text";
  };

  const getLanguageColor = () => {
    const colorMap: Record<string, string> = {
      javascript: "bg-yellow-500",
      typescript: "bg-blue-500",
      python: "bg-green-500",
      java: "bg-red-500",
      cpp: "bg-purple-500",
      csharp: "bg-indigo-500",
      go: "bg-cyan-500",
      rust: "bg-orange-500",
      sql: "bg-pink-500",
    };
    return colorMap[code.language || ""] || "bg-gray-500";
  };

  // Apply basic syntax highlighting (enhanced version would use Prism.js)
  const highlightCode = (codeText: string) => {
    // SECURITY: Escape HTML first to prevent XSS attacks
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    let highlighted = escapeHtml(codeText);

    // Highlight keywords (simplified)
    const keywords = [
      "function",
      "const",
      "let",
      "var",
      "if",
      "else",
      "for",
      "while",
      "return",
      "class",
      "interface",
      "type",
      "import",
      "export",
      "async",
      "await",
    ];

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      highlighted = highlighted.replace(
        regex,
        `<span class="text-purple-400">${keyword}</span>`
      );
    });

    // Highlight strings (simplified) - Note: HTML is already escaped
    highlighted = highlighted.replace(
      /(&quot;|&#039;)(?:(?=(\\?))\2.)*?\1/g,
      '<span class="text-green-400">$&</span>'
    );

    // Highlight comments (simplified)
    highlighted = highlighted.replace(
      /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm,
      '<span class="text-gray-500 italic">$&</span>'
    );

    return highlighted;
  };

  return (
    <Card className={cn("overflow-hidden", isCompleted && "border-green-500")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-500" />
              {code.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs text-white", getLanguageColor())}>
              {getLanguageLabel()}
            </Badge>
            {isCompleted && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {/* Code and Output Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="code" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Code
            </TabsTrigger>
            {code.output && (
              <TabsTrigger value="output" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Output
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="code" className="mt-0">
            <div className="relative">
              {/* Toolbar */}
              <div className="absolute top-0 right-0 z-10 flex items-center gap-1 p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="h-8 w-8 p-0 hover:bg-gray-800"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={downloadCode}
                  className="h-8 w-8 p-0 hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 text-gray-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0 hover:bg-gray-800"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
                {code.runnable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 hover:bg-gray-800"
                    onClick={() => toast.info("Code execution coming soon!")}
                  >
                    <Play className="h-4 w-4 text-green-400" />
                  </Button>
                )}
              </div>

              {/* Code Display */}
              <ScrollArea
                className={cn(
                  "w-full bg-gray-950 transition-all",
                  isExpanded ? "h-[600px]" : "h-[300px]"
                )}
              >
                <pre className="p-4 text-sm text-gray-100 font-mono">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(code.code),
                    }}
                  />
                </pre>
              </ScrollArea>

              {/* Line Numbers (optional enhancement) */}
              <div className="absolute top-0 left-0 bg-gray-900 text-gray-500 text-xs font-mono p-4 select-none">
                {code.code.split("\n").map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {code.output && (
            <TabsContent value="output" className="mt-0">
              <ScrollArea className="h-[200px] w-full bg-gray-900 p-4">
                <pre className="text-sm text-green-400 font-mono">
                  {code.output}
                </pre>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>

        {/* Explanation */}
        {code.explanation && (
          <div className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-sm font-semibold mb-2">Explanation</h4>
                <p className="text-sm">{code.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mark as complete button */}
        {canMarkComplete && !isCompleted && (
          <div className="p-4 pt-0">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onMarkComplete(code.id)}
            >
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Initialize Prism for syntax highlighting
 * Add this to your layout or page component
 */
export function initPrism() {
  if (typeof window !== "undefined" && !(window as any).Prism) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
    script.async = true;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
    document.head.appendChild(link);
  }
}