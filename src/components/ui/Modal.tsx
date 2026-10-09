import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "3xl" | "5xl";
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

/**
 * Open modals, innermost last: Escape closes only the one on top (a picker
 * opened from the template menu, say), not every modal underneath.
 */
const openModals: symbol[] = [];

/**
 * A modal taller than the screen scrolls with the page behind it instead of
 * being cut off: before, a long import preview pushed the title and the close
 * button above the top of the screen, with no way to reach them. The header
 * stays stuck to the top while scrolling. The body itself does not scroll, so
 * the dropdowns inside it are not clipped.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) => {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol("modal");
    openModals.push(token);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || openModals[openModals.length - 1] !== token) return;
      // Someone inside already used it (closing an autocomplete in the
      // formula editor): closing the modal too would lose unsaved work
      if (event.defaultPrevented) return;
      event.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openModals.splice(openModals.indexOf(token), 1);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" data-modal-overlay>
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`bg-white rounded-xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-xl border-b bg-white p-6">
            <h2 id={titleId} className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                aria-label="Cerrar"
              >
                <IconX className="h-6 w-6" />
              </button>
            )}
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
