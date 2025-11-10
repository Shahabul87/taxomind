"use client";

import { ResponsiveHeaderWrapper } from "./_components/responsive-header-wrapper";
import { UserRole } from "@prisma/client";

interface ConditionalHeaderProps {
  user: {
    id: string;
    role?: UserRole;
  } | null;
}

/**
 * A header that adapts based on user's authentication status and screen size
 *
 * Automatically switches between 4 different headers based on screen width:
 * - MobileMiniHeader: < 768px (Unified mobile experience for all mobile devices)
 * - TabletHeader: 768px - 1023px (Tablet navigation)
 * - LaptopHeader: 1024px - 1279px (Compact laptop navigation)
 * - MainHeader: ≥ 1280px (Full desktop navigation with mega menus)
 *
 * Works for both authenticated and guest users
 */
const ConditionalHeader = ({ user }: ConditionalHeaderProps) => {
  return <ResponsiveHeaderWrapper user={user} />;
};

export default ConditionalHeader; 





