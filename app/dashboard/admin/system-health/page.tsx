import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { SystemHealthClient } from "./_components/SystemHealthClient";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  const session = await adminAuth();
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  return <SystemHealthClient />;
}
