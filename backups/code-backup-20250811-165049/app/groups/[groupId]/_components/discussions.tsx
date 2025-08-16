"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Filter, ArrowUp, ThumbsUp, MessageCircle, ShareIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewDiscussionDialog } from "./new-discussion-dialog";
import { DiscussionCard } from "./discussion-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TimeAgo } from "@/app/components/ui/time-ago";
import { Badge } from "@/components/ui/badge";

interface DiscussionsProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

export const Discussions = ({ group, currentUser, isGroupMember }: DiscussionsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort and filter discussions
  const filteredDiscussions = group.discussions
    .filter((discussion: any) => {
      if (filterBy === "all") return true;
      if (filterBy === "popular") return discussion._count.likedBy > 3;
      if (filterBy === "mine") return discussion.author.id === currentUser.id;
      return true;
    })
    .filter((discussion: any) => {
      if (!searchQuery) return true;
      return (
        discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a: any, b: any) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "mostLiked") return b._count.likedBy - a._count.likedBy;
      if (sortBy === "mostComments") return b._count.comments - a._count.comments;
      return 0;
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search discussions..."
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
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={filterBy} onValueChange={setFilterBy}>
                <DropdownMenuRadioItem value="all">All Discussions</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="popular">Popular</DropdownMenuRadioItem>
                {isGroupMember && (
                  <DropdownMenuRadioItem value="mine">My Discussions</DropdownMenuRadioItem>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="mostLiked">Most Liked</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="mostComments">Most Comments</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {isGroupMember && (
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Discussion
            </Button>
          )}
        </div>
      </div>

      {/* Discussions list */}
      <div className="space-y-4">
        {!filteredDiscussions || filteredDiscussions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <MessageSquare className="w-16 h-16 mx-auto mb-6 text-indigo-300 dark:text-indigo-700" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No discussions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Be the first to start a discussion in this group and help build the community!</p>
              
              {isGroupMember && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Discussion
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400 pl-2">
              Showing {filteredDiscussions.length} discussion{filteredDiscussions.length !== 1 ? 's' : ''}
            </div>
            
            {filteredDiscussions.map((discussion: any) => (
              <div 
                key={discussion.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                        <AvatarImage src={discussion.author.image} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          {discussion.author.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{discussion.author.name}</span>
                          <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <TimeAgo date={discussion.createdAt} />
                          </span>
                          
                          {discussion.author.id === group.creatorId && (
                            <Badge variant="outline" className="ml-1 text-xs px-2 border-amber-500 text-amber-700 dark:text-amber-400">
                              Creator
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <span className="sr-only">Open menu</span>
                          <svg width="15" height="3" viewBox="0 0 15 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                            <path d="M1.5 1.5C1.5 2.05228 1.05228 2.5 0.5 2.5C-0.0522848 2.5 -0.5 2.05228 -0.5 1.5C-0.5 0.947715 -0.0522848 0.5 0.5 0.5C1.05228 0.5 1.5 0.947715 1.5 1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.5 1.5C8.5 2.05228 8.05228 2.5 7.5 2.5C6.94772 2.5 6.5 2.05228 6.5 1.5C6.5 0.947715 6.94772 0.5 7.5 0.5C8.05228 0.5 8.5 0.947715 8.5 1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15.5 1.5C15.5 2.05228 15.0523 2.5 14.5 2.5C13.9477 2.5 13.5 2.05228 13.5 1.5C13.5 0.947715 13.9477 0.5 14.5 0.5C15.0523 0.5 15.5 0.947715 15.5 1.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Save</DropdownMenuItem>
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 mb-4">
                    <div dangerouslySetInnerHTML={{ __html: discussion.content }} />
                  </div>
                  
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <button className="flex items-center gap-1.5 text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{discussion._count.likedBy}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm hover:text-indigo-600 dark:hover:text-indigo-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>{discussion._count.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 ml-auto">
                      <ShareIcon className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <NewDiscussionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        groupId={group.id}
        currentUser={currentUser}
        onSuccess={() => {
          setIsDialogOpen(false);
          window.location.reload();
        }}
      />
    </motion.div>
  );
}; 