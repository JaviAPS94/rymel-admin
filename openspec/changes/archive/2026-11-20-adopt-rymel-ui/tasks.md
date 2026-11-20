## 1. Sistema de diseño: `@rymel/ui` v0.2.0 (repo `rymel-ui`)

- [x] 1.1 `Modal`: pila de modales abiertos; Esc cierra solo el de arriba y respeta `event.defaultPrevented`
- [x] 1.2 `Modal`: el fondo (`data-modal-overlay`) se desplaza con un modal alto; cabecera fija; el cuerpo sin desplazamiento propio
- [x] 1.3 Clases de marca para `sonner` exportadas desde el paquete (`toastClassNames`) y ejemplo en la galería
- [x] 1.4 Probar en la galería (modal largo, dos modales apilados), `npm run verify`, etiqueta `v0.2.0` y push

## 2. Admin: base

- [x] 2.1 Dependencia `@rymel/ui#v0.2.0` en `package.json`
- [x] 2.2 `src/index.css`: `@import "@rymel/ui/theme.css"`, quitar el `@theme` propio, `body` con `bg-surface font-sans text-gray-900`
- [x] 2.3 Fuentes de marca en `index.html`
- [x] 2.4 `RymelUIProvider` con el `Link` de wouter en `src/main.tsx`
- [x] 2.5 Sustituir los 2 usos de tokens heredados (`muted`, `foreground`…) por la escala de grises

## 3. Admin: adaptadores de `src/components/ui`

- [x] 3.1 `Button` sobre el paquete: `secondary`→`accent`, `outline`→`secondary`, `isLoading`→`loading`
- [x] 3.2 `Modal` sobre el paquete (traducción de `maxWidth`, `showCloseButton`); `Modal.spec.tsx` en verde sin cambios
- [x] 3.3 `Input` (con `error`), `Select`, `Pagination` y `Card` (con sus subpartes) sobre el paquete
- [x] 3.4 `Toaster` de `sonner` con las clases de marca
- [x] 3.5 `npm test` y `tsc -b` en verde

## 4. Admin: Navbar, Layout y login

- [x] 4.1 `Navbar.tsx` como configuración del `Navbar` del paquete: marca «Rymel Admin» al Dashboard, «Catálogos» y «Administración» por rol, cuenta con roles y «Cerrar sesión»
- [x] 4.2 Quitar «Recursos» (`/resources`) y «Configuración» (`/settings`); comprobar que todo enlace tiene ruta en `App.tsx`
- [x] 4.3 Sección activa por prefijo de ruta (`/bom/12` enciende «Catálogos» → Materiales)
- [x] 4.4 Eliminar `NavDropdown.tsx`; `Layout.tsx` con opción `bare` (sin contenedor): las páginas migradas ponen su `PageHeader` + `Page`, las demás siguen en el contenedor hasta su grupo
- [x] 4.5 Login con la composición del cliente (banda índigo, marca, tarjeta con `Field`/`Input`)
- [x] 4.6 Prueba de la barra: secciones según rol, sin enlaces retirados, menú móvil cierra al navegar

## 5. Admin: listados

- [x] 5.1 Usuarios
- [x] 5.2 Materiales (`BomListPage`)
- [x] 5.3 Diseños (`DesignListPage`)
- [x] 5.4 Fórmulas
- [x] 5.5 Plantillas
- [x] 5.6 Semielaborados
- [x] 5.7 Fantasmas
- [x] 5.8 Reglas de código
- [x] 5.9 Pruebas de páginas en verde

## 6. Admin: detalle, editores y Dashboard (solo marco)

- [x] 6.1 Detalle de diseño: `PageHeader` con código, etiquetas y acciones; pestañas del sistema
- [x] 6.2 Editor de materiales, editor de plantillas y editor de fantasmas: `PageHeader` y acciones; el cuerpo intacto. El de plantillas usa una banda índigo compacta (una fila) para no quitarle alto a la grilla
- [x] 6.3 Dashboard con tarjetas de acceso del sistema de diseño, generadas desde `navSections` (sin los contadores en 0 ni los accesos sin función de antes)
- [x] 6.4 Pasar los `blue-*` restantes al índigo de marca fuera de grillas y editores. El azul del tipo de nodo «Referencia» se queda: es dato de categoría, el mismo que pinta el árbol

## 7. Cierre

- [x] 7.1 `npm test`, `tsc -b` y `npm run build` en verde
- [x] 7.2 Revisión visual de todas las pantallas (escritorio y móvil) contra el cliente — hecha por el equipo con sesión
