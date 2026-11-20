import type { ReactNode } from "react";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { IconButton } from "@rymel/ui";

export interface RuleColumn {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => ReactNode;
}

interface DesignCodeRuleTableProps {
  columns: RuleColumn[];
  rows: Record<string, any>[];
  isLoading: boolean;
  onEdit: (row: Record<string, any>) => void;
  onDelete: (row: Record<string, any>) => void;
  extraRowAction?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isVisible: (row: Record<string, any>) => boolean;
    onClick: (row: Record<string, any>) => void;
  };
}

export const DesignCodeRuleTable = ({
  columns,
  rows,
  isLoading,
  onEdit,
  onDelete,
  extraRowAction,
}: DesignCodeRuleTableProps) => {
  if (isLoading) {
    return (
      <p className="m-0 px-5 py-8 text-sm text-gray-600 sm:px-8">Cargando…</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="rm-table min-w-[560px]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="py-8 text-center text-gray-600">
                Sin registros
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : String(row[column.key])}
                </td>
              ))}
              <td data-align="right">
                <div className="flex items-center justify-end gap-2">
                  {extraRowAction && extraRowAction.isVisible(row) && (
                    <IconButton label={extraRowAction.label} onClick={() => extraRowAction.onClick(row)}>
                      <extraRowAction.icon className="h-[18px] w-[18px]" />
                    </IconButton>
                  )}
                  <IconButton label="Editar" onClick={() => onEdit(row)}>
                    <IconEdit className="h-[18px] w-[18px]" />
                  </IconButton>
                  <IconButton label="Eliminar" tone="danger" onClick={() => onDelete(row)}>
                    <IconTrash className="h-[18px] w-[18px]" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
