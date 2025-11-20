import { db } from "@/lib/db";
// UserRole removed - admins use AdminRole from AdminAccount table

// Force dynamic rendering to avoid build-time database queries
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let stats = 0;
  try {
    stats = await db.user.count();
  } catch (error) {
    console.error("Database error in User.count:", error);
    // Return 0 during build if database is not ready
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div>Total Users: {stats}</div>
    </div>
  );
} 