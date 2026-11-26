## Why

Los semielaborados son la base de la lista de materiales: son los nodos del árbol de la estructura, las zonas de la plantilla de diseño y el destino de los accesorios de la norma. Hoy solo existen por seed: el backend expone únicamente `GET /semi-finished` y nadie puede crear, corregir o retirar uno sin tocar la base. Cada semielaborado nuevo que pide el cliente (o un nombre mal escrito) termina en un script manual.

## What Changes

**Backend (`project-back`, módulo `semi-finished`)**

- Nuevos endpoints, solo para `ADMIN`: obtener uno, crear, editar y eliminar.
- El código del semielaborado es obligatorio y único entre los activos (sin distinguir mayúsculas ni espacios al inicio/fin). Un código repetido responde `409`.
- Eliminar es lógico (`deleted_at`), como en el resto del sistema. No se puede eliminar un semielaborado que esté en el árbol de alguna estructura activa: responde `409` indicando en qué estructuras está.
- `GET /semi-finished` deja de devolver los eliminados. Mantiene su forma (`id`, `code`, `name`) y sus roles, así que el cliente y los selectores del admin siguen funcionando igual. **Cambio de comportamiento**: un semielaborado eliminado ya no aparece para elegirlo en normas, plantillas ni estructuras.
- La lista indica en cuántas estructuras se usa cada semielaborado, para saber antes de borrar.

**Admin (`project-admin`)**

- Nueva sección **Semielaborados** en el menú «Catálogos» (ruta `/semi-finished`), solo para `ADMIN`.
- Tabla con código, nombre, estructuras donde se usa y acciones; búsqueda por código o nombre y paginación.
- Modal para crear y editar (código y nombre), con validación de campos requeridos y del código repetido.
- Confirmación al eliminar; si está en uso, el botón avisa y el error del servidor se muestra con las estructuras que lo usan.
- Los selectores de semielaborado existentes (árbol de la estructura, zonas de la plantilla) se refrescan al crear, editar o eliminar.

**Fuera de alcance**

- Propagar un cambio de nombre o código a las plantillas y normas ya guardadas: guardan una copia del código y el nombre en su JSON y la conservan (ver design).
- Importar o exportar semielaborados desde Excel.
- Restaurar un semielaborado eliminado desde el admin.

## Capabilities

### New Capabilities

- `semi-finished-catalog`: alta, edición, consulta y baja lógica de semielaborados, con unicidad del código y protección de los que están en uso.

### Modified Capabilities

_Ninguna: no hay spec previo de semielaborados._

## Impact

- **project-back**: `src/modules/semi-finished/` (controller, service, DTOs nuevos de entrada y salida, módulo importa el nodo de BOM para contar usos). Sin migración: la tabla `semi_finished` ya tiene `deleted_at`.
- **project-admin**: `semiFinishedService`, hook nuevo `useSemiFinished`, página `SemiFinishedListPage`, modal `SemiFinishedFormModal`, ruta en `App.tsx`, ítem en `Navbar`. Invalida las queries que ya leen semielaborados (`useBom`, `RegionForms`).
- **project-front**: sin cambios de código; deja de ver los semielaborados eliminados en `GET /semi-finished`.
