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

export interface BomNode {
  id: number;
  semiFinished: SemiFinished;
  type: BomNodeType | null;
  parentId: number | null;
  children: BomNode[];
}

export interface BillOfMaterials {
  id: number;
  code: string;
  name: string;
  nodes: BomNode[];
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
