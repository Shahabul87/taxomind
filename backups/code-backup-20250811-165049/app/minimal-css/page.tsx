"use client";

// Minimal CSS test with no external dependencies
export default function MinimalCSS() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          CSS Test Page - No Dependencies
        </h1>
        
        <div className="space-y-6">
          {/* Test 1: Basic Tailwind Classes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-blue-600 mb-4">
              Test 1: Tailwind CSS Classes
            </h2>
            <p className="text-gray-700 mb-4">
              If this card has a white background, shadow, and rounded corners, Tailwind is working.
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
              Hover Me
            </button>
          </div>

          {/* Test 2: Responsive Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-red-500 text-white p-4 rounded">Red Box</div>
            <div className="bg-green-500 text-white p-4 rounded">Green Box</div>
            <div className="bg-blue-500 text-white p-4 rounded">Blue Box</div>
          </div>

          {/* Test 3: Flexbox */}
          <div className="flex items-center justify-between bg-gray-800 text-white p-6 rounded-lg">
            <span>Flexbox Test</span>
            <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
          </div>

          {/* Test 4: Animations */}
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl">🎨</div>
            <p className="mt-2 text-gray-600">Spinning icon = CSS animations work</p>
          </div>
        </div>
      </div>
    </div>
  );
}