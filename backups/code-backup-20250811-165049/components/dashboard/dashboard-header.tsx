import Link from "next/link";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your account today
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex gap-2">
        <Link 
          href="/profile" 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          View Profile
        </Link>
        <Link 
          href="/settings" 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white shadow-sm text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Account Settings
        </Link>
      </div>
    </div>
  );
} 