import { cn } from "@utils/cn";
import type { PhantomProcess } from "@/types/phantom-item.types";

interface ProcessTabsProps {
  processes: PhantomProcess[];
  selectedId: number;
  onSelect: (id: number) => void;
}

/** One tab per process, in its order, like the sheets of the workbook */
export const ProcessTabs = ({ processes, selectedId, onSelect }: ProcessTabsProps) => (
  <div role="tablist" aria-label="Procesos" className="flex gap-1 overflow-x-auto border-b border-gray-200 px-5">
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
            "flex h-[60px] cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-[3px] border-solid bg-transparent px-4 text-[15px] transition-colors",
            selected
              ? "border-rymel-blue font-bold text-rymel-blue"
              : "border-transparent font-semibold text-gray-600 hover:text-gray-900",
          )}
        >
          {process.name}
          <span
            className={cn(
              "rounded-full px-2 py-px text-xs font-bold",
              selected ? "bg-rymel-soft text-rymel-indigo" : "bg-gray-100 text-gray-700",
            )}
          >
            {process.phantomItemsCount}
          </span>
        </button>
      );
    })}
  </div>
);
