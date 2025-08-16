import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Metadata } from "next";
import { MyGroupsHero } from "./_components/my-groups-hero";
import { MyGroupsContent } from "./_components/my-groups-content";

export const metadata: Metadata = {
  title: "My Groups | BDGenAI",
  description: "View and manage all your group memberships in one place",
};

export default async function MyGroupsPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Fetch all groups where the user is a member
  const userGroups = await db.groupMember.findMany({
    where: {
      userId: user.id,
    },
    include: {
      group: {
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
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  // Separate groups into owned and joined groups
  const ownedGroups = userGroups.filter(
    (membership) => membership.group.creator.id === user.id
  );
  const joinedGroups = userGroups.filter(
    (membership) => membership.group.creator.id !== user.id
  );

  // Fetch group activity (recent discussions and events)
  const groupIds = userGroups.map((membership) => membership.group.id);
  
  const recentDiscussions = await db.groupDiscussion.findMany({
    where: {
      groupId: {
        in: groupIds,
      },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          comments: true,
          likedBy: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const upcomingEvents = await db.groupEvent.findMany({
    where: {
      groupId: {
        in: groupIds,
      },
      date: {
        gte: new Date(),
      },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          attendees: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <MyGroupsHero />
      <MyGroupsContent 
        ownedGroups={ownedGroups} 
        joinedGroups={joinedGroups} 
        recentDiscussions={recentDiscussions}
        upcomingEvents={upcomingEvents}
      />
    </div>
  );
} 