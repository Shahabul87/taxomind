import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCenter } from "./_components/message-center";

export default async function MessagesPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  return (
    <SidebarDemo>
      <div className="p-6 pt-16">
        <MessageCenter userId={user.id!} />
      </div>
    </SidebarDemo>
  );
} 