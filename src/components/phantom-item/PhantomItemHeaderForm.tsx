import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import type { UsePhantomItemGridResult } from "@hooks/usePhantomItemGrid";

interface PhantomItemHeaderFormProps {
  grid: UsePhantomItemGridResult;
}

const REFERENCE_LIMIT_OPTIONS = [
  { value: "40", label: "40" },
  { value: "50", label: "50" },
];

/**
 * Plain-field editor for the header's non-derived columns (A, B, C, D, E,
 * L) plus the reference length limit. A convenience alternative to typing
 * directly into the grid's repeated header columns (tasks.md 11.1) — both
 * read from and write to the same row-1 cells, so they always agree.
 */
export const PhantomItemHeaderForm = ({ grid }: PhantomItemHeaderFormProps) => {
  const field = (letter: string) => grid.getCell(letter, 1).formula;
  const setField = (letter: string) => (value: string) => grid.setCellValue(letter, 1, value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo PT</label>
        <Input value={field("A")} onChange={(e) => setField("A")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo PP</label>
        <Input value={field("B")} onChange={(e) => setField("B")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Raíz Fantasma</label>
        <Input value={field("C")} onChange={(e) => setField("C")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          R kVA + Norma / Otros
        </label>
        <Input value={field("D")} onChange={(e) => setField("D")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Item (SAP)</label>
        <Input value={field("E")} onChange={(e) => setField("E")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">UM</label>
        <Input value={field("L")} onChange={(e) => setField("L")(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Límite Largo 40/50
        </label>
        <Select
          value={String(grid.referenceLengthLimit)}
          onChange={(value) => grid.setReferenceLengthLimit(Number(value))}
          options={REFERENCE_LIMIT_OPTIONS}
        />
      </div>
    </div>
  );
};
