import { useState } from "react";
import { toast } from "sonner";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Select } from "@components/ui/Select";
import { useImportPhantomItems } from "@hooks/usePhantomItems";
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

  const allIssues = preview ? [...preview.errors, ...preview.warnings] : [];

  return (
    <Modal isOpen={true} onClose={onClose} title="Importar fantasmas" maxWidth="lg">
      <div className="space-y-5">
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
            onChange={(value) => setMode(value as PhantomItemImportMode)}
            options={MODE_OPTIONS}
          />
        </div>

        {blockingError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <IconAlertTriangle className="h-5 w-5 shrink-0" />
            <span>{blockingError}</span>
          </div>
        )}

        {preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <IconCheck className="h-5 w-5 shrink-0" />
              <span>
                Se crearían <strong>{preview.created}</strong> y se actualizarían{" "}
                <strong>{preview.updated}</strong> fantasmas ({preview.rowsRead} filas
                leídas, {preview.phantomItemsDetected} ítems detectados).
              </span>
            </div>

            {allIssues.length > 0 && (
              <div className="max-h-48 overflow-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Fila</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Columna</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allIssues.map((issue, index) => (
                      <tr key={index} className="border-t border-gray-100">
                        <td className="py-2 px-3 text-gray-700">{issue.row}</td>
                        <td className="py-2 px-3 text-gray-500">{issue.column ?? "-"}</td>
                        <td className="py-2 px-3 text-gray-700">{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
