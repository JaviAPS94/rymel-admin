import {
  IconLogout,
  IconHome,
  IconUsers,
  IconFiles,
} from "@tabler/icons-react";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useAuthStore } from "../store/authStore";
import { useLogout } from "../hooks/useAuth";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <IconHome className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Administrador de Recursos
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.name || "Usuario"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona tus recursos desde este panel de control
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <IconUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Usuarios</CardTitle>
                  <CardDescription>Gestionar usuarios</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">
                Total de usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <IconFiles className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recursos</CardTitle>
                  <CardDescription>Gestionar recursos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">
                Total de recursos disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <IconHome className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Proyectos</CardTitle>
                  <CardDescription>Gestionar proyectos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">
                Total de proyectos activos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Acciones Rápidas
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <IconUsers className="mr-2 h-5 w-5" />
              Nuevo Usuario
            </Button>
            <Button variant="outline" className="justify-start">
              <IconFiles className="mr-2 h-5 w-5" />
              Nuevo Recurso
            </Button>
            <Button variant="outline" className="justify-start">
              <IconHome className="mr-2 h-5 w-5" />
              Nuevo Proyecto
            </Button>
            <Button variant="outline" className="justify-start">
              Ver Reportes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
