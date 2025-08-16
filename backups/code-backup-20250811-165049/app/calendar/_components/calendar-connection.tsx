"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from "./sync-button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

interface CalendarConnectionProps {
  hasGoogleAccount: boolean;
  onRefresh: () => void;
}

export const CalendarConnection = ({ hasGoogleAccount, onRefresh }: CalendarConnectionProps) => {
  const [autoSync, setAutoSync] = useState(false);
  const [syncLast, setSyncLast] = useState<string | null>(null);

  useEffect(() => {
    // Load auto-sync settings from localStorage
    const savedAutoSync = localStorage.getItem('calendar_autosync');
    if (savedAutoSync) {
      setAutoSync(savedAutoSync === 'true');
    }

    // Load last sync time
    const lastSync = localStorage.getItem('calendar_last_sync');
    if (lastSync) {
      setSyncLast(lastSync);
    }
  }, []);

  // Toggle auto-sync
  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked);
    localStorage.setItem('calendar_autosync', String(checked));
    
    if (checked) {
      toast.success("Auto-sync enabled. Calendar will sync daily.");
    } else {
      toast.info("Auto-sync disabled.");
    }
  };

  // Handle manual sync
  const handleSync = () => {
    const now = new Date().toISOString();
    localStorage.setItem('calendar_last_sync', now);
    setSyncLast(now);
    onRefresh();
  };

  // Connect Google account
  const handleConnectGoogle = async () => {
    await signIn("google", { 
      callbackUrl: "/calendar",
      redirect: true
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <GoogleLogo className="w-5 h-5 mr-2" />
          Google Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events between both systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasGoogleAccount ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto-sync daily</Label>
                <p className="text-sm text-gray-500">
                  Automatically sync your calendar events daily
                </p>
              </div>
              <Switch 
                id="auto-sync" 
                checked={autoSync} 
                onCheckedChange={handleAutoSyncToggle} 
              />
            </div>
            
            {syncLast && (
              <p className="text-sm text-gray-500">
                Last synced: {new Date(syncLast).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center text-gray-600">
              Connect your Google account to sync your calendars
            </p>
            <Button onClick={handleConnectGoogle} className="bg-white text-black border hover:bg-gray-100">
              <GoogleLogo className="w-4 h-4 mr-2" />
              Connect Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
      {hasGoogleAccount && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <div className="flex space-x-2">
            <SyncButton action="export" onSync={handleSync} variant="outline" label="Export All" />
            <SyncButton action="import" onSync={handleSync} />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}; 