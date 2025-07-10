export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          CSS Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tailwind Classes Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Tailwind Classes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              If you can see styled content here, Tailwind is working.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
              Test Button
            </button>
          </div>
          
          {/* CSS Variables Test */}
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold text-card-foreground mb-4">
              CSS Variables
            </h2>
            <p className="text-muted-foreground mb-4">
              This uses CSS custom properties from your theme.
            </p>
            <button className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded">
              Primary Button
            </button>
          </div>
          
          {/* Gradient Test */}
          <div className="bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-semibold mb-4">Gradient Background</h2>
            <p className="mb-4">Testing gradient utilities</p>
          </div>
          
          {/* Animation Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Animation Test
            </h2>
            <div className="animate-pulse bg-blue-500 h-4 w-full rounded mb-2"></div>
            <div className="animate-bounce text-2xl">🎯</div>
          </div>
        </div>
        
        {/* Raw HTML Test */}
        <div className="mt-8 p-6 bg-yellow-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Debug Info:</h2>
          <p>If this box has a yellow background, CSS is loading.</p>
          <p className="mt-2">Current classes on body: Check DevTools</p>
        </div>
      </div>
    </div>
  );
}