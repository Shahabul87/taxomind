"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Shield, MoreVertical, Search, UserCog, Crown, Star, Mail, Filter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { InviteMemberDialog } from "./invite-member-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MembersProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

export const Members = ({ group, currentUser, isGroupMember }: MembersProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const isAdmin = group.members.some(
    (member: any) => member.userId === currentUser.id && member.role === "admin"
  );
  
  const isCreator = group.creator.id === currentUser.id;

  // Filter and sort members
  const filteredMembers = group.members
    .filter((member: any) => {
      if (roleFilter === "all") return true;
      return member.role === roleFilter;
    })
    .filter((member: any) => {
      if (!searchQuery) return true;
      return member.user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: any, b: any) => {
      // Always show creator first
      if (a.userId === group.creator.id) return -1;
      if (b.userId === group.creator.id) return 1;
      
      // Then sort by role (admin -> moderator -> member)
      const roleOrder = { admin: 1, moderator: 2, member: 3 };
      return roleOrder[a.role as keyof typeof roleOrder] - roleOrder[b.role as keyof typeof roleOrder];
    });
    
  // Stats for displaying member counts
  const totalMembers = group.members.length;
  const adminCount = group.members.filter((m: any) => m.role === "admin").length;
  const moderatorCount = group.members.filter((m: any) => m.role === "moderator").length;
  const memberCount = group.members.filter((m: any) => m.role === "member").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Members</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalMembers}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Admins</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{adminCount}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <UserCog className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Moderators</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{moderatorCount}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Members</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{memberCount}</p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search members..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {roleFilter === "all" ? "All Roles" : `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup value={roleFilter} onValueChange={setRoleFilter}>
                <DropdownMenuRadioItem value="all">
                  All Roles ({totalMembers})
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="admin">
                  Admins ({adminCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="moderator">
                  Moderators ({moderatorCount})
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="member">
                  Members ({memberCount})
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-l-lg",
                viewMode === "grid" 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-r-lg",
                viewMode === "list" 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {isAdmin && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          )}
        </div>
      </div>

      {/* Display members */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <Users className="w-16 h-16 mx-auto mb-6 text-indigo-300 dark:text-indigo-700" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No members found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? "Try adjusting your search criteria."
                : "There are no members in this group yet."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 pl-2">
            Showing {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </div>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-3 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-lg">
                        {member.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {member.user.name}
                    </h3>
                    
                    <div className="flex items-center mt-1 mb-4">
                      {member.userId === group.creatorId ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30 border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      ) : member.role === "admin" ? (
                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : member.role === "moderator" ? (
                        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/30 border-0">
                          <UserCog className="w-3 h-3 mr-1" />
                          Moderator
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30 border-0">
                          <Users className="w-3 h-3 mr-1" />
                          Member
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </Button>
                      
                      {isAdmin && member.userId !== currentUser.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role !== "admin" && (
                              <DropdownMenuItem>
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role !== "moderator" && member.role !== "admin" && (
                              <DropdownMenuItem>
                                Make Moderator
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-700">
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        {member.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {member.user.name}
                        {member.userId === group.creatorId ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/30 border-0 ml-2">
                            <Crown className="w-3 h-3 mr-1" />
                            Creator
                          </Badge>
                        ) : member.role === "admin" ? (
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border-0 ml-2">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        ) : member.role === "moderator" ? (
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/30 border-0 ml-2">
                            <UserCog className="w-3 h-3 mr-1" />
                            Moderator
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/30 border-0 ml-2">
                            <Users className="w-3 h-3 mr-1" />
                            Member
                          </Badge>
                        )}
                      </h3>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Joined {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </Button>
                    
                    {isAdmin && member.userId !== currentUser.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "admin" && (
                            <DropdownMenuItem>
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {member.role !== "moderator" && member.role !== "admin" && (
                            <DropdownMenuItem>
                              Make Moderator
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      <InviteMemberDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        groupId={group.id}
        onSuccess={() => {
          setIsDialogOpen(false);
          window.location.reload();
        }}
      />
    </motion.div>
  );
}; 