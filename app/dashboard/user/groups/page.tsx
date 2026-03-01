import { Suspense } from "react";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";
import { GroupsEnterpriseHero } from "./_components/groups-enterprise-hero";
import { TrendingSection, MainGroupsSection } from "./_components/enterprise-groups-sections";
import { HeroSkeleton, TrendingSectionSkeleton, GroupsSkeleton } from "./_components/groups-skeleton";

// SAM AI Study Buddy Integration
import { StudyBuddyFinder } from "@/components/sam/StudyBuddyFinder";

export const revalidate = 30;

interface GroupsPageProps {
  searchParams: Promise<{
    category?: string;
    query?: string;
    view?: string;
  }>;
}

// Fetch functions for Suspense boundaries
async function getTrendingGroups() {
  return db.group.findMany({
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
        _count: "desc",
      },
    },
  });
}

async function getGroupsWithFilters(query?: string, category?: string) {
  return db.group.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        category && category !== "All Categories"
          ? {
              category: category,
            }
          : {},
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
      createdAt: "desc",
    },
  });
}

async function getCategories() {
  return db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

async function getStats() {
  const [groupCount, memberCount] = await Promise.all([
    db.group.count(),
    db.groupMember.count(),
  ]);
  return { totalGroups: groupCount, totalMembers: memberCount };
}

// Server Components for data fetching with Suspense
async function HeroWithData() {
  const stats = await getStats();
  return (
    <GroupsEnterpriseHero
      totalGroups={stats.totalGroups}
      totalMembers={stats.totalMembers}
    />
  );
}

async function TrendingWithData() {
  const trendingGroups = await getTrendingGroups();
  return <TrendingSection groups={trendingGroups} />;
}

async function MainGroupsWithData({
  query,
  category,
  view,
  searchParams,
}: {
  query?: string;
  category?: string;
  view: "grid" | "list";
  searchParams: Record<string, string | undefined>;
}) {
  const [groups, categories] = await Promise.all([
    getGroupsWithFilters(query, category),
    getCategories(),
  ]);

  return (
    <MainGroupsSection
      groups={groups}
      categories={categories}
      viewMode={view}
      currentCategory={category}
      searchParams={searchParams}
    />
  );
}

export default async function GroupsPage(props: GroupsPageProps) {
  const searchParams = await props.searchParams;
  const user = await currentUser();
  const viewMode = (searchParams.view as "grid" | "list") || "grid";

  if (!user) {
    return redirect("/");
  }

  const searchParamsRecord: Record<string, string | undefined> = {
    category: searchParams.category,
    query: searchParams.query,
    view: searchParams.view,
  };

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="groups-hero-mesh min-h-screen"
    >
      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <Suspense fallback={<HeroSkeleton />}>
          <HeroWithData />
        </Suspense>

        {/* Trending Groups */}
        <Suspense fallback={<TrendingSectionSkeleton />}>
          <TrendingWithData />
        </Suspense>

        {/* SAM AI Study Buddy Finder - Find compatible study partners */}
        <section className="my-8 sm:my-10">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Find Study Buddies
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              SAM AI matches you with compatible learners based on shared courses and interests
            </p>
          </div>
          <StudyBuddyFinder
            limit={6}
            compact={false}
            minCompatibility={30}
            showConnectionStatus={true}
            autoRefreshInterval={60000}
          />
        </section>

        {/* Main Groups Section */}
        <Suspense
          fallback={
            <div className="rounded-2xl p-5 sm:p-7 bg-[hsl(var(--groups-surface-elevated))] border border-[hsl(var(--groups-border))] shadow-sm mb-16 sm:mb-20">
              <div className="mb-8">
                <div className="h-8 w-64 bg-[hsl(var(--groups-border-subtle))] rounded-lg mb-2 groups-skeleton" />
                <div className="h-5 w-96 bg-[hsl(var(--groups-border-subtle))] rounded-lg groups-skeleton" />
              </div>
              <GroupsSkeleton count={6} variant={viewMode === "list" ? "list" : "card"} />
            </div>
          }
        >
          <MainGroupsWithData
            query={searchParams.query}
            category={searchParams.category}
            view={viewMode}
            searchParams={searchParamsRecord}
          />
        </Suspense>
      </main>
    </PageWithMobileLayout>
  );
}
