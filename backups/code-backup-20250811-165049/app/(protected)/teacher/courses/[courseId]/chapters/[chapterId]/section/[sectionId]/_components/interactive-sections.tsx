"use client";

import { Button } from "@/components/ui/button";
import { Code2, PlusCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExplanationActions } from "./explanation-actions";
import axios from "axios";

// Dynamically import components with no SSR to avoid hydration issues
const CodeExplanationForm = dynamic(
  () => import("../_components/_explanations/code-explanation-form").then(mod => mod.CodeExplanationForm),
  { ssr: false, loading: () => <p className="text-center py-8">Loading code editor...</p> }
);

const MathEquationForm = dynamic(
  () => import("../_components/_explanations/math-equation-form").then(mod => mod.MathEquationForm),
  { ssr: false, loading: () => <p className="text-center py-8">Loading equation editor...</p> }
);

interface InteractiveSectionsProps {
  courseId: string; 
  chapterId: string; 
  sectionId: string;
  initialData?: any;
}

export const InteractiveSections = ({ 
  courseId, 
  chapterId, 
  sectionId,
  initialData = {}
}: InteractiveSectionsProps) => {
  const router = useRouter();
  
  // Separate states for each editor
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<"math" | "code" | null>(null);
  
  // Toggle the math editor visibility
  const toggleMathEditor = () => {
    // Close the other editor when opening this one
    if (!showMathEditor && showCodeEditor) {
      setShowCodeEditor(false);
    }
    
    setShowMathEditor(prev => !prev);
    
    // If showing math editor, scroll to it and set active tab
    if (!showMathEditor) {
      setActiveTab("math");
      setTimeout(() => {
        const element = document.getElementById('math-equations');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  // Toggle the code editor visibility
  const toggleCodeEditor = () => {
    // Close the other editor when opening this one
    if (!showCodeEditor && showMathEditor) {
      setShowMathEditor(false);
    }
    
    setShowCodeEditor(prev => !prev);
    
    // If showing code editor, scroll to it and set active tab
    if (!showCodeEditor) {
      setActiveTab("code");
      setTimeout(() => {
        const element = document.getElementById('code-explanations');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* New Tabs UI for Math and Code Explanations */}
      <Tabs
        defaultValue="math"
        value={activeTab || "math"}
        className="w-full"
        onValueChange={(value) => setActiveTab(value as "math" | "code")}
      >
        <div className="flex items-center justify-center mb-6">
          <TabsList className="bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-900/30 dark:to-blue-900/30 p-1">
            <TabsTrigger 
              value="math" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400"
              onClick={() => setActiveTab("math")}
            >
              Math Explanation
            </TabsTrigger>
            <TabsTrigger 
              value="code" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              onClick={() => setActiveTab("code")}
            >
              Code Explanation
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="math" className="animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Math Equations Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-pink-600 dark:text-pink-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 11h16M4 15h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">Math Equation Explanations</h2>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create detailed explanations for mathematical concepts with support for complex equations and visualizations.</p>
                
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 p-4 rounded-lg mb-6">
                  <div className="text-center mb-2 text-gray-700 dark:text-gray-300 font-medium">Example:</div>
                  <div className="flex items-center justify-center mb-2">
                    <div className="text-center p-2 text-lg font-serif">
                      f(x) = ax² + bx + c
                    </div>
                  </div>
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Explain mathematical formulas with step-by-step solutions
                  </div>
                </div>
                
                <Button
                  onClick={toggleMathEditor}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {showMathEditor ? "Hide Math Editor" : "Add Math Explanation"}
                </Button>
              </div>
            </div>
            
            {/* Math explanations list with proper modal editing */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Math Explanations</div>
              {/* TODO: Add MathExplanationActions component when available */}
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Math explanations list coming soon...
              </div>
            </div>
          </div>
          
          {/* Conditional math editor section */}
          {showMathEditor && (
            <div className="mt-8 animate-fadeIn" id="math-equations">
              <div className="p-4 border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-400 mb-6 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-pink-700 dark:text-pink-300">
                    Math Equation Editor
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleMathEditor}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                  Create a beautiful mathematical explanation with LaTeX formatting. Use the templates to get started quickly.
                </p>
              </div>
              
              {/* Properly rendered MathEquationForm */}
              <div className="mt-2">
                <MathEquationForm 
                  courseId={courseId}
                  chapterId={chapterId}
                  sectionId={sectionId}
                  initialData={null}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Code Explanations Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
                    <Code2 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">Code Explanations</h2>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create interactive code explanations with syntax highlighting, annotations, and detailed context.</p>
                
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-6">
                  <div className="text-center mb-2 text-gray-700 dark:text-gray-300 font-medium">Example:</div>
                  <div className="bg-gray-900 p-2 rounded text-xs text-gray-300 font-mono mb-2">
                    {`function example() {
  return "Hello World";
}`}
                  </div>
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Explain code snippets with detailed annotations
                  </div>
                </div>
                
                <Button
                  onClick={toggleCodeEditor}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {showCodeEditor ? "Hide Code Editor" : "Add Code Explanation"}
                </Button>
              </div>
            </div>
            
            {/* Code explanations list with proper modal editing */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <ExplanationActions
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                codeExplanations={initialData.codeExplanations || []}
              />
            </div>
          </div>
          
          {/* Conditional code editor section */}
          {showCodeEditor && (
            <div className="mt-8 animate-fadeIn" id="code-explanations">
              <div className="p-4 border-l-4 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 dark:border-cyan-400 mb-6 rounded-r-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cyan-700 dark:text-cyan-300">
                    Code Explanation Editor
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleCodeEditor}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                  Create detailed explanations for code snippets with syntax highlighting and annotations.
                </p>
              </div>
              
              {/* Properly rendered CodeExplanationForm */}
              <div className="mt-2">
                <CodeExplanationForm 
                  courseId={courseId}
                  chapterId={chapterId}
                  sectionId={sectionId}
                  initialData={initialData}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 