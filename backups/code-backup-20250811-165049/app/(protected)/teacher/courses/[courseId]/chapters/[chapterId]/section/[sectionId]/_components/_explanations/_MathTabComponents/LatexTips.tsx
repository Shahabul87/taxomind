"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const LatexTips = () => {
  return (
    <Card className="border border-yellow-400/40 shadow-sm bg-slate-800/40">
      <CardHeader className="bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-t-lg border-b border-yellow-400/30 py-3">
        <CardTitle className="text-sm text-white font-bold">
          LaTeX Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        <ul className="space-y-1 text-xs text-gray-300">
          <li>
            <strong className="text-white">Fractions:</strong>{" "}
            <code className="bg-slate-800/50 text-gray-200 p-1 rounded text-[10px]">
              \frac&#123;numerator&#125;&#123;denominator&#125;
            </code>
          </li>
          <li>
            <strong className="text-white">Exponents:</strong>{" "}
            <code className="bg-slate-800/50 text-gray-200 p-1 rounded text-[10px]">
              x^&#123;power&#125;
            </code>
          </li>
          <li>
            <strong className="text-white">Square roots:</strong>{" "}
            <code className="bg-slate-800/50 text-gray-200 p-1 rounded text-[10px]">
              \sqrt&#123;expression&#125;
            </code>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}; 