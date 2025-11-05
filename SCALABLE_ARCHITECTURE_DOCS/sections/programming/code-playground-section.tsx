'use client';

/**
 * Code Playground Section - Programming Category
 *
 * Interactive code editor preview for programming courses
 */

import { Code2, Play, Terminal, FileCode } from 'lucide-react';
import type { ProgrammingSectionProps } from '../../../_types/section.types';

export function CodePlaygroundSection({ course }: ProgrammingSectionProps) {
  // Demo code examples by language
  const codeExamples = [
    {
      language: 'JavaScript',
      icon: FileCode,
      code: `// React Component Example
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

export default Welcome;`,
      description: 'Build interactive UI components',
    },
    {
      language: 'TypeScript',
      icon: Terminal,
      code: `// Type-safe API call
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}`,
      description: 'Write type-safe, scalable code',
    },
    {
      language: 'Python',
      icon: Code2,
      code: `# Data processing with Pandas
import pandas as pd

def analyze_data(df):
    return df.groupby('category').agg({
        'sales': 'sum',
        'quantity': 'mean'
    })`,
      description: 'Process and analyze data efficiently',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Interactive Code Playground
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Practice coding directly in your browser with real-time feedback and syntax highlighting
          </p>
        </div>

        {/* Code Examples Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {codeExamples.map((example, index) => {
            const IconComponent = example.icon;
            return (
              <div
                key={index}
                className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{example.language}</h3>
                    <p className="text-xs text-slate-300">{example.description}</p>
                  </div>
                </div>

                {/* Code Block */}
                <div className="p-4 bg-slate-900 dark:bg-slate-950">
                  <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>

                {/* Action Button */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 group-hover:scale-105">
                    <Play className="w-4 h-4" />
                    <span className="font-semibold">Run Code</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Playground Features
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Terminal className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Real-time Execution
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  See your code run instantly with live output
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Syntax Highlighting
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Color-coded syntax for better readability
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Multiple Languages
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Practice in JavaScript, Python, TypeScript, and more
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                <Play className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  Save &amp; Share
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Save your code snippets and share with others
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Access 50+ coding challenges and projects in the playground
          </p>
        </div>
      </div>
    </section>
  );
}
