import { useState } from "react";
import {
  IconUserPlus,
  IconEdit,
  IconUserCheck,
  IconUserX,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Modal } from "@components/ui/Modal";
import { Pagination } from "@components/ui/Pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/Card";
import { useUsers, useToggleUserStatus } from "@hooks/useUsers";
import { UserFormModal } from "@components/UserFormModal";
import { Layout } from "@components/Layout";
import { Role, type User } from "@/types/user.types";

export const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  const { data: usersData, isLoading, error } = useUsers(page, 10);
  const toggleStatusMutation = useToggleUserStatus();

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggle(user);
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = () => {
    if (userToToggle) {
      toggleStatusMutation.mutate(userToToggle.id);
    }
    setShowConfirmModal(false);
    setUserToToggle(null);
  };

  const filteredUsers =
    usersData?.users.filter((user) => {
      const matchesSearch = user.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole =
        selectedRole === "all" || user.roles?.includes(selectedRole as Role);
      const matchesStatus =
        selectedStatus === "all" || user.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    }) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los usuarios del sistema
            </p>
          </div>
          <Button variant="primary" onClick={handleCreateUser}>
            <IconUserPlus className="h-5 w-5 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              Total: {usersData?.total || 0} usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Rol
                  </label>
                  <Select
                    value={selectedRole}
                    onChange={(value) => setSelectedRole(value as Role | "all")}
                    options={[
                      { value: "all", label: "Todos los roles" },
                      { value: Role.ADMIN, label: "Administrador" },
                      { value: Role.USER, label: "Usuario" },
                      { value: Role.NORM, label: "Norma" },
                      { value: Role.DESIGN, label: "Diseño" },
                    ]}
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Estado
                  </label>
                  <Select
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={[
                      { value: "all", label: "Todos los estados" },
                      { value: "active", label: "Activo" },
                      { value: "inactive", label: "Inactivo" },
                    ]}
                  />
                </div>

                {(selectedRole !== "all" || selectedStatus !== "all") && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRole("all");
                        setSelectedStatus("all");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </div>

              {filteredUsers.length !== usersData?.users.length && (
                <p className="text-sm text-gray-600">
                  Mostrando {filteredUsers.length} de {usersData?.users.length}{" "}
                  usuarios
                </p>
              )}
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando usuarios...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar usuarios
              </div>
            )}

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Roles
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Fecha Creación
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Fecha Actualización
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No se encontraron usuarios
                        </td>
                      </tr>
                    )}
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {user.roles?.map((role) => {
                              const roleLabels: Record<string, string> = {
                                [Role.ADMIN]: "Administrador",
                                [Role.USER]: "Usuario",
                                [Role.NORM]: "Norma",
                                [Role.DESIGN]: "Diseño",
                              };
                              return (
                                <span
                                  key={role}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {roleLabels[role] || role}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left text-gray-600 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-left text-gray-600 text-sm">
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={
                                user.status === "active"
                                  ? "Desactivar"
                                  : "Activar"
                              }
                            >
                              {user.status === "active" ? (
                                <IconUserX className="h-5 w-5" />
                              ) : (
                                <IconUserCheck className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={page}
              totalPages={Math.ceil((usersData?.total || 0) / 10)}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {showModal && (
          <UserFormModal
            user={selectedUser}
            onClose={() => setShowModal(false)}
          />
        )}

        {showConfirmModal && userToToggle && (
          <Modal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setUserToToggle(null);
            }}
            title={
              userToToggle.status === "active"
                ? "Desactivar Usuario"
                : "Activar Usuario"
            }
          >
            <div className="space-y-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas{" "}
                {userToToggle.status === "active" ? "desactivar" : "activar"} al
                usuario <strong>{userToToggle.email}</strong>?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setUserToToggle(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmToggleStatus}
                  isLoading={toggleStatusMutation.isPending}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};
