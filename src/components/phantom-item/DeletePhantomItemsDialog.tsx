import { IconAlertTriangle } from "@tabler/icons-react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";

interface DeletePhantomItemsDialogProps {
  /** Item codes of what is about to be deleted, to name it before confirming */
  itemCodes: string[];
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** How many item codes are named; past that, «y N más» */
const SHOWN = 12;

export const DeletePhantomItemsDialog = ({
  itemCodes,
  isDeleting,
  onConfirm,
  onClose,
}: DeletePhantomItemsDialogProps) => {
  const one = itemCodes.length === 1;
  const rest = itemCodes.length - SHOWN;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={one ? "Eliminar fantasma" : `Eliminar ${itemCodes.length} fantasmas`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <IconAlertTriangle className="h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <p>
              {one ? "Se elimina el fantasma" : "Se eliminan los fantasmas"}{" "}
              <strong>{itemCodes.slice(0, SHOWN).join(", ")}</strong>
              {rest > 0 && <> y {rest} más</>}, con todas sus líneas.
            </p>
            <p>
              Dejan de aparecer en el catálogo y en las exportaciones. Para recuperar uno, vuelve a
              importarlo desde el libro.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting} className="flex-1">
            {one ? "Eliminar" : `Eliminar ${itemCodes.length}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
