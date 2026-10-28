import { cn } from "@utils/cn";
import type { PhantomProcess } from "@/types/phantom-item.types";

interface ProcessTabsProps {
  processes: PhantomProcess[];
  selectedId: number;
  onSelect: (id: number) => void;
}

/** One tab per process, in its order, like the sheets of the workbook */
export const ProcessTabs = ({ processes, selectedId, onSelect }: ProcessTabsProps) => (
  <div role="tablist" aria-label="Procesos" className="flex gap-1 overflow-x-auto border-b border-gray-200">
    {processes.map((process) => {
      const selected = process.id === selectedId;
      return (
        <button
          key={process.id}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onSelect(process.id)}
          className={cn(
            "whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            selected
              ? "border-rymel-blue text-rymel-blue"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
          )}
        >
          {process.name}
          <span
            className={cn(
              "ml-2 rounded-full px-2 py-0.5 text-xs",
              selected ? "bg-rymel-blue/10 text-rymel-blue" : "bg-gray-100 text-gray-500",
            )}
          >
            {process.phantomItemsCount}
          </span>
        </button>
      );
    })}
  </div>
);
