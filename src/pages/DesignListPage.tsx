import { useState } from "react";
import { useLocation } from "wouter";
import { IconAlertTriangle, IconFileDescription, IconSearch } from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import { Pagination } from "@components/ui/Pagination";
import { useDesigns } from "@hooks/useDesigns";
import type { DesignFilters, DesignRow } from "@/types/design.types";

/**
 * Los diseños que crea el cliente, para consultarlos y gestionarlos.
 *
 * Es una sección aparte de la lista de materiales: esa se define en la
 * plantilla. Aquí se encuentra cualquier diseño por lo que se sabe de él
 * —norma, elemento, tipo, fechas, si está desactualizado— y se abre su detalle.
 */

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });

const field = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

/** Un filtro de sí / no / todos. */
const triState = (value: boolean | undefined) => (value === undefined ? "" : String(value));
const fromTriState = (value: string) => (value === "" ? undefined : value === "true");

export const DesignListPage = () => {
  const [filters, setFilters] = useState<DesignFilters>({ page: 1, limit: 20 });
  const [, navigate] = useLocation();
  const designs = useDesigns(filters);
  const options = designs.data?.options;

  /** Cambiar un filtro vuelve a la primera página. */
  const setFilter = <K extends keyof DesignFilters>(key: K, value: DesignFilters[K]) =>
    setFilters((current) => ({
      ...current,
      [key]: value === "" || value === 0 ? undefined : value,
      page: 1,
    }));

  const subTypes = (options?.designSubTypes ?? []).filter(
    (subType) => !filters.designTypeId || subType.designTypeId === filters.designTypeId,
  );

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconFileDescription className="h-7 w-7 text-rymel-blue" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diseños</h1>
            <p className="text-sm text-gray-500">
              Los diseños que crea el cliente. Ábrelos para ver sus hojas, costos, versiones y
              lista de materiales, o para desactivarlos, recalcularlos o exportarlos.
            </p>
          </div>
        </div>

        <div
          className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Filtros"
        >
          <label className="flex items-center gap-2 rounded border border-gray-300 px-2 sm:col-span-2">
            <IconSearch className="h-4 w-4 text-gray-400" />
            <input
              value={filters.search ?? ""}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Código o nombre"
              aria-label="Código o nombre"
              className="h-9 flex-1 text-sm outline-none"
            />
          </label>
          <input
            value={filters.sapReference ?? ""}
            onChange={(event) => setFilter("sapReference", event.target.value)}
            placeholder="Referencia ERP del elemento"
            aria-label="Referencia ERP"
            className={field}
          />
          <select
            value={filters.normId ?? ""}
            onChange={(event) => setFilter("normId", Number(event.target.value))}
            aria-label="Norma"
            className={field}
          >
            <option value="">Todas las normas</option>
            {(options?.norms ?? []).map((norm) => (
              <option key={norm.id} value={norm.id}>
                {norm.name}
              </option>
            ))}
          </select>
          <select
            value={filters.countryId ?? ""}
            onChange={(event) => setFilter("countryId", Number(event.target.value))}
            aria-label="País"
            className={field}
          >
            <option value="">Todos los países</option>
            {(options?.countries ?? []).map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            value={filters.designTypeId ?? ""}
            onChange={(event) => {
              setFilter("designTypeId", Number(event.target.value));
              setFilter("designSubtypeId", undefined);
            }}
            aria-label="Tipo"
            className={field}
          >
            <option value="">Todos los tipos</option>
            {(options?.designTypes ?? []).map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <select
            value={filters.designSubtypeId ?? ""}
            onChange={(event) => setFilter("designSubtypeId", Number(event.target.value))}
            aria-label="Subtipo"
            className={field}
          >
            <option value="">Todos los subtipos</option>
            {subTypes.map((subType) => (
              <option key={subType.id} value={subType.id}>
                {subType.name}
              </option>
            ))}
          </select>
          <select
            value={triState(filters.stale)}
            onChange={(event) => setFilter("stale", fromTriState(event.target.value))}
            aria-label="Desactualizado"
            className={field}
          >
            <option value="">Actualizados y desactualizados</option>
            <option value="true">Solo desactualizados</option>
            <option value="false">Solo actualizados</option>
          </select>
          <select
            value={triState(filters.adjusted)}
            onChange={(event) => setFilter("adjusted", fromTriState(event.target.value))}
            aria-label="Lista de materiales"
            className={field}
          >
            <option value="">Con y sin lista ajustada</option>
            <option value="true">Con lista ajustada por el cliente</option>
            <option value="false">Sin lista ajustada</option>
          </select>
          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 sm:col-span-2">
            <select
              value={filters.dateField ?? "created"}
              onChange={(event) => setFilter("dateField", event.target.value as "created" | "updated")}
              aria-label="Fecha de"
              className="h-9 rounded border border-gray-300 px-1 text-sm"
            >
              <option value="created">Creado</option>
              <option value="updated">Actualizado</option>
            </select>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(event) => setFilter("from", event.target.value)}
              aria-label="Desde"
              className={field}
            />
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(event) => setFilter("to", event.target.value)}
              aria-label="Hasta"
              className={field}
            />
          </div>
        </div>

        {designs.isLoading && <p className="text-sm text-gray-500">Cargando diseños…</p>}
        {designs.isError && <p className="text-sm text-red-600">No se pudieron cargar los diseños.</p>}

        {designs.data && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm" aria-label="Diseños">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Tipo · subtipo</th>
                  <th className="px-3 py-2">Norma · país</th>
                  <th className="px-3 py-2">Elementos</th>
                  <th className="px-3 py-2">Fechas</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {designs.data.data.map((row) => (
                  <DesignRowView key={row.id} row={row} onOpen={() => navigate(`/designs/${row.id}`)} />
                ))}
              </tbody>
            </table>
            <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
              {designs.data.total} diseño(s)
              {designs.data.data.length === 0 ? "; ninguno coincide con los filtros." : ""}
            </p>
          </div>
        )}

        {designs.data && designs.data.totalPages > 1 && (
          <Pagination
            currentPage={filters.page}
            totalPages={designs.data.totalPages}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        )}
      </div>
    </Layout>
  );
};

