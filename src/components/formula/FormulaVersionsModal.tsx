import { IconHistory, IconRotateClockwise } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import {
  useDesignFunctionVersions,
  useRestoreVersion,
} from "@hooks/useDesignFunctions";

interface FormulaVersionsModalProps {
  isOpen: boolean;
  functionId: number | null;
  functionName: string;
  onClose: () => void;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });

/**
 * Historial de versiones.
 *
 * Restaurar **publica una versión nueva** con el contenido de la anterior en
 * vez de revertir el historial. Restaurar la 1 de una fórmula que va por la 3
 * produce una 4: así el historial sigue siendo un registro fiable de qué
 * estuvo vigente y cuándo, que es lo único que permite explicar el número que
 * tiene guardado un diseño.
 */
export const FormulaVersionsModal = ({
  isOpen,
  functionId,
  functionName,
  onClose,
}: FormulaVersionsModalProps) => {
  const versions = useDesignFunctionVersions(isOpen ? functionId : null);
  const restore = useRestoreVersion();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial · ${functionName}`}
      maxWidth="xl"
    >
      <div className="max-h-[60vh] overflow-y-auto p-6">
        {versions.isLoading && (
          <p className="text-sm text-gray-500">Cargando…</p>
        )}

        {versions.data?.length === 0 && (
          <p className="text-sm text-gray-500">Sin versiones registradas.</p>
        )}

        <ul className="space-y-3">
          {(versions.data ?? []).map((version) => (
            <li
              key={version.id}
              className={`rounded-lg border p-4 ${
                version.isCurrent
                  ? "border-rymel-blue bg-blue-50/50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <IconHistory className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      Versión {version.version}
                    </span>
                    {version.isCurrent && (
                      <span className="rounded-full bg-rymel-blue px-2 py-0.5 text-xs font-medium text-white">
                        vigente
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatDate(version.createdAt)}
                    {version.createdBy ? ` · ${version.createdBy}` : ""}
                  </p>
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    variables: {version.variables || "—"}
                    {Object.keys(version.constants).length > 0 &&
                      ` · constantes: ${Object.entries(version.constants)
                        .map(([name, value]) => `${name}=${value}`)
                        .join(", ")}`}
                  </p>
                </div>

                {!version.isCurrent && functionId !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={restore.isPending}
                    onClick={() =>
                      restore.mutate({
                        id: functionId,
                        version: version.version,
                      })
                    }
                  >
                    <IconRotateClockwise className="mr-1 h-4 w-4" />
                    Restaurar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-gray-500">
          Restaurar no borra nada: publica una versión nueva con el contenido de
          la elegida.
        </p>
      </div>
    </Modal>
  );
};
