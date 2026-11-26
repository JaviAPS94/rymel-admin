/**
 * Clases para controles nativos (`<select>`, `<input type="date">`…) con el
 * aspecto de los campos de @rymel/ui. Se usan donde el control nativo tiene
 * que quedarse (filtros que las pruebas manejan con `fireEvent.change`).
 */
export const nativeFieldClass =
  "h-[46px] w-full min-w-0 cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-[15px] text-gray-900 outline-none transition-[border-color,box-shadow] hover:border-gray-400 focus:border-rymel-indigo focus:ring-[3px] focus:ring-rymel-indigo/[.12]";
