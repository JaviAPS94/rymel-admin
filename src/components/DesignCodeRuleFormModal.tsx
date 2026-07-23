import { useState, type FormEvent } from "react";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";

export interface RuleFieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  options?: { value: string; label: string }[];
}

interface DesignCodeRuleFormModalProps {
  title: string;
  fields: RuleFieldConfig[];
  initialValues?: Record<string, string | number | boolean>;
  isLoading: boolean;
  onSubmit: (values: Record<string, string | number | boolean>) => void;
  onClose: () => void;
}

export const DesignCodeRuleFormModal = ({
  title,
  fields,
  initialValues,
  isLoading,
  onSubmit,
  onClose,
}: DesignCodeRuleFormModalProps) => {
  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    () => {
      const defaults: Record<string, string | number | boolean> = {};
      fields.forEach((field) => {
        if (initialValues && field.key in initialValues) {
          defaults[field.key] = initialValues[field.key];
        } else {
          defaults[field.key] = field.type === "checkbox" ? false : "";
        }
      });
      return defaults;
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.type === "checkbox") return;
      const value = values[field.key];
      if (value === "" || value === undefined || value === null) {
        newErrors[field.key] = "Este campo es requerido";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Record<string, string | number | boolean> = {};
    fields.forEach((field) => {
      payload[field.key] =
        field.type === "number" ? Number(values[field.key]) : values[field.key];
    });

    onSubmit(payload);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            {field.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.key])}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-rymel-blue focus:ring-rymel-blue"
                />
                {field.label}
              </label>
            ) : (
              <>
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <Select
                    value={String(values[field.key] ?? "")}
                    onChange={(value) =>
                      setValues({ ...values, [field.key]: value })
                    }
                    options={field.options || []}
                    error={errors[field.key]}
                  />
                ) : (
                  <Input
                    type={field.type === "number" ? "number" : "text"}
                    step={field.type === "number" ? "any" : undefined}
                    value={values[field.key] as string | number}
                    onChange={(e) =>
                      setValues({ ...values, [field.key]: e.target.value })
                    }
                    error={errors[field.key]}
                  />
                )}
              </>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
