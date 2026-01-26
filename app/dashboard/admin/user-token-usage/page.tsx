import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";
import { UserTokenUsageClient } from "./_components/UserTokenUsageClient";

export const dynamic = "force-dynamic";

export default async function UserTokenUsagePage() {
  // Check admin session
  const session = await adminAuth();
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  return <UserTokenUsageClient />;
}
