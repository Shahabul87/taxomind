import { db } from "@/lib/db";
import { SearchInput } from "@/components/search-input";
import { Search, Users, Grid3X3, List, PlusCircle, Filter } from "lucide-react";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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
      categoryRef: true,
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
          categoryRef: {
            name: searchParams.category
          }
        } : {},
      ],
    },
    include: {
      _count: {
        select: {
          members: true,
          discussions: true,
          events: true,
        },
      },
      categoryRef: true,
      creator: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <ConditionalHeader user={user} />
      
      <main className="pt-20">
        {/* Hero Section with Background Image */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 h-80">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(transparent,white)] bg-grid-pattern"></div>
          
          <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center">
              Connect & Collaborate
            </h1>
            <p className="text-xl text-white/90 max-w-2xl text-center mb-8">
              Join knowledge communities where ideas flourish and learning becomes a shared journey
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
              <SearchInput 
                placeholder="Find your perfect study group..." 
                className="flex-1 bg-white/20 backdrop-blur-lg border-transparent focus-within:bg-white/95 text-white placeholder:text-white/70 transition-all duration-300"
              />
              <Link href="/groups/create">
                <Button size="lg" variant="default" className="bg-white text-indigo-700 hover:bg-white/90 hover:text-indigo-800">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Trending Groups Section */}
        <section className="container mx-auto px-4 -mt-16 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Trending Study Groups
              </h2>
              <Link href="/groups/trending">
                <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800">
                  View all
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {trendingGroups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{group.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{group.description}</p>
                    {group.categoryRef && (
                      <Badge variant="secondary" className="mt-auto self-start">
                        {group.categoryRef.name}
                      </Badge>
                    )}
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                      {group._count.members} members
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* Main Groups Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Explore Study Groups
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Discover groups that match your learning goals and interests
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-1">
                  <Link href={{ pathname: '/groups', query: { ...searchParams, view: 'grid' } }}>
                    <Button variant={viewMode === 'grid' ? "default" : "ghost"} size="sm" className="rounded-md">
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={{ pathname: '/groups', query: { ...searchParams, view: 'list' } }}>
                    <Button variant={viewMode === 'list' ? "default" : "ghost"} size="sm" className="rounded-md">
                      <List className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="relative group">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter by Category
                  </Button>
                  <div className="absolute mt-2 right-0 z-10 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700 hidden group-hover:block">
                    <div className="space-y-2">
                      <Link href="/groups" className="block px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-gray-700">
                        All Categories
                      </Link>
                      {categories.map(category => (
                        <Link 
                          key={category.id} 
                          href={`/groups?category=${category.name}`}
                          className="block px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-gray-700"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Link href="/groups/create">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Groups Display */}
            {groups.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <div className="bg-slate-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No groups found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Try adjusting your search or filters, or create your own group to get started.
                </p>
                <Link href="/groups/create">
                  <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">
                    Create a New Group
                  </Button>
                </Link>
              </div>
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} className="block">
                      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
                        <div className="h-36 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                          {group.coverImage ? (
                            <Image 
                              src={group.coverImage} 
                              alt={group.name} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-grid-white/10 bg-grid-pattern"></div>
                          )}
                          {group.categoryRef && (
                            <Badge className="absolute top-3 right-3 bg-white/90 text-indigo-700 hover:bg-white">
                              {group.categoryRef.name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {group.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-1">
                            {group.description}
                          </p>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1 text-indigo-500" />
                                {group._count.members}
                              </div>
                              {group.creator?.name && (
                                <div className="text-xs">
                                  by {group.creator.name}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} className="block">
                      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
                        <div className="w-full md:w-48 h-32 md:h-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-md overflow-hidden relative flex-shrink-0">
                          {group.coverImage ? (
                            <Image 
                              src={group.coverImage} 
                              alt={group.name} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-grid-white/10 bg-grid-pattern flex items-center justify-center">
                              <Users className="h-12 w-12 text-white/70" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex flex-col md:flex-row justify-between gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {group.name}
                            </h3>
                            {group.categoryRef && (
                              <Badge className="self-start md:self-auto bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200">
                                {group.categoryRef.name}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                            {group.description}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-auto text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-indigo-500" />
                              {group._count.members} members
                            </div>
                            {group.creator?.name && (
                              <div>
                                Created by {group.creator.name}
                              </div>
                            )}
                            <div className="ml-auto">
                              <Button variant="outline" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950">
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
    </div>
  );
} 