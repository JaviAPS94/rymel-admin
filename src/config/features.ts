/**
 * Funcionalidades que se pueden apagar por despliegue.
 *
 * Las zonas de solo lectura solo protegen algo cuando el diseñador de
 * project-front las cumple. Ya las cumple, así que están encendidas por
 * omisión; `VITE_READ_ONLY_ZONES=false` las apaga en un despliegue donde el
 * diseñador vaya por detrás, para no hacer creer al autor que una celda está
 * protegida cuando el diseñador todavía puede editarla.
 */
export const READ_ONLY_ZONES_ENABLED = import.meta.env.VITE_READ_ONLY_ZONES !== "false";
