import { type ReactNode } from "react";
import { Modal as UIModal } from "@rymel/ui";

/**
 * Adaptador del `Modal` de @rymel/ui con la API del admin. El comportamiento
 * (pila de Esc, Esc ya usado dentro, fondo desplazable con cabecera fija)
 * vive en el paquete; `Modal.spec.tsx` lo fija para el admin.
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "3xl" | "5xl";
  showCloseButton?: boolean;
}

// Anchos del admin → tamaños del sistema (md: 576 px, lg: 768 px, xl: 1120 px).
const SIZES = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "md",
  "3xl": "lg",
  "5xl": "xl",
} as const;

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) => (
  <UIModal
    open={isOpen}
    onClose={onClose}
    title={title}
    size={SIZES[maxWidth]}
    showCloseButton={showCloseButton}
    // El modal del admin nunca se cerró al pulsar fuera: se conserva.
    dismissable={false}
  >
    {children}
  </UIModal>
);
