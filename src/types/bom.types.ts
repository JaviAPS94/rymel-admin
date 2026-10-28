export const BomNodeType = {
  STANDARD: 'STANDARD',
  CRITICAL: 'CRITICAL',
  REFERENCE: 'REFERENCE',
} as const;

export type BomNodeType = (typeof BomNodeType)[keyof typeof BomNodeType];

export interface SemiFinished {
  id: number;
  code: string;
  name: string;
}

/** Una familia de fantasmas colgada de un semielaborado del árbol. */
export interface BomNodePhantomFamily {
  id: number;
  family: { id: number; name: string };
  process: { id: number; name: string };
  /** Fantasmas de la familia que ofrece la estructura, según sus Tipos PT. */
  offered: number;
}

export interface BomNode {
  id: number;
  semiFinished: SemiFinished;
  type: BomNodeType | null;
  parentId: number | null;
  children: BomNode[];
  /** Ausente en respuestas de servidores anteriores a las familias. */
  phantomFamilies?: BomNodePhantomFamily[];
}

export interface BillOfMaterials {
  id: number;
  code: string;
  name: string;
  nodes: BomNode[];
  /** Tipos PT que soporta la estructura; vacío ofrece todos los fantasmas. */
  productTypes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BomListItem {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BomListResponse {
  data: BomListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBomDto {
  code: string;
  name: string;
}

export interface UpdateBomDto {
  code?: string;
  name?: string;
}

export interface CreateBomNodeDto {
  semiFinishedId: number;
  parentId?: number;
  type?: BomNodeType;
}

export interface UpdateBomNodeDto {
  semiFinishedId?: number;
  parentId?: number;
  type?: BomNodeType;
}

/** Un fantasma que la estructura ofrece de una familia del árbol. */
export interface OfferedPhantomItem {
  id: number;
  itemCode: string;
  reference: string;
  finishedProductType: string;
  componentsCount: number;
}

/** Un Tipo PT de los fantasmas, con cuántos lo tienen. */
export interface PhantomProductType {
  code: string;
  count: number;
}
