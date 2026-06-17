import { useState, type FormEvent } from 'react';
import { IconCode, IconTag } from '@tabler/icons-react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { useCreateBom, useUpdateBom } from '@hooks/useBom';
import type { BomListItem, CreateBomDto, UpdateBomDto } from '@/types/bom.types';

interface BomFormModalProps {
  bom?: BomListItem;
  onClose: () => void;
}

export const BomFormModal = ({ bom, onClose }: BomFormModalProps) => {
  const createMutation = useCreateBom();
  const updateMutation = useUpdateBom();

  const [formData, setFormData] = useState({
    code: bom?.code ?? '',
    name: bom?.name ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = 'El código es requerido';
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (bom) {
      const data: UpdateBomDto = { code: formData.code, name: formData.name };
      updateMutation.mutate({ id: bom.id, data }, { onSuccess: () => onClose() });
    } else {
      const data: CreateBomDto = { code: formData.code, name: formData.name };
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={bom ? 'Editar BOM' : 'Nuevo BOM'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <IconCode className="h-4 w-4" />
            Código
          </label>
          <Input
            placeholder="Ej: PT: 1FCV/AU/CM/TC/AF"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            error={errors.code}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <IconTag className="h-4 w-4" />
            Nombre
          </label>
          <Input
            placeholder="Ej: Estructura principal vehículo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            {bom ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
