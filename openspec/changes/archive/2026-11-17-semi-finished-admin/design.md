## Context

- Tabla `semi_finished` (`id`, `name`, `code`, `created_at`, `updated_at`, `deleted_at`). Sin índice único en `code`. Se carga por seed.
- Backend: `SemiFinishedController` solo tiene `GET /semi-finished` (roles `ADMIN`, `DESIGN`, `NORM`) y devuelve **todos** los registros, incluidos los eliminados.
- Quién usa un semielaborado:
  - **`bill_of_materials_node.semi_finished_id`**: FK real (`ON DELETE NO ACTION`). Es la única referencia por id en la base.
  - **Plantillas de diseño**: las zonas guardan `semiFinishedId`, `semiFinishedCode` y `semiFinishedName` dentro del JSON de la plantilla (`@rymel/design-template`).
  - **Normas del cliente**: cada accesorio guarda una copia del objeto `semiFinished` (`id`, `name`, `code`) en el JSON `values` del elemento.
- Admin: React + TanStack Query + wouter. Patrón CRUD a imitar: `BomListPage` + `BomFormModal` + `useBom`. Las consultas existentes de semielaborados usan la clave `['semi-finished']` (`useBom`, `RegionForms`).
- Patrón de borrado del backend: lógico con `deletedAt` (ver `BillOfMaterialsService.remove`).

## Goals / Non-Goals

**Goals:**
- CRUD completo de semielaborados en backend y admin, solo para `ADMIN`.
- No romper a los consumidores de `GET /semi-finished` (cliente y selectores del admin).
- Impedir borrar algo que deje una estructura con un nodo huérfano.

**Non-Goals:**
- Reescribir las copias de código/nombre en plantillas y normas al editar.
- Importación/exportación masiva, restauración de eliminados, auditoría de cambios.
- Paginación en servidor.

## Decisions

### 1. Listado de admin aparte: `GET /semi-finished/admin`
`GET /semi-finished` sigue igual de forma (solo filtra eliminados y ordena por código) porque lo consumen el cliente y dos selectores del admin. El listado de la sección necesita `bomCount`, que obligaría a un join en cada carga de selector; va en `GET /semi-finished/admin` (solo `ADMIN`), que devuelve `{ id, code, name, bomCount, updatedAt }[]`.

`bomCount` = estructuras distintas entre los nodos con `deleted_at IS NULL` cuya estructura tiene `deleted_at IS NULL`; 0 si no se usa. Se calcula en el servicio a partir de los nodos activos con su estructura (una consulta), no con `GROUP BY` en SQL: el volumen es pequeño (decenas de nodos) y así la misma función da los códigos de estructura para el mensaje del `409` al eliminar y se prueba sin base.

*Alternativa descartada:* añadir `bomCount` a `GET /semi-finished` — cambia el contrato que usa el cliente y encarece los selectores.

### 2. Búsqueda y paginación en el navegador
El catálogo es pequeño (decenas, no miles) y el listado completo ya se pide hoy en una sola llamada. La página filtra por código o nombre (normalizando mayúsculas y tildes) y pagina de 10 en 10 en memoria, con el mismo componente `Pagination`.

*Alternativa descartada:* `?page&limit&search` en servidor como `bill-of-materials` — más código para un volumen que no lo necesita. Si el catálogo crece, se añade sin cambiar la UI.

### 3. Unicidad del código en el servicio, no con índice
Se valida en `create`/`update` buscando otro activo con `LOWER(LTRIM(RTRIM(code)))` igual, excluyendo el propio id. Se guarda el código recortado.

*Alternativa descartada:* índice único filtrado (`WHERE deleted_at IS NULL`) — robusto ante concurrencia, pero exige migración y fallaría si el seed actual tiene duplicados (no pude verificarlo en la base). Se deja como mejora en Open Questions.

### 4. Borrado lógico bloqueado por uso en estructuras
`DELETE /semi-finished/:id` cuenta los nodos activos de estructuras activas que lo referencian. Si hay alguno, `409 ConflictException` con el mensaje «El semielaborado X se usa en las estructuras: A, B» (códigos de estructura, máximo 5 y «y N más»). Si no, `deletedAt = now`.

Plantillas y normas **no** bloquean: guardan una copia de código y nombre, así que siguen mostrándose aunque el semielaborado se retire, y el borrado lógico conserva la fila para cualquier lectura por id.

*Alternativa descartada:* borrar en cascada los nodos — destruye estructuras sin aviso.

### 5. DTOs con class-validator
`CreateSemiFinishedDto { code, name }` con `@IsString() @IsNotEmpty() @MaxLength(255)` y `@Transform(trim)`; `UpdateSemiFinishedDto = PartialType(Create…)`. Mismo estilo que los DTOs de `bill-of-materials`.

### 6. Admin: página + modal + hook, imitando BOM
- `semiFinishedService`: `getAll` (existente), `getAdminList`, `create`, `update`, `remove`.
- `useSemiFinished.ts`: `useSemiFinishedAdminList`, `useCreateSemiFinished`, `useUpdateSemiFinished`, `useDeleteSemiFinished`. Al terminar cualquier mutación invalidan `['semi-finished']` (prefijo: cubre el listado de admin `['semi-finished', 'admin']` y los selectores existentes). Avisos con `sonner`.
- `SemiFinishedFormModal`: errores de campo locales; un `409` del servidor se coloca en el campo código y el modal no se cierra.
- `SemiFinishedListPage`: cabecera, búsqueda, tabla, paginación, modal de confirmación. Si `bomCount > 0`, la confirmación avisa que el servidor lo rechazará y en cuántas estructuras se usa.
- Ruta `/semi-finished` con `ProtectedRoute roles={[Role.ADMIN]}`; ítem «Semielaborados» (icono `IconPuzzle`) en `catalogItems` del `Navbar`, visible solo para `ADMIN`.

## Risks / Trade-offs

- [Renombrar no actualiza plantillas ni normas guardadas] → Aceptado y fuera de alcance: son copias históricas, igual que hoy con el seed. Se menciona en el modal de edición con una nota breve.
- [Dos altas simultáneas con el mismo código pasan la validación] → Riesgo bajo (un solo administrador). Mitigación futura: índice único filtrado.
- [Un semielaborado eliminado deja de aparecer en el selector de la norma del cliente] → Es el comportamiento buscado; los accesorios que ya lo tienen conservan su copia.
- [Duplicados de código ya existentes en el seed] → La edición de uno de ellos daría `409` hasta corregir el otro. Se verifica en la tarea de comprobación contra la base.

## Migration Plan

Sin migración de esquema. Despliegue: backend primero (los endpoints nuevos no rompen nada), luego admin. Rollback: revertir el admin; el backend puede quedarse.

## Open Questions

- ¿Hay códigos duplicados hoy en `semi_finished`? Si no los hay, conviene añadir el índice único filtrado en un cambio posterior.
- ¿Los roles `DESIGN`/`NORM` deberían ver la sección en modo solo lectura? Por ahora, solo `ADMIN`.
