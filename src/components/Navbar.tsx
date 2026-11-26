import { useLocation } from "wouter";
import { Navbar as UINavbar } from "@rymel/ui";
import { buildSections } from "@components/navSections";
import { useAuthStore } from "@store/authStore";
import { useLogout } from "@hooks/useAuth";
import { Role } from "@/types/user.types";

/**
 * Barra del admin. Qué secciones hay, quién las ve y cuándo están encendidas
 * vive en `navSections.tsx`; el aspecto lo pone `Navbar` de @rymel/ui.
 */
export const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const [location] = useLocation();

  const isAdmin = Boolean(user?.roles?.includes(Role.ADMIN));
  const email = user?.email ?? "";

  return (
    <UINavbar
      brand={{ name: "Rymel Admin", mark: "R", href: "/dashboard" }}
      sections={buildSections(location, isAdmin)}
      user={
        user
          ? { name: email.split("@")[0] || email, email, roles: user.roles }
          : undefined
      }
      onLogout={() => logoutMutation.mutate()}
    />
  );
};
