"use client";

import { MainHeader } from "./main-header";
import { UserRole } from "@prisma/client";

interface ConditionalHeaderProps {
  user: {
    id: string;
    role?: UserRole;
  } | null;
}

/**
 * A header that adapts based on user's authentication status
 */
const ConditionalHeader = ({ user }: ConditionalHeaderProps) => {
  if (!user) {
    return null;
  }

  return <MainHeader user={user} />;
};

export default ConditionalHeader; 