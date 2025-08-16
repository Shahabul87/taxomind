import Link from "next/link";
import { Film, Music, FileText, BookOpen, ChevronRight } from "lucide-react";

interface QuickLinksProps {
  favoriteVideos?: any[];
  favoriteAudios?: any[];
  favoriteBlogs?: any[];
  favoriteArticles?: any[];
}

export default function QuickLinks({ favoriteVideos = [], favoriteAudios = [], favoriteBlogs = [], favoriteArticles = [] }: QuickLinksProps) {
  const categories = [
    {
      title: "Favorite Videos",
      href: "/dashboard/user/favoritevideos",
      icon: <Film className="h-5 w-5 text-blue-500" />,
      count: favoriteVideos.length
    },
    {
      title: "Favorite Audios",
      href: "/dashboard/user/favoriteaudios",
      icon: <Music className="h-5 w-5 text-green-500" />,
      count: favoriteAudios.length
    },
    {
      title: "Favorite Blogs",
      href: "/dashboard/user/favoriteblogs",
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      count: favoriteBlogs.length
    },
    {
      title: "Favorite Articles",
      href: "/dashboard/user/favoritearticles",
      icon: <BookOpen className="h-5 w-5 text-orange-500" />,
      count: favoriteArticles.length
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Favorites</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {categories.map((category, index) => (
          <Link
            key={index}
            href={category.href}
            className="block hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 group"
          >
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                {category.icon}
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                  {category.title}
                </span>
              </div>
              <div className="flex items-center">
                <span className="mr-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {category.count}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 