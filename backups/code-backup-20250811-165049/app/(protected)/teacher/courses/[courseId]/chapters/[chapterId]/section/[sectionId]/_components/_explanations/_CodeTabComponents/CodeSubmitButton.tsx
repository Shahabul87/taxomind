import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send, RotateCcw } from "lucide-react";

interface CodeSubmitButtonProps {
  isSubmitting: boolean;
  isValid: boolean;
  onReset: () => void;
}

export const CodeSubmitButton = ({ 
  isSubmitting, 
  isValid,
  onReset
}: CodeSubmitButtonProps) => {
  return (
    <div className="flex justify-between items-center pt-3 border-t border-gray-300 dark:border-gray-600 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-900/20 -mx-6 -mb-6 px-6 pb-4 rounded-b shadow-sm">
      <Button
        type="button"
        onClick={onReset}
        variant="outline"
        disabled={isSubmitting}
        size="sm"
        className="h-8 px-3 text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-600"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset
      </Button>
      
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        size="sm"
        className="h-8 px-4 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white border-0 shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Send className="h-3 w-3 mr-1" />
            Create
          </>
        )}
      </Button>
    </div>
  );
}; 