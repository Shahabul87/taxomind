"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export function DebugModeToggle() {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDebugMode(localStorage.getItem('debug-mode') === 'true');
    }
  }, []);

  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    
    if (typeof window !== 'undefined') {
      if (newMode) {
        localStorage.setItem('debug-mode', 'true');
        toast.success('Debug mode enabled');
      } else {
        localStorage.removeItem('debug-mode');
        toast.success('Debug mode disabled');
      }
      
      // Refresh the page to show/hide debug components
      window.location.reload();
    }
  };

  // Only show in production (development always has debug mode)
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <Button
      onClick={toggleDebugMode}
      variant="ghost"
      size="sm"
      className={`fixed top-4 right-4 z-50 ${
        debugMode 
          ? 'bg-orange-600 text-white hover:bg-orange-700' 
          : 'bg-slate-600 text-slate-300 hover:bg-slate-700'
      }`}
    >
      <Settings className="w-4 h-4 mr-2" />
      Debug {debugMode ? 'ON' : 'OFF'}
    </Button>
  );
} 