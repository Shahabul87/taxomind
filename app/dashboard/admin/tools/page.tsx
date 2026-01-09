import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/auth.admin';
import { ToolsClient } from './_components/ToolsClient';

export const metadata: Metadata = {
  title: 'Tool Execution System | Admin | Taxomind',
  description: 'Manage AI tool registry, permissions, and monitor executions',
};

export default async function AdminToolsPage() {
  const session = await adminAuth();

  // Check if session exists and has user
  if (!session?.user) {
    redirect('/admin/auth/login');
  }

  // Safely check role - allow ADMIN and SUPERADMIN
  const userRole = (session.user as { role?: string }).role;
  if (!userRole || (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN')) {
    redirect('/admin/auth/login');
  }

  return (
    <ToolsClient
      user={{
        id: session.user.id ?? '',
        name: session.user.name,
        email: session.user.email,
        role: userRole,
      }}
    />
  );
}
