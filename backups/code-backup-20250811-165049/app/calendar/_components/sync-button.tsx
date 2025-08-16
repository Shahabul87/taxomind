"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Check, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  onSync: () => void;
  action?: 'import' | 'export' | 'update';
  eventId?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export const SyncButton = ({ 
  onSync, 
  action = 'import', 
  eventId, 
  variant = 'default',
  size = 'default',
  className,
  label 
}: SyncButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      // Make sure eventId is provided for export and update actions
      if ((action === 'export' || action === 'update') && !eventId) {
        toast.error(`Event ID is required for ${action} action`);
        return;
      }
      
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          provider: "google", 
          action,
          eventId 
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Sync failed');
      }
      
      setSyncComplete(true);
      onSync();
      
      const messages = {
        import: "Calendar synced successfully",
        export: "Event exported to Google Calendar",
        update: "Event updated in Google Calendar"
      };
      
      toast.success(messages[action]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync calendar");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncComplete(false), 2000);
    }
  };
  
  const getIcon = () => {
    if (syncComplete) {
      return <Check className="w-4 h-4" />;
    }
    
    switch(action) {
      case 'import':
        return <Download className="w-4 h-4" />;
      case 'export':
        return <Upload className="w-4 h-4" />;
      case 'update':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };
  
  const getLabel = () => {
    if (label) return label;
    
    if (isSyncing) return "Syncing...";
    if (syncComplete) return "Synced";
    
    switch(action) {
      case 'import':
        return "Import from Google";
      case 'export':
        return "Export to Google";
      case 'update':
        return "Update in Google";
      default:
        return "Sync Calendar";
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant={variant}
      size={size}
      className={cn(
        "relative",
        syncComplete && "bg-green-500 hover:bg-green-600",
        className
      )}
    >
      <motion.div
        animate={{ rotate: isSyncing ? 360 : 0 }}
        transition={{ duration: 1, repeat: isSyncing ? Infinity : 0 }}
      >
        {getIcon()}
      </motion.div>
      {size !== 'icon' && <span className="ml-2">{getLabel()}</span>}
    </Button>
  );
}; 