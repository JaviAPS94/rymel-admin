import { apiClient } from "./api";
import type {
  LoginCredentials,
  AuthResponse,
  BackendLoginResponse,
} from "@/types/auth.types";

/**
 * Decodifica un JWT para extraer el payload
 */
function decodeJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Servicio de autenticación usando axios
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data } = await apiClient.post<BackendLoginResponse>(
        "/auth/login",
        credentials
      );

      const decoded = decodeJWT(data.access_token);

      if (!decoded) {
        throw new Error("Token inválido");
      }

      return {
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.email.split("@")[0],
          roles: decoded.roles,
        },
        token: data.access_token,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Credenciales inválidas");
    }
  },

  async logout(): Promise<void> {
    // Por ahora solo limpia el estado local
    // Si tu backend tiene un endpoint de logout, descomenta esto:
    // await apiClient.post('/auth/logout');
    await Promise.resolve();
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = decodeJWT(token);
      if (!decoded) return false;

      // Verificar si el token ha expirado
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  },
};
