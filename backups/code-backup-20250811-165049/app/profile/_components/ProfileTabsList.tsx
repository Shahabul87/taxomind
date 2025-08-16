import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, User, Settings, BookOpen, Activity, Server, Video, 
  Headphones, FileText, Newspaper, DollarSign, Lightbulb, Brain, 
  FilePen, BarChart3, Globe 
} from "lucide-react";

export function ProfileTabsList() {
  return (
    <div className="w-full overflow-hidden pb-1">
      <div className="flex justify-center mb-4">
        <TabsList className="flex flex-wrap justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md border border-slate-700/50 shadow-xl max-w-full mx-auto">
          {/* Main tabs in first row */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {/* Overview Tab */}
            <TabsTrigger 
              value="overview" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-600 data-[state=active]:to-purple-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-purple-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <BarChart3 className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Overview</span>
            </TabsTrigger>

            {/* Social Tab */}
            <TabsTrigger 
              value="social" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-cyan-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-cyan-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Globe className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Social</span>
            </TabsTrigger>

            {/* Activity Tab */}
            <TabsTrigger 
              value="activity" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-600 data-[state=active]:to-emerald-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-emerald-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Activity className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Activity</span>
            </TabsTrigger>
            
            {/* Content Tab */}
            <TabsTrigger 
              value="content" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Content</span>
            </TabsTrigger>

            {/* Courses Tab */}
            <TabsTrigger 
              value="courses" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-600 data-[state=active]:to-blue-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-blue-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Courses</span>
            </TabsTrigger>
            
            {/* Ideas Tab */}
            <TabsTrigger 
              value="ideas" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-600/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Lightbulb className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Ideas</span>
            </TabsTrigger>
            
            {/* Minds Tab */}
            <TabsTrigger 
              value="minds" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-600 data-[state=active]:to-rose-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-rose-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Brain className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Minds</span>
            </TabsTrigger>
            
            {/* Scripts Tab */}
            <TabsTrigger 
              value="scripts" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-green-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-green-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <FilePen className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Scripts</span>
            </TabsTrigger>
            
            {/* Profile Tab */}
            <TabsTrigger 
              value="profile" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:to-purple-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-purple-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <User className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Profile</span>
            </TabsTrigger>
          </div>
          
          {/* Media tabs in second row */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {/* Videos Tab */}
            <TabsTrigger 
              value="videos" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-600 data-[state=active]:to-pink-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-pink-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Video className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Videos</span>
            </TabsTrigger>
            
            {/* Audios Tab */}
            <TabsTrigger 
              value="audios" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-indigo-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Headphones className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Audios</span>
            </TabsTrigger>
            
            {/* Blogs Tab */}
            <TabsTrigger 
              value="blogs" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-600 data-[state=active]:to-cyan-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600/0 to-cyan-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <FileText className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Blogs</span>
            </TabsTrigger>
            
            {/* Articles Tab */}
            <TabsTrigger 
              value="articles" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-600 data-[state=active]:to-yellow-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-yellow-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Newspaper className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Articles</span>
            </TabsTrigger>
            
            {/* Subscription Tab */}
            <TabsTrigger 
              value="subscription" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-green-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-green-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <DollarSign className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Subscriptions</span>
            </TabsTrigger>
          </div>
          
          {/* Settings and related tabs in third row */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {/* Settings Tab */}
            <TabsTrigger 
              value="settings" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-600 data-[state=active]:to-slate-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600/0 to-slate-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Settings className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110 group-hover:rotate-12 group-data-[state=active]:rotate-12" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Settings</span>
            </TabsTrigger>
            
            {/* Server Tab */}
            <TabsTrigger 
              value="server" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-600 data-[state=active]:to-zinc-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-600/0 to-zinc-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Server className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110 group-hover:translate-y-[-1px] group-data-[state=active]:translate-y-[-1px]" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Server</span>
            </TabsTrigger>
            
            {/* Billing Tab */}
            <TabsTrigger 
              value="billing" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-600 data-[state=active]:to-emerald-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-emerald-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <DollarSign className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Billing</span>
            </TabsTrigger>
            
            {/* Make a Plan Tab */}
            <TabsTrigger 
              value="make-a-plan" 
              className="group relative flex items-center justify-center gap-1 min-w-[80px] py-2 px-3 rounded-xl text-xs sm:text-sm font-medium 
                transition-all duration-300 ease-out
                text-slate-400 hover:text-white
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-sky-700
                data-[state=active]:text-white data-[state=active]:shadow-lg
                overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-sky-700/0 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <Calendar className="w-4 h-4 transition-transform group-hover:scale-110 group-data-[state=active]:scale-110" />
              <span className="transition-transform group-hover:translate-x-0.5 group-data-[state=active]:translate-x-0.5">Plan</span>
            </TabsTrigger>
          </div>
        </TabsList>
      </div>
    </div>
  );
} 