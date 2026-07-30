import { useState } from "react";
import { Layout } from "@components/Layout";
import { DesignCodeRuleSection } from "@components/DesignCodeRuleSection";
import {
  usePowerLetters,
  usePrimaryTensionLetters,
  useSecondaryTensionLetters,
  useSapSegmentMappings,
  useSuffixFormats,
} from "@hooks/useDesignCodeRules";

const PHASE_TYPE_OPTIONS = [
  { value: "MONOFASICA", label: "Monofásica" },
  { value: "TRIFASICA", label: "Trifásica" },
];

const PHASE_TYPE_LABELS: Record<string, string> = {
  MONOFASICA: "Monofásica",
  TRIFASICA: "Trifásica",
};

const SEGMENT_NAME_OPTIONS = [
  { value: "FASE", label: "Fase" },
  { value: "POTENCIA", label: "Potencia" },
  { value: "TENSION_PRIMARIA", label: "Tensión primaria" },
  { value: "TENSION_SECUNDARIA", label: "Tensión secundaria" },
  { value: "SUFIJO_FINAL", label: "Sufijo final" },
  { value: "PAIS_CODE", label: "Código de país" },
];

const SEGMENT_NAME_LABELS: Record<string, string> = Object.fromEntries(
  SEGMENT_NAME_OPTIONS.map((option) => [option.value, option.label])
);

const SUFFIX_PATTERN_OPTIONS = [
  { value: "LETTER_SUFFIX", label: "Letra pegada al año (26A)" },
  { value: "LETTER_SUFFIX_DASH", label: "Letra con guion (26-A)" },
  { value: "NUMERIC_SUFFIX", label: "Número pegado al año (261)" },
  { value: "NUMERIC_SUFFIX_DASH", label: "Número con guion (26-1)" },
];

const SUFFIX_PATTERN_LABELS: Record<string, string> = Object.fromEntries(
  SUFFIX_PATTERN_OPTIONS.map((option) => [option.value, option.label])
);

const validateMinMax =
  (minKey: string, maxKey: string) => (values: Record<string, any>) => {
    const min = Number(values[minKey]);
    const max = Number(values[maxKey]);
    if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      return "El valor mínimo no puede ser mayor que el máximo";
    }
    return null;
  };

