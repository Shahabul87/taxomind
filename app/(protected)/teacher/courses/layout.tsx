import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

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
      <SmartHeader user={user} />
      <SmartSidebar user={user} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 ml-[72px] transition-all duration-300">
        {children}
      </div>
    </>
  );
}
