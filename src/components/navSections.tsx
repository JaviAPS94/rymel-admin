import type { ComponentType } from "react";
import {
  IconBarcode,
  IconBoxSeam,
  IconFileDescription,
  IconFileSpreadsheet,
  IconGhost2,
  IconHome,
  IconMathFunction,
  IconPuzzle,
  IconSitemap,
  IconUserCog,
  IconUsers,
} from "@tabler/icons-react";
import type { NavItem, NavSection } from "@rymel/ui";

/**
 * Secciones de la barra del admin: qué destinos hay, cuáles son solo para
 * ADMIN y cuándo se encienden. Todo destino debe tener ruta en `App.tsx`
 * (lo comprueba `navSections.spec.tsx`).
 */

interface ItemConfig {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Solo para administradores. */
  adminOnly?: boolean;
}

interface SectionConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  items?: ItemConfig[];
}

export const SECTIONS: SectionConfig[] = [
  { label: "Dashboard", icon: IconHome, href: "/dashboard" },
  {
    label: "Catálogos",
    icon: IconBoxSeam,
    items: [
      { href: "/bom", label: "Materiales", icon: IconSitemap },
      { href: "/semi-finished", label: "Semielaborados", icon: IconPuzzle, adminOnly: true },
      { href: "/phantom-items", label: "Fantasmas", icon: IconGhost2 },
    ],
  },
  {
    label: "Administración",
    icon: IconUserCog,
    items: [
      { href: "/users", label: "Usuarios", icon: IconUsers },
      { href: "/design-code-rules", label: "Reglas de código", icon: IconBarcode, adminOnly: true },
      { href: "/formulas", label: "Fórmulas", icon: IconMathFunction, adminOnly: true },
      { href: "/templates", label: "Plantillas", icon: IconFileSpreadsheet, adminOnly: true },
      { href: "/designs", label: "Diseños", icon: IconFileDescription, adminOnly: true },
    ],
  },
];

/** Una ruta pertenece a un destino si es él o una pantalla bajo él (`/bom/12`). */
export const isUnder = (location: string, href: string) =>
  location === href || location.startsWith(`${href}/`);

const iconOf = (Icon: ComponentType<{ className?: string }>) => (
  <Icon className="h-[18px] w-[18px]" />
);

/** Secciones visibles para el usuario, con la activa marcada según la ruta. */
export const buildSections = (location: string, isAdmin: boolean): NavSection[] =>
  SECTIONS.map(({ icon, items, ...section }) => {
    const visible: NavItem[] | undefined = items
      ?.filter((item) => isAdmin || !item.adminOnly)
      .map((item) => ({
        href: item.href,
        label: item.label,
        icon: iconOf(item.icon),
        active: isUnder(location, item.href),
      }));
    return {
      ...section,
      icon: iconOf(icon),
      items: visible,
      active: section.href
        ? isUnder(location, section.href)
        : Boolean(visible?.some((item) => item.active)),
    };
  }).filter((section) => !section.items || section.items.length > 0);

