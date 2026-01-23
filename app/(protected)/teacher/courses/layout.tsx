import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UnifiedHeaderClient } from "@/components/dashboard/unified-header-client";
import { TeacherCoursesClient } from "./_components/teacher-courses-client";

export default async function TeacherCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <>
      <UnifiedHeaderClient user={user} />
      <TeacherCoursesClient user={user}>
        <div className="min-h-screen pt-14 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 transition-all duration-300">
          {children}
        </div>
      </TeacherCoursesClient>
    </>
  );
}
