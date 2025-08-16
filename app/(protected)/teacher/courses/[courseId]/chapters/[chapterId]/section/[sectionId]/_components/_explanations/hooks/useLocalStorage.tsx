import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Use useState with a lazy initializer function
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // Only try to get from localStorage after component has mounted (client-side only)
  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Check if the item exists
      if (item) {
        try {
          // Parse stored json
          const parsedValue = JSON.parse(item);
          setStoredValue(parsedValue);
        } catch {
          // If JSON parsing fails, remove the invalid item
          window.localStorage.removeItem(key);
          logger.warn(`Invalid JSON in localStorage for key: ${key}, using default value`);
        }
      }
    } catch (error: any) {
      logger.error("Error reading from localStorage:", error);
    }
  }, [key]); // Run only once when component mounts

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error: any) {
      logger.error("Error writing to localStorage:", error);
    }
  };

  return [storedValue, setValue];
}

export { useLocalStorage }; 