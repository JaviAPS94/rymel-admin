## 1. Backend: DTOs y servicio (`project-back/src/modules/semi-finished`)

- [x] 1.1 Crear `dtos/create-semi-finished.dto.ts` y `dtos/update-semi-finished.dto.ts` (trim, no vacío, máx. 255) y `dtos/semi-finished-admin-output.dto.ts` (`id`, `code`, `name`, `bomCount`, `updatedAt`)
- [x] 1.2 `findAll` filtra `deletedAt IS NULL` y ordena por código
- [x] 1.3 `findAdminList` con `bomCount` (nodos activos de estructuras activas, estructuras distintas, 0 si no se usa)
- [x] 1.4 `findOne` (404 si no existe o está eliminado)
- [x] 1.5 `create` y `update` con validación de código único entre activos (normalizado, excluyendo el propio id) → `409`
- [x] 1.6 `remove`: `409` con los códigos de estructura si está en uso; si no, `deletedAt = now`
- [x] 1.7 Importar en `SemiFinishedModule` las entidades de nodo y estructura de BOM para las consultas de uso

## 2. Backend: controlador y pruebas

- [x] 2.1 Endpoints `GET /admin`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` (204) con `@Roles(Role.ADMIN)` y Swagger; `GET /admin` declarado antes de `GET /:id`
- [x] 2.2 `semiFinished.service.spec.ts`: listado sin eliminados, `bomCount`, alta, código repetido (mayúsculas/espacios), editar conservando código, reutilizar código de eliminado, borrar sin uso, borrar en uso → 409, 404 en eliminado
- [x] 2.3 `npm run build` y `npm test` del backend en verde

## 3. Admin: servicio, tipos y hooks

- [x] 3.1 Tipos `SemiFinishedAdminItem`, `CreateSemiFinishedDto`, `UpdateSemiFinishedDto` en `src/types/` (junto a `SemiFinished`)
- [x] 3.2 `semiFinishedService`: `getAdminList`, `create`, `update`, `remove`
- [x] 3.3 `src/hooks/useSemiFinished.ts` con listado y mutaciones; invalidan `['semi-finished']` y muestran avisos

## 4. Admin: UI

- [x] 4.1 `SemiFinishedFormModal` (crear/editar, validación local, `409` en el campo código, nota de que renombrar no cambia plantillas/normas guardadas)
- [x] 4.2 `SemiFinishedListPage`: cabecera, búsqueda (sin mayúsculas ni tildes, vuelve a página 1), tabla con código/nombre/estructuras/acciones, paginación de 10, estados de carga/error/vacío
- [x] 4.3 Confirmación de borrado con aviso si `bomCount > 0` y mensaje del servidor si responde `409`
- [x] 4.4 Ruta `/semi-finished` (solo `ADMIN`) en `App.tsx` e ítem «Semielaborados» en «Catálogos» del `Navbar`, solo para `ADMIN`

## 5. Admin: pruebas y verificación

- [x] 5.1 `SemiFinishedListPage.spec.tsx`: lista, búsqueda, abrir modal, crear, `409` en código, confirmar borrado, borrado rechazado
- [x] 5.2 `npm run build`, `npm run lint` y `npm test` del admin en verde
- [x] 5.3 Comprobación contra la base local: duplicados de código existentes y `bomCount` de algunos semielaborados; anotar resultado en este archivo
  - Base local, 2026-11-17: 5 semielaborados, todos activos. **Sin códigos duplicados** (normalizando mayúsculas y espacios), así que la validación no bloquea a ninguno existente. Código más largo: 19 caracteres; nombre: 21 (cabe en el límite de 255).
  - Uso en estructuras activas: BOBINA 2, NUCLEO 2, TANQUEMETALMECANICA 1, TANQUEPINTADO 2, ENSAMBLEFINAL 2. Los cinco están en uso: hoy ninguno se puede eliminar; para probar el borrado hay que crear uno nuevo.
- [x] 5.4 Prueba manual: crear, editar, buscar, borrar sin uso, intentar borrar uno en uso, y ver el nuevo semielaborado en el editor de estructuras
