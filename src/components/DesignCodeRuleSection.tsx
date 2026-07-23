import { useState } from "react";
import { IconPlus, IconStar } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/Card";
import {
  DesignCodeRuleFormModal,
  type RuleFieldConfig,
} from "@components/DesignCodeRuleFormModal";
import { DesignCodeRuleTable, type RuleColumn } from "@components/DesignCodeRuleTable";

interface RuleHooks {
  useList: () => {
    data?: Record<string, any>[];
    isLoading: boolean;
    error: unknown;
  };
  useCreate: () => {
    mutate: (data: any, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
  useUpdate: () => {
    mutate: (
      variables: { id: number; data: any },
      options?: { onSuccess?: () => void }
    ) => void;
    isPending: boolean;
  };
  useRemove: () => {
    mutate: (id: number, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
}

interface DesignCodeRuleSectionProps {
  title: string;
  description: string;
  newButtonLabel: string;
  fields: RuleFieldConfig[];
  columns: RuleColumn[];
  hooks: RuleHooks;
  /** Solo para el catálogo de formatos de sufijo: acción de "marcar como predeterminado". */
  markAsDefault?: {
    isDefault: (row: Record<string, any>) => boolean;
    confirmMessage: (row: Record<string, any>) => string;
  };
}

export const DesignCodeRuleSection = ({
  title,
  description,
  newButtonLabel,
  fields,
  columns,
  hooks,
  markAsDefault,
}: DesignCodeRuleSectionProps) => {
  const { data: rows, isLoading, error } = hooks.useList();
  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const removeMutation = hooks.useRemove();

  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | undefined>();
  const [rowToDelete, setRowToDelete] = useState<Record<string, any> | null>(null);
  const [rowToMarkDefault, setRowToMarkDefault] = useState<Record<string, any> | null>(
    null
  );

  const handleCreate = () => {
    setSelectedRow(undefined);
    setShowFormModal(true);
  };

  const handleEdit = (row: Record<string, any>) => {
    setSelectedRow(row);
    setShowFormModal(true);
  };

  const handleSubmit = (values: Record<string, any>) => {
    if (selectedRow) {
      updateMutation.mutate(
        { id: selectedRow.id, data: values },
        { onSuccess: () => setShowFormModal(false) }
      );
    } else {
      createMutation.mutate(values, { onSuccess: () => setShowFormModal(false) });
    }
  };

  const confirmDelete = () => {
    if (rowToDelete) {
      removeMutation.mutate(rowToDelete.id, {
        onSuccess: () => setRowToDelete(null),
      });
    }
  };

  const confirmMarkDefault = () => {
    if (rowToMarkDefault) {
      updateMutation.mutate(
        { id: rowToMarkDefault.id, data: { isDefault: true } },
        { onSuccess: () => setRowToMarkDefault(null) }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <IconPlus className="h-4 w-4 mr-2" />
            {newButtonLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {Boolean(error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error al cargar las reglas
          </div>
        )}

        <DesignCodeRuleTable
          columns={columns}
          rows={rows || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={setRowToDelete}
          extraRowAction={
            markAsDefault
              ? {
                  label: "Marcar como predeterminado",
                  icon: IconStar,
                  isVisible: (row) => !markAsDefault.isDefault(row),
                  onClick: setRowToMarkDefault,
                }
              : undefined
          }
        />
      </CardContent>

      {showFormModal && (
        <DesignCodeRuleFormModal
          title={selectedRow ? `Editar ${title}` : `Nueva regla: ${title}`}
          fields={fields}
          initialValues={selectedRow}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {rowToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setRowToDelete(null)}
          title="Eliminar regla"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar esta regla? Esta acción no
              afecta los códigos de diseño ya generados.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRowToDelete(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmDelete}
                isLoading={removeMutation.isPending}
                className="flex-1"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {rowToMarkDefault && markAsDefault && (
        <Modal
          isOpen={true}
          onClose={() => setRowToMarkDefault(null)}
          title="Marcar como predeterminado"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              {markAsDefault.confirmMessage(rowToMarkDefault)}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRowToMarkDefault(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmMarkDefault}
                isLoading={updateMutation.isPending}
                className="flex-1"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
