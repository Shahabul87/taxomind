"use client";

import Link from "next/link";
import Image from "next/image";
// UserRole removed - users no longer have roles

interface SimpleHeaderProps {
  user: {
    id: string | undefined;
    name?: string | null;
    image?: string | null;
    isTeacher?: boolean;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
  } | null;
}

export const SimpleHeader = ({ user }: SimpleHeaderProps) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-purple-600 dark:text-purple-400">
              Learning Platform
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.name || 'User'}
                </div>
                {user.image && (
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                    <Image src={user.image} alt={user.name || 'User'} className="h-full w-full object-cover" width={32} height={32} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 