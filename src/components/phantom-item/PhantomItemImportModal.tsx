import { useState } from "react";
import { toast } from "sonner";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { useImportPhantomItems } from "@hooks/usePhantomItems";
import { ImportPreview } from "./ImportPreview";
import { PhantomItemImportMode, type ImportResult } from "@/types/phantom-item.types";

interface PhantomItemImportModalProps {
  onClose: () => void;
}

const MODE_OPTIONS = [
  { value: PhantomItemImportMode.CREATE, label: "Crear (omite ítems existentes)" },
  { value: PhantomItemImportMode.UPSERT, label: "Actualizar (reemplaza componentes)" },
];

const extractErrorMessage = (error: unknown): string => {
  const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } })
    ?.response;
  const errors = response?.data?.errors;
  if (errors) {
    return Object.values(errors).flat().join(" ");
  }
  return "No se pudo procesar el archivo.";
};

export const PhantomItemImportModal = ({ onClose }: PhantomItemImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<PhantomItemImportMode>(PhantomItemImportMode.CREATE);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const importMutation = useImportPhantomItems();

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setPreview(null);
    setBlockingError(null);
  };

  const handlePreview = async () => {
    if (!file) return;
    setBlockingError(null);
    try {
      const result = await importMutation.mutateAsync({ file, mode, dryRun: true });
      setPreview(result);
    } catch (error) {
      setPreview(null);
      setBlockingError(extractErrorMessage(error));
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    try {
      await importMutation.mutateAsync({ file, mode, dryRun: false });
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Importar libro de fantasmas" maxWidth="5xl">
      <div className="space-y-5">
        <p className="text-sm text-gray-500">
          Cada hoja visible va al proceso del mismo nombre; una hoja sin proceso crea uno nuevo con
          sus columnas. Puede ser el libro completo o solo las hojas y fantasmas que cambian: en
          modo «Actualizar» no se toca lo que no viene en el archivo.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archivo .xlsx
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-rymel-blue file:text-white file:text-sm hover:file:bg-rymel-blue/90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modo</label>
          <Select
            value={mode}
            onChange={(value) => {
              setMode(value as PhantomItemImportMode);
              setPreview(null);
            }}
            options={MODE_OPTIONS}
          />
        </div>

        {blockingError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <IconAlertTriangle className="h-5 w-5 shrink-0" />
            <span>{blockingError}</span>
          </div>
        )}

        {preview && <ImportPreview result={preview} bySheet />}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          {!preview ? (
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!file}
              isLoading={importMutation.isPending}
              className="flex-1"
            >
              Previsualizar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleConfirm}
              isLoading={importMutation.isPending}
              className="flex-1"
            >
              Confirmar importación
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
