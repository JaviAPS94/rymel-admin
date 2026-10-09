/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { PhantomItemGrid, type GridSelection } from "./PhantomItemGrid";
import { usePhantomItemGrid } from "@hooks/usePhantomItemGrid";

const Harness = () => {
  const grid = usePhantomItemGrid();
  const [selected, setSelected] = useState<GridSelection | null>({ letter: "M", row: 1 });
  return (
    <>
      <span data-testid="rows">{grid.rowCount}</span>
      <PhantomItemGrid grid={grid} selected={selected} onSelect={setSelected} />
    </>
  );
};

const paste = (text: string) => {
  const target = document.querySelector("[tabindex='0']") as HTMLElement;
  fireEvent.paste(target, { clipboardData: { getData: () => text } });
};

describe("PhantomItemGrid", () => {
  it("regression: pasting more rows than the grid has adds them instead of hanging", () => {
    render(<Harness />);

    // ÍTEM - COMPONENTE, DESCRIPCIÓN, CANT. BASE: three lines copied from Excel
    paste("211\tPARARRAYO\t1\r\n3045\tSELLO\t1\r\n2534\tSOPORTE\t1\r\n");

    expect(screen.getByTestId("rows").textContent).toBe("3");
    expect(screen.getByText("PARARRAYO")).toBeTruthy();
    expect(screen.getByText("2534")).toBeTruthy();
  });
});
