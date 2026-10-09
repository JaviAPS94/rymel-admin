import { useState } from "react";
import { toast } from "sonner";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { usePastePhantomItems } from "@hooks/usePhantomItems";
import { apiErrorMessage } from "@hooks/usePhantomProcesses";
import { ImportPreview } from "./ImportPreview";
import { FAMILY_HEADER } from "./processColumns";
import {
  PhantomItemImportMode,
  type ImportResult,
  type PhantomProcess,
} from "@/types/phantom-item.types";

interface PhantomItemPasteModalProps {
  process: PhantomProcess;
  onClose: () => void;
}

const MODE_OPTIONS = [
  { value: PhantomItemImportMode.CREATE, label: "Crear (omite ítems existentes)" },
  { value: PhantomItemImportMode.UPSERT, label: "Actualizar (reemplaza componentes)" },
];

/**
 * Rows copied from the process's sheet in Excel, pasted as they are. They go
 * through the same grouping, validation and preview as a workbook.
 */
export const PhantomItemPasteModal = ({ process, onClose }: PhantomItemPasteModalProps) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<PhantomItemImportMode>(PhantomItemImportMode.CREATE);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const paste = usePastePhantomItems();

  const expectedHeaders = [FAMILY_HEADER, ...process.columns.map((column) => column.header)];

  const reset = () => {
    setPreview(null);
    setBlockingError(null);
  };

  const run = async (dryRun: boolean) => {
    setBlockingError(null);
    try {
      const result = await paste.mutateAsync({ processId: process.id, text, mode, dryRun });
      if (dryRun) {
        setPreview(result);
      } else {
        onClose();
      }
    } catch (error) {
      const message = apiErrorMessage(error, "No se pudieron leer las filas pegadas.");
      if (dryRun) {
        setPreview(null);
        setBlockingError(message);
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Pegar en ${process.name}`} maxWidth="5xl">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>
            Copia las filas en Excel y pégalas aquí. Si no incluyes el encabezado, las columnas se
            leen en este orden:
          </p>
          <div className="mt-2 flex flex-wrap gap-1" aria-label="Orden de columnas">
            {expectedHeaders.map((header, index) => (
              <span key={header} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {index + 1}. {header}
              </span>
            ))}
          </div>
        </div>

        <textarea
          aria-label="Filas copiadas de Excel"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            reset();
          }}
          rows={10}
          spellCheck={false}
          placeholder="Pega aquí (Ctrl+V)"
          className="w-full whitespace-pre rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-rymel-blue"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Modo</label>
          <Select
            value={mode}
            onChange={(value) => {
              setMode(value as PhantomItemImportMode);
              reset();
            }}
            options={MODE_OPTIONS}
          />
        </div>

        {blockingError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <IconAlertTriangle className="h-5 w-5 shrink-0" />
            <span>{blockingError}</span>
          </div>
        )}

        {preview && <ImportPreview result={preview} />}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          {!preview ? (
            <Button
              variant="outline"
              onClick={() => run(true)}
              disabled={!text.trim()}
              isLoading={paste.isPending}
              className="flex-1"
            >
              Previsualizar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => run(false)}
              disabled={preview.created + preview.updated === 0}
              isLoading={paste.isPending}
              className="flex-1"
            >
              Confirmar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
