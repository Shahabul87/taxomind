"use client";

import { useEffect } from 'react';
import { useToastStore } from '@/store/toast-store';

export const useSafeToast = () => {
  const { addToast, processQueue } = useToastStore();
  
  // Process any queued toasts on mount
  useEffect(() => {
    processQueue();
  }, [processQueue]);
  
  return {
    success: (message: string, options?: any) => addToast('success', message, options),
    error: (message: string, options?: any) => addToast('error', message, options),
    info: (message: string, options?: any) => addToast('info', message, options),
    custom: (message: string, options?: any) => addToast('custom', message, options)
  };
}; 