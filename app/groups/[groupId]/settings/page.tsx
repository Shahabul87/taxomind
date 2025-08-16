import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { SettingsTab } from "./_components/settings-tab";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface GroupSettingsPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { groupId } = await params;
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  const group = await db.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      creator: true,
      members: {
        include: {
          User: true,
        },
      },
      categoryRef: true,
    },
  });

  if (!group) {
    return redirect("/groups");
  }

  // Only group creator and admins can access settings
  const isCreator = group.creatorId === user.id;
  const isAdmin = group.members.some(
    (member) => member.userId === user.id && member.role === "admin"
  );

  if (!isCreator && !isAdmin) {
    return redirect(`/groups/${groupId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConditionalHeader user={user} />

      <div className="pt-20 pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-2">
              <Link
                href={`/groups/${groupId}`}
                className="flex items-center text-sm text-white/80 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Group
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Group Settings</h1>
            <p className="text-white/80 mt-1">Manage and customize your group</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 -mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <SettingsTab group={group} currentUser={user} isCreator={isCreator} />
          </div>
        </div>
      </div>
    </div>
  );
} 