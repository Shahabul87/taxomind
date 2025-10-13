"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MathModeSelectorProps {
  editorMode: "equation" | "visual";
  onModeChange: (mode: "equation" | "visual") => void;
}

export const MathModeSelector = ({ editorMode, onModeChange }: MathModeSelectorProps) => {
  return (
    <Tabs
      value={editorMode}
      onValueChange={(value) => onModeChange(value as "equation" | "visual")}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <TabsTrigger
          value="equation"
          className="data-[state=active]:bg-purple-600 dark:data-[state=active]:bg-purple-700 data-[state=active]:text-white dark:data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200 text-gray-700 dark:text-gray-300 font-medium"
        >
          <span className="font-mono mr-2">∫</span>
          Equation Mode
        </TabsTrigger>
        <TabsTrigger
          value="visual"
          className="data-[state=active]:bg-purple-600 dark:data-[state=active]:bg-purple-700 data-[state=active]:text-white dark:data-[state=active]:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-all duration-200 text-gray-700 dark:text-gray-300 font-medium"
        >
          <span className="mr-2">🖼️</span>
          Visual Mode
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}; 