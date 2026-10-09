/**
 * La lista de materiales de un diseño real, armada en el admin con lo que
 * devuelve el servidor.
 *
 * Las pruebas de `DesignBomPage` simulan los servicios; ésta usa la respuesta
 * real de `GET /design/by-id/:id` y de la búsqueda de BOM, volcadas por
 * `project-back/src/db/scripts/dump-design-bom-input.ts`, para comprobar que
 * la forma de los datos es la que el admin espera.
 *
 *   npx tsx scripts/check-design-bom.ts ../project-back/design-bom-input.json
 */

import { readFileSync } from "node:fs";
import { buildBomSummaryCells } from "../src/components/bom-summary/buildBomSummary";
import { toCsv } from "../src/components/bom-summary/summaryTable";
import type { DesignDetail } from "../src/types/designBom.types";
import type { BillOfMaterials } from "../src/types/bom.types";

let failures = 0;
const check = (name: string, condition: boolean, detail = ""): void => {
  console.log(`${condition ? "  ok  " : " FALLA"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failures++;
};

const { design, bom } = JSON.parse(
  readFileSync(process.argv[2] ?? "../project-back/design-bom-input.json", "utf8"),
) as { design: DesignDetail; bom: BillOfMaterials };

const sheets = design.subDesigns.map((subDesign) => subDesign.data);
const element = design.designElements[0]!.element;
const cells = buildBomSummaryCells(bom, new Set(), sheets, element);
const values = Object.values(cells).map((cell) => cell.value);

console.log(`\n--- ${design.code} con la estructura ${bom.code}`);
check("el elemento llega con su referencia ERP", typeof element.sapReference === "string");
check("las hojas llegan como objetos, no como texto", sheets.every((sheet) => typeof sheet === "object"));
check("la estructura llega con su árbol", bom.nodes.length > 0);
check("la lista incluye el ítem vinculado del diseño", values.includes("240") && values.includes("Fibra de 2 mm"));
check("y su cantidad", values.includes("3"));
check("el CSV se genera", toCsv(cells).includes("240;Fibra de 2 mm;3;KLS"));

console.log(failures === 0 ? "\nLa lista se arma con los datos reales." : `\n${failures} comprobación(es) fallan.`);
process.exit(failures === 0 ? 0 : 1);
