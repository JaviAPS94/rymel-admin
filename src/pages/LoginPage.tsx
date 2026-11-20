import { IconShieldCheckFilled } from "@tabler/icons-react";
import { LoginForm } from "@components/LoginForm";

/** Entrada al admin, con la misma composición que la del cliente. */
export const LoginPage = () => (
  <div className="fixed inset-0 overflow-y-auto bg-rymel-blue">
    <div className="h-[3px] bg-rymel-yellow" />
    <div aria-hidden="true" className="rm-dots pointer-events-none fixed inset-y-0 right-0 w-[46%]" />

    <div className="relative flex min-h-[calc(100%-3px)] items-center justify-center p-4">
      <div className="grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-2">
        <div className="space-y-8 text-white lg:pr-12">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-rymel-yellow text-2xl font-extrabold text-rymel-blue"
              >
                R
              </span>
              <span className="text-3xl font-bold tracking-[-0.01em]">Rymel Admin</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-rymel-yellow">
              <IconShieldCheckFilled className="h-4 w-4" />
              Administrador
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] lg:text-5xl">
              Panel de control administrativo
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-white/80">
              Catálogos, plantillas, fórmulas y usuarios de la plataforma Rymel.
            </p>
          </div>

          <p className="max-w-md rounded-2xl border border-white/15 bg-white/[.07] p-4 text-sm text-white/80">
            <strong className="text-white">Aviso:</strong> esta área es exclusiva para personal
            autorizado. Todos los accesos quedan registrados.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-modal sm:p-8 lg:p-12">
          <LoginForm />
        </div>
      </div>
    </div>
  </div>
);
