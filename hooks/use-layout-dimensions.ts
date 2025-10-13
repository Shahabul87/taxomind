import { useState, useEffect } from 'react';

interface LayoutDimensions {
  sidebarWidth: number;
  headerHeight: number;
  isSidebarExpanded: boolean;
  isMobile: boolean;
  isTablet: boolean;
}

/**
 * Hook to track dynamic layout dimensions (sidebar width, header height)
 * Useful for teacher routes that need to adjust content based on collapsible sidebar
 */
export function useLayoutDimensions(): LayoutDimensions {
  const [dimensions, setDimensions] = useState<LayoutDimensions>({
    sidebarWidth: 94, // Default collapsed width
    headerHeight: 64, // Default header height (16 * 4 = 64px for sm:pt-16)
    isSidebarExpanded: false,
    isMobile: false,
    isTablet: false,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const isMobile = width < 1024;
      const isTablet = width >= 768 && width < 1024;

      // Get header height from DOM
      const header = document.querySelector('header');
      const headerHeight = header?.offsetHeight || (width >= 640 ? 64 : 56);

      // Check sidebar expansion state from localStorage
      const savedExpanded = localStorage.getItem('sidebar-expanded');
      const isSidebarExpanded = savedExpanded ? JSON.parse(savedExpanded) : false;

      // Determine sidebar width based on expansion state
      let sidebarWidth = 94; // Default collapsed
      if (isMobile) {
        sidebarWidth = 0; // Hidden on mobile when not open
      } else if (isSidebarExpanded) {
        sidebarWidth = 280; // Expanded
      }

      setDimensions({
        sidebarWidth,
        headerHeight,
        isSidebarExpanded,
        isMobile,
        isTablet,
      });
    };

    // Initial update
    updateDimensions();

    // Listen for resize events
    window.addEventListener('resize', updateDimensions);

    // Listen for storage events (sidebar expansion changes)
    window.addEventListener('storage', updateDimensions);

    // Custom event for sidebar state changes
    const handleSidebarChange = () => updateDimensions();
    window.addEventListener('sidebar-state-change', handleSidebarChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('storage', updateDimensions);
      window.removeEventListener('sidebar-state-change', handleSidebarChange);
    };
  }, []);

  return dimensions;
}
