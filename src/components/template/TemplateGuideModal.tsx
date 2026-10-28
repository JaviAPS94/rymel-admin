import { useState } from "react";
import { Modal } from "@components/ui/Modal";
import BomTutorial from "./BomTutorial";

interface TemplateGuideModalProps {
  onClose: () => void;
}

type Section = "bom" | "goto";

/**
 * Los pasos de «Ir a», con las etiquetas del menú contextual del editor. Antes
 * los enseñaban las instrucciones del diseñador en project-front.
 */
const GOTO_STEPS: { label: string; description: string; example?: string }[] = [
  {
    label: "¿Qué es Ir a?",
    description:
      "Lleva al diseñador a una tabla de referencia según el valor de una o varias celdas. Útil cuando una celda tiene un desplegable y hay que saltar a la tabla que corresponde.",
  },
  {
    label: "Paso 1: Etiquetar rango como tabla",
    description:
      'Selecciona el rango de celdas que forma la tabla → clic derecho → "Etiquetar rango como tabla". Asigna un nombre y uno o más tags separados por coma.',
    example:
      'Nombre: "Tabla Aluminio", Tags: aluminio — Nombre: "Tabla Cobre 12AWG", Tags: cobre, 12awg',
  },
  {
    label: "Paso 2: Configurar Ir a en una celda",
    description:
      'Clic derecho en la celda desde la que se navega → "Configurar Ir a…". Agrega las celdas cuyo valor se usará como condición.',
    example:
      "Si la celda C2 tiene un desplegable con [aluminio, cobre], agrega C2 como celda de condición.",
  },
  {
    label: "Paso 3: El diseñador navega",
    description:
      'En el diseño, clic derecho en la celda → "Ir a tabla". Se leen las celdas de condición y se busca la tabla cuyos tags coinciden, aunque esté en otra hoja.',
    example: 'C2 = "cobre" → navega a la tabla con tag "cobre".',
  },
  {
    label: "Multi-condición",
    description:
      "Puedes agregar varias celdas de condición. Se busca la tabla cuyos tags contengan TODOS los valores.",
    example:
      'Condiciones: C2="cobre", C3="12awg" → coincide con la tabla con tags: cobre, 12awg',
  },
  {
    label: "Indicadores en la hoja",
    description:
      "Las celdas con Ir a muestran ➔ y la celda donde empieza una tabla etiquetada muestra ▣.",
  },
  {
    label: "Quitar la configuración",
    description:
      'Clic derecho → "Quitar Ir a" en la celda, o "Quitar tabla etiquetada" dentro del rango.',
  },
];

/** Cómo se configura en la plantilla lo que el diseñador después usa. */
export const TemplateGuideModal = ({ onClose }: TemplateGuideModalProps) => {
  const [section, setSection] = useState<Section>("bom");

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Guía de la plantilla"
      maxWidth="5xl"
    >
      <div className="space-y-4">
        <div className="flex gap-1 text-sm">
          {(
            [
              ["bom", "Lista de materiales"],
              ["goto", "Tablas e Ir a"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`rounded px-3 py-1.5 ${
                section === id
                  ? "bg-rymel-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "bom" ? (
          <div className="h-[560px]">
            <BomTutorial />
          </div>
        ) : (
          <ol className="space-y-3">
            {GOTO_STEPS.map((step) => (
              <li
                key={step.label}
                className="rounded-lg border border-gray-200 p-3"
              >
                <p className="text-sm font-medium text-gray-900">
                  {step.label}
                </p>
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                {step.example && (
                  <p className="mt-2 rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700">
                    {step.example}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
};
