export const DesignCodePhaseType = {
  MONOFASICA: "MONOFASICA",
  TRIFASICA: "TRIFASICA",
} as const;
export type DesignCodePhaseType =
  (typeof DesignCodePhaseType)[keyof typeof DesignCodePhaseType];

export const DesignCodeSapSegmentName = {
  FASE: "FASE",
  POTENCIA: "POTENCIA",
  TENSION_PRIMARIA: "TENSION_PRIMARIA",
  TENSION_SECUNDARIA: "TENSION_SECUNDARIA",
  SUFIJO_FINAL: "SUFIJO_FINAL",
  PAIS_CODE: "PAIS_CODE",
} as const;
export type DesignCodeSapSegmentName =
  (typeof DesignCodeSapSegmentName)[keyof typeof DesignCodeSapSegmentName];

export const DesignCodeSuffixPattern = {
  LETTER_SUFFIX: "LETTER_SUFFIX",
  LETTER_SUFFIX_DASH: "LETTER_SUFFIX_DASH",
  NUMERIC_SUFFIX: "NUMERIC_SUFFIX",
  NUMERIC_SUFFIX_DASH: "NUMERIC_SUFFIX_DASH",
} as const;
export type DesignCodeSuffixPattern =
  (typeof DesignCodeSuffixPattern)[keyof typeof DesignCodeSuffixPattern];

export interface DesignCodePowerLetter {
  id: number;
  phaseType: DesignCodePhaseType;
  powerKva: number;
  letter: string;
}
export interface CreateDesignCodePowerLetterDto {
  phaseType: DesignCodePhaseType;
  powerKva: number;
  letter: string;
}
export type UpdateDesignCodePowerLetterDto =
  Partial<CreateDesignCodePowerLetterDto>;

export interface DesignCodeTensionLetter {
  id: number;
  tensionValue: number;
  letter: string;
}
export interface CreateDesignCodeTensionLetterDto {
  tensionValue: number;
  letter: string;
}
export type UpdateDesignCodeTensionLetterDto =
  Partial<CreateDesignCodeTensionLetterDto>;

export interface DesignCodeSapSegmentMapping {
  id: number;
  segmentName: DesignCodeSapSegmentName;
  segmentIndex: number;
}
export interface CreateDesignCodeSapSegmentMappingDto {
  segmentName: DesignCodeSapSegmentName;
  segmentIndex: number;
}
export type UpdateDesignCodeSapSegmentMappingDto =
  Partial<CreateDesignCodeSapSegmentMappingDto>;

export interface DesignCodeSuffixFormat {
  id: number;
  pattern: DesignCodeSuffixPattern;
  label: string;
  isDefault: boolean;
}
export interface CreateDesignCodeSuffixFormatDto {
  pattern: DesignCodeSuffixPattern;
  label: string;
  isDefault?: boolean;
}
export type UpdateDesignCodeSuffixFormatDto =
  Partial<CreateDesignCodeSuffixFormatDto>;
