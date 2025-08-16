"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { logger } from '@/lib/logger';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Sparkles, 
  Copy,
  BookOpen,
  Calculator,
  Sigma,
  Infinity,
  Function,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface LatexCommand {
  symbol: string;
  description: string;
  example?: string;
  category: string;
  tags: string[];
}

export interface LatexCommandsHelperProps {
  /** Function to insert command at cursor */
  onInsertCommand: (command: string) => void;
  /** Show/hide state */
  isVisible: boolean;
  /** Toggle visibility */
  onToggleVisibility: () => void;
  /** Theme */
  theme?: "light" | "dark";
  /** Custom CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

const latexCommands: LatexCommand[] = [
  // Basic Math
  { symbol: "\\frac{a}{b}", description: "Fraction", example: "\\frac{1}{2}", category: "basic", tags: ["fraction", "division"] },
  { symbol: "\\sqrt{x}", description: "Square root", example: "\\sqrt{16}", category: "basic", tags: ["root", "sqrt"] },
  { symbol: "\\sqrt[n]{x}", description: "nth root", example: "\\sqrt[3]{8}", category: "basic", tags: ["root", "nth"] },
  { symbol: "x^{n}", description: "Superscript/Power", example: "x^{2}", category: "basic", tags: ["power", "exponent"] },
  { symbol: "x_{n}", description: "Subscript", example: "x_{1}", category: "basic", tags: ["subscript", "index"] },
  { symbol: "\\pm", description: "Plus/minus", example: "\\pm 5", category: "basic", tags: ["plus", "minus", "operator"] },
  { symbol: "\\mp", description: "Minus/plus", example: "\\mp 3", category: "basic", tags: ["minus", "plus", "operator"] },

  // Operators
  { symbol: "\\times", description: "Multiplication", example: "5 \\times 3", category: "operators", tags: ["multiply", "times"] },
  { symbol: "\\div", description: "Division", example: "10 \\div 2", category: "operators", tags: ["divide", "division"] },
  { symbol: "\\cdot", description: "Dot product", example: "a \\cdot b", category: "operators", tags: ["dot", "product"] },
  { symbol: "\\ast", description: "Asterisk", example: "a \\ast b", category: "operators", tags: ["asterisk", "star"] },
  { symbol: "\\oplus", description: "Circle plus", example: "a \\oplus b", category: "operators", tags: ["circle", "plus"] },
  { symbol: "\\ominus", description: "Circle minus", example: "a \\ominus b", category: "operators", tags: ["circle", "minus"] },
  { symbol: "\\otimes", description: "Circle times", example: "a \\otimes b", category: "operators", tags: ["circle", "times"] },

  // Relations
  { symbol: "\\leq", description: "Less than or equal", example: "x \\leq 5", category: "relations", tags: ["less", "equal", "inequality"] },
  { symbol: "\\geq", description: "Greater than or equal", example: "x \\geq 3", category: "relations", tags: ["greater", "equal", "inequality"] },
  { symbol: "\\neq", description: "Not equal", example: "a \\neq b", category: "relations", tags: ["not", "equal"] },
  { symbol: "\\approx", description: "Approximately equal", example: "\\pi \\approx 3.14", category: "relations", tags: ["approximately", "equal"] },
  { symbol: "\\equiv", description: "Equivalent", example: "a \\equiv b", category: "relations", tags: ["equivalent", "congruent"] },
  { symbol: "\\sim", description: "Similar to", example: "a \\sim b", category: "relations", tags: ["similar", "tilde"] },
  { symbol: "\\propto", description: "Proportional to", example: "y \\propto x", category: "relations", tags: ["proportional", "proportion"] },
  { symbol: "\\parallel", description: "Parallel", example: "AB \\parallel CD", category: "relations", tags: ["parallel", "geometry"] },
  { symbol: "\\perp", description: "Perpendicular", example: "AB \\perp CD", category: "relations", tags: ["perpendicular", "geometry"] },

  // Greek Letters
  { symbol: "\\alpha", description: "Alpha", example: "\\alpha", category: "greek", tags: ["alpha", "greek"] },
  { symbol: "\\beta", description: "Beta", example: "\\beta", category: "greek", tags: ["beta", "greek"] },
  { symbol: "\\gamma", description: "Gamma", example: "\\gamma", category: "greek", tags: ["gamma", "greek"] },
  { symbol: "\\delta", description: "Delta", example: "\\delta", category: "greek", tags: ["delta", "greek"] },
  { symbol: "\\epsilon", description: "Epsilon", example: "\\epsilon", category: "greek", tags: ["epsilon", "greek"] },
  { symbol: "\\theta", description: "Theta", example: "\\theta", category: "greek", tags: ["theta", "greek"] },
  { symbol: "\\lambda", description: "Lambda", example: "\\lambda", category: "greek", tags: ["lambda", "greek"] },
  { symbol: "\\mu", description: "Mu", example: "\\mu", category: "greek", tags: ["mu", "greek"] },
  { symbol: "\\pi", description: "Pi", example: "\\pi", category: "greek", tags: ["pi", "greek"] },
  { symbol: "\\sigma", description: "Sigma", example: "\\sigma", category: "greek", tags: ["sigma", "greek"] },
  { symbol: "\\phi", description: "Phi", example: "\\phi", category: "greek", tags: ["phi", "greek"] },
  { symbol: "\\omega", description: "Omega", example: "\\omega", category: "greek", tags: ["omega", "greek"] },

  // Capital Greek
  { symbol: "\\Gamma", description: "Capital Gamma", example: "\\Gamma", category: "greek", tags: ["gamma", "capital", "greek"] },
  { symbol: "\\Delta", description: "Capital Delta", example: "\\Delta", category: "greek", tags: ["delta", "capital", "greek"] },
  { symbol: "\\Theta", description: "Capital Theta", example: "\\Theta", category: "greek", tags: ["theta", "capital", "greek"] },
  { symbol: "\\Lambda", description: "Capital Lambda", example: "\\Lambda", category: "greek", tags: ["lambda", "capital", "greek"] },
  { symbol: "\\Pi", description: "Capital Pi", example: "\\Pi", category: "greek", tags: ["pi", "capital", "greek"] },
  { symbol: "\\Sigma", description: "Capital Sigma", example: "\\Sigma", category: "greek", tags: ["sigma", "capital", "greek"] },
  { symbol: "\\Phi", description: "Capital Phi", example: "\\Phi", category: "greek", tags: ["phi", "capital", "greek"] },
  { symbol: "\\Omega", description: "Capital Omega", example: "\\Omega", category: "greek", tags: ["omega", "capital", "greek"] },

  // Calculus & Analysis
  { symbol: "\\sum_{i=1}^{n}", description: "Summation", example: "\\sum_{i=1}^{n} x_i", category: "calculus", tags: ["sum", "summation", "series"] },
  { symbol: "\\prod_{i=1}^{n}", description: "Product", example: "\\prod_{i=1}^{n} x_i", category: "calculus", tags: ["product", "multiplication"] },
  { symbol: "\\int", description: "Integral", example: "\\int f(x) dx", category: "calculus", tags: ["integral", "integration"] },
  { symbol: "\\int_{a}^{b}", description: "Definite integral", example: "\\int_{0}^{1} x dx", category: "calculus", tags: ["integral", "definite"] },
  { symbol: "\\oint", description: "Contour integral", example: "\\oint_C f(z) dz", category: "calculus", tags: ["contour", "integral", "complex"] },
  { symbol: "\\partial", description: "Partial derivative", example: "\\frac{\\partial f}{\\partial x}", category: "calculus", tags: ["partial", "derivative"] },
  { symbol: "\\nabla", description: "Nabla/gradient", example: "\\nabla f", category: "calculus", tags: ["nabla", "gradient", "del"] },
  { symbol: "\\lim_{x \\to a}", description: "Limit", example: "\\lim_{x \\to 0} \\frac{\\sin x}{x}", category: "calculus", tags: ["limit", "approach"] },

  // Sets & Logic
  { symbol: "\\in", description: "Element of", example: "x \\in A", category: "sets", tags: ["element", "belongs", "set"] },
  { symbol: "\\notin", description: "Not element of", example: "x \\notin A", category: "sets", tags: ["not", "element", "set"] },
  { symbol: "\\subset", description: "Subset", example: "A \\subset B", category: "sets", tags: ["subset", "inclusion"] },
  { symbol: "\\subseteq", description: "Subset or equal", example: "A \\subseteq B", category: "sets", tags: ["subset", "equal", "inclusion"] },
  { symbol: "\\cup", description: "Union", example: "A \\cup B", category: "sets", tags: ["union", "or"] },
  { symbol: "\\cap", description: "Intersection", example: "A \\cap B", category: "sets", tags: ["intersection", "and"] },
  { symbol: "\\emptyset", description: "Empty set", example: "A \\cap B = \\emptyset", category: "sets", tags: ["empty", "null", "set"] },
  { symbol: "\\mathbb{R}", description: "Real numbers", example: "x \\in \\mathbb{R}", category: "sets", tags: ["real", "numbers", "blackboard"] },
  { symbol: "\\mathbb{N}", description: "Natural numbers", example: "n \\in \\mathbb{N}", category: "sets", tags: ["natural", "numbers", "blackboard"] },
  { symbol: "\\mathbb{Z}", description: "Integers", example: "z \\in \\mathbb{Z}", category: "sets", tags: ["integers", "numbers", "blackboard"] },
  { symbol: "\\mathbb{Q}", description: "Rational numbers", example: "q \\in \\mathbb{Q}", category: "sets", tags: ["rational", "numbers", "blackboard"] },
  { symbol: "\\mathbb{C}", description: "Complex numbers", example: "z \\in \\mathbb{C}", category: "sets", tags: ["complex", "numbers", "blackboard"] },

  // Functions & Trigonometry
  { symbol: "\\sin", description: "Sine", example: "\\sin(x)", category: "functions", tags: ["sine", "trigonometry"] },
  { symbol: "\\cos", description: "Cosine", example: "\\cos(x)", category: "functions", tags: ["cosine", "trigonometry"] },
  { symbol: "\\tan", description: "Tangent", example: "\\tan(x)", category: "functions", tags: ["tangent", "trigonometry"] },
  { symbol: "\\log", description: "Logarithm", example: "\\log(x)", category: "functions", tags: ["logarithm", "log"] },
  { symbol: "\\ln", description: "Natural log", example: "\\ln(x)", category: "functions", tags: ["natural", "logarithm", "ln"] },
  { symbol: "\\exp", description: "Exponential", example: "\\exp(x)", category: "functions", tags: ["exponential", "exp"] },
  { symbol: "\\arcsin", description: "Arcsine", example: "\\arcsin(x)", category: "functions", tags: ["arcsine", "inverse", "trigonometry"] },
  { symbol: "\\arccos", description: "Arccosine", example: "\\arccos(x)", category: "functions", tags: ["arccosine", "inverse", "trigonometry"] },
  { symbol: "\\arctan", description: "Arctangent", example: "\\arctan(x)", category: "functions", tags: ["arctangent", "inverse", "trigonometry"] },

  // Special Symbols
  { symbol: "\\infty", description: "Infinity", example: "\\lim_{x \\to \\infty}", category: "special", tags: ["infinity", "limit"] },
  { symbol: "\\hbar", description: "h-bar (Planck)", example: "\\hbar", category: "special", tags: ["hbar", "planck", "physics"] },
  { symbol: "\\ell", description: "Script l", example: "\\ell", category: "special", tags: ["script", "ell"] },
  { symbol: "\\Re", description: "Real part", example: "\\Re(z)", category: "special", tags: ["real", "part", "complex"] },
  { symbol: "\\Im", description: "Imaginary part", example: "\\Im(z)", category: "special", tags: ["imaginary", "part", "complex"] },
  { symbol: "\\angle", description: "Angle", example: "\\angle ABC", category: "special", tags: ["angle", "geometry"] },
  { symbol: "\\degree", description: "Degree", example: "90\\degree", category: "special", tags: ["degree", "angle"] },

  // Arrows
  { symbol: "\\rightarrow", description: "Right arrow", example: "f: A \\rightarrow B", category: "arrows", tags: ["arrow", "right", "maps"] },
  { symbol: "\\leftarrow", description: "Left arrow", example: "\\leftarrow", category: "arrows", tags: ["arrow", "left"] },
  { symbol: "\\leftrightarrow", description: "Double arrow", example: "A \\leftrightarrow B", category: "arrows", tags: ["arrow", "double", "equivalent"] },
  { symbol: "\\Rightarrow", description: "Implies", example: "P \\Rightarrow Q", category: "arrows", tags: ["implies", "logic"] },
  { symbol: "\\Leftarrow", description: "Implied by", example: "Q \\Leftarrow P", category: "arrows", tags: ["implied", "logic"] },
  { symbol: "\\Leftrightarrow", description: "If and only if", example: "P \\Leftrightarrow Q", category: "arrows", tags: ["iff", "logic", "equivalent"] },

  // Brackets & Delimiters
  { symbol: "\\left( \\right)", description: "Auto-sized parentheses", example: "\\left( \\frac{a}{b} \\right)", category: "brackets", tags: ["parentheses", "auto", "size"] },
  { symbol: "\\left[ \\right]", description: "Auto-sized brackets", example: "\\left[ x \\right]", category: "brackets", tags: ["brackets", "auto", "size"] },
  { symbol: "\\left\\{ \\right\\}", description: "Auto-sized braces", example: "\\left\\{ x \\right\\}", category: "brackets", tags: ["braces", "auto", "size"] },
  { symbol: "\\left| \\right|", description: "Auto-sized absolute", example: "\\left| x \\right|", category: "brackets", tags: ["absolute", "auto", "size"] },
];

const categoryIcons: Record<string, React.ReactNode> = {
  basic: <Calculator className="h-4 w-4" />,
  operators: <Zap className="h-4 w-4" />,
  relations: <BookOpen className="h-4 w-4" />,
  greek: <Sigma className="h-4 w-4" />,
  calculus: <Function className="h-4 w-4" />,
  sets: <Infinity className="h-4 w-4" />,
  functions: <Function className="h-4 w-4" />,
  special: <Sparkles className="h-4 w-4" />,
  arrows: <span className="text-sm">→</span>,
  brackets: <span className="text-sm">( )</span>,
};

export const LatexCommandsHelper: React.FC<LatexCommandsHelperProps> = ({
  onInsertCommand,
  isVisible,
  onToggleVisibility,
  theme = "light",
  className = "",
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("basic");

  const isDark = theme === "dark";

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(latexCommands.map(cmd => cmd.category)));
    return cats.sort();
  }, []);

  // Filter commands based on search and category
  const filteredCommands = useMemo(() => {
    return latexCommands.filter(cmd => {
      const matchesCategory = cmd.category === activeCategory;
      const matchesSearch = searchQuery === "" || 
        cmd.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleInsertCommand = (command: string) => {
    onInsertCommand(`$${command}$`);
    toast.success(`Inserted: ${command}`);
  };

  const handleCopyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success(`Copied: ${command}`);
    } catch (error) {
      logger.error("Failed to copy command:", error);
      toast.error("Failed to copy command");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toggle Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className={cn(
            "text-sm font-medium",
            isDark ? "text-gray-200" : "text-gray-700"
          )}>
            LaTeX Commands Helper
          </span>
          <Badge variant="secondary" className="text-xs">
            {latexCommands.length} commands
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          disabled={disabled}
          className="h-8 px-2"
        >
          {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isVisible ? "Hide" : "Show"}
        </Button>
      </div>

      {/* Commands Panel */}
      {isVisible && (
        <Card className={cn(
          "border shadow-sm",
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        )}>
          <CardHeader className={cn(
            "py-3 px-4 border-b",
            isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
          )}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 text-sm",
                  isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300"
                )}
                disabled={disabled}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              {/* Category Tabs */}
              <div className={cn(
                "border-b px-4 py-2",
                isDark ? "border-slate-700" : "border-gray-200"
              )}>
                <ScrollArea className="w-full">
                  <div className="flex gap-1 pb-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveCategory(category)}
                        disabled={disabled}
                        className="h-8 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                      >
                        {categoryIcons[category]}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Commands Grid */}
              <div className="p-4">
                <ScrollArea className="h-64">
                  {filteredCommands.length === 0 ? (
                    <div className={cn(
                      "text-center py-8 text-sm",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No commands found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredCommands.map((cmd, index) => (
                        <div
                          key={index}
                          className={cn(
                            "group border rounded-lg p-3 transition-all duration-200",
                            isDark 
                              ? "border-slate-600 bg-slate-800/50 hover:bg-slate-700/50" 
                              : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className={cn(
                                  "text-xs font-mono px-2 py-1 rounded",
                                  isDark ? "bg-slate-900 text-slate-300" : "bg-white text-gray-700"
                                )}>
                                  {cmd.symbol}
                                </code>
                              </div>
                              <p className={cn(
                                "text-xs",
                                isDark ? "text-gray-300" : "text-gray-600"
                              )}>
                                {cmd.description}
                              </p>
                              {cmd.example && (
                                <p className={cn(
                                  "text-xs mt-1 font-mono",
                                  isDark ? "text-gray-400" : "text-gray-500"
                                )}>
                                  Example: {cmd.example}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleInsertCommand(cmd.symbol)}
                                disabled={disabled}
                                className="h-6 px-2 text-xs"
                              >
                                Insert
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyCommand(cmd.symbol)}
                                disabled={disabled}
                                className="h-6 px-2 text-xs"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LatexCommandsHelper; 