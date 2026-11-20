import { useEffect, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { cx, fieldBoxClass } from "@rymel/ui";

/**
 * Desplegable del admin con el aspecto de @rymel/ui.
 *
 * Conserva su mecánica (un botón con el valor elegido que abre una lista de
 * botones): las pruebas de Fantasmas eligen proceso y familia así. Para código
 * nuevo con búsqueda y teclado usa `Select` de `@rymel/ui`.
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  error,
  className,
  disabled = false,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Cierra la lista sin cerrar el modal que la contenga.
      event.preventDefault();
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="w-full" ref={selectRef}>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cx(
            fieldBoxClass(Boolean(error)),
            "justify-between text-left text-[15px] outline-none",
            disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : "cursor-pointer",
            className,
          )}
        >
          <span className={cx("truncate", selectedOption ? "text-gray-900" : "text-gray-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <IconChevronDown
            aria-hidden="true"
            className={cx(
              "h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white p-1.5 shadow-menu">
            <div className="max-h-64 overflow-auto">
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cx(
                      "flex w-full cursor-pointer items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-rymel-tint font-bold text-rymel-blue"
                        : "text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    <span>{option.label}</span>
                    {selected && <IconCheck aria-hidden="true" className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
};