const DesignRowView = ({ row, onOpen }: { row: DesignRow; onOpen: () => void }) => {
  const norms = [...new Set(row.elements.map((element) => element.norm?.name).filter(Boolean))];
  const countries = [...new Set(row.elements.map((element) => element.country?.name).filter(Boolean))];
  return (
    <tr className="cursor-pointer border-t border-gray-100 hover:bg-gray-50" onClick={onOpen}>
      <td className="px-3 py-2">
        {/* Botón para llegar con el teclado; el clic lo atiende la fila */}
        <button
          className="text-left"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <div className="font-mono font-medium text-gray-900">{row.code}</div>
          <div className="text-xs text-gray-500">{row.name}</div>
        </button>
      </td>
      <td className="px-3 py-2 text-gray-700">
        {row.designType?.name ?? "—"} · {row.designSubType?.name ?? "—"}
      </td>
      <td className="px-3 py-2 text-gray-700">
        {norms.join(", ") || "—"}
        {countries.length > 0 && <div className="text-xs text-gray-500">{countries.join(", ")}</div>}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-gray-600">
        {row.elements.map((element) => element.sapReference || "sin referencia").join(" · ") || "—"}
      </td>
      <td className="px-3 py-2 text-xs text-gray-600">
        <div>Creado {formatDate(row.createdAt)}</div>
        <div>Actualizado {formatDate(row.updatedAt)}</div>
      </td>
      <td className="space-y-1 px-3 py-2 text-xs">
        {row.stale && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700">
            <IconAlertTriangle className="h-3 w-3" />
            Desactualizado
          </span>
        )}
        {row.bomAdjustment && (
          <div className="text-amber-700">
            Lista ajustada{row.bomAdjustment.updatedBy ? ` por ${row.bomAdjustment.updatedBy}` : ""}
          </div>
        )}
        {!row.stale && !row.bomAdjustment && <span className="text-gray-400">—</span>}
      </td>
    </tr>
  );
};

export default DesignListPage;
