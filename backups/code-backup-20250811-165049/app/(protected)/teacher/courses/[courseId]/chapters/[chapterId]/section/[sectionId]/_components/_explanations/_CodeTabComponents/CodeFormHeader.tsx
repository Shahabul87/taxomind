import React from "react";

export const CodeFormHeader = () => {
  return (
    <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-600 text-center bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100">
        Code Explanation
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
        Add code with explanations
      </p>
    </div>
  );
}; 