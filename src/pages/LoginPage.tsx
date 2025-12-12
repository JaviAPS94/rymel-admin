import {
  IconChartBar,
  IconLock,
  IconSettings,
  IconShieldCheckFilled,
} from "@tabler/icons-react";
import { LoginForm } from "@components/LoginForm";

export const LoginPage = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-rymel-blue to-[#0a0638]">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Admin branding and features */}
          <div className="text-white space-y-8 lg:pr-12">
            <div className="space-y-4">
              <img
                className="h-12 w-auto"
                src="https://rymel.com.co/wp-content/uploads/2024/07/Logo-Rymel-Oscuro.png"
              />
              <div className="inline-flex items-center gap-2 bg-rymel-yellow px-4 py-2 rounded-full">
                <IconShieldCheckFilled className="h-5 w-5 text-rymel-blue" />
                <span className="text-sm font-bold text-rymel-blue">
                  ADMINISTRADOR
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight text-balance">
                Panel de Control Administrativo
              </h1>
              <p className="text-xl text-white/80 leading-relaxed">
                Acceso exclusivo para gestión y supervisión de la plataforma
                Rymel
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-rymel-yellow rounded-lg flex items-center justify-center mb-3">
                  <IconLock className="h-6 w-6 text-rymel-blue" />
                </div>
                <h3 className="font-semibold mb-1">Seguridad Avanzada</h3>
                <p className="text-sm text-white/70">
                  Autenticación multifactor
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <IconChartBar className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Análisis en Vivo</h3>
                <p className="text-sm text-white/70">
                  Dashboard en tiempo real
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <IconSettings className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Configuración Total</h3>
                <p className="text-sm text-white/70">
                  Control completo del sistema
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="font-semibold mb-1">Gestión de Usuarios</h3>
                <p className="text-sm text-white/70">Administra permisos</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                <p className="text-sm text-orange-200">
                  <strong>Aviso:</strong> Esta área es exclusiva para personal
                  autorizado. Todos los accesos son registrados y monitoreados.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login form with distinct styling */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center text-sm text-white/70">
        <span>© 2025 Rymel - Panel Administrativo</span>
      </div>
    </div>
  );
};
