import { useState } from "react";
import { parseRefList } from "./regions";

/**
 * Los formularios de celda que abre el menú contextual.
 *
 * Son pequeños y no guardan nada por su cuenta: devuelven lo que se escribió
 * y quien los abre lo aplica con las mismas mutaciones que el panel de celda.
 */

export const NoteForm = ({
  initial,
  onSubmit,
}: {
  initial: string;
  onSubmit: (note: string | undefined) => void;
}) => {
  const [note, setNote] = useState(initial);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(note.trim() === "" ? undefined : note.trim());
      }}
    >
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={4}
        autoFocus
        aria-label="Nota"
        placeholder="Explicación para quien use la plantilla"
        className="w-full rounded border border-gray-300 p-2 text-sm"
      />
      <button type="submit" className="w-full rounded bg-rymel-blue px-2 py-1.5 text-sm text-white">
        Guardar nota
      </button>
    </form>
  );
};

/** Las celdas de condición de un `goTo` o de un vínculo al catálogo. */
export const RefListForm = ({
  initial,
  help,
  onSubmit,
}: {
  initial: string[];
  help: string;
  /** Una lista vacía significa quitar la configuración. */
  onSubmit: (refs: string[]) => void;
}) => {
  const [text, setText] = useState(initial.join(", "));
  const [invalid, setInvalid] = useState<string[]>([]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = parseRefList(text);
        setInvalid(parsed.invalid);
        if (parsed.invalid.length === 0) onSubmit(parsed.refs);
      }}
    >
      <p className="text-xs text-gray-600">{help}</p>
      <input
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setInvalid([]);
        }}
        autoFocus
        aria-label="Celdas de condición"
        placeholder="B5, C5"
        className="h-8 w-full rounded border border-gray-300 px-2 font-mono text-sm"
      />
      {invalid.length > 0 && (
        <p role="alert" className="text-xs text-red-600">
          No son referencias de celda: {invalid.join(", ")}
        </p>
      )}
      <button type="submit" className="w-full rounded bg-rymel-blue px-2 py-1.5 text-sm text-white">
        Guardar
      </button>
    </form>
  );
};
