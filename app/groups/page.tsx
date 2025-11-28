import { db } from "@/lib/db";
import { Search, Users, Grid3X3, List, PlusCircle, Filter } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";
import { MobileGroupFilters } from "./_components/mobile-group-filters";
import { GroupsSearchInput } from "./_components/groups-search-input";

export const revalidate = 0;

interface GroupsPageProps {
  searchParams: Promise<{
    category?: string;
    query?: string;
    view?: string;
  }>
}

export default async function GroupsPage(props: GroupsPageProps) {
  const searchParams = await props.searchParams;
  const user = await currentUser();
  const viewMode = searchParams.view || "grid";

  if (!user) {
    return redirect("/");
  }

  // Fetch categories for filter
  const categories = await db.category.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  // Fetch trending/popular groups
  const trendingGroups = await db.group.findMany({
    take: 5,
    where: {
      isPrivate: false,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      members: {
        _count: 'desc'
      }
    }
  });

  // Fetch groups with filters
  const groups = await db.group.findMany({
    where: {
      AND: [
        searchParams.query ? {
          OR: [
            { name: { contains: searchParams.query, mode: 'insensitive' } },
            { description: { contains: searchParams.query, mode: 'insensitive' } },
          ],
        } : {},
        searchParams.category && searchParams.category !== "All Categories" ? {
          category: searchParams.category
        } : {},
      ],
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      <main className="min-h-screen w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6">
        {/* Hero Section with Background Image - Mobile Optimized */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 h-[280px] sm:h-[320px] md:h-80 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 shadow-xl">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(transparent,white)] bg-grid-pattern"></div>

          <div className="px-4 sm:px-6 h-full flex flex-col justify-center items-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 text-center leading-tight">
              Connect & Collaborate
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl text-center mb-6 sm:mb-8 px-2 leading-relaxed">
              Join knowledge communities where ideas flourish and learning becomes a shared journey
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-2xl px-2">
              <div className="flex-1 relative [&_input]:bg-white/20 [&_input]:backdrop-blur-lg [&_input]:border-transparent [&_input]:text-white [&_input]:placeholder:text-white/70 [&_input:focus]:bg-white/95 [&_input:focus]:text-gray-700 [&_input:focus]:placeholder:text-gray-500 [&_svg]:text-white/70 [&:has(input:focus)_svg]:text-gray-500 [&_input]:h-11 sm:[&_input]:h-12 [&_input]:text-sm sm:[&_input]:text-base">
                <GroupsSearchInput 
                  placeholder="Find your perfect study group..." 
                />
              </div>
              <Link href="/groups/create" className="w-full sm:w-auto">
                <Button size="lg" variant="default" className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-white/90 hover:text-indigo-800 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg">
                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Create Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Trending Groups Section - Mobile Optimized */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-500" />
                <span>Trending Study Groups</span>
              </h2>
              <Link href="/groups/trending">
                <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-xs sm:text-sm h-8 sm:h-9">
                  View all
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {trendingGroups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`} className="group">
                  <div className="bg-slate-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md active:scale-[0.98] transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{group.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
                    {group.category && (
                      <Badge variant="secondary" className="mt-auto self-start text-[10px] sm:text-xs py-0.5 px-1.5 sm:py-1 sm:px-2">
                        {group.category}
                      </Badge>
                    )}
                    <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                      {group._count.members} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Main Groups Section - Mobile Optimized */}
        <section className="mb-12 sm:mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700/50">
            <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Explore Study Groups
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Discover groups that match your learning goals and interests
                </p>
              </div>
              
              {/* Controls Bar - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* View Toggle - Hidden on mobile, shown on tablet+ */}
                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                  <Link href={{ pathname: '/groups', query: { ...searchParams, view: 'grid' } }}>
                    <Button 
                      variant={viewMode === 'grid' ? "default" : "ghost"} 
                      size="sm" 
                      className="rounded-md h-8 w-8 p-0"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={{ pathname: '/groups', query: { ...searchParams, view: 'list' } }}>
                    <Button 
                      variant={viewMode === 'list' ? "default" : "ghost"} 
                      size="sm" 
                      className="rounded-md h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                {/* Filter Component */}
                <MobileGroupFilters 
                  categories={categories} 
                  currentCategory={searchParams.category}
                />
                
                {/* Create Group Button */}
                <Link href="/groups/create" className="flex-1 sm:flex-initial">
                  <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 h-9 sm:h-10 text-sm sm:text-base font-semibold shadow-md">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Create Group</span>
                    <span className="xs:hidden">Create</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Groups Display - Mobile Optimized */}
            {groups.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-slate-50 dark:bg-gray-900/50 rounded-lg sm:rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="bg-slate-100 dark:bg-gray-800 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No groups found</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">
                  Try adjusting your search or filters, or create your own group to get started.
                </p>
                <Link href="/groups/create">
                  <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 h-10 sm:h-11 text-sm sm:text-base font-semibold">
                    Create a New Group
                  </Button>
                </Link>
              </div>
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                  {groups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} className="block group">
                      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl active:scale-[0.98] transition-all duration-300 h-full flex flex-col shadow-sm">
                        <div className="h-32 sm:h-36 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                          {group.imageUrl ? (
                            <Image 
                              src={group.imageUrl} 
                              alt={group.name} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-grid-white/10 bg-grid-pattern"></div>
                          )}
                          {group.category && (
                            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 dark:bg-gray-900/95 text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-gray-900 text-xs sm:text-sm font-semibold shadow-md">
                              {group.category}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-4 sm:p-5 flex-1 flex flex-col">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {group.name}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-1 leading-relaxed">
                            {group.description}
                          </p>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-indigo-500" />
                                <span className="font-medium">{group._count.members}</span>
                              </div>
                              <div className="text-[10px] sm:text-xs hidden sm:block">
                                by Admin
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                              <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {groups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} className="block group">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg active:scale-[0.99] transition-all duration-300 shadow-sm">
                        <div className="w-full sm:w-40 md:w-48 h-28 sm:h-32 md:h-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-md sm:rounded-lg overflow-hidden relative flex-shrink-0">
                          {group.imageUrl ? (
                            <Image 
                              src={group.imageUrl} 
                              alt={group.name} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-grid-white/10 bg-grid-pattern flex items-center justify-center">
                              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-white/70" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {group.name}
                            </h3>
                            {group.category && (
                              <Badge className="self-start sm:self-auto bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200 text-xs sm:text-sm font-semibold">
                                {group.category}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-auto text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-indigo-500" />
                              <span className="font-medium">{group._count.members} members</span>
                            </div>
                            <div className="hidden sm:block text-xs">
                              Created by Admin
                            </div>
                            <div className="w-full sm:w-auto sm:ml-auto">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 h-8 sm:h-9 text-xs sm:text-sm font-medium">
                                View Group
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      </main>
    </PageWithMobileLayout>
  );
} 