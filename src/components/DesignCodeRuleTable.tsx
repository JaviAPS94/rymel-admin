import type { ReactNode } from "react";
import { IconEdit, IconTrash } from "@tabler/icons-react";

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
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left py-3 px-4 font-semibold text-gray-700"
              >
                {column.label}
              </th>
            ))}
            <th className="text-right py-3 px-4 font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-8 text-gray-500"
              >
                Sin registros
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td key={column.key} className="py-3 px-4 text-gray-600">
                  {column.render ? column.render(row) : String(row[column.key])}
                </td>
              ))}
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {extraRowAction && extraRowAction.isVisible(row) && (
                    <button
                      onClick={() => extraRowAction.onClick(row)}
                      className="p-2 text-gray-600 hover:text-rymel-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title={extraRowAction.label}
                    >
                      <extraRowAction.icon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(row)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <IconEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
