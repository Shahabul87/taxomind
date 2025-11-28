import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCenter } from "./_components/message-center";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";

export default async function MessagesPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      <div className="min-h-screen w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6">
        <MessageCenter userId={user.id!} />
      </div>
    </PageWithMobileLayout>
  );
} 