const TABS = [
  { id: "power", label: "Potencia" },
  { id: "primaryTension", label: "Tensión Primaria" },
  { id: "secondaryTension", label: "Tensión Secundaria" },
  { id: "sapSegmentMapping", label: "Mapeo ERP" },
  { id: "suffixFormats", label: "Sufijos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const DesignCodeRulesPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("power");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reglas de Código de Diseño
          </h1>
          <p className="text-gray-600 mt-1">
            Administra las tablas que alimentan la generación automática del
            código de diseño
          </p>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-rymel-blue text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "power" && (
          <DesignCodeRuleSection
            title="Potencia → Letra"
            description="Letra correspondiente a cada rango de potencia (kVA) según la fase"
            newButtonLabel="Nueva regla de potencia"
            fields={[
              {
                key: "phaseType",
                label: "Fase",
                type: "select",
                options: PHASE_TYPE_OPTIONS,
              },
              {
                key: "powerKvaMin",
                label: "Potencia mínima (kVA)",
                type: "number",
              },
              {
                key: "powerKvaMax",
                label: "Potencia máxima (kVA)",
                type: "number",
              },
              { key: "letter", label: "Letra", type: "text" },
            ]}
            columns={[
              {
                key: "phaseType",
                label: "Fase",
                render: (row) => PHASE_TYPE_LABELS[row.phaseType] || row.phaseType,
              },
              { key: "powerKvaMin", label: "Potencia mínima (kVA)" },
              { key: "powerKvaMax", label: "Potencia máxima (kVA)" },
              { key: "letter", label: "Letra" },
            ]}
            hooks={usePowerLetters}
            validate={validateMinMax("powerKvaMin", "powerKvaMax")}
          />
        )}

        {activeTab === "primaryTension" && (
          <DesignCodeRuleSection
            title="Tensión Primaria → Letra"
            description="Letra correspondiente a cada rango de tensión primaria"
            newButtonLabel="Nueva regla de tensión primaria"
            fields={[
              {
                key: "tensionValueMin",
                label: "Tensión mínima (V)",
                type: "number",
              },
              {
                key: "tensionValueMax",
                label: "Tensión máxima (V)",
                type: "number",
              },
              { key: "letter", label: "Letra", type: "text" },
            ]}
            columns={[
              { key: "tensionValueMin", label: "Tensión mínima (V)" },
              { key: "tensionValueMax", label: "Tensión máxima (V)" },
              { key: "letter", label: "Letra" },
            ]}
            hooks={usePrimaryTensionLetters}
            validate={validateMinMax("tensionValueMin", "tensionValueMax")}
          />
        )}

        {activeTab === "secondaryTension" && (
          <DesignCodeRuleSection
            title="Tensión Secundaria → Letra"
            description="Letra correspondiente a cada rango de tensión secundaria"
            newButtonLabel="Nueva regla de tensión secundaria"
            fields={[
              {
                key: "tensionValueMin",
                label: "Tensión mínima (V)",
                type: "number",
              },
              {
                key: "tensionValueMax",
                label: "Tensión máxima (V)",
                type: "number",
              },
              { key: "letter", label: "Letra", type: "text" },
            ]}
            columns={[
              { key: "tensionValueMin", label: "Tensión mínima (V)" },
              { key: "tensionValueMax", label: "Tensión máxima (V)" },
              { key: "letter", label: "Letra" },
            ]}
            hooks={useSecondaryTensionLetters}
            validate={validateMinMax("tensionValueMin", "tensionValueMax")}
          />
        )}

        {activeTab === "sapSegmentMapping" && (
          <DesignCodeRuleSection
            title="Mapeo de Segmentos ERP"
            description="Posición (0-based) de cada segmento dentro de la referencia ERP, separada por guiones"
            newButtonLabel="Nueva regla de mapeo"
            fields={[
              {
                key: "segmentName",
                label: "Segmento",
                type: "select",
                options: SEGMENT_NAME_OPTIONS,
              },
              { key: "segmentIndex", label: "Posición (0-based)", type: "number" },
            ]}
            columns={[
              {
                key: "segmentName",
                label: "Segmento",
                render: (row) =>
                  SEGMENT_NAME_LABELS[row.segmentName] || row.segmentName,
              },
              { key: "segmentIndex", label: "Posición (0-based)" },
            ]}
            hooks={useSapSegmentMappings}
          />
        )}

        {activeTab === "suffixFormats" && (
          <DesignCodeRuleSection
            title="Formatos de Sufijo de Desambiguación"
            description="Formato usado para diferenciar un código de diseño cuando ya existe uno igual"
            newButtonLabel="Nuevo formato de sufijo"
            fields={[
              {
                key: "pattern",
                label: "Patrón",
                type: "select",
                options: SUFFIX_PATTERN_OPTIONS,
              },
              { key: "label", label: "Etiqueta", type: "text" },
              {
                key: "isDefault",
                label: "Marcar como predeterminado",
                type: "checkbox",
              },
            ]}
            columns={[
              {
                key: "pattern",
                label: "Patrón",
                render: (row) => SUFFIX_PATTERN_LABELS[row.pattern] || row.pattern,
              },
              { key: "label", label: "Etiqueta" },
              {
                key: "isDefault",
                label: "Predeterminado",
                render: (row) =>
                  row.isDefault ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Predeterminado
                    </span>
                  ) : (
                    "-"
                  ),
              },
            ]}
            hooks={useSuffixFormats}
            markAsDefault={{
              isDefault: (row) => Boolean(row.isDefault),
              confirmMessage: (row) =>
                `¿Deseas marcar "${row.label}" como el formato de sufijo predeterminado? El formato actualmente predeterminado dejará de serlo.`,
            }}
          />
        )}
      </div>
    </Layout>
  );
};
