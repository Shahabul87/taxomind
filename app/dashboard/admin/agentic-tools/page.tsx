import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { AgenticToolsAdminClient } from "./_components/AgenticToolsAdminClient";

export default async function AgenticToolsAdminPage() {
  const session = await adminAuth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    redirect("/admin/auth/login");
  }

  return <AgenticToolsAdminClient />;
}
