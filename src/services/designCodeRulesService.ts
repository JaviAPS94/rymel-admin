import { apiClient } from "./api";
import type {
  DesignCodePowerLetter,
  CreateDesignCodePowerLetterDto,
  UpdateDesignCodePowerLetterDto,
  DesignCodeTensionLetter,
  CreateDesignCodeTensionLetterDto,
  UpdateDesignCodeTensionLetterDto,
  DesignCodeSapSegmentMapping,
  CreateDesignCodeSapSegmentMappingDto,
  UpdateDesignCodeSapSegmentMappingDto,
  DesignCodeSuffixFormat,
  CreateDesignCodeSuffixFormatDto,
  UpdateDesignCodeSuffixFormatDto,
} from "@/types/designCodeRules.types";

function createRuleResourceService<T, TCreate, TUpdate>(basePath: string) {
  const url = `/design-code-rules/${basePath}`;

  return {
    async getAll(): Promise<T[]> {
      const response = await apiClient.get<T[]>(url);
      return response.data;
    },
    async create(data: TCreate): Promise<T> {
      const response = await apiClient.post<T>(url, data);
      return response.data;
    },
    async update(id: number, data: TUpdate): Promise<T> {
      const response = await apiClient.put<T>(`${url}/${id}`, data);
      return response.data;
    },
    async remove(id: number): Promise<void> {
      await apiClient.delete(`${url}/${id}`);
    },
  };
}

export const powerLetterService = createRuleResourceService<
  DesignCodePowerLetter,
  CreateDesignCodePowerLetterDto,
  UpdateDesignCodePowerLetterDto
>("power-letters");

export const primaryTensionLetterService = createRuleResourceService<
  DesignCodeTensionLetter,
  CreateDesignCodeTensionLetterDto,
  UpdateDesignCodeTensionLetterDto
>("primary-tension-letters");

export const secondaryTensionLetterService = createRuleResourceService<
  DesignCodeTensionLetter,
  CreateDesignCodeTensionLetterDto,
  UpdateDesignCodeTensionLetterDto
>("secondary-tension-letters");

export const sapSegmentMappingService = createRuleResourceService<
  DesignCodeSapSegmentMapping,
  CreateDesignCodeSapSegmentMappingDto,
  UpdateDesignCodeSapSegmentMappingDto
>("sap-segment-mappings");

export const suffixFormatService = createRuleResourceService<
  DesignCodeSuffixFormat,
  CreateDesignCodeSuffixFormatDto,
  UpdateDesignCodeSuffixFormatDto
>("suffix-formats");
