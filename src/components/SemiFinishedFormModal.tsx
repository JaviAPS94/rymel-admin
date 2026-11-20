import { useState, type FormEvent } from 'react';
import { IconCode, IconTag } from '@tabler/icons-react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { useCreateSemiFinished, useUpdateSemiFinished } from '@hooks/useSemiFinished';
import { apiErrorMessage } from '@hooks/usePhantomProcesses';
import type { SemiFinished } from '@/types/bom.types';

interface SemiFinishedFormModalProps {
  /** Ausente al crear. */
  semiFinished?: SemiFinished;
  onClose: () => void;
}

const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

export const SemiFinishedFormModal = ({ semiFinished, onClose }: SemiFinishedFormModalProps) => {
  const createMutation = useCreateSemiFinished();
  const updateMutation = useUpdateSemiFinished();
  const isEditing = !!semiFinished;

  const [formData, setFormData] = useState({
    code: semiFinished?.code ?? '',
    name: semiFinished?.name ?? '',
  });
  const [errors, setErrors] = useState<{ code?: string; name?: string; form?: string }>({});

  const handleError = (error: unknown) => {
    const fallback = isEditing
      ? 'Error al actualizar el semielaborado'
      : 'Error al crear el semielaborado';
    const message = apiErrorMessage(error, fallback);
    setErrors(statusOf(error) === 409 ? { code: message } : { form: message });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const data = { code: formData.code.trim(), name: formData.name.trim() };
    const newErrors: typeof errors = {};
    if (!data.code) newErrors.code = 'El código es requerido';
    if (!data.name) newErrors.name = 'El nombre es requerido';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const options = { onSuccess: onClose, onError: handleError };
    if (semiFinished) {
      updateMutation.mutate({ id: semiFinished.id, data }, options);
    } else {
      createMutation.mutate(data, options);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Editar semielaborado' : 'Nuevo semielaborado'}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label
            htmlFor="semi-finished-code"
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <IconCode className="h-4 w-4" />
            Código
          </label>
          <Input
            id="semi-finished-code"
            placeholder="Ej: 123JR5"
            value={formData.code}
            maxLength={255}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            error={errors.code}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="semi-finished-name"
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <IconTag className="h-4 w-4" />
            Nombre
          </label>
          <Input
            id="semi-finished-name"
            placeholder="Ej: Bobina"
            value={formData.name}
            maxLength={255}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
        </div>

        {isEditing && (
          <p className="text-xs text-gray-500">
            Las plantillas y normas ya guardadas conservan el código y el nombre
            con que se guardaron.
          </p>
        )}

        {errors.form && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
          >
            {errors.form}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
