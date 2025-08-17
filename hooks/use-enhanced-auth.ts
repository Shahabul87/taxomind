import { useSession } from "next-auth/react";
import { UserRole, Permission } from "@/types/auth";
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

export const useCurrentRole = () => {
  const { user } = useCurrentUser();
  return user?.role || null;
};

export const useHasPermission = (permission: Permission) => {
  const role = useCurrentRole();
  return role ? hasPermission(role as UserRole, permission) : false;
};

export const useHasAnyPermission = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAnyPermission(role as UserRole, permissions) : false;
};

export const useHasAllPermissions = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAllPermissions(role as UserRole, permissions) : false;
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

export const useRequireRole = (role: UserRole) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && authenticated && user?.role !== role) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, role, router]);
  
  return { user, loading, authenticated };
};

export const useRequireAnyRole = (roles: UserRole[]) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && authenticated && user?.role && !roles.includes(user.role as UserRole)) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, roles, router]);
  
  return { user, loading, authenticated };
};

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