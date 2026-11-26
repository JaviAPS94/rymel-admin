import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Button as UIButton, type ButtonVariant } from "@rymel/ui";

/**
 * Adaptador del `Button` de @rymel/ui con la API del admin. Para código nuevo
 * usa `Button` de `@rymel/ui` (variantes `primary`, `accent`, `secondary`,
 * `ghost`, `danger` y las claras para la banda índigo).
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

// El `secondary` del admin era el amarillo de marca (`accent` en el sistema);
// el `outline`, la acción secundaria con borde.
const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, ButtonVariant> = {
  primary: "primary",
  secondary: "accent",
  outline: "secondary",
  ghost: "ghost",
  danger: "danger",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, type = "button", ...props }, ref) => (
    <UIButton
      ref={ref}
      type={type}
      variant={VARIANTS[variant]}
      size={size}
      loading={isLoading}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button };
