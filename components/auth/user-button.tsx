"use client";

import { User, ShieldCheck, Settings, Server, Home } from "lucide-react";
import { ExitIcon } from "@radix-ui/react-icons"
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogoutButton } from "@/components/auth/logout-button";

export const UserButton = () => {
  const user = useCurrentUser();

  //console.log(user)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative group focus:outline-none focus:ring-2 focus:ring-purple-500/20 rounded-full">
        {/* Gradient ring on hover */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 blur transition-all duration-300" />

        {/* Avatar container */}
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700 group-hover:border-transparent transition-all duration-300 shadow-md group-hover:shadow-xl">
            <AvatarImage src={user?.image || ""} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white font-semibold">
              <User className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>

          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 mt-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-xl" align="end">
        {/* User Info Header */}
        <div className="px-2 py-3 mb-2 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {user?.name || "User"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.email || "No email"}
          </p>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem className="rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Link href="/settings" className="flex flex-row items-center w-full py-1">
            <div className="w-8 h-8 mr-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="font-medium">Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Link href="/admin" className="flex flex-row items-center w-full py-1">
            <div className="w-8 h-8 mr-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium">Admin</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Link href="/server" className="flex flex-row items-center w-full py-1">
            <div className="w-8 h-8 mr-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
              <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">Server</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Link href="/client" className="flex flex-row items-center w-full py-1">
            <div className="w-8 h-8 mr-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
              <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="font-medium">Client</span>
          </Link>
        </DropdownMenuItem>

        {/* Separator */}
        <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

        {/* Logout Button */}
        <LogoutButton>
          <DropdownMenuItem className="rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <div className="flex flex-row items-center w-full py-1 text-red-600 dark:text-red-400">
              <div className="w-8 h-8 mr-2 rounded-lg bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center">
                <ExitIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="font-medium">Logout</span>
            </div>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};