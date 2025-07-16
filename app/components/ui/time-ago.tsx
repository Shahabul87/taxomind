"use client";

import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

/**
 * TimeAgo component that safely handles date formatting for client-side rendering
 * Uses a fallback during SSR and updates with proper formatting on the client
 */
export function TimeAgo({ date, className }: TimeAgoProps) {
  const [formattedTime, setFormattedTime] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false);
  
  // Parse date if it's a string
  const dateObj = useMemo(() => date instanceof Date ? date : new Date(date), [date]);
  
  useEffect(() => {
    // Mark as mounted on first client render
    setHasMounted(true);
    
    // Format the date only on the client side
    setFormattedTime(formatDistanceToNow(dateObj, { addSuffix: true }));
    
    // Optional: Update the time periodically
    const timer = setInterval(() => {
      setFormattedTime(formatDistanceToNow(dateObj, { addSuffix: true }));
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [dateObj]);
  
  // During server-side rendering and initial hydration, return a fixed string
  if (!hasMounted) {
    return <span className={className}>{dateObj.toISOString()}</span>;
  }
  
  // After hydration, show the client-side formatted time
  return <span className={className}>{formattedTime}</span>;
} 