## Why

El cliente ya estrenó la identidad nueva de Rymel sobre el sistema de diseño compartido `@rymel/ui` (banda índigo, acento amarillo, Plus Jakarta Sans, tablas y cabeceras comunes). El admin sigue con su propio kit (`src/components/ui`), otros colores (`#1b1363`, `#d4c034`), una barra blanca y cada pantalla resuelve a mano su cabecera, filtros y tabla. Sin migrar, los dos productos se separan más con cada cambio visual y cada arreglo hay que hacerlo dos veces.

## What Changes

**Sistema de diseño (`rymel-ui`, versión v0.2.0, requisito previo)**

- El `Modal` incorpora lo que hoy solo tiene el del admin: con varios abiertos, Esc cierra solo el de arriba; respeta un Esc que ya usó alguien dentro (`defaultPrevented`, p. ej. el autocompletado del editor de fórmulas); un modal más alto que la pantalla se desplaza con el fondo y mantiene la cabecera fija; el fondo lleva `data-modal-overlay`.
- Estilos de marca para los avisos de `sonner`.

**Admin (`project-admin`)**

- Base: `@rymel/ui` como dependencia, su `theme.css` en Tailwind v4, fuentes de marca y `RymelUIProvider` con el `Link` de wouter. Se elimina el `@theme` propio de `index.css`.
- `src/components/ui/*` pasan a ser adaptadores finos sobre `@rymel/ui`, conservando su API para no tocar los 190 usos. Mapeo de botones: `secondary` (amarillo) → `accent`, `outline` → `secondary`.
- Navbar del sistema de diseño: banda índigo, marca «Rymel Admin», menús «Catálogos» y «Administración» y menú móvil. **Se quitan los enlaces rotos «Recursos» (`/resources`) y «Configuración» (`/settings`)**, que no tienen ruta.
- Login con la misma composición que el del cliente.
- Ocho listados (Usuarios, Materiales, Diseños, Fórmulas, Plantillas, Semielaborados, Fantasmas, Reglas de código) con `PageHeader`, filtros flotantes y tabla del sistema.
- Detalle de diseño, editores (materiales, plantillas, fantasmas) y Dashboard: solo el marco (cabecera, botones, modales).

**Fuera de alcance**

- El interior de la grilla de plantillas, el árbol de materiales, la grilla de fantasmas y el editor de fórmulas.
- Funcionalidad nueva o cambios de datos: es un cambio visual y de estructura de componentes.
- Las pantallas «Recursos» y «Configuración».

## Capabilities

### New Capabilities

- `admin-navigation`: qué secciones ofrece la barra del admin, a quién, cuándo se marcan activas y cómo se navega en pantallas estrechas.
- `admin-dialogs`: comportamiento de los modales del admin (cierre, apilado, desplazamiento) independientemente del componente que los dibuje.

### Modified Capabilities

_Ninguna: los specs existentes describen catálogos y fórmulas, no su presentación._

## Impact

- **rymel-ui**: `Modal`, estilos de `sonner`; versión v0.2.0.
- **project-admin**: `package.json`, `src/index.css`, `index.html`, `src/main.tsx`, `src/components/ui/*`, `Navbar.tsx`, `NavDropdown.tsx` (se elimina), `Layout.tsx`, `LoginForm.tsx`, `LoginPage.tsx`, las 13 páginas de `src/pages`. Las pruebas existentes se buscan por rol y deben seguir pasando sin cambios de expectativas.
- **project-front**: sin cambios obligatorios; puede subir a v0.2.0 para heredar el comportamiento de los modales.
