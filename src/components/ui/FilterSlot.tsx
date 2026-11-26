import type { ReactNode } from "react";
import { cx } from "@rymel/ui";

/**
 * Campo de filtro como `FilterField` de @rymel/ui, pero sin `<label>`: para el
 * `Select` del admin, que es un botón. Dentro de un `<label>` el botón tomaría
 * el texto de la etiqueta como nombre («Familia») en vez de su valor
 * («Todas las familias»), que es como lo encuentran las pruebas y los lectores.
 */
export const FilterSlot = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cx("flex min-w-0 flex-[1_1_180px] flex-col gap-1.5 text-xs font-semibold text-gray-600", className)}>
    <span>{label}</span>
    {children}
  </div>
);
