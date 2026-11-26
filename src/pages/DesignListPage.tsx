import { useState } from "react";
import { useLocation } from "wouter";
import { IconAlertTriangle, IconFileDescription, IconSearch } from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import {
  Badge,
  Card as UICard,
  EmptyState,
  FilterField,
  Input as UIInput,
  Page,
  PageHeader,
  Pagination as UIPagination,
  RowIcon,
  TableCard,
} from "@rymel/ui";
import { nativeFieldClass } from "@components/ui/fieldClasses";
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

  const total = designs.data?.total ?? 0;

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Administración"
        title="Diseños"
        description={
          designs.data ? (
            <>
              <strong>
                {total} {total === 1 ? "diseño" : "diseños"}
              </strong>{" "}
              del cliente. Ábrelos para ver hojas, costos, versiones y lista de materiales.
            </>
          ) : (
            "Los diseños que crea el cliente: hojas, costos, versiones y lista de materiales."
          )
        }
      />

      <Page>
        <UICard as="div" aria-label="Filtros" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Buscar" className="sm:col-span-2">
            <UIInput
              value={filters.search ?? ""}
              onChange={(event) => setFilter("search", event.target.value)}
              onClear={() => setFilter("search", undefined)}
              placeholder="Código o nombre"
              aria-label="Código o nombre"
              leftIcon={<IconSearch className="h-[18px] w-[18px]" />}
            />
          </FilterField>
          <FilterField label="Referencia ERP">
            <UIInput
              mono
              value={filters.sapReference ?? ""}
              onChange={(event) => setFilter("sapReference", event.target.value)}
              placeholder="Del elemento"
            />
          </FilterField>
          <FilterField label="Norma">
            <select
              value={filters.normId ?? ""}
              onChange={(event) => setFilter("normId", Number(event.target.value))}
              className={nativeFieldClass}
            >
              <option value="">Todas las normas</option>
              {(options?.norms ?? []).map((norm) => (
                <option key={norm.id} value={norm.id}>
                  {norm.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="País">
            <select
              value={filters.countryId ?? ""}
              onChange={(event) => setFilter("countryId", Number(event.target.value))}
              className={nativeFieldClass}
            >
              <option value="">Todos los países</option>
              {(options?.countries ?? []).map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Tipo">
            <select
              value={filters.designTypeId ?? ""}
              onChange={(event) => {
                setFilter("designTypeId", Number(event.target.value));
                setFilter("designSubtypeId", undefined);
              }}
              className={nativeFieldClass}
            >
              <option value="">Todos los tipos</option>
              {(options?.designTypes ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Subtipo">
            <select
              value={filters.designSubtypeId ?? ""}
              onChange={(event) => setFilter("designSubtypeId", Number(event.target.value))}
              className={nativeFieldClass}
            >
              <option value="">Todos los subtipos</option>
              {subTypes.map((subType) => (
                <option key={subType.id} value={subType.id}>
                  {subType.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Desactualizado">
            <select
              value={triState(filters.stale)}
              onChange={(event) => setFilter("stale", fromTriState(event.target.value))}
              className={nativeFieldClass}
            >
              <option value="">Actualizados y desactualizados</option>
              <option value="true">Solo desactualizados</option>
              <option value="false">Solo actualizados</option>
            </select>
          </FilterField>
          <FilterField label="Lista de materiales">
            <select
              value={triState(filters.adjusted)}
              onChange={(event) => setFilter("adjusted", fromTriState(event.target.value))}
              className={nativeFieldClass}
            >
              <option value="">Con y sin lista ajustada</option>
              <option value="true">Con lista ajustada por el cliente</option>
              <option value="false">Sin lista ajustada</option>
            </select>
          </FilterField>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2 sm:col-span-2">
            <FilterField label="Fecha de">
              <select
                value={filters.dateField ?? "created"}
                onChange={(event) => setFilter("dateField", event.target.value as "created" | "updated")}
                className={nativeFieldClass}
              >
                <option value="created">Creado</option>
                <option value="updated">Actualizado</option>
              </select>
            </FilterField>
            <FilterField label="Desde">
              <input
                type="date"
                value={filters.from ?? ""}
                onChange={(event) => setFilter("from", event.target.value)}
                className={nativeFieldClass}
              />
            </FilterField>
            <FilterField label="Hasta">
              <input
                type="date"
                value={filters.to ?? ""}
                onChange={(event) => setFilter("to", event.target.value)}
                className={nativeFieldClass}
              />
            </FilterField>
          </div>
        </UICard>

        {designs.isLoading && <p className="text-sm text-gray-600">Cargando diseños…</p>}
        {designs.isError && <EmptyState tone="error" title="No se pudieron cargar los diseños." />}

        {designs.data &&
          (designs.data.data.length === 0 ? (
            <EmptyState title="Ningún diseño coincide con los filtros." />
          ) : (
            <TableCard
              aria-label="Resultados"
              footer={
                <UIPagination
                  page={filters.page}
                  totalPages={designs.data.totalPages}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                  totalItems={total}
                  pageSize={filters.limit}
                />
              }
            >
              <table className="rm-table" aria-label="Diseños">
                <thead>
                  <tr>
                    <th>Diseño</th>
                    <th>Tipo · subtipo</th>
                    <th>Norma · país</th>
                    <th>Elementos</th>
                    <th>Fechas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {designs.data.data.map((row) => (
                    <DesignRowView key={row.id} row={row} onOpen={() => navigate(`/designs/${row.id}`)} />
                  ))}
                </tbody>
              </table>
            </TableCard>
          ))}
      </Page>
    </Layout>
  );
};

const DesignRowView = ({ row, onOpen }: { row: DesignRow; onOpen: () => void }) => {
  const norms = [...new Set(row.elements.map((element) => element.norm?.name).filter(Boolean))];
  const countries = [...new Set(row.elements.map((element) => element.country?.name).filter(Boolean))];
  return (
    <tr className="cursor-pointer" onClick={onOpen}>
      <td>
        {/* Botón para llegar con el teclado; el clic lo atiende la fila */}
        <button
          type="button"
          className="flex cursor-pointer items-center gap-3.5 border-0 bg-transparent p-0 text-left"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <RowIcon>
            <IconFileDescription className="h-[18px] w-[18px]" />
          </RowIcon>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono font-bold text-gray-900">{row.code}</span>
            <span className="text-[13px] text-gray-600">{row.name}</span>
          </span>
        </button>
      </td>
      <td className="whitespace-nowrap">
        {row.designType?.name ?? "—"} · {row.designSubType?.name ?? "—"}
      </td>
      <td>
        <span className="font-semibold">{norms.join(", ") || "—"}</span>
        {countries.length > 0 && <div className="text-[13px] text-gray-600">{countries.join(", ")}</div>}
      </td>
      <td className="font-mono text-[12.5px] text-gray-600">
        {row.elements.map((element) => element.sapReference || "sin referencia").join(" · ") || "—"}
      </td>
      <td className="whitespace-nowrap text-[13px] text-gray-600">
        <div>Creado {formatDate(row.createdAt)}</div>
        <div>Actualizado {formatDate(row.updatedAt)}</div>
      </td>
      <td>
        <div className="flex flex-col items-start gap-1.5">
          {row.stale && (
            <Badge tone="danger" icon={<IconAlertTriangle className="h-3.5 w-3.5" />}>
              Desactualizado
            </Badge>
          )}
          {row.bomAdjustment && (
            <Badge tone="warning">
              Lista ajustada{row.bomAdjustment.updatedBy ? ` por ${row.bomAdjustment.updatedBy}` : ""}
            </Badge>
          )}
          {!row.stale && !row.bomAdjustment && <span className="text-gray-600">—</span>}
        </div>
      </td>
    </tr>
  );
};

export default DesignListPage;
