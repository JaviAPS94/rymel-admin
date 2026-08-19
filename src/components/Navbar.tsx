import { Link, useLocation } from "wouter";
import {
  IconLogout,
  IconHome,
  IconUsers,
  IconFiles,
  IconSettings,
  IconSitemap,
  IconBarcode,
  IconGhost2,
  IconBoxSeam,
  IconUserCog,
  IconMathFunction,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { NavDropdown } from "@components/NavDropdown";
import { useAuthStore } from "@store/authStore";
import { useLogout } from "@hooks/useAuth";
import { Role } from "@/types/user.types";

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isAdmin = user?.roles?.includes(Role.ADMIN);

  const catalogItems = [
    { path: "/bom", label: "Materiales", icon: IconSitemap },
    { path: "/phantom-items", label: "Fantasmas", icon: IconGhost2 },
    { path: "/resources", label: "Recursos", icon: IconFiles },
  ];

  const adminItems = [
    { path: "/users", label: "Usuarios", icon: IconUsers },
    ...(isAdmin
      ? [
          { path: "/design-code-rules", label: "Reglas de Código", icon: IconBarcode },
          { path: "/formulas", label: "Fórmulas", icon: IconMathFunction },
        ]
      : []),
    { path: "/settings", label: "Configuración", icon: IconSettings },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="shrink-0">
          <div className="flex items-center gap-2 cursor-pointer">
            <IconHome className="h-6 w-6 text-rymel-blue shrink-0" />
            <h1 className="text-base font-semibold text-gray-900 whitespace-nowrap hidden sm:block">
              Administrador de Recursos
            </h1>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard" className="shrink-0">
            <button
              className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-rymel-blue text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <IconHome className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </button>
          </Link>

          <NavDropdown label="Catálogos" icon={IconBoxSeam} items={catalogItems} />
          <NavDropdown label="Administración" icon={IconUserCog} items={adminItems} />
        </nav>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-rymel-blue flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700 font-medium hidden lg:block whitespace-nowrap">
              {user?.name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <IconLogout className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
