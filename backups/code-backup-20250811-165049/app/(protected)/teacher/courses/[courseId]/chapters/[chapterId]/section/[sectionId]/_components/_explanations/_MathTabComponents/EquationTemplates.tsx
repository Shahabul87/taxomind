"use client";

import { InlineMath } from "react-katex";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EquationTemplatesProps {
  onApplyTemplate: (template: { title: string; equation: string; explanation: string }) => void;
}

export const EquationTemplates = ({ onApplyTemplate }: EquationTemplatesProps) => {
  const templates = [
    { 
      title: "Quadratic Formula", 
      equation: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      displayText: "x = (-b ± √(b²-4ac)) / 2a", 
      explanation: "The quadratic formula helps solve quadratic equations in the form ax² + bx + c = 0." 
    },
    { 
      title: "Pythagorean Theorem", 
      equation: "a^2 + b^2 = c^2",
      displayText: "a² + b² = c²", 
      explanation: "In a right triangle, the square of the length of the hypotenuse (c) equals the sum of squares of the other two sides (a and b)." 
    },
    { 
      title: "Derivative Rule", 
      equation: "\\frac{d}{dx}[x^n] = nx^{n-1}",
      displayText: "d/dx[xⁿ] = nxⁿ⁻¹", 
      explanation: "The power rule for differentiation states that if you have x raised to a power n, the derivative is n times x raised to the power of n-1." 
    },
  ];

  return (
    <Card className="border border-yellow-400/60 shadow-lg bg-slate-800">
      <CardHeader className="bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border-b border-yellow-400/40 py-4">
        <CardTitle className="text-base text-white font-bold">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-amber-300" />
            Quick Templates
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[220px] overflow-y-auto overflow-x-hidden bg-slate-900/60">
          <div className="p-4 space-y-3 w-full">
            {templates.map((template, index) => (
              <div 
                key={index} 
                className="group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-yellow-400/40 bg-slate-800/70 hover:bg-yellow-400/10 hover:border-yellow-400/70 hover:shadow-md w-full"
                onClick={() => onApplyTemplate(template)}
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white font-semibold text-sm truncate flex-1 mr-2">{template.title}</span>
                    <span className="text-yellow-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Click to use
                    </span>
                  </div>
                  
                  <div className="bg-slate-900 p-3 rounded border border-yellow-400/30 text-center w-full overflow-hidden">
                    <div className="text-white text-sm font-mono mb-1 overflow-x-auto">
                      <InlineMath math={template.equation} />
                    </div>
                    <div className="text-gray-300 text-xs font-mono break-words">
                      {template.displayText}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-xs leading-relaxed break-words">
                    {template.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 