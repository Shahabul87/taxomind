import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsPageWithLayout } from "./_components/settings-page-with-layout";
import { SettingsUser } from "@/types/settings";

const SettingsPage = async () => {
  const user = await currentUser();

  if (!user || !user.id) {
    redirect("/login");
  }

  // Fetch complete user data from database
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      isTwoFactorEnabled: true,
      totpEnabled: true,
      totpVerified: true,
      isTeacher: true,
      isAffiliate: true,
      learningStyle: true,
      walletBalance: true,
      affiliateEarnings: true,
      affiliateCode: true,
      samTotalPoints: true,
      samLevel: true,
      createdAt: true,
      lastLoginAt: true,
      lastLoginIp: true,
      isAccountLocked: true,
      emailVerified: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Type-safe user conversion for settings
  const settingsUser: SettingsUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
    phone: dbUser.phone,
    isOAuth: user.isOAuth || false,
    isTwoFactorEnabled: dbUser.isTwoFactorEnabled,
    totpEnabled: dbUser.totpEnabled,
    totpVerified: dbUser.totpVerified,
    isTeacher: dbUser.isTeacher,
    isAffiliate: dbUser.isAffiliate,
    learningStyle: dbUser.learningStyle,
    walletBalance: Number(dbUser.walletBalance),
    affiliateEarnings: Number(dbUser.affiliateEarnings),
    affiliateCode: dbUser.affiliateCode,
    samTotalPoints: dbUser.samTotalPoints,
    samLevel: dbUser.samLevel,
    createdAt: dbUser.createdAt,
    lastLoginAt: dbUser.lastLoginAt,
    lastLoginIp: dbUser.lastLoginIp,
    isAccountLocked: dbUser.isAccountLocked,
    emailVerified: dbUser.emailVerified,
  };

  // Convert user data for SmartHeader and SmartSidebar
  const dashboardUser = {
    id: user.id,
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
    isTeacher: dbUser.isTeacher || false,
    isAffiliate: dbUser.isAffiliate || false,
  };

  return <SettingsPageWithLayout user={settingsUser} dashboardUser={dashboardUser} />;
}

export default SettingsPage;