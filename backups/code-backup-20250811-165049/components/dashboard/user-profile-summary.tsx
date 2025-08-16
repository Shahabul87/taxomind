import Link from "next/link";
import { BadgeCheck } from "lucide-react";

interface UserProfileSummaryProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  userData: any;
}

export default function UserProfileSummary({ user, userData }: UserProfileSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={user.image} 
                alt={user?.name || "User"} 
                className="h-full w-full object-cover"
              />
            ) : (
              user?.name?.charAt(0) || "U"
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white flex justify-center items-center">
              {userData?.subscriptions?.length > 0 ? 
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <BadgeCheck className="mr-1 h-5 w-5" /> Premium
                </span> : 
                "Free Plan"
              }
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Link
            href="/profile"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
} 