import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/app/actions/get-profile-data";
import Link from "next/link";
import { ArrowLeft, Heart, Plus, FileText, Search, Calendar, Clock, User, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";

export default async function FavoriteBlogsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const userData = await getProfileData();
  
  if (!userData) {
    redirect("/auth/login");
  }
  
  const favoriteBlogs = userData.favoriteBlogs || [];
  
  // Sort blogs by recently added (newest first)
  const sortedBlogs = [...favoriteBlogs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Get featured blog (most recent)
  const featuredBlog = sortedBlogs.length > 0 ? sortedBlogs[0] : null;
  
  // Remaining blogs
  const remainingBlogs = sortedBlogs.slice(1);

  return (
    <div className="min-h-screen pb-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/user" className="mr-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Favorite Blogs
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Your saved blog posts and articles from around the web. Easily access and read interesting content you&apos;ve bookmarked.
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search through your favorite blogs..."
              />
            </div>
            <Link 
              href="/dashboard/user/favoriteblogs/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Blog
            </Link>
          </div>
        </div>
        
        {favoriteBlogs.length > 0 ? (
          <>
            {/* Featured Blog */}
            {featuredBlog && (
              <div className="mb-12">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl overflow-hidden shadow-md">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                    <div className="lg:col-span-3 p-6 md:p-8 order-2 lg:order-1">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(featuredBlog.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <User className="h-3.5 w-3.5 mr-1" />
                          {featuredBlog.platform || "Blog"}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-2">
                        {featuredBlog.title}
                      </h2>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                        {featuredBlog.description || "This blog post has been saved to your favorites. Click below to read the full article."}
                      </p>
                      
                      <div className="flex space-x-3">
                        <a
                          href={featuredBlog.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                        >
                          Read Article <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <BookmarkCheck className="mr-2 h-4 w-4 text-purple-500" /> Saved
                        </button>
                      </div>
                    </div>
                    <div className="lg:col-span-2 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center p-10 order-1 lg:order-2">
                      <FileText className="h-24 w-24 text-purple-500 dark:text-purple-400 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-4">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite blogs yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Start building your collection by saving blogs and articles you find interesting.
            </p>
            <Link
              href="/dashboard/user/favoriteblogs/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Your First Blog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface BlogCardProps {
  blog: any;
}

function BlogCard({ blog }: BlogCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group">
      <div className="h-40 bg-gradient-to-r from-purple-400/20 to-blue-400/20 dark:from-purple-500/20 dark:to-blue-500/20 flex items-center justify-center">
        <FileText className="h-16 w-16 text-purple-500 dark:text-purple-400 opacity-80" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {new Date(blog.createdAt).toLocaleDateString()}
          </span>
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-xs">
            {blog.platform || "Blog"}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {blog.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {blog.description || "Click to read this saved article."}
        </p>
        
        <div className="flex justify-end">
          <a
            href={blog.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium inline-flex items-center"
          >
            Read More <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
} 