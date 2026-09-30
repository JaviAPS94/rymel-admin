/**
 * Funcionalidades que se encienden por despliegue.
 *
 * Las zonas de solo lectura solo protegen algo cuando el diseñador de
 * project-front las cumple. Ofrecerlas antes haría creer al autor que una
 * celda está protegida mientras el diseñador todavía puede editarla, así que
 * la acción se enciende cuando esa versión del diseñador está desplegada.
 */
export const READ_ONLY_ZONES_ENABLED = import.meta.env.VITE_READ_ONLY_ZONES === "true";
