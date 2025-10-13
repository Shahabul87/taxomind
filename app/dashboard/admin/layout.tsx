import { ReactNode } from "react";
import { AdminWithSidebar } from "./admin-with-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Mock admin user - in production, this would come from auth
  const user = {
    id: "admin001",
    name: "Admin",
    email: "admin@taxomind.com",
    image: null,
    role: "ADMIN" as const
  };

  return <AdminWithSidebar user={user}>{children}</AdminWithSidebar>;
}