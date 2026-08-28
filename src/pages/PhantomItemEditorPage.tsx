import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { IconArrowLeft, IconAlertTriangle, IconDeviceFloppy } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Layout } from "@components/Layout";
import { PhantomItemHeaderForm } from "@components/phantom-item/PhantomItemHeaderForm";
import { PhantomItemGrid, type GridSelection } from "@components/phantom-item/PhantomItemGrid";
import { FormulaBar } from "@components/phantom-item/FormulaBar";
import { COLUMNS, getColumnByLetter } from "@components/phantom-item/columns";

/** Columnas del componente distintas de M: si alguna tiene algo, la fila se quiso usar. */
const COMPONENT_LETTERS = COLUMNS.filter(
  (column) => column.scope === "component" && column.letter !== "M",
).map((column) => column.letter);
import { usePhantomItemGrid, type UsePhantomItemGridResult } from "@hooks/usePhantomItemGrid";
import { usePhantomItem, useCreatePhantomItem, useUpdatePhantomItem } from "@hooks/usePhantomItems";
import { useAuthStore } from "@store/authStore";
import { Role } from "@/types/user.types";
import type { CreatePhantomItemDto, PhantomItemDetail } from "@/types/phantom-item.types";

const HEADER_FORMULA_LETTERS: Record<string, string> = {
  F: "reference",
  H: "itemDescription",
  J: "shortDescription",
};

const buildSavePayload = (grid: UsePhantomItemGridResult): CreatePhantomItemDto => {
  const formulaOverrides: Record<string, string> = {};

  const dto: CreatePhantomItemDto = {
    finishedProductType: String(grid.getCell("A", 1).computed ?? ""),
    workInProcessType: String(grid.getCell("B", 1).computed ?? ""),
    phantomRootCode: String(grid.getCell("C", 1).computed ?? ""),
    kvaRatingStandard: String(grid.getCell("D", 1).computed ?? ""),
    itemCode: String(grid.getCell("E", 1).computed ?? ""),
    unitOfMeasure: String(grid.getCell("L", 1).computed ?? ""),
    reference: String(grid.getCell("F", 1).computed ?? ""),
    itemDescription: String(grid.getCell("H", 1).computed ?? ""),
    shortDescription: String(grid.getCell("J", 1).computed ?? ""),
    referenceLengthLimit: grid.referenceLengthLimit,
    components: [],
  };

  Object.entries(HEADER_FORMULA_LETTERS).forEach(([letter, field]) => {
    if (grid.hasOwnFormula(letter, 1)) {
      formulaOverrides[field] = grid.getCell(letter, 1).formula;
    }
  });
  dto.formulaOverrides = formulaOverrides;

  const componentColumns = COLUMNS.filter((c) => c.scope === "component");

  dto.components = Array.from({ length: grid.rowCount }, (_, i) => i + 1)
    .map((row) => {
      // Una fila sin código de componente no se envía: la columna es la
      // identidad del componente y el servidor la exige. `rowsWithoutItemCode`
      // impide llegar hasta aquí con filas así, para que descartarlas nunca
      // sea silencioso.
      const componentItemCode = String(grid.getCell("M", row).computed ?? "").trim();
      if (!componentItemCode) return null;

      const componentFormulaOverrides: Record<string, string> = {};
      componentColumns.forEach((column) => {
        if (column.defaultFormula && grid.hasOwnFormula(column.letter, row)) {
          componentFormulaOverrides[column.field] = grid.getCell(column.letter, row).formula;
        }
      });

      return {
        componentItemCode,
        description: String(grid.getCell("N", row).computed ?? "") || undefined,
        baseQuantity: Number(grid.getCell("O", row).computed) || 0,
        requiredQuantity: Number(grid.getCell("P", row).computed) || 0,
        requiredQuantityPerUnit: Number(grid.getCell("Q", row).computed) || undefined,
        componentUnitOfMeasure: String(grid.getCell("R", row).computed ?? "") || undefined,
        wastePercentage: Number(grid.getCell("S", row).computed) || undefined,
        consumptionWarehouse: String(grid.getCell("T", row).computed ?? "") || undefined,
        formulaOverrides: componentFormulaOverrides,
      };
    })
    .filter((component): component is NonNullable<typeof component> => component !== null);

  return dto;
};

const extractValidationErrors = (error: unknown): string[] => {
  const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } })
    ?.response;
  const errors = response?.data?.errors;
  if (!errors) return [];
  return Object.entries(errors).map(([field, messages]) => {
    const label = getColumnByLetter(field)?.header ?? field;
    return `${label}: ${messages.join(" ")}`;
  });
};

