import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/app/actions/get-profile-data";
import Link from "next/link";
import { ArrowLeft, Heart, Video, BookOpen, Headphones, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userData = await getProfileData();

  if (!userData) {
    redirect("/auth/login");
  }

  const favoriteVideos = userData.FavoriteVideo || [];
  const favoriteBlogs = userData.FavoriteBlog || [];
  const favoriteArticles = userData.FavoriteArticle || [];
  const favoriteAudios = userData.FavoriteAudio || [];
  const favoriteImages = userData.FavoriteImage || [];

  const totalFavorites = favoriteVideos.length + favoriteBlogs.length + favoriteArticles.length + favoriteAudios.length + favoriteImages.length;

  const categories = [
    {
      title: "Videos",
      count: favoriteVideos.length,
      icon: Video,
      href: "/dashboard/user/favoritevideos",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Blogs",
      count: favoriteBlogs.length,
      icon: BookOpen,
      href: "/dashboard/user/favoriteblogs",
      color: "from-blue-500 to-indigo-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Articles",
      count: favoriteArticles.length,
      icon: FileText,
      href: "/dashboard/user/favoritearticles",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Audio",
      count: favoriteAudios.length,
      icon: Headphones,
      href: "/dashboard/user/favoriteaudios",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Images",
      count: favoriteImages.length,
      icon: ImageIcon,
      href: "/dashboard/user/favoriteimages",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 pb-10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="mr-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Access all your favorite content in one place. From videos to articles, keep track of everything you love.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Total Favorites</h2>
              <p className="text-purple-100">Your curated collection of content</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center">
              <span className="text-3xl font-bold">{totalFavorites}</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {totalFavorites > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.title} category={category} />
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
              <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorites yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Start building your collection by adding videos, articles, and other content you love.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/dashboard/user/favoritevideos"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <Video className="mr-2 h-4 w-4" /> Add Videos
              </Link>
              <Link
                href="/dashboard/user/favoriteblogs"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="mr-2 h-4 w-4" /> Add Blogs
              </Link>
              <Link
                href="/dashboard/user/favoritearticles"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <FileText className="mr-2 h-4 w-4" /> Add Articles
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {totalFavorites > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Most Favorites</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {categories.reduce((max, cat) => cat.count > max.count ? cat : max, categories[0]).title}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Categories Used</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {categories.filter(cat => cat.count > 0).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{favoriteVideos.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Articles</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{favoriteArticles.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: {
    title: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: string;
    bgColor: string;
    iconColor: string;
  };
}

function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <Link
      href={category.href}
      className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
    >
      <div className={`h-2 bg-gradient-to-r ${category.color}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${category.bgColor} p-3 rounded-lg`}>
            <Icon className={`h-6 w-6 ${category.iconColor}`} />
          </div>
          <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {category.title}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {category.count} {category.count === 1 ? 'item' : 'items'}
          </p>
          {category.count > 0 && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              View all →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
