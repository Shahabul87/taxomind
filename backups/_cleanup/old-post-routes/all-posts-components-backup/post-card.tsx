"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Eye, MessageCircle, Heart, Edit, Trash, MoreVertical, ExternalLink, Clock, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: any;
  viewMode: "grid" | "list";
  onDelete: () => void;
}

export const PostCard = ({ post, viewMode, onDelete }: PostCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Format the post date
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");
  
  // Truncate description for display
  const truncatedDescription = post.description 
    ? post.description.length > 120 
      ? post.description.substring(0, 120) + "..." 
      : post.description
    : "No description";

  if (viewMode === "grid") {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
          {/* Featured Image */}
          <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            {post.imageUrl && post.imageUrl.trim() ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                <FileText className="w-16 h-16 text-gray-400 opacity-50" />
              </div>
            )}
            {!post.published && (
              <Badge variant="secondary" className="absolute top-3 left-3 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50">
                <Clock className="w-3 h-3 mr-1" />
                Draft
              </Badge>
            )}
            {post.category && (
              <Badge variant="secondary" className="absolute top-3 right-3 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50">
                {post.category}
              </Badge>
            )}
          </div>
          
          {/* Content */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {truncatedDescription}
              </p>
            </div>

            {/* Stats */}
            <div className="mt-auto">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500 dark:text-gray-400">
                  {formattedDate}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4 mr-1" />
                    {post.views || 0}
                  </span>
                  <span className="flex items-center text-gray-500 dark:text-gray-400">
                    <Heart className="w-4 h-4 mr-1" />
                    {post.likes?.length || 0}
                  </span>
                  <span className="flex items-center text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link href={post.published ? `/blog/${post.id}` : `/post/edit/${post.id}`}>
                  <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    {post.published ? (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/post/edit/${post.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Post
                      </Link>
                    </DropdownMenuItem>
                    {post.published && (
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${post.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Post
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your post and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  // List view
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
          {/* Image (thumbnail in list view) */}
          <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {post.imageUrl && post.imageUrl.trim() ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
                <FileText className="w-8 h-8 text-gray-400 opacity-50" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                {post.title}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {!post.published && (
                  <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50">
                    <Clock className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                )}
                
                {post.category && (
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50">
                    {post.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {truncatedDescription}
            </p>
            
            <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {post.views || 0}
                </span>
                <span className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {post.likes?.length || 0}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.comments?.length || 0}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {formattedDate}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Link href={post.published ? `/blog/${post.id}` : `/post/edit/${post.id}`}>
                <Button variant="outline" size="sm" className="text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  {post.published ? (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 hover:text-red-600 border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 