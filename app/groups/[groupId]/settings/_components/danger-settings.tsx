"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";
import { logger } from '@/lib/logger';

interface DangerSettingsProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

export function DangerSettings({ group, currentUser, isCreator }: DangerSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // Implement your delete group logic here

    } catch (error) {
      logger.error("Failed to delete group:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone</AlertTitle>
        <AlertDescription>
          These actions are irreversible. Please be certain.
        </AlertDescription>
      </Alert>

      <Card className="p-6 border-red-200 dark:border-red-900">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Delete Group
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Permanently delete this group and all of its content. This action cannot be undone.
            </p>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleDeleteGroup}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Group"}
          </Button>
        </div>
      </Card>
    </div>
  );
} 