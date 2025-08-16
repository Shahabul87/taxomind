import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupportContent } from "./_components/support-content";

export default async function SupportPage() {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/");
  }

  return (
    <SidebarDemo>
      <div className="p-6 pt-16">
        <SupportContent userId={user.id!} />
      </div>
    </SidebarDemo>
  );
} 