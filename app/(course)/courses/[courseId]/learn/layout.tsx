export default async function CourseLearnLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-200">
      <main className="flex-1 text-slate-900 dark:text-slate-100">
        {children}
      </main>
    </div>
  );
} 