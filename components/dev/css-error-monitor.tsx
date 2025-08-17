'use client';

import { useEffect, useState } from 'react';

/**
 * CSS Error Monitor Component
 * Monitors and reports CSS loading errors in development
 */
export function CSSErrorMonitor() {
  const [cssErrors, setCSSErrors] = useState<string[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    let errorCount = 0;
    const cssErrorPattern = /_next\/static\/css|\.css/;
    
    // Monitor for CSS 404 errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [resource] = args;
      const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : resource.toString();
      
      try {
        const response = await originalFetch(...args);
        
        // Check for CSS 404 errors
        if (!response.ok && url && cssErrorPattern.test(url)) {
          errorCount++;
          setCSSErrors(prev => [...prev, url]);
          
          if (errorCount >= 3) {
            setShowBanner(true);
            console.error('🚨 Multiple CSS 404 errors detected!');
            console.error('Run "npm run fix-css" to resolve this issue.');
          }
        }
        
        return response;
      } catch (error) {
        if (url && cssErrorPattern.test(url)) {
          errorCount++;
          setCSSErrors(prev => [...prev, url]);
        }
        throw error;
      }
    };
    
    // Listen for resource loading errors
    const handleError = (event: ErrorEvent) => {
      if (event.filename && cssErrorPattern.test(event.filename)) {
        errorCount++;
        setCSSErrors(prev => [...prev, event.filename]);
        
        if (errorCount >= 3) {
          setShowBanner(true);
        }
      }
    };
    
    window.addEventListener('error', handleError, true);
    
    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError, true);
    };
  }, []);
  
  // Don't show in production
  if (process.env.NODE_ENV !== 'development' || !showBanner) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-[9999]">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            CSS Loading Error Detected
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Multiple CSS files failed to load. To fix this:</p>
            <ol className="list-decimal list-inside mt-1">
              <li>Stop the dev server (Ctrl+C)</li>
              <li>Run: <code className="bg-red-100 px-1 rounded">npm run fix-css</code></li>
              <li>Start: <code className="bg-red-100 px-1 rounded">npm run dev:clean</code></li>
            </ol>
          </div>
          <div className="mt-3">
            <button
              onClick={() => setShowBanner(false)}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}