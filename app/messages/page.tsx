import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCenter } from "./_components/message-center";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

export default async function MessagesPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <>
      {/* Smart Sidebar - Fixed position with 72px collapsed width */}
      <SmartSidebar user={user as any} />

      {/* Main Content Area - Left margin matches collapsed sidebar width (72px) */}
      <div className="ml-[72px]">
        {/* Smart Header - Full width, sticky to top */}
        <SmartHeader user={user as any} />

        {/* Page Content */}
        <main className="min-h-screen pt-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <MessageCenter userId={user.id!} />
          </div>
        </main>
      </div>
    </>
  );
} 