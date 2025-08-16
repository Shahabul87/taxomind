export default async function CourseLearnLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 transition-colors duration-200">
      <main className="flex-1 text-gray-100">
        {children}
      </main>
    </div>
  );
} 