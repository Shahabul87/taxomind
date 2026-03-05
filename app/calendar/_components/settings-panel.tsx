"use client";

import { useEffect } from 'react';
import { CalendarSettings } from './calendar-settings';
import { useSettingsStore } from '../_lib/settings-store';
import { useSettingsSync } from '../_lib/settings-sync';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const SettingsPanel = () => {
  const settings = useSettingsStore(state => state.settings);
  const resetSettings = useSettingsStore(state => state.resetSettings);
  const { syncSettings } = useSettingsSync();

  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        await syncSettings();
      } catch (error: any) {
        logger.error('Failed to sync settings:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncSettings]);

  const handleReset = async () => {
    try {
      resetSettings();
      await syncSettings();
      toast.success('Settings reset to defaults');
    } catch (error: any) {
      toast.error('Failed to reset settings');
    }
  };

  return (
    <div className="space-y-6">
      <CalendarSettings />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          className="text-red-600 hover:text-red-700"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}; 