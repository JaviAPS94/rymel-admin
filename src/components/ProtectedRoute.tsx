import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuthStore } from "@store/authStore";
import type { Role } from "@/types/user.types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, solo usuarios con al menos uno de estos roles pueden acceder. */
  roles?: Role[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (roles && roles.length > 0) {
    const hasRequiredRole = user?.roles?.some((role) =>
      roles.includes(role as Role)
    );
    if (!hasRequiredRole) {
      return <Redirect to="/dashboard" />;
    }
  }

  return <>{children}</>;
};
