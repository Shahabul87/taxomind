"use client";

import { motion } from "framer-motion";
import { Users, Lock, Globe, UserPlus, Book, Star, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "./notifications-bell";
import { GroupSearch } from "./group-search";
import Image from 'next/image';
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface GroupHeaderProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

export const GroupHeader = ({ group, currentUser, isGroupMember }: GroupHeaderProps) => {
  const [isNotifying, setIsNotifying] = useState(false);
  const isCreator = group.creator.id === currentUser.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Group Banner */}
      <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden shadow-xl">
        {group.imageUrl ? (
          <Image 
            src={group.imageUrl}
            alt={group.name}
            width={1200}
            height={400}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-violet-600 to-indigo-600" />
        )}
        
        {/* Overlay gradient for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Group badges */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {isCreator && (
            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-none">
              <Star className="w-3 h-3 mr-1" />
              Creator
            </Badge>
          )}
          {group.privacy === "public" ? (
            <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-none">
              <Globe className="w-3 h-3 mr-1" />
              Public
            </Badge>
          ) : group.privacy === "private" ? (
            <Badge className="bg-indigo-500/90 hover:bg-indigo-500 text-white border-none">
              <Lock className="w-3 h-3 mr-1" />
              Private
            </Badge>
          ) : (
            <Badge className="bg-blue-500/90 hover:bg-blue-500 text-white border-none">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Invite Only
            </Badge>
          )}
        </div>
      </div>

      {/* Group Info Card - Floating above the banner */}
      <div className="relative mt-[-3rem]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {group.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm">{group.members.length} members</span>
                </div>
                {group.course && (
                  <div className="flex items-center gap-1">
                    <Book className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm">{group.course.title}</span>
                  </div>
                )}
                {group.categoryRef && (
                  <span className="px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300">
                    {group.categoryRef.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {!isGroupMember ? (
                <Button
                  className={cn(
                    "bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700",
                    "text-white font-medium",
                    "shadow-md shadow-indigo-500/20",
                    "border-0"
                  )}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              ) : (
                <Button
                  onClick={() => setIsNotifying(!isNotifying)}
                  variant="outline"
                  className={cn(
                    isNotifying ? "text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700" : "",
                    "transition-colors duration-200"
                  )}
                >
                  <Bell className={cn(
                    "w-4 h-4 mr-2",
                    isNotifying ? "text-indigo-600 dark:text-indigo-400" : ""
                  )} />
                  {isNotifying ? "Notifications On" : "Get Notified"}
                </Button>
              )}
            </div>
          </div>

          {group.description && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {group.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <GroupSearch group={group} />
          </div>
          {isGroupMember && (
            <NotificationsBell
              notifications={[]} // TODO: Fetch notifications
              onMarkAsRead={(id) => {
                // TODO: Implement mark as read
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}; 