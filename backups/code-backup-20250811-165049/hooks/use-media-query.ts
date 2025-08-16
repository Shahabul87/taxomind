import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using media queries
 * @param query The media query to match (e.g., '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Create a media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the callback as a listener for changes to the media query
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function to remove the listener
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
} 