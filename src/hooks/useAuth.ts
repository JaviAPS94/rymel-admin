import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import type { LoginCredentials } from "../types/auth.types";

export function useLogin() {
  const [, setLocation] = useLocation();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success("¡Bienvenido!");
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al iniciar sesión");
    },
  });
}

export function useLogout() {
  const [, setLocation] = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      toast.success("Sesión cerrada");
      setLocation("/login");
    },
  });
}
