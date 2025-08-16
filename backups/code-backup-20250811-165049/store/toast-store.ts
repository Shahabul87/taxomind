"use client";

import { create } from 'zustand';
import { toast as sonnerToast } from 'sonner';

type ToastStore = {
  toastQueue: Array<{type: string; message: string; options?: any}>;
  addToast: (type: string, message: string, options?: any) => void;
  processQueue: () => void;
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toastQueue: [],
  addToast: (type, message, options = {}) => {
    set(state => ({
      toastQueue: [...state.toastQueue, {type, message, options}]
    }));
    // Process immediately if we're client-side
    if (typeof window !== 'undefined') {
      setTimeout(() => get().processQueue(), 0);
    }
  },
  processQueue: () => {
    const { toastQueue } = get();
    if (toastQueue.length > 0) {
      toastQueue.forEach(item => {
        switch(item.type) {
          case 'success':
            sonnerToast.success(item.message, item.options);
            break;
          case 'error':
            sonnerToast.error(item.message, item.options);
            break;
          case 'info':
            sonnerToast.info(item.message, item.options);
            break;
          default:
            sonnerToast(item.message, item.options);
        }
      });
      set({ toastQueue: [] });
    }
  }
})); 