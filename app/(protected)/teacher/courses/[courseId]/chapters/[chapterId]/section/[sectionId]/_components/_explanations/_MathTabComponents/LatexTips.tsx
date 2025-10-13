"use client";

export const LatexTips = () => {
  return (
    <div className="border border-purple-200 dark:border-purple-800/30 shadow-sm bg-purple-50 dark:bg-purple-900/20 rounded-lg">
      <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 rounded-t-lg border-b border-purple-200 dark:border-purple-800/30 py-3 px-4">
        <h4 className="text-sm text-gray-900 dark:text-gray-100 font-bold">
          LaTeX Tips
        </h4>
      </div>
      <div className="pt-2 pb-3 px-4">
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <li>
            <strong className="text-gray-900 dark:text-gray-100">Fractions:</strong>{" "}
            <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-1 rounded text-[10px]">
              \frac&#123;numerator&#125;&#123;denominator&#125;
            </code>
          </li>
          <li>
            <strong className="text-gray-900 dark:text-gray-100">Exponents:</strong>{" "}
            <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-1 rounded text-[10px]">
              x^&#123;power&#125;
            </code>
          </li>
          <li>
            <strong className="text-gray-900 dark:text-gray-100">Square roots:</strong>{" "}
            <code className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-1 rounded text-[10px]">
              \sqrt&#123;expression&#125;
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}; 