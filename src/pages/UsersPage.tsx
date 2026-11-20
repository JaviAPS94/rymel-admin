import { useState } from "react";
import {
  IconUserPlus,
  IconEdit,
  IconUserCheck,
  IconUserX,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { Modal } from "@components/ui/Modal";
import {
  Badge,
  Button as UIButton,
  Card as UICard,
  EmptyState,
  FilterField,
  IconButton,
  Input as UIInput,
  Page,
  PageHeader,
  Pagination as UIPagination,
  TableCard,
  TitleCell,
} from "@rymel/ui";
import { useUsers, useToggleUserStatus } from "@hooks/useUsers";
import { UserFormModal } from "@components/UserFormModal";
import { Layout } from "@components/Layout";
import { FilterSlot } from "@components/ui/FilterSlot";
import { Role, type User } from "@/types/user.types";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, string> = {
  [Role.ADMIN]: "Administrador",
  [Role.USER]: "Usuario",
  [Role.NORM]: "Norma",
  [Role.DESIGN]: "Diseño",
};

const ROLE_OPTIONS = [
  { value: "all", label: "Todos los roles" },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

export const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);

  const { data: usersData, isLoading, error } = useUsers(page, PAGE_SIZE);
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

  const hasFilters = selectedRole !== "all" || selectedStatus !== "all";
  const total = usersData?.total ?? 0;

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description={
          usersData ? (
            <>
              <strong>
                {total} {total === 1 ? "usuario" : "usuarios"}
              </strong>{" "}
              con acceso al sistema.
            </>
          ) : (
            "Quién entra al sistema y con qué roles."
          )
        }
        actions={
          <UIButton
            variant="light"
            size="lg"
            icon={<IconUserPlus className="h-[18px] w-[18px]" />}
            onClick={handleCreateUser}
          >
            Nuevo usuario
          </UIButton>
        }
      />

      <Page>
        <UICard as="form" role="search" aria-label="Filtrar usuarios" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <FilterField label="Buscar" className="flex-[2_1_280px]">
              <UIInput
                type="search"
                placeholder="Buscar por email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm("")}
                leftIcon={<IconSearch className="h-[18px] w-[18px]" />}
              />
            </FilterField>
            <FilterSlot label="Rol">
              <Select
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as Role | "all")}
                options={ROLE_OPTIONS}
              />
            </FilterSlot>
            <FilterSlot label="Estado">
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={STATUS_OPTIONS}
              />
            </FilterSlot>
          </div>
          {(hasFilters || filteredUsers.length !== usersData?.users.length) && (
            <div className="flex flex-wrap items-center gap-2.5 border-t border-gray-200 pt-3.5 text-[13px] text-gray-600">
              {filteredUsers.length !== usersData?.users.length && (
                <span>
                  Mostrando <strong className="text-gray-900">{filteredUsers.length}</strong> de{" "}
                  <strong className="text-gray-900">{usersData?.users.length}</strong> en esta página
                </span>
              )}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("all");
                    setSelectedStatus("all");
                  }}
                  className="ml-auto cursor-pointer border-0 bg-transparent font-semibold text-rymel-indigo hover:text-rymel-blue hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </UICard>

        {isLoading ? (
          <p className="text-sm text-gray-600">Cargando usuarios…</p>
        ) : error ? (
          <EmptyState tone="error" title="Error al cargar usuarios" />
        ) : (
          <TableCard
            aria-label="Usuarios"
            minWidth={880}
            footer={
              Math.ceil(total / PAGE_SIZE) > 1 ? (
                <UIPagination
                  page={page}
                  totalPages={Math.ceil(total / PAGE_SIZE)}
                  onPageChange={setPage}
                  totalItems={total}
                  pageSize={PAGE_SIZE}
                />
              ) : undefined
            }
          >
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Roles</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-600">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <TitleCell
                        icon={user.email.charAt(0).toUpperCase()}
                        title={user.email.split("@")[0]}
                        code={user.email}
                      />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles?.map((role) => (
                          <Badge key={role} tone="brand">
                            {ROLE_LABELS[role] || role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Badge tone={user.status === "active" ? "success" : "danger"} dot>
                        {user.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap text-gray-600">{formatDate(user.createdAt)}</td>
                    <td className="whitespace-nowrap text-gray-600">{formatDate(user.updatedAt)}</td>
                    <td data-align="right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton
                          label={user.status === "active" ? "Desactivar" : "Activar"}
                          tone={user.status === "active" ? "danger" : "neutral"}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "active" ? (
                            <IconUserX className="h-[18px] w-[18px]" />
                          ) : (
                            <IconUserCheck className="h-[18px] w-[18px]" />
                          )}
                        </IconButton>
                        <IconButton label="Editar" onClick={() => handleEditUser(user)}>
                          <IconEdit className="h-[18px] w-[18px]" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Page>

      {showModal && (
        <UserFormModal user={selectedUser} onClose={() => setShowModal(false)} />
      )}

      {showConfirmModal && userToToggle && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setUserToToggle(null);
          }}
          title={userToToggle.status === "active" ? "Desactivar usuario" : "Activar usuario"}
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas{" "}
              {userToToggle.status === "active" ? "desactivar" : "activar"} al usuario{" "}
              <strong>{userToToggle.email}</strong>?
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
                variant={userToToggle.status === "active" ? "danger" : "primary"}
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
    </Layout>
  );
};
