import { type ReactNode } from "react";
import { Navbar } from "@components/Navbar";

interface LayoutProps {
  children: ReactNode;
  /**
   * Sin contenedor propio: la página pone su `PageHeader` (banda índigo
   * pegada a la barra) y su `Page` de @rymel/ui. Las pantallas aún sin
   * migrar siguen dentro del contenedor de siempre.
   */
  bare?: boolean;
}

export const Layout = ({ children, bare = false }: LayoutProps) => (
  <div className="min-h-screen bg-surface">
    <Navbar />
    {bare ? (
      children
    ) : (
      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8">{children}</main>
    )}
  </div>
);
