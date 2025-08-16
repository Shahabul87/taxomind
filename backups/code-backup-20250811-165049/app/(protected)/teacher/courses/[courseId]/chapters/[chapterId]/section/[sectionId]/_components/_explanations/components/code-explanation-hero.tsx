import { Code2, Sparkles, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeExplanationHeroProps {
  isCreating: boolean;
  onToggleCreate: () => void;
  hasMounted: boolean;
}

export const CodeExplanationHero = ({ 
  isCreating, 
  onToggleCreate, 
  hasMounted 
}: CodeExplanationHeroProps) => {
  const buttonText = hasMounted && isCreating ? "Cancel" : "Add explanation";

  return (
    <div className="w-full px-6 py-16 bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-emerald-600/10"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-32 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl"></div>
      </div>
      
      {/* Header Content - Full Width */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center xl:text-left">
            <div className="flex items-center justify-center xl:justify-start gap-6 mb-8">
              <div className="p-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl">
                <Code2 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl xl:text-6xl font-bold mb-3 text-white">
                  Code Explainer
                </h1>
                <p className="text-xl text-gray-300 font-medium">
                  Transform code into interactive learning experiences
                </p>
              </div>
            </div>
            
            {/* Feature Pills - Enhanced Contrast */}
            <div className="flex flex-wrap justify-center xl:justify-start gap-4 mb-10">
              <div className="flex items-center gap-3 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full text-base font-medium text-gray-200 border border-gray-700/50">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Interactive
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full text-base font-medium text-gray-200 border border-gray-700/50">
                <Zap className="h-5 w-5 text-emerald-400" />
                Real-time Preview
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-gray-800/80 backdrop-blur-sm rounded-full text-base font-medium text-gray-200 border border-gray-700/50">
                <Target className="h-5 w-5 text-purple-400" />
                Student Focused
              </div>
            </div>
          </div>
          
          {/* Action Button - Full Width on Small Screens */}
          <div className="w-full xl:w-auto xl:flex-shrink-0">
            <Button
              onClick={onToggleCreate}
              size="lg"
              className={cn(
                "w-full xl:w-auto px-10 py-5 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
                "border border-blue-500/30"
              )}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 