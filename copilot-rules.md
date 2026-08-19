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
"@rymel/formula-engine": "github:JaviAPS94/rymel-formula-engine#v1.5.0"
```

El mismo paquete lo usan `project-back` (para recalcular diseños en el
servidor) y `project-front` (el diseñador tipo Excel). Vive fuera de estos
repositorios porque el mismo cálculo tiene que dar el mismo número en los
tres: un diseño recalculado en el servidor debe coincidir con lo que el
usuario vio en pantalla.

**No copies código del motor a este repositorio.** Si falta una función, se
añade al paquete y se publica un tag nuevo.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de `project-back`. Por omisión `http://localhost:3000`. |

## Notas Adicionales

- Priorizar accesibilidad (a11y)
- Optimizar imágenes y assets
- Lazy loading para rutas/componentes grandes
- Mantener bundle size bajo control
