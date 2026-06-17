import { Link, useLocation } from "wouter";
import {
  IconLogout,
  IconHome,
  IconUsers,
  IconFiles,
  IconSettings,
  IconSitemap,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { useAuthStore } from "@store/authStore";
import { useLogout } from "@hooks/useAuth";

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: IconHome },
    { path: "/users", label: "Usuarios", icon: IconUsers },
    { path: "/bom", label: "Materiales", icon: IconSitemap },
    { path: "/resources", label: "Recursos", icon: IconFiles },
    { path: "/settings", label: "Configuración", icon: IconSettings },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8">
          <Link href="/dashboard">
            <div className="flex items-center space-x-3 cursor-pointer">
              <IconHome className="h-6 w-6 text-rymel-blue" />
              <h1 className="text-xl font-semibold text-gray-900">
                Administrador de Recursos
              </h1>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-rymel-blue text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-rymel-blue flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 font-medium hidden lg:block">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <IconLogout className="h-4 w-4" />
            <span>Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
