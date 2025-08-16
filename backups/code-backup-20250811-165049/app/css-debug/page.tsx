"use client";

export default function CSSDebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">CSS Debug Page</h1>
      
      {/* Force common Tailwind classes to be included */}
      <div className="hidden">
        <div className="bg-blue-500 text-white p-4 rounded"></div>
        <div className="bg-green-500 text-white p-4 rounded"></div>
        <div className="text-4xl text-blue-500 font-bold"></div>
        <div className="hover:bg-blue-700"></div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">If you see this card styled, CSS is working!</h2>
          <p className="text-gray-600 dark:text-gray-400">This should be a white/gray card with shadow.</p>
        </div>
        
        <button 
          onClick={() => alert('CSS is working!')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Click Me
        </button>
      </div>
    </div>
  );
}