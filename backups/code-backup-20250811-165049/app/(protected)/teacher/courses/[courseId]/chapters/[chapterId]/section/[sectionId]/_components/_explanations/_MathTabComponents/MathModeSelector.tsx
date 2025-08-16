"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MathModeSelectorProps {
  editorMode: "equation" | "visual";
  onModeChange: (mode: "equation" | "visual") => void;
}

export const MathModeSelector = ({ editorMode, onModeChange }: MathModeSelectorProps) => {
  return (
    <div className="mt-4">
      <Tabs 
        value={editorMode} 
        onValueChange={(value) => onModeChange(value as "equation" | "visual")}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 bg-slate-700/50">
          <TabsTrigger 
            value="equation" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-400/50 text-gray-200 font-medium"
          >
            <span className="font-mono mr-2 text-gold-300">∫</span>
            Equation Mode
          </TabsTrigger>
          <TabsTrigger 
            value="visual" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-gold-300 data-[state=active]:border data-[state=active]:border-gold-400/50 text-gray-200 font-medium"
          >
            <span className="mr-2">🖼️</span>
            Visual Mode
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}; 