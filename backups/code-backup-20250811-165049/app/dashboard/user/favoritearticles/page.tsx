import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/app/actions/get-profile-data";
import Link from "next/link";
import { ArrowLeft, Heart, Plus, BookOpen, Search, Calendar, Tag, ExternalLink, Bookmark, Eye } from "lucide-react";

export default async function FavoriteArticlesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const userData = await getProfileData();
  
  if (!userData) {
    redirect("/auth/login");
  }
  
  const favoriteArticles = userData.favoriteArticles || [];
  
  // Sort articles by recently added (newest first)
  const sortedArticles = [...favoriteArticles].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Create pseudo-random categories for demonstration
  const categories = ['Technology', 'Science', 'Business', 'Health', 'Education'];
  
  // Group articles into 3 sections for magazine layout
  const featuredArticles = sortedArticles.slice(0, 1);
  const primaryArticles = sortedArticles.slice(1, 4);
  const secondaryArticles = sortedArticles.slice(4);

  return (
    <div className="min-h-screen pb-10 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Magazine Style */}
        <div className="mb-8 border-b-2 border-orange-500 dark:border-orange-600 pb-4">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/user" className="mr-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex gap-2 items-center">
              <span className="text-orange-500 dark:text-orange-400">Favorite</span> Articles
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl italic border-l-4 border-orange-200 dark:border-orange-800 pl-3">
            Your personal reading list with curated articles, publications, and academic papers.
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Search articles by title or topic..."
              />
            </div>
            <Link 
              href="/dashboard/user/favoritearticles/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Article
            </Link>
          </div>
        </div>
        
        {favoriteArticles.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Article - Magazine Cover Style */}
            {featuredArticles.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-orange-500" /> Editor&apos;s Pick
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 flex flex-col justify-between order-2 md:order-1">
                      <div>
                        <div className="mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <Tag className="h-3 w-3 mr-1" />
                            {categories[Math.floor(Math.random() * categories.length)]}
                          </span>
                        </div>
                        
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                          {featuredArticles[0].title}
                        </h2>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          {featuredArticles[0].description || "A featured article from your collection. Click to read the full content."}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(featuredArticles[0].createdAt).toLocaleDateString()}
                        </span>
                        
                        <a
                          href={featuredArticles[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                        >
                          Read Article <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-400 to-red-500 dark:from-orange-500 dark:to-red-600 flex items-center justify-center p-10 min-h-[250px] order-1 md:order-2">
                      <BookOpen className="h-24 w-24 text-white opacity-90" />
                    </div>
                  </div>
                </div>
              </section>
            )}
            
            {/* Primary Articles */}
            {primaryArticles.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Bookmark className="h-5 w-5 mr-2 text-orange-500" /> Featured Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {primaryArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} categories={categories} />
                  ))}
                </div>
              </section>
            )}
            
            {/* Secondary Articles */}
            {secondaryArticles.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Reading List
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {secondaryArticles.map((article) => (
                    <ArticleListItem key={article.id} article={article} categories={categories} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/40 mb-4">
              <BookOpen className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite articles yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Start building your reading list by saving articles, papers, and publications.
            </p>
            <Link
              href="/dashboard/user/favoritearticles/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Your First Article
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface ArticleProps {
  article: any;
  categories: string[];
}

function ArticleCard({ article, categories }: ArticleProps) {
  // Choose a pseudo-random category for demo purposes
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group h-full flex flex-col">
      <div className="h-40 bg-gradient-to-r from-orange-300 to-red-300 dark:from-orange-800/50 dark:to-red-800/50 flex items-center justify-center">
        <BookOpen className="h-16 w-16 text-white opacity-75" />
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-xs">
            {category}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
          {article.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {article.description || "An article from your saved collection."}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {article.platform || "Article"}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium inline-flex items-center"
          >
            Read <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface ArticleListItemProps {
  article: any;
  categories: string[];
}

function ArticleListItem({ article, categories }: ArticleListItemProps) {
  // Choose a pseudo-random category for demo purposes
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group flex gap-4">
      <div className="rounded-md w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 dark:from-orange-500 dark:to-red-600 flex-shrink-0 flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-white" />
      </div>
      
      <div className="flex-grow overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors pr-2">
            {article.title}
          </h3>
          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-xs flex-shrink-0">
            {category}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400 truncate">
            {article.platform || "Article"} · {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium ml-2 flex-shrink-0"
          >
            View
          </a>
        </div>
      </div>
    </div>
  );
} 