import { apiClient } from "./api";
import type {
  CreateDesignFunctionDto,
  DesignFunctionDetail,
  DesignFunctionImpact,
  DesignFunctionVersion,
  ListDesignFunctionsParams,
  PaginatedDesignFunctions,
  PublishVersionDto,
  PublishVersionResult,
  RecalculationReport,
  StaleSubDesign,
  TestExpressionDto,
  TestExpressionResult,
  UpdateDesignFunctionDto,
} from "@/types/designFunction.types";

const BASE = "/admin/design-functions";

export interface DesignSubTypeOption {
  id: number;
  name: string;
  designTypeName?: string;
}

/**
 * Etiqueta legible de un subtipo.
 *
 * Los nombres se repiten: "1F" y "3F" existen en varios tipos de diseño, así
 * que mostrar solo el nombre daría cuatro opciones idénticas e
 * indistinguibles.
 */
export const subTypeLabel = (subType: DesignSubTypeOption): string =>
  subType.designTypeName
    ? `${subType.designTypeName} · ${subType.name}`
    : subType.name;

/** Subtipos de diseño, para la pantalla de asignación. */
export const listDesignSubTypes = async (): Promise<DesignSubTypeOption[]> => {
  const response = await apiClient.get<DesignSubTypeOption[]>(
    "/design/subtypes"
  );
  return response.data;
};

export const designFunctionService = {
  async list(
    params: ListDesignFunctionsParams = {}
  ): Promise<PaginatedDesignFunctions> {
    const response = await apiClient.get<PaginatedDesignFunctions>(BASE, {
      params,
    });
    return response.data;
  },

  /**
   * Detalle para editar. Devuelve la expresión en claro y **deja constancia
   * del acceso** en el servidor: no debe llamarse para pintar un listado.
   */
  async detail(id: number): Promise<DesignFunctionDetail> {
    const response = await apiClient.get<DesignFunctionDetail>(`${BASE}/${id}`);
    return response.data;
  },

  async impact(id: number): Promise<DesignFunctionImpact> {
    const response = await apiClient.get<DesignFunctionImpact>(
      `${BASE}/${id}/impact`
    );
    return response.data;
  },

  async versions(id: number): Promise<DesignFunctionVersion[]> {
    const response = await apiClient.get<DesignFunctionVersion[]>(
      `${BASE}/${id}/versions`
    );
    return response.data;
  },

  async create(
    data: CreateDesignFunctionDto
  ): Promise<{ id: number; warnings: string[] }> {
    const response = await apiClient.post<{ id: number; warnings: string[] }>(
      BASE,
      data
    );
    return response.data;
  },

  async update(id: number, data: UpdateDesignFunctionDto): Promise<void> {
    await apiClient.put(`${BASE}/${id}`, data);
  },

  async publishVersion(
    id: number,
    data: PublishVersionDto
  ): Promise<PublishVersionResult> {
    const response = await apiClient.post<PublishVersionResult>(
      `${BASE}/${id}/versions`,
      data
    );
    return response.data;
  },

  async restoreVersion(
    id: number,
    version: number
  ): Promise<DesignFunctionVersion> {
    const response = await apiClient.post<DesignFunctionVersion>(
      `${BASE}/${id}/versions/${version}/restore`
    );
    return response.data;
  },

  async test(data: TestExpressionDto): Promise<TestExpressionResult> {
    const response = await apiClient.post<TestExpressionResult>(
      `${BASE}/test`,
      data
    );
    return response.data;
  },

  async setSubTypes(id: number, designSubTypeIds: number[]): Promise<void> {
    await apiClient.put(`${BASE}/${id}/subtypes`, { designSubTypeIds });
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async undelete(id: number): Promise<void> {
    await apiClient.post(`${BASE}/${id}/restore`);
  },

  async staleSubDesigns(): Promise<StaleSubDesign[]> {
    const response = await apiClient.get<StaleSubDesign[]>(
      `${BASE}/stale/sub-designs`
    );
    return response.data;
  },

  /**
   * Recalcula sub-diseños. Puede tardar: reevalúa cada hoja contra el motor
   * cifrado, así que el tiempo de espera por defecto del cliente se queda
   * corto.
   */
  async recalculate(subDesignIds: number[]): Promise<RecalculationReport> {
    const response = await apiClient.post<RecalculationReport>(
      `${BASE}/recalculate`,
      { subDesignIds },
      { timeout: 120000 }
    );
    return response.data;
  },
};
