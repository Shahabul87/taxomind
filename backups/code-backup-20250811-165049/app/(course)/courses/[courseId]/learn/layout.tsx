import { ThemeProvider } from "@/app/providers/theme-provider";

export default async function CourseLearnLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
        <main className="flex-1 text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
} 