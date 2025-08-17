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
      Group: {
        include: {
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
    (membership) => membership.Group.creator.id === user.id
  );
  const joinedGroups = userGroups.filter(
    (membership) => membership.Group.creator.id !== user.id
  );

  // Fetch group activity (recent discussions and events)
  const groupIds = userGroups.map((membership) => membership.groupId);
  
  const recentDiscussions = await db.groupDiscussion.findMany({
    where: {
      groupId: {
        in: groupIds,
      },
    },
    include: {
      Group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      User: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          GroupDiscussionComment: true,
          GroupDiscussionLike: true,
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
      Group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          GroupEventAttendee: true,
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
        ownedGroups={ownedGroups as any} 
        joinedGroups={joinedGroups as any} 
        recentDiscussions={recentDiscussions as any}
        upcomingEvents={upcomingEvents as any}
      />
    </div>
  );
} 