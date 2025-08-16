import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { GroupHeader } from "./_components/group-header";
import { GroupContent } from "./_components/group-content";
import Link from "next/link";
import { ArrowLeft, Users, ChevronRight, Bell, MessageCircle, Calendar, BookOpen, Settings } from "lucide-react";

interface GroupPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function GroupPage(props: GroupPageProps) {
  const params = await props.params;
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }


  const group = await db.group.findUnique({
    where: {
      id: params.groupId,
    },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
      course: {
        select: {
          title: true,
          imageUrl: true,
        },
      },
      categoryRef: true,
      discussions: {
        include: {
          author: true,
          _count: {
            select: {
              comments: true,
              likedBy: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      resources: {
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!group) {
    return redirect("/groups");
  }

  const isGroupMember = group.members.some(member => member.userId === user.id);
  const isCreator = group.creator.id === user.id;

  // Get other groups the user is a member of (limited to 3)
  const userGroups = await db.groupMember.findMany({
    where: {
      userId: user.id,
      NOT: {
        groupId: group.id
      }
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        }
      }
    },
    take: 3
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConditionalHeader user={user} />
      
      <div className="flex pt-16">
        {/* Custom Group Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] sticky top-16 bg-white dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <Link 
              href="/groups" 
              className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Groups
            </Link>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{group.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {group.description || "No description provided"}
            </p>
          </div>
          
          <nav className="p-2 flex-1 overflow-y-auto">
            <div className="space-y-1">
              <Link 
                href={`/groups/${group.id}?tab=discussions`} 
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MessageCircle className="w-4 h-4 mr-3 text-indigo-500" />
                Discussions
              </Link>
              <Link 
                href={`/groups/${group.id}?tab=resources`} 
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <BookOpen className="w-4 h-4 mr-3 text-indigo-500" />
                Resources
              </Link>
              <Link 
                href={`/groups/${group.id}?tab=members`} 
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Users className="w-4 h-4 mr-3 text-indigo-500" />
                Members ({group.members.length})
              </Link>
              <Link 
                href={`/groups/${group.id}?tab=events`} 
                className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Calendar className="w-4 h-4 mr-3 text-indigo-500" />
                Events
              </Link>
              {isCreator && (
                <Link 
                  href={`/groups/${group.id}/settings`} 
                  className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Settings className="w-4 h-4 mr-3 text-indigo-500" />
                  Group Settings
                </Link>
              )}
            </div>
            
            {userGroups.length > 0 && (
              <div className="mt-6">
                <h4 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Your Other Groups
                </h4>
                <div className="space-y-1">
                  {userGroups.map((membership) => (
                    <Link 
                      key={membership.group.id}
                      href={`/groups/${membership.group.id}`}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="truncate">{membership.group.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </aside>
        
        {/* Mobile navigation (visible on small screens) */}
        <div className="md:hidden border-b border-gray-200 dark:border-gray-800 w-full px-4 py-3 flex items-center justify-between sticky top-16 bg-white dark:bg-gray-900 z-10">
          <Link 
            href="/groups" 
            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Link>
          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{group.name}</span>
        </div>
        
        {/* Main content */}
        <main className="flex-1 pt-4 pb-16 px-4 md:px-6 w-full">
          <GroupHeader 
            group={group} 
            currentUser={user}
            isGroupMember={isGroupMember}
          />
          <GroupContent 
            group={group}
            currentUser={user}
            isGroupMember={isGroupMember}
          />
        </main>
      </div>
    </div>
  );
} 