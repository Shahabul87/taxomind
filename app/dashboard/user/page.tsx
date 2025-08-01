import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserDashboard } from "./_components/UserDashboard";

export default async function UserDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  return <UserDashboard user={session.user} />;
}