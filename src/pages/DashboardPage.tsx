import { Link } from "wouter";
import { IconUsers, IconFiles, IconHome } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/Card";
import { useAuthStore } from "@store/authStore";
import { Layout } from "@components/Layout";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <Layout>
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
        <Link href="/users">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
        </Link>

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
          <Link href="/users">
            <Button variant="outline" className="justify-start w-full">
              <IconUsers className="mr-2 h-5 w-5" />
              Gestionar Usuarios
            </Button>
          </Link>
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
    </Layout>
  );
};
