import { Link } from "wouter";
import { IconArrowRight } from "@tabler/icons-react";
import { Page, PageHeader } from "@rymel/ui";
import { useAuthStore } from "@store/authStore";
import { Layout } from "@components/Layout";
import { buildSections } from "@components/navSections";
import { Role } from "@/types/user.types";

/**
 * Inicio del admin: una tarjeta por sección a la que el usuario tiene acceso,
 * agrupadas como en la barra. Sale de la misma lista que la barra, así que
 * nunca ofrece un destino que la barra no tenga.
 */
export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = Boolean(user?.roles?.includes(Role.ADMIN));
  const name = user?.email?.split("@")[0];
  const groups = buildSections("/dashboard", isAdmin).filter((section) => section.items);

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Rymel Admin"
        title={name ? `Hola, ${name}` : "Panel de administración"}
        description="Catálogos, plantillas, fórmulas y usuarios de la plataforma."
      />

      <Page>
        {groups.map((group) => (
          <section
            key={group.label}
            aria-labelledby={`grupo-${group.label}`}
            className="rounded-[20px] border border-gray-200 bg-white p-5 sm:p-7"
          >
            <h2
              id={`grupo-${group.label}`}
              className="m-0 mb-4 flex items-center gap-2.5 text-lg font-extrabold text-gray-900"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-rymel-blue text-rymel-yellow"
              >
                {group.icon}
              </span>
              {group.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items!.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-300 p-4 text-gray-900 no-underline transition-shadow hover:border-transparent hover:shadow-float"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rymel-soft text-rymel-indigo"
                  >
                    {item.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-bold">{item.label}</span>
                    {item.description && (
                      <span className="text-[13px] text-gray-600">{item.description}</span>
                    )}
                  </span>
                  <IconArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-rymel-indigo"
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </Page>
    </Layout>
  );
};
