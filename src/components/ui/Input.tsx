import { forwardRef, type InputHTMLAttributes } from "react";
import { Input as UIInput } from "@rymel/ui";

/**
 * Adaptador del `Input` de @rymel/ui con la API del admin: `error` muestra el
 * mensaje bajo el campo. Para código nuevo usa `Field` + `Input` de `@rymel/ui`.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: string;
  /** `lg`: 50 px de alto (login, buscadores principales). */
  size?: "md" | "lg";
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ error, className, ...props }, ref) => (
  <div className="w-full">
    <UIInput ref={ref} invalid={Boolean(error)} className={className} {...props} />
    {error && (
      <p role="alert" className="mt-1 text-[13px] text-danger">
        {error}
      </p>
    )}
  </div>
));

Input.displayName = "Input";

export { Input };
