import React, { useState } from "react";
import { logger } from '@/lib/logger';

// Local storage hook for code explanations
export function useCodeExplanationLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      try {
        return JSON.parse(item);
      } catch {
        window.localStorage.removeItem(key);
        logger.warn(`Invalid JSON in localStorage for key: ${key}, using default value`);
        return initialValue;
      }
    } catch (error) {
      logger.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue];
} 