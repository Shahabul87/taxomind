"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { 
  Calendar, 
  MessageCircle, 
  Users, 
  Clock, 
  Shield, 
  User, 
  Tag,
  Heart,
  ChevronRight,
  Search,
  PlusCircle,
  Settings,
  CalendarDays,
  MessagesSquare,
  UserPlus,
  X
} from "lucide-react";
import { Group, GroupDiscussion, GroupEvent, GroupMember, User as UserType, Category } from "@prisma/client";
import { EmptyState } from "./empty-state";

// Define types
interface GroupWithRelations extends Group {
  _count: {
    members: number;
    discussions: number;
    events: number;
  };
  categoryRef: Category | null;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface GroupMemberWithGroup extends GroupMember {
  group: GroupWithRelations;
}

interface DiscussionWithRelations extends GroupDiscussion {
  group: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    comments: number;
    likedBy: number;
  };
}

interface EventWithRelations extends GroupEvent {
  group: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  _count: {
    attendees: number;
  };
}

interface MyGroupsContentProps {
  ownedGroups: GroupMemberWithGroup[];
  joinedGroups: GroupMemberWithGroup[];
  recentDiscussions: DiscussionWithRelations[];
  upcomingEvents: EventWithRelations[];
}

export const MyGroupsContent = ({
  ownedGroups,
  joinedGroups,
  recentDiscussions,
  upcomingEvents,
}: MyGroupsContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "joined">("all");

  // Filter groups based on search query and tab
  const filteredOwnedGroups = ownedGroups.filter((item) =>
    item.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJoinedGroups = joinedGroups.filter((item) =>
    item.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="w-full md:w-2/3">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <Users className="mr-2 w-6 h-6 text-indigo-500" />
                My Groups
                <span className="ml-2 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5">
                  {ownedGroups.length + joinedGroups.length}
                </span>
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-700 dark:text-gray-200"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                All Groups
              </button>
              <button
                onClick={() => setActiveTab("owned")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "owned"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                Created by Me
              </button>
              <button
                onClick={() => setActiveTab("joined")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "joined"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                Joined Groups
              </button>
            </div>
          </div>

          {/* Groups Grid */}
          <AnimatePresence mode="wait">
            {/* Empty State */}
            {((activeTab === "all" && filteredOwnedGroups.length + filteredJoinedGroups.length === 0) ||
              (activeTab === "owned" && filteredOwnedGroups.length === 0) ||
              (activeTab === "joined" && filteredJoinedGroups.length === 0)) && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  icon={<Users className="w-10 h-10 text-indigo-300 dark:text-indigo-600" />}
                  title={searchQuery ? "No matching groups found" : "No groups yet"}
                  description={
                    searchQuery
                      ? "Try adjusting your search term"
                      : "Join or create a group to get started"
                  }
                  actionText="Create New Group"
                  actionLink="/groups/create"
                />
              </motion.div>
            )}

            {/* Groups */}
            {(activeTab === "all" || activeTab === "owned") && filteredOwnedGroups.length > 0 && (
              <motion.div
                key="owned"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="mb-10"
              >
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                      <Shield className="mr-2 w-5 h-5 text-indigo-500" />
                      Groups You Manage
                    </h3>
                    <Link href="/dashboard/user/groups/create">
                      <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Create New
                      </button>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOwnedGroups.map((membership) => (
                    <GroupCard
                      key={membership.group.id}
                      membership={membership}
                      isOwner={true}
                      variants={itemVariants}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {(activeTab === "all" || activeTab === "joined") && filteredJoinedGroups.length > 0 && (
              <motion.div
                key="joined"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {activeTab === "all" && (
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                      <UserPlus className="mr-2 w-5 h-5 text-indigo-500" />
                      Groups You&apos;ve Joined
                    </h3>
                    <Link href="/dashboard/user/groups">
                      <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
                        <Search className="w-4 h-4 mr-1" />
                        Discover More
                      </button>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredJoinedGroups.map((membership) => (
                    <GroupCard
                      key={membership.group.id}
                      membership={membership}
                      isOwner={false}
                      variants={itemVariants}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-1/3 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                Recent Discussions
              </h3>
            </div>
            {recentDiscussions.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentDiscussions.map((discussion) => (
                  <Link
                    key={discussion.id}
                    href={`/groups/${discussion.groupId}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 relative rounded-full overflow-hidden">
                          <Image
                            src={discussion.group.imageUrl || "/group-placeholder.jpg"}
                            alt={discussion.group.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {discussion.title}
                          </p>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <span className="line-clamp-1">{discussion.group.name}</span>
                              <span className="mx-1.5 inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                              <span>{format(new Date(discussion.createdAt), "MMM d")}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              {discussion._count.comments}
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-3.5 h-3.5 mr-1" />
                              {discussion._count.likedBy}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <MessagesSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No recent discussions</p>
              </div>
            )}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750">
              <Link href="/dashboard/user/groups">
                <button className="w-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-center">
                  View All Discussions
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Upcoming Events
              </h3>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/groups/${event.groupId}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-2.5 text-indigo-600 dark:text-indigo-400">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                            <span className="line-clamp-1">{event.group.name}</span>
                          </p>
                          <div className="flex items-center mt-2 text-xs font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              {format(new Date(event.date), "MMM d, yyyy")}
                              {event.startTime && ` • ${event.startTime}`}
                            </span>
                            <span className="ml-2 text-gray-500 dark:text-gray-400 flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              {event._count.attendees}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No upcoming events</p>
              </div>
            )}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750">
              <Link href="/dashboard/user/groups">
                <button className="w-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center justify-center">
                  View All Events
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Group Card Component
interface GroupCardProps {
  membership: GroupMemberWithGroup;
  isOwner: boolean;
  variants: any;
}

const GroupCard = ({ membership, isOwner, variants }: GroupCardProps) => {
  const { group } = membership;

  return (
    <motion.div
      variants={variants}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800"
    >
      <div className="relative h-32 overflow-hidden">
        {group.imageUrl ? (
          <Image
            src={group.imageUrl}
            alt={group.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Role Badge */}
        <div className="absolute top-3 left-3">
          <span 
            className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm 
              ${isOwner 
                ? "bg-yellow-500/20 text-yellow-200 border border-yellow-500/30" 
                : "bg-blue-500/20 text-blue-200 border border-blue-500/30"
              }`}
          >
            {isOwner ? (
              <span className="flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </span>
            ) : (
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                Member
              </span>
            )}
          </span>
        </div>
        
        {/* Category Badge */}
        {group.categoryRef && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200 backdrop-blur-sm border border-indigo-500/30 flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {group.categoryRef.name}
            </span>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-1">
            {group.name}
          </h3>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 h-10 mb-3">
          {group.description || "No description provided"}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-indigo-500" />
              {group._count.members}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1 text-indigo-500" />
              {group._count.discussions}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-indigo-500" />
              {group._count.events}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/groups/${group.id}`} className="flex-1">
            <button className="w-full px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              View Group
            </button>
          </Link>
          
          {isOwner && (
            <Link href={`/groups/${group.id}/settings`} className="flex-shrink-0">
              <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 