export const dynamic = 'force-static';

export const metadata = {
  title: 'AI Tutor | Taxomind',
  description: 'Personal learning assistant powered by AI. Get explanations, practice, and personalized guidance.'
};

export default function AITutorPage() {
  return (
    <div className="min-h-screen pt-14 xl:pt-16 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">AI Tutor</h1>
        <p className="mt-3 text-slate-600 dark:text-gray-400 max-w-3xl">
          Your personal learning assistant. Ask questions, get tailored explanations, and practice with smart suggestions.
        </p>
        <div className="mt-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            This is a placeholder page. The full AI Tutor experience integrates across courses and learning flows.
          </p>
        </div>
      </div>
    </div>
  );
}

