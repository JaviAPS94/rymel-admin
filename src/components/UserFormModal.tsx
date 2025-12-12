import { useState, type FormEvent } from "react";
import { IconMail, IconLock } from "@tabler/icons-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import { useCreateUser, useUpdateUser } from "@hooks/useUsers";
import type { User, CreateUserDto, UpdateUserDto } from "@/types/user.types";
import { Role } from "@/types/user.types";

interface UserFormModalProps {
  user?: User;
  onClose: () => void;
}

export const UserFormModal = ({ user, onClose }: UserFormModalProps) => {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    roles: user?.roles || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "El email es requerido";
    if (!user && !formData.password)
      newErrors.password = "La contraseña es requerida";
    if (formData.roles.length === 0)
      newErrors.roles = "Debes seleccionar al menos un rol";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (user) {
      const data: UpdateUserDto = {
        email: formData.email,
        roles: formData.roles,
      };
      if (formData.password) {
        data.password = formData.password;
      }
      updateUserMutation.mutate(
        { id: user.id, data },
        {
          onSuccess: () => onClose(),
        }
      );
    } else {
      const data: CreateUserDto = {
        email: formData.email,
        password: formData.password,
        roles: formData.roles,
      };
      createUserMutation.mutate(data, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isLoading =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? "Editar Usuario" : "Crear Usuario"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <IconMail className="h-4 w-4" />
            Correo Electrónico
          </label>
          <Input
            id="email"
            type="email"
            placeholder="usuario@rymel.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <IconLock className="h-4 w-4" />
            {user ? "Nueva Contraseña (opcional)" : "Contraseña"}
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Roles</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries({
              [Role.ADMIN]: "Administrador",
              [Role.USER]: "Usuario",
              [Role.NORM]: "Norma",
              [Role.DESIGN]: "Diseño",
            }).map(([roleValue, roleLabel]) => {
              const isSelected = formData.roles.includes(roleValue as Role);
              return (
                <button
                  key={roleValue}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFormData({
                        ...formData,
                        roles: formData.roles.filter((r) => r !== roleValue),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        roles: [...formData.roles, roleValue as Role],
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {roleLabel}
                </button>
              );
            })}
          </div>
          {errors.roles && (
            <p className="text-sm text-red-600 mt-1">{errors.roles}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
          >
            {user ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
