import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfileData } from "@/app/actions/get-profile-data";
import Link from "next/link";
import { ArrowLeft, Heart, Plus, Music, Clock, Calendar, Search, PlayCircle, Pause } from "lucide-react";

export default async function FavoriteAudiosPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  const userData = await getProfileData();
  
  if (!userData) {
    redirect("/auth/login");
  }
  
  const favoriteAudios = userData.favoriteAudios || [];
  
  // Group audio by category
  const groupedAudios = favoriteAudios.reduce((acc: any, audio: any) => {
    const category = audio.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(audio);
    return acc;
  }, {});
  
  // Sort audios by recently added (newest first)
  const recentlyAdded = [...favoriteAudios].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 4);

  return (
    <div className="min-h-screen pb-10 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/user" className="mr-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Favorite Audio
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Your personal audio library with podcasts, music, and educational content from various sources.
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Search your audio collection..."
              />
            </div>
            <Link 
              href="/dashboard/user/favoriteaudios/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Audio
            </Link>
          </div>
        </div>
        
        {/* Featured Audio Player - First Audio or Empty State */}
        <div className="mb-12">
          {favoriteAudios.length > 0 ? (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Featured Audio</h2>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                    <Music className="h-24 w-24 text-white opacity-80" />
                  </div>
                  
                  <div className="w-full md:w-2/3 space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{favoriteAudios[0].title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {favoriteAudios[0].platform || "Audio Track"}
                    </p>
                    
                    {/* Audio Player UI */}
                    <div className="mt-6 space-y-3">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full w-2/5 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>01:24</span>
                        <span>03:45</span>
                      </div>
                      <div className="flex gap-4 justify-center mt-4">
                        <button className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-700 dark:text-gray-300">
                            <polygon points="19 20 9 12 19 4 19 20"></polygon>
                            <line x1="5" y1="19" x2="5" y2="5"></line>
                          </svg>
                        </button>
                        <button className="bg-green-500 p-4 rounded-full">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </button>
                        <button className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-700 dark:text-gray-300">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
                <Music className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audio content yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Start building your audio collection by adding podcasts, music, or other audio content.
              </p>
              <Link
                href="/dashboard/user/favoriteaudios/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Your First Audio
              </Link>
            </div>
          )}
        </div>
        
        {/* Recently Added Section */}
        {recentlyAdded.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recently Added</h2>
              <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyAdded.map((audio: any) => (
                <AudioCard key={audio.id} audio={audio} />
              ))}
            </div>
          </section>
        )}
        
        {/* Categories */}
        {Object.keys(groupedAudios).map((category) => (
          <section key={category} className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{groupedAudios[category].length} tracks</span>
            </div>
            <div className="space-y-3">
              {groupedAudios[category].map((audio: any, index: number) => (
                <AudioListItem key={audio.id} audio={audio} index={index + 1} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

interface AudioProps {
  audio: any;
}

function AudioCard({ audio }: AudioProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group">
      <div className="aspect-square bg-gradient-to-br from-green-400 to-blue-500 relative overflow-hidden flex items-center justify-center">
        <Music className="h-12 w-12 text-white opacity-80" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg">
            <PlayCircle className="h-6 w-6 text-green-500" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
          {audio.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(audio.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
            {audio.platform || "Audio"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface AudioListItemProps {
  audio: any;
  index: number;
}

function AudioListItem({ audio, index }: AudioListItemProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
      <div className="p-3 flex items-center">
        <div className="w-12 text-center font-medium text-gray-500 dark:text-gray-400">
          {index}
        </div>
        <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-md flex items-center justify-center mr-4">
          <Music className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors text-sm truncate">
            {audio.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {audio.platform || "Audio Track"}
          </p>
        </div>
        <div className="ml-4 flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            {new Date(audio.createdAt).toLocaleDateString()}
          </span>
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </button>
        </div>
      </div>
    </div>
  );
} 