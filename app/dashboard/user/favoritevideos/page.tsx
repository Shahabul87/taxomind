import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/app/actions/get-profile-data";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, ExternalLink, Plus, Clock, Calendar, Search } from "lucide-react";

export default async function FavoriteVideosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const userData = await getProfileData();
  
  if (!userData) {
    redirect("/auth/login");
  }
  
  const favoriteVideos = userData.favoriteVideos || [];
  
  // Group videos by category or platform
  const groupedVideos = favoriteVideos.reduce((acc: any, video: any) => {
    const category = video.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(video);
    return acc;
  }, {});
  
  // Sort videos by recently added (newest first)
  const recentlyAdded = [...favoriteVideos].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 5);

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
              Favorite Videos
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Your curated collection of videos from different platforms. Easily access your favorite educational content, tutorials, and entertainment.
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
                placeholder="Search your favorite videos..."
              />
            </div>
            <Link 
              href="/dashboard/user/favoritevideos/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Video
            </Link>
          </div>
        </div>
        
        {/* Recently Added Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recently Added</h2>
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyAdded.map((video: any) => (
              <RecentVideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
        
        {/* Categories */}
        {Object.keys(groupedVideos).map((category) => (
          <section key={category} className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{groupedVideos[category].length} videos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedVideos[category].map((video: any) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        ))}
        
        {/* Empty State */}
        {favoriteVideos.length === 0 && (
          <div className="mt-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
              <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite videos yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Start building your collection by adding videos you love or want to watch later.
            </p>
            <Link
              href="/dashboard/user/favoritevideos/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Your First Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: any;
}

function VideoCard({ video }: VideoCardProps) {
  // Extract video ID for thumbnail (works for YouTube URLs)
  const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = video.platform === 'youtube' ? getYouTubeID(video.url) : null;
  const thumbnailUrl = videoId ? 
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 
    'https://via.placeholder.com/320x180?text=Video+Thumbnail';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group">
      <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        <Image 
          src={thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
          >
            <ExternalLink className="h-5 w-5 text-purple-600" />
          </a>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {video.title}
          </h3>
          <span className="text-xs text-white bg-purple-600 px-2 py-1 rounded capitalize">
            {video.platform}
          </span>
        </div>
        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(video.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function RecentVideoCard({ video }: VideoCardProps) {
  // Extract video ID for thumbnail (works for YouTube URLs)
  const getYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const videoId = video.platform === 'youtube' ? getYouTubeID(video.url) : null;
  const thumbnailUrl = videoId ? 
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 
    'https://via.placeholder.com/320x180?text=Video+Thumbnail';

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 group">
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-2/5 aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          <Image 
            src={thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <span className="text-xs text-white bg-purple-600 px-2 py-1 rounded-full shadow-sm capitalize">
              {video.platform}
            </span>
          </div>
        </div>
        <div className="p-4 md:w-3/5 flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {video.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              Added to your favorites collection
            </p>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(video.createdAt).toLocaleDateString()}
            </div>
            <a 
              href={video.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 inline-flex items-center text-sm font-medium"
            >
              Watch <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 