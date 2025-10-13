import { db } from "@/lib/db";
import { UsersClient } from "./users-client";

// Response type
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: "Active" | "Inactive" | "Suspended";
  joinDate: string;
  lastActive: string;
  courses: number;
  image: string | null;
  isTwoFactorEnabled: boolean;
  isAccountLocked: boolean;
  lastLoginAt: Date | null;
  emailVerified: Date | null;
}

async function getUsersData(): Promise<UserData[]> {
  try {
    // Fetch users with related data
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
        isAccountLocked: true,
        isTwoFactorEnabled: true,
        emailVerified: true,
        _count: {
          select: {
            courses: true,
            Enrollment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for response
    const transformedUsers: UserData[] = users.map((user) => {
      // Determine status based on account state
      let status: "Active" | "Inactive" | "Suspended" = "Inactive";
      if (user.isAccountLocked) {
        status = "Suspended";
      } else if (user.lastLoginAt) {
        const daysSinceLogin = Math.floor(
          (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        status = daysSinceLogin <= 30 ? "Active" : "Inactive";
      }

      // Format last active time
      let lastActive = "Never";
      if (user.lastLoginAt) {
        const now = new Date();
        const lastLogin = new Date(user.lastLoginAt);
        const diffMs = now.getTime() - lastLogin.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
          lastActive = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
        } else if (diffHours < 24) {
          lastActive = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        } else if (diffDays < 30) {
          lastActive = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        } else {
          lastActive = lastLogin.toLocaleDateString();
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status,
        joinDate: user.createdAt.toLocaleDateString(),
        lastActive,
        courses: user._count.courses + user._count.Enrollment, // Courses created + enrolled
        image: user.image,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        isAccountLocked: user.isAccountLocked,
        lastLoginAt: user.lastLoginAt,
        emailVerified: user.emailVerified,
      };
    });

    return transformedUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UsersPage() {
  const users = await getUsersData();

  // Calculate stats from users data
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Active").length,
    instructors: users.filter(
      (u) => u.role === "INSTRUCTOR" || u.role === "ADMIN"
    ).length,
    newToday: users.filter((u) => {
      const today = new Date().toDateString();
      return new Date(u.joinDate).toDateString() === today;
    }).length,
  };

  return <UsersClient initialUsers={users} initialStats={stats} />;
}
