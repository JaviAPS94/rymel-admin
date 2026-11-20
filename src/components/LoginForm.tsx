import { useState, type FormEvent } from "react";
import {
  IconMail,
  IconLock,
  IconUserShield,
  IconShieldCheckFilled,
} from "@tabler/icons-react";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useLogin } from "@hooks/useAuth";
import { Notice } from "@rymel/ui";

export const LoginForm = () => {
  const loginMutation = useLogin();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación simple
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) newErrors.email = "El email es requerido";
    if (!formData.password) newErrors.password = "La contraseña es requerida";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    loginMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rymel-blue rounded-2xl mb-2">
          <IconUserShield className="h-8 w-8 text-rymel-yellow" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-gray-900">
          Acceso administrativo
        </h2>
        <p className="text-gray-600">Ingresa tus credenciales de seguridad</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-gray-900 flex items-center gap-2"
          >
            <IconMail className="h-4 w-4" />
            Correo electrónico
          </label>
          <Input
            id="email"
            type="email"
            placeholder="admin@rymel.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
            size="lg"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-gray-900 flex items-center gap-2"
          >
            <IconLock className="h-4 w-4" />
            Contraseña
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
            size="lg"
          />
        </div>

        {loginMutation.isError && (
          <Notice tone="danger">
            Credenciales inválidas. Por favor, intenta nuevamente.
          </Notice>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={loginMutation.isPending}
        >
          {!loginMutation.isPending && (
            <IconShieldCheckFilled className="h-5 w-5" />
          )}
          Continuar
        </Button>
      </form>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-center text-gray-600">
          Acceso restringido a personal autorizado únicamente
        </p>
      </div>
    </div>
  );
};