interface PhantomItemEditorContentProps {
  detail?: PhantomItemDetail;
  onSaved: (id: number) => void;
}

const PhantomItemEditorContent = ({ detail, onSaved }: PhantomItemEditorContentProps) => {
  const grid = usePhantomItemGrid(detail);
  const [selected, setSelected] = useState<GridSelection | null>({ letter: "A", row: 1 });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes(Role.ADMIN);

  const createMutation = useCreatePhantomItem();
  const updateMutation = useUpdatePhantomItem();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!grid.isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [grid.isDirty]);

  const hasOutOfLimitRows = Array.from({ length: grid.rowCount }, (_, i) => i + 1).some(
    (row) => grid.isOverLimit("G", row) || grid.isOverLimit("I", row) || grid.isOverLimit("K", row),
  );

  /**
   * Filas que no se guardarían por no tener «ÍTEM - COMPONENTE».
   *
   * Antes se descartaban en silencio: se agregaba un componente, se pulsaba
   * «Guardar», el editor decía que todo había ido bien y al volver a entrar no
   * estaba. Se comprueba antes de enviar y se dice qué fila falta.
   *
   * Una única fila entera en blanco no cuenta: es la fila vacía con la que
   * empieza un fantasma sin componentes, y no es un olvido de nadie.
   */
  const rowsWithoutItemCode = Array.from(
    { length: grid.rowCount },
    (_, i) => i + 1,
  ).filter((row) => {
    if (String(grid.getCell("M", row).computed ?? "").trim() !== "") return false;
    return COMPONENT_LETTERS.some(
      (letter) => String(grid.getCell(letter, row).computed ?? "").trim() !== "",
    );
  });

  const handleSave = async () => {
    setValidationErrors([]);

    if (rowsWithoutItemCode.length > 0) {
      setValidationErrors([
        `Falta «ÍTEM - COMPONENTE» en ${
          rowsWithoutItemCode.length === 1 ? "la fila" : "las filas"
        } ${rowsWithoutItemCode.join(", ")}. Sin ese código el componente no se ` +
          "puede guardar.",
      ]);
      return;
    }

    const payload = buildSavePayload(grid);

    try {
      if (detail) {
        await updateMutation.mutateAsync({ id: detail.id, data: payload });
        grid.markSaved();
        onSaved(detail.id);
      } else {
        const created = await createMutation.mutateAsync(payload);
        grid.markSaved();
        onSaved(created.id);
      }
    } catch (error) {
      setValidationErrors(extractValidationErrors(error));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cabecera</CardTitle>
        </CardHeader>
        <CardContent>
          <PhantomItemHeaderForm grid={grid} />
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm space-y-1">
          {validationErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Componentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormulaBar grid={grid} selected={selected} />
          <PhantomItemGrid grid={grid} selected={selected} onSelect={setSelected} readOnly={!isAdmin} />
        </CardContent>
      </Card>

      {isAdmin && (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {grid.isDirty && <span className="text-amber-600">Cambios sin guardar</span>}
            {hasOutOfLimitRows && (
              <span className="flex items-center gap-1 text-red-600 mt-1">
                <IconAlertTriangle className="h-4 w-4" />
                Hay filas con longitudes fuera de límite
              </span>
            )}
          </div>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            <IconDeviceFloppy className="h-5 w-5 mr-2" />
            Guardar
          </Button>
        </div>
      )}
    </div>
  );
};

export const PhantomItemEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = id === "new";

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes(Role.ADMIN);

  const { data: detail, isLoading, error } = usePhantomItem(isNew ? 0 : Number(id));

  useEffect(() => {
    if (isNew && !isAdmin) navigate("/phantom-items", { replace: true });
  }, [isNew, isAdmin, navigate]);

  const handleBack = () => {
    navigate("/phantom-items");
  };

  const handleSaved = (savedId: number) => {
    if (isNew) navigate(`/phantom-items/${savedId}`, { replace: true });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-rymel-blue hover:bg-blue-50 rounded-lg transition-colors"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "Nuevo fantasma" : `Fantasma ${detail?.itemCode ?? ""}`}
          </h1>
        </div>

        {!isNew && isLoading && (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        )}

        {!isNew && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error al cargar el fantasma
          </div>
        )}

        {((isNew && isAdmin) || (!isNew && !isLoading && !error && detail)) && (
          <PhantomItemEditorContent detail={isNew ? undefined : detail} onSaved={handleSaved} />
        )}
      </div>
    </Layout>
  );
};
