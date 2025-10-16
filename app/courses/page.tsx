export const metadata = {
  title: 'Courses | Taxomind',
  description: 'Browse courses and explore intelligent learning paths.'
};

export default function CoursesIndexPage() {
  return (
    <div className="min-h-screen pt-14 xl:pt-16 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Courses</h1>
        <p className="mt-3 text-slate-600 dark:text-gray-400 max-w-3xl">
          Explore our growing catalog. Intelligent LMS features help you learn efficiently with adaptive pathways and course insights.
        </p>
        <div className="mt-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
          <p className="text-sm text-slate-600 dark:text-gray-400">
            A detailed catalog view is coming soon. For now, you can explore individual courses from featured sections and dashboards.
          </p>
        </div>
      </div>
    </div>
  );
}

