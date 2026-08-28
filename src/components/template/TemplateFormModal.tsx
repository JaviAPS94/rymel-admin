import { useState } from "react";
import { Button } from "@components/ui/Button";
import { subTypeLabel } from "@services/designFunctionService";
import { useDesignSubTypes } from "@hooks/useDesignFunctions";
import { TemplateType, type TemplateListItem } from "@/types/template.types";

export interface TemplateFormValues {
  name: string;
  code: string;
  description?: string;
  type: TemplateType;
  designSubTypeId: number;
}

interface Props {
  /** La plantilla que se está editando, o la que se está duplicando. */
  template?: TemplateListItem;
  mode: "create" | "edit" | "duplicate";
  onCancel: () => void;
  onSubmit: (values: TemplateFormValues) => void;
  isPending: boolean;
}

const TITLES: Record<Props["mode"], string> = {
  create: "Nueva plantilla",
  edit: "Editar plantilla",
  duplicate: "Duplicar plantilla",
};

/**
 * Alta, metadatos y duplicación.
 *
 * Duplicar exige un código nuevo y deja cambiar el subtipo. Cambiarlo puede
 * dejar inválidas las fórmulas de diseño que la plantilla invoca —están
 * asignadas por subtipo—, así que se avisa aquí en vez de dejar que el autor
 * lo descubra al publicar.
 */
export const TemplateFormModal = ({
  template,
  mode,
  onCancel,
  onSubmit,
  isPending,
}: Props) => {
  const subTypes = useDesignSubTypes();

  const [name, setName] = useState(
    mode === "duplicate" ? `${template?.name ?? ""} (copia)` : (template?.name ?? ""),
  );
  const [code, setCode] = useState(mode === "edit" ? (template?.code ?? "") : "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [type, setType] = useState<TemplateType>(
    template?.type ?? TemplateType.DESIGN,
  );
  const [designSubTypeId, setDesignSubTypeId] = useState<number | "">(
    template?.designSubTypeId ?? "",
  );

  const subTypeChanged =
    mode === "duplicate" &&
    designSubTypeId !== "" &&
    designSubTypeId !== template?.designSubTypeId;

  const canSubmit =
    name.trim() !== "" && code.trim() !== "" && designSubTypeId !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">{TITLES[mode]}</h3>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Código</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="TEMPLATE_1F_0002"
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 font-mono text-sm focus:border-rymel-blue focus:outline-none"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Único entre las plantillas activas.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Descripción
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as TemplateType)}
                disabled={mode === "duplicate"}
                className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none disabled:bg-gray-50"
              >
                <option value={TemplateType.DESIGN}>Diseño</option>
                <option value={TemplateType.COST}>Costo</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Subtipo</span>
              <select
                value={designSubTypeId}
                onChange={(event) =>
                  setDesignSubTypeId(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                className="mt-1 h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
              >
                <option value="">Elegir…</option>
                {(subTypes.data ?? []).map((subType) => (
                  <option key={subType.id} value={subType.id}>
                    {subTypeLabel(subType)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {subTypeChanged && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              Cambias de subtipo. Las fórmulas de diseño se asignan por subtipo,
              así que la copia puede quedar con invocaciones no disponibles; la
              validación las señalará al abrirla.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit || isPending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                code: code.trim(),
                description: description.trim() || undefined,
                type,
                designSubTypeId: designSubTypeId as number,
              })
            }
          >
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
};
