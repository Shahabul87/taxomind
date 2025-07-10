import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SimpleTabbedDashboard } from "./_components/SimpleTabbedDashboard";

export default async function UserDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  return <SimpleTabbedDashboard user={session.user} />;
}