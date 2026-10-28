# Instrucciones de Desarrollo - Project Admin

## Stack Tecnológico

- **Frontend**: React 18+ con TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm

### Librerías Principales

- **Router**: Wouter
- **Estilos**: TailwindCSS
- **Componentes UI**: Shadcn UI
- **Iconos**: Tabler Icons
- **Estado Global**: Zustand
- **Data Fetching**: Tanstack Query
- **Formularios**: Conform
- **Autenticación**: Better Auth

### Librerías Adicionales

- **Gráficas**: Nivo
- **Animaciones**: Motion
- **Notificaciones**: Sonner
- **Drag & Drop**: DnDKit
- **Estado en URL**: nuqs
- **i18n**: react-i18next
- **3D**: React Three Fiber
- **Testing**: Vitest + Testing Library

## Convenciones de Código

### Estructura de Componentes

- Usar functional components con hooks
- Usar functional components como arrow functions
- Componentes en PascalCase: `UserProfile.tsx`
- Un componente por archivo
- Props con TypeScript interfaces

### Estilos con Tailwind

- Usar clases de utilidad de Tailwind
- Evitar CSS personalizado cuando sea posible
- Usar `className` en lugar de inline styles
- Responsive design: mobile-first (sm, md, lg, xl)

### Organización de Archivos

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas/vistas principales
├── hooks/         # Custom hooks
├── services/      # API calls y lógica de negocio
├── types/         # TypeScript types/interfaces
├── utils/         # Funciones auxiliares
└── constants/     # Constantes y configuraciones
```

## Reglas de Desarrollo

### TypeScript

- Siempre tipar props, estados y funciones
- Usar interfaces para objetos complejos
- Evitar `any`, usar `unknown` si es necesario

### React Best Practices

- Usar hooks modernos (useState, useEffect, useContext, etc.)
- Memoizar componentes pesados con `React.memo`
- Extraer lógica compleja a custom hooks
- Mantener componentes pequeños y enfocados

### Nombres y Comentarios

- Variables y funciones en camelCase
- Constantes en UPPER_SNAKE_CASE
- Comentarios en español para explicar lógica compleja
- JSDoc para funciones públicas importantes

## Patrones de Diseño

### Estado Global

- Context API para estado compartido simple
- Considerar Zustand o Redux para estado complejo

### Manejo de Errores

- Try-catch en operaciones asíncronas
- Boundary errors para componentes
- Mensajes de error informativos al usuario

### Formularios

- Validación de inputs
- Feedback visual claro
- Disabled states durante submit

## Comandos Útiles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview del build
npm run lint         # Linting
```

## Motor de fórmulas

La grilla de ítems fantasma no evalúa fórmulas por su cuenta: usa
`@rymel/formula-engine`, fijado a un **tag inmutable** en `package.json`.

```json
"@rymel/formula-engine": "github:JaviAPS94/rymel-formula-engine#v1.6.0"
```

El mismo paquete lo usan `project-back` (para recalcular diseños en el
servidor) y `project-front` (el diseñador tipo Excel). Vive fuera de estos
repositorios porque el mismo cálculo tiene que dar el mismo número en los
tres: un diseño recalculado en el servidor debe coincidir con lo que el
usuario vio en pantalla.

**No copies código del motor a este repositorio.** Si falta una función, se
añade al paquete y se publica un tag nuevo.

## Plantillas de diseño

Las plantillas —la base sobre la que los diseñadores calculan— **se
administran aquí**. `project-front` las carga; este repositorio es donde se
escriben, se validan y se publican.

Su contrato vive en otro paquete, con la misma regla que el motor:

```json
"@rymel/design-template": "github:JaviAPS94/rymel-design-template#v2.1.0"
```

**No declares tipos de plantilla en este repositorio ni traduzcas la forma
persistida a mano.** `src/types/template.types.ts` reexporta el modelo del
paquete y solo añade la forma de las peticiones de la API.

No es una preferencia de estilo. Mientras cada consumidor tenía su propia
versión de la plantilla, uno escribía `templateHiddenRows` y otro leía
`hiddenRows`: las filas que un autor ocultaba reaparecían en la pantalla del
diseñador, y nadie lo notó durante meses porque los dos lados «funcionaban».

Lo que el paquete decide, y aquí no se rehace:

- los tipos del documento, la hoja y la celda;
- la traducción entre lo guardado y el modelo canónico;
- qué se descarta al normalizar y qué cuenta como contenido;
- la validación completa, que es la misma que corre en el servidor.

### Estados y publicación

Una plantilla nace en `DRAFT` y solo se ve en la biblioteca del diseñador
cuando se publica. Editar una publicada trabaja sobre su borrador: lo que los
diseñadores cargan no cambia hasta publicar de nuevo.

El corte de la biblioteca es reversible desde `project-back` con
`TEMPLATE_LIBRARY_PUBLISHED_ONLY=false`.

### Qué configura la plantilla y qué es del diseñador

Todo lo que decide **cómo se calcula y qué materiales lleva** un
transformador es de la plantilla y se configura aquí, con el menú contextual
de la rejilla o con los paneles: celdas combinadas, paneles inmovilizados,
notas, etiquetas MO/MD, `goTo`, rangos con nombre, zonas de semielaborado,
tablas de catálogo, condiciones de catálogo, ítem vinculado y zonas de solo
lectura. `project-front` no tiene ninguna acción que las escriba.

