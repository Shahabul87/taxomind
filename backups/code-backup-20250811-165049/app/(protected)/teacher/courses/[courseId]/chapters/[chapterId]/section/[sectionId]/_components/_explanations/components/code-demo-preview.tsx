export const CodeDemoPreview = () => {
  return (
    <div className="w-full bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 shadow-2xl border border-gray-800">
      <h3 className="text-4xl font-bold text-white mb-12 text-center">Preview Experience</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {/* Code Side */}
        <div className="bg-gray-950 rounded-2xl p-8 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-400 text-base ml-4 font-mono">main.js</span>
          </div>
          <pre className="text-green-400 font-mono text-base leading-relaxed">
{`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + 
         fibonacci(n - 2);
}

console.log(fibonacci(10));`}
          </pre>
        </div>
        
        {/* Explanation Side */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Understanding Recursion</h4>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-lg">
            This function demonstrates recursive computation. The base case prevents infinite recursion...
          </p>
          <div className="flex items-center gap-3 text-base text-blue-600 dark:text-blue-400">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            Interactive explanation continues...
          </div>
        </div>
      </div>
    </div>
  );
}; 