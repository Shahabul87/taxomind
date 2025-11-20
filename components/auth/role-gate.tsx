"use client";

// NOTE: Users don't have roles anymore - only AdminAccount has roles
// This component is deprecated for regular user authentication
// For regular users, use permission-based checks instead

import { useCurrentRole } from "@/hooks/use-current-role";
import { FormError } from "@/components/form-error";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: string; // Changed from UserRole to string since UserRole doesn't exist
};

/**
 * @deprecated Users don't have roles - only AdminAccount has roles
 * For regular users, use permission-based guards instead
 * This component is kept for backward compatibility
 */
export const RoleGate = ({
  children,
  allowedRole,
}: RoleGateProps) => {
  const role = useCurrentRole();

  if (role !== allowedRole) {
    return (
      <FormError message="You do not have permission to view this content!" />
    )
  }

  return (
    <>
      {children}
    </>
  );
};
