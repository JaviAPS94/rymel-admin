## Context

- El admin usa Tailwind v4 (`@tailwindcss/vite`), wouter, iconos Tabler y un kit propio en `src/components/ui` (Button 103 usos, Modal 37, Input 25, Card 10, Select 8, Pagination 7). Sus colores de marca se llaman igual que en el sistema de diseño (`rymel-blue`, `rymel-yellow`) pero con valores viejos.
- `@rymel/ui` (repo `JaviAPS94/rymel-ui`) publica tokens, `theme.css` para Tailwind v4 y componentes sin dependencia de router ni de librería de iconos. El cliente ya lo usa (v0.1.0).
- Las pruebas del admin (vitest + Testing Library) buscan por rol (`button`, `dialog`, `table`, `tab`) y `Modal.spec.tsx` fija el apilado de Esc, el `defaultPrevented` y el desplazamiento con `data-modal-overlay`.

## Goals / Non-Goals

**Goals:**
- El admin se ve y se comporta como el cliente: misma banda, cabeceras, tablas, botones, campos y modales.
- Un único origen para lo compartido: los arreglos visuales se hacen en `rymel-ui`.
- Las pruebas existentes siguen pasando sin cambiar sus expectativas.

**Non-Goals:**
- Rediseñar el interior de la grilla de plantillas, el árbol de materiales, la grilla de fantasmas o el editor de fórmulas.
- Eliminar el kit `src/components/ui` en este cambio (queda como adaptadores).

## Decisions

**1. Llevar el comportamiento del modal del admin al paquete (v0.2.0) antes de migrar.**
El modal del admin es más completo que el del paquete (pila de Esc, `defaultPrevented`, cabecera fija, fondo desplazable). Se sube al paquete en vez de mantener dos modales.
*Alternativa descartada:* que el admin conserve su modal y solo cambie estilos. Mantendría dos implementaciones y el cliente no ganaría el arreglo.

**2. Adaptadores en `src/components/ui/*` en lugar de cambiar los 190 usos.**
Cada archivo conserva su API y por dentro usa el componente del paquete. Mapeo de `Button`: `primary`→`primary`, `secondary` (amarillo)→`accent`, `outline`→`secondary`, `ghost`→`ghost`, `danger`→`danger`, `isLoading`→`loading`. `Modal.maxWidth` se traduce a los tamaños del paquete. `Card` y sus subpartes quedan en el admin sobre el `Card` del paquete. Los usos se pueden ir pasando al paquete sin prisa.
*Alternativa descartada:* reescribir todas las llamadas ahora: mucho riesgo sin cambio visible.

**3. Navbar del paquete con la configuración en el admin.**
`Navbar.tsx` del admin queda en secciones, roles, ruta activa y usuario; `NavDropdown.tsx` se elimina. La sección activa compara por prefijo de ruta (hoy es igualdad exacta, así que `/bom/12` no encendía nada).

**4. Tema por CSS, sin preset.**
`src/index.css`: `@import "tailwindcss"; @import "@rymel/ui/theme.css";`. El `@source` del tema ya escanea el paquete. Se borra el `@theme` propio. Los nombres viejos de shadcn (`muted`, `foreground`…) tienen 2 usos y se sustituyen por la escala de grises.

**5. Pantallas en tres niveles de intervención.**
Listados: `PageHeader` + `Page` + filtros en `Card` + `TableCard` con `rm-table`. Detalles y editores: solo `PageHeader` y acciones; el cuerpo intacto. Dashboard: tarjetas de acceso con el estilo del sistema.

## Risks / Trade-offs

- [La escala de grises cambia en 903 usos a la vez] → Es el efecto buscado; se revisan visualmente las pantallas densas (grillas) al final y, si algo pierde contraste, se ajusta ese punto.
- [El primer bloque de `Page` sube 72 px sobre la banda] → Las pantallas cuyo primer bloque no es una tarjeta (editores con barra de herramientas) usan `PageHeader` sin `Page`, con su propio contenedor.
- [`sonner` sigue con su estilo] → El paquete exporta clases de marca para `toastOptions`; si no alcanzan, se deja `richColors` y se revisa después.
- [Dependencia por etiqueta de GitHub] → Igual que `@rymel/design-template`; `prepare` compila al instalar.

## Migration Plan

1. Publicar `@rymel/ui` v0.2.0 (modal y `sonner`) y comprobarlo en su galería.
2. Base del admin, adaptadores y Navbar en un commit; pruebas en verde.
3. Pantallas por grupos (listados, detalles/editores, Dashboard/login), un commit por grupo.
4. Rollback: revertir los commits del admin; el paquete no rompe a nadie porque cada app fija su etiqueta.

## Open Questions

- Ninguna bloqueante. Las pantallas «Recursos» y «Configuración» quedan para un cambio propio si se necesitan.
