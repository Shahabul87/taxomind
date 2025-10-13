"use client";

import { useLayoutDimensions } from '@/hooks/use-layout-dimensions';
import { BarChart3, Layout, Monitor } from 'lucide-react';

/**
 * Example component demonstrating the dynamic layout system
 * Shows real-time sidebar width, header height, and responsive state
 */
export function DynamicLayoutExample() {
  const {
    sidebarWidth,
    headerHeight,
    isSidebarExpanded,
    isMobile,
    isTablet,
  } = useLayoutDimensions();

  const deviceType = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Dynamic Layout System
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time layout dimensions and responsive state
        </p>
      </div>

      {/* Dimension Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar Width Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10">
              <Layout className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Sidebar Width
            </h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {sidebarWidth}px
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isSidebarExpanded ? (
                <span className="text-green-600 dark:text-green-400">
                  ✓ Expanded
                </span>
              ) : (
                <span className="text-gray-500">Collapsed</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Height Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Header Height
            </h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {headerHeight}px
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {headerHeight === 64 ? 'Desktop' : 'Mobile'}
            </div>
          </div>
        </div>

        {/* Device Type Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
              <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Device Type
            </h3>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {deviceType}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isMobile && '<1024px'}
              {isTablet && '768-1023px'}
              {!isMobile && !isTablet && '≥1024px'}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Content Area Calculations
        </h3>
        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-gray-600 dark:text-gray-400">
              Content Margin Left:
            </span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {sidebarWidth}px
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-gray-600 dark:text-gray-400">
              Content Width:
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              calc(100% - {sidebarWidth}px)
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <span className="text-gray-600 dark:text-gray-400">
              Content Padding Top:
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {headerHeight}px (header space)
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Try It Out
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              Click the sidebar expand button to see dimensions update in
              real-time
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              Hover over the collapsed sidebar to see temporary expansion
              (desktop only)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              Resize your browser window to see responsive breakpoint changes
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400">•</span>
            <span>
              All values update automatically with smooth transitions
            </span>
          </li>
        </ul>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
        <div className="text-xs text-gray-400 mb-2">Usage Example</div>
        <pre className="text-sm text-gray-100">
          <code>{`import { useLayoutDimensions } from '@/hooks/use-layout-dimensions';

export default function MyTeacherPage() {
  const { sidebarWidth, headerHeight } = useLayoutDimensions();

  return (
    <div
      style={{
        marginLeft: \`\${sidebarWidth}px\`,
        paddingTop: \`\${headerHeight}px\`,
        transition: 'all 300ms ease-in-out',
      }}
    >
      <h1>Dynamic Content</h1>
      <p>Adjusts automatically to sidebar width</p>
    </div>
  );
}`}</code>
        </pre>
      </div>
    </div>
  );
}