Al diseñador le quedan dos cosas, y no se mueven aquí:

- **ocultar** celdas, filas o columnas, que es estado de su sesión y el
  contrato no transporta;
- **seguir** un «Ir a tabla» ya configurado, que es navegación.

La razón es de datos, no de permisos: un diseño guarda una copia de sus hojas,
así que lo que el diseñador configuraba se quedaba en ese diseño y no volvía
nunca a la plantilla. Cuando se movió, de 33 diseños solo 2 —de prueba— tenían
configuración de BOM, y ninguna plantilla. Si algo tiene que variar de un
diseño a otro, se resuelve en la plantilla (por ejemplo, con un vínculo
calculado), no devolviéndole al diseñador la escritura.

Las zonas de solo lectura se cumplen en tres sitios con **una sola regla**,
`isReadOnly` del contrato: el editor las señala, el diseñador no deja
escribir en ellas y `project-back` rechaza la actualización de un diseño que
las altere. La acción de proteger está encendida por omisión; se apaga con
`VITE_READ_ONLY_ZONES=false` en un despliegue donde el diseñador vaya por
detrás.

El menú contextual y los paneles escriben por las mismas mutaciones
(`updateCell`, `setSheetStyles`, `setMaterialTag`) y los mismos formularios
(`RegionForms.tsx`). Una acción nueva se añade una vez y se ofrece en los dos.

### Lista de materiales

**La base la define la plantilla.** En el editor de plantillas el admin
declara las zonas de semielaborado, las tablas de catálogo y los ítems
vinculados. Las estructuras BOM se administran en `/bom`. La **norma** del
cliente aporta los accesorios de cada elemento, cada uno con su
semielaborado. Cuando el cliente usa la plantilla, la estructura se busca por
prefijo de la referencia ERP del elemento y la lista se arma con
`buildBomSummaryCells` de **`@rymel/design-template`** (desde v2.3.0), la
única regla: la usan el diseñador y la sección «Diseños» de aquí. Un cambio
de regla se hace en la librería, con sus casos (`test/fixtures/bom-cases.json`),
y los dos repos suben el tag a la vez. El diseñador la ve en solo lectura y,
con «Editar», añade filas o la ajusta; sus ajustes se guardan con el diseño
en `design_bom_adjustment`.

El admin no edita ni revisa la lista diseño por diseño: la ve, tal como la ve
el cliente, en el detalle de un diseño. Hubo una sección `/design-bom` por
diseño y se retiró el 2026-10-27: partía de un malentendido.

### Diseños

`/designs` lista los diseños del cliente (`POST /admin/designs`, solo ADMIN,
sin el contenido de las hojas) con filtros por código o nombre, norma, país,
tipo, subtipo, referencia ERP, fechas, desactualizado y con lista ajustada.
`/designs/:id` lo muestra todo en **solo lectura**: elementos, hojas de
diseño y de costos en la rejilla del editor (`ReadOnlySheet`, que no abre la
edición), versiones de fórmulas (`GET /admin/designs/:id/versions`) y la
lista de materiales. El admin no recalcula fórmulas en el navegador: muestra
el `computed` que guardó el diseñador.

Acciones: desactivar (borrado lógico, con confirmación), recalcular
(`POST /admin/designs/:id/recalculate`, primero `dryRun` y solo después
aplicar: reescribe números que alguien ya vio) y exportar a Excel (ExcelJS,
cargado con `import()` para que no pese en el resto del admin).

## Deuda conocida

### Dos rejillas de hoja de cálculo

Existen dos: la de `project-front` (`SpreadSheet.tsx`, ~6300 líneas) y la de
este repositorio (`components/template/grid/`). Es deliberado — la del
diseñador está entrelazada con su elemento, su panel de código y su BOM, y no
se puede tomar sin llevarse todo lo demás.

Se acota con una regla: **ninguna lógica de cálculo, serialización o
validación vive en la capa de interfaz.** Toda está en los dos paquetes.
Mientras eso se cumpla, lo que se duplica son estilos, no números.

Extraer una rejilla compartida (`@rymel/spreadsheet-ui`) se plantea **cuando
el editor y el diseñador empiecen a pedir las mismas funciones** — cuando una
misma necesidad haya que implementarla dos veces más de una vez. Hasta
entonces, el coste del paquete compartido supera al de las dos rejillas.

### Campos espejo del contrato

El contrato escribe cuatro campos por duplicado mientras `project-front` no lo
consuma del todo. Están declarados en `DEPRECATED_FIELDS`, con quién los lee, y
una prueba impide que la declaración y el serializador diverjan. Retirarlos es
versión mayor del contrato.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de `project-back`. Por omisión `http://localhost:3000`. |
| `VITE_READ_ONLY_ZONES` | Zonas de solo lectura, encendidas por omisión. `false` las apaga si el diseñador desplegado aún no las cumple. |

## Notas Adicionales

- Priorizar accesibilidad (a11y)
- Optimizar imágenes y assets
- Lazy loading para rutas/componentes grandes
- Mantener bundle size bajo control
