/**
 * @deprecated Regular users no longer have roles.
 * These hooks are only for admin routes with AdminRole.
 * Admin authentication is completely separate from user authentication.
 */

import { useSession } from "next-auth/react";
import { AdminRole } from "@prisma/client";
import { Permission } from "@/types/auth";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/auth/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  return {
    user: session?.user,
    loading: status === "loading",
    authenticated: status === "authenticated"
  };
};

/**
 * @deprecated Only works for admin sessions. Regular users don't have roles.
 */
export const useCurrentRole = () => {
  const { user } = useCurrentUser();
  return user?.role || null;
};

/**
 * @deprecated Only works for admin sessions with AdminRole.
 */
export const useHasPermission = (permission: Permission) => {
  const role = useCurrentRole();
  return role ? hasPermission(role as AdminRole, permission) : false;
};

/**
 * @deprecated Only works for admin sessions with AdminRole.
 */
export const useHasAnyPermission = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAnyPermission(role as AdminRole, permissions) : false;
};

/**
 * @deprecated Only works for admin sessions with AdminRole.
 */
export const useHasAllPermissions = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAllPermissions(role as AdminRole, permissions) : false;
};

export const useRequireAuth = () => {
  const { user, loading, authenticated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/auth/login");
    }
  }, [loading, authenticated, router]);

  return { user, loading, authenticated };
};

/**
 * @deprecated Only works for admin routes. Use AdminGuard component instead.
 */
export const useRequireRole = (role: AdminRole) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated && user?.role !== role) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, role, router]);

  return { user, loading, authenticated };
};

/**
 * @deprecated Only works for admin routes. Use RoleGuard component instead.
 */
export const useRequireAnyRole = (roles: AdminRole[]) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated && user?.role && !roles.includes(user.role as AdminRole)) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, roles, router]);

  return { user, loading, authenticated };
};

/**
 * @deprecated Only works for admin routes with permissions.
 */
export const useRequirePermission = (permission: Permission) => {
  const { user, loading, authenticated } = useRequireAuth();
  const hasRequiredPermission = useHasPermission(permission);
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated && !hasRequiredPermission) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, hasRequiredPermission, router, permission]);

  return { user, loading, authenticated, hasPermission: hasRequiredPermission };
};