"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InterfaceModeToggleProps {
  isAdvancedMode: boolean;
  onModeChange: (isAdvanced: boolean) => void;
  className?: string;
  showBadge?: boolean;
}

export const InterfaceModeToggle = ({
  isAdvancedMode,
  onModeChange,
  className,
  showBadge = true
}: InterfaceModeToggleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode Toggle Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isAdvancedMode ? (
              <Settings className="w-4 h-4 text-purple-600" />
            ) : (
              <Zap className="w-4 h-4 text-blue-600" />
            )}
            <Label htmlFor="interface-mode" className="text-sm font-medium">
              Interface Mode
            </Label>
          </div>
          {showBadge && (
            <Badge variant={isAdvancedMode ? "secondary" : "default"} className="text-xs">
              {isAdvancedMode ? "Advanced" : "Simple"}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs transition-colors",
              !isAdvancedMode ? "text-blue-600 font-medium" : "text-gray-500"
            )}>
              Simple
            </span>
            <Switch
              id="interface-mode"
              checked={isAdvancedMode}
              onCheckedChange={onModeChange}
              className="data-[state=checked]:bg-purple-600"
            />
            <span className={cn(
              "text-xs transition-colors",
              isAdvancedMode ? "text-purple-600 font-medium" : "text-gray-500"
            )}>
              Advanced
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Mode Description */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              {isAdvancedMode ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Advanced Mode
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    Access all configuration options, detailed settings, and power-user features. 
                    Perfect for experienced educators who want full control over AI behavior.
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1 ml-3">
                    <li>• Custom AI prompts and parameters</li>
                    <li>• Detailed Bloom&apos;s taxonomy controls</li>
                    <li>• Advanced analytics and insights</li>
                    <li>• Bulk operations and batch processing</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Simple Mode
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Streamlined interface with smart defaults and guided workflows. 
                    Perfect for getting started quickly with AI-powered features.
                  </p>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-3">
                    <li>• One-click AI generation</li>
                    <li>• Smart presets for common scenarios</li>
                    <li>• Guided step-by-step workflows</li>
                    <li>• Essential controls only</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};