import { useState } from "react";
import { IconClipboardList } from "@tabler/icons-react";
import {
  bomBaseSheet,
  buildBomBaseSheet,
  type TemplateDocument,
  type TemplateSheet,
} from "@rymel/design-template";
import { Button } from "@components/ui/Button";
import { useBoms } from "@hooks/useBom";
import { bomService } from "@services/bomService";

interface Props {
  document: TemplateDocument;
  /** Pone o reemplaza la hoja base en el documento. */
  onSetBomSheet: (sheet: TemplateSheet) => void;
  /** Ir a la hoja base. */
  onOpenSheet: (name: string) => void;
}

/**
 * La lista de materiales base de la plantilla.
 *
 * Se genera desde una estructura BOM y lo que la plantilla vincula —zonas de
 * semielaborado, tablas de catálogo e ítems—, en una hoja «Lista de
 * materiales» que se edita como cualquier otra y se publica con la
 * plantilla. Los accesorios no van aquí: los suma la norma del elemento
 * cuando el cliente crea el diseño.
 */
export const BomBasePanel = ({ document, onSetBomSheet, onOpenSheet }: Props) => {
  const current = bomBaseSheet(document.sheets);
  const marker = current?.styles.billOfMaterials;
  const boms = useBoms(1, 200);
  const [structureId, setStructureId] = useState<number | "">(marker?.structureId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (structureId === "") return;
    if (
      current &&
      !window.confirm(
        `Se vuelve a armar «${current.name}» desde la estructura y la configuración actuales, y se pierde lo editado a mano en ella. ¿Continuar?`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const structure = await bomService.getBom(structureId);
      const others = document.sheets.filter((sheet) => sheet !== current);
      onSetBomSheet(buildBomBaseSheet(structure, others));
    } catch {
      setError("No se pudo cargar la estructura BOM.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-gray-900">
        <IconClipboardList className="h-4 w-4 text-rymel-blue" />
        Lista de materiales
      </div>
      <p className="text-xs text-gray-500">
        Se genera con la estructura que elijas y los ítems que la plantilla vincula en sus zonas
        de semielaborado. Cantidad, descripción y unidad apuntan a las celdas de la plantilla, así
        que cada diseño las calcula con sus valores. Al crear el diseño se le suman los accesorios
        de la norma del elemento.
      </p>

      {current ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
          <div>
            Hoja <span className="font-medium">{current.name}</span>, desde la estructura{" "}
            <span className="font-mono">{marker?.structureCode}</span> ({marker?.structureName}).
          </div>
          <button className="mt-1 text-rymel-blue hover:underline" onClick={() => onOpenSheet(current.name)}>
            Ir a la hoja
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-500">La plantilla todavía no tiene lista de materiales.</p>
      )}

      <label className="space-y-1">
        <span className="text-xs font-medium text-gray-700">Estructura BOM</span>
        <select
          value={structureId}
          onChange={(event) => setStructureId(event.target.value === "" ? "" : Number(event.target.value))}
          aria-label="Estructura BOM"
          className="h-9 w-full rounded border border-gray-300 px-2 text-sm"
        >
          <option value="">Elige una estructura</option>
          {(boms.data?.data ?? []).map((bom) => (
            <option key={bom.id} value={bom.id}>
              {bom.code} · {bom.name}
            </option>
          ))}
        </select>
      </label>
      {boms.isError && <p className="text-xs text-red-600">No se pudieron cargar las estructuras.</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button size="sm" disabled={structureId === "" || pending} onClick={() => void generate()}>
        {pending ? "Generando…" : current ? "Regenerar lista de materiales" : "Generar lista de materiales"}
      </Button>
      {current && (
        <p className="text-xs text-gray-500">
          Regenerar descarta lo editado a mano en la hoja. Para ajustes puntuales, edita la hoja
          directamente.
        </p>
      )}
    </div>
  );
};
