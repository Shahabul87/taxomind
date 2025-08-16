import { Code2, BookOpen, Sparkles } from "lucide-react";

export const CodeFeaturesGrid = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      <div className="group p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
          <Code2 className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Code Blocks</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          Add syntax-highlighted code snippets that remain visible while students read explanations.
        </p>
      </div>
      
      <div className="group p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rich Explanations</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          Write detailed explanations with markdown support, images, and interactive elements.
        </p>
      </div>
      
      <div className="group p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Interactive Learning</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          Students can follow along with code while reading explanations in a split-view layout.
        </p>
      </div>
    </div>
  );
}; 