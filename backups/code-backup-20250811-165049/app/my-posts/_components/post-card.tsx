import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  Edit3, Trash2, Eye, MessageSquare, 
  Heart, Share2, Clock, MoreVertical, 
  ArrowUpRight, Sparkles
} from "lucide-react";

interface PostCardProps {
  post: any;
}

export const PostCard = ({ post }: PostCardProps) => {
  const [showOptions, setShowOptions] = useState(false);
  
  // Format date if available, otherwise use updateAt or createdAt
  const publishedDate = post.publishedAt 
    ? format(new Date(post.publishedAt), "MMM dd, yyyy")
    : post.updatedAt 
      ? format(new Date(post.updatedAt), "MMM dd, yyyy") 
      : "Not published";
  
  const isPublished = post.status === "published" || post.isPublished;
  const isFeatured = post.isFeatured;
  
  // Calculate URLs
  const editLink = `/editor/${post.id}`;
  const viewLink = isPublished ? `/posts/${post.slug || post.id}` : editLink;
  
  // Default placeholder for images, allow for flexible image fields
  const imageUrl = post.coverImage || post.image || post.imageUrl || "/images/post-placeholder.jpg";

  // Prepare categories/tags display
  const categories = post.categories || 
    (post.tags && Array.isArray(post.tags)) 
      ? post.tags.map((tag: any) => typeof tag === 'string' ? tag : tag.name)
      : [];

  // Determine word count and read time if not provided
  const readTime = post.readTime || `${Math.ceil((post.content?.length || 0) / 1000)} min read`;

  // Safely access analytics numbers
  const views = typeof post.views === 'number' ? post.views : 
    Array.isArray(post.views) ? post.views.length : 0;
    
  const likes = typeof post.likes === 'number' ? post.likes : 
    Array.isArray(post.likes) ? post.likes.length : 0;
    
  const comments = typeof post.comments === 'number' ? post.comments : 
    Array.isArray(post.comments) ? post.comments.length : 0;

  return (
    <div className="group relative bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50 h-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
      {/* Featured Tag */}
      {isFeatured && (
        <div className="absolute top-0 left-0 z-10 m-2">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured
          </div>
        </div>
      )}
      
      {/* Image Section with Gradient Overlay */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
        
        {/* Post Status Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm
          ${isPublished ? "bg-emerald-600/80 text-white" : "bg-amber-600/80 text-white"}`}>
          {isPublished ? "Published" : "Draft"}
        </div>
        
        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {categories.slice(0, 2).map((category: string, index: number) => (
              <div 
                key={index} 
                className="px-2 py-1 rounded-md text-xs font-medium bg-gray-900/70 text-gray-300 backdrop-blur-sm border border-gray-800/50"
              >
                {category}
              </div>
            ))}
            {categories.length > 2 && (
              <div className="px-2 py-1 rounded-md text-xs font-medium bg-gray-900/70 text-gray-400 backdrop-blur-sm border border-gray-800/50">
                +{categories.length - 2}
              </div>
            )}
          </div>
        )}
        
        {/* Read Time */}
        {readTime && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-medium bg-gray-900/70 text-gray-300 backdrop-blur-sm border border-gray-800/50 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {readTime}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-2">
          {post.title}
        </h3>
        
        <p className="mt-2 text-gray-400 text-sm line-clamp-2">
          {post.excerpt || post.description || (post.content && post.content.substring(0, 150) + "...")}
        </p>
        
        <div className="mt-4 text-xs text-gray-500">
          {isPublished ? `Published on ${publishedDate}` : "Draft • Last edited recently"}
        </div>
        
        {/* Stats & Actions Bar */}
        <div className="mt-5 pt-4 flex items-center justify-between border-t border-gray-800/50">
          {/* Stats - only show for published posts */}
          {isPublished ? (
            <div className="flex items-center space-x-4 text-gray-400 text-xs">
              <div className="flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1" />
                <span>{views.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-3.5 w-3.5 mr-1" />
                <span>{likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span>{comments.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Not published yet</div>
          )}
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <Link href={editLink}>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/20">
                <Edit3 className="h-4 w-4" />
              </button>
            </Link>
            
            {isPublished && (
              <Link href={viewLink}>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-900/20">
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </Link>
            )}
            
            <div className="relative">
              <button 
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/70"
                onClick={() => setShowOptions(!showOptions)}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {/* Dropdown Menu */}
              {showOptions && (
                <div className="absolute right-0 bottom-full mb-2 w-32 bg-gray-800 rounded-lg shadow-lg py-2 z-20 border border-gray-700">
                  {isPublished && (
                    <button className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center">
                      <Share2 className="h-3.5 w-3.5 mr-2" />
                      Share
                    </button>
                  )}
                  <button className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700 flex items-center">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 