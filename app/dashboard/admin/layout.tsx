import { ReactNode } from "react";
import { AdminWithSidebar } from "./admin-with-sidebar";
import { adminAuth } from "@/auth.admin";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

interface SessionUser {
  id?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Get real admin session
  const session = await adminAuth();

  // Redirect to login if no session
  if (!session || !session.user) {
    redirect("/admin/auth/login");
  }

  // Redirect if not an admin or superadmin
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    redirect("/admin/auth/login");
  }

  // Type-safe user ID extraction - handle both 'id' and 'sub' fields
  const sessionUser = session.user as SessionUser;
  const userId = sessionUser.id || sessionUser.sub;

  // Guard against missing userId
  if (!userId) {
    console.error("[AdminLayout] Missing user ID in session");
    redirect("/admin/auth/login");
  }

  const user = {
    id: userId,
    name: session.user.name || null,
    email: session.user.email || null,
    image: session.user.image || null,
    role: session.user.role as "ADMIN" | "SUPERADMIN"
  };

  return <AdminWithSidebar user={user}>{children}</AdminWithSidebar>;
}