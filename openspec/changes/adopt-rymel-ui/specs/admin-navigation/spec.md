## ADDED Requirements

### Requirement: Secciones de la barra según el rol
La barra del admin SHALL ofrecer el Dashboard y dos menús: «Catálogos» (Materiales, Semielaborados, Fantasmas) y «Administración» (Usuarios, Reglas de código, Fórmulas, Plantillas, Diseños). Semielaborados, Reglas de código, Fórmulas, Plantillas y Diseños SHALL mostrarse solo a usuarios con rol `ADMIN`.

#### Scenario: Usuario ADMIN
- **WHEN** entra un usuario con rol `ADMIN`
- **THEN** «Catálogos» lista Materiales, Semielaborados y Fantasmas, y «Administración» lista Usuarios, Reglas de código, Fórmulas, Plantillas y Diseños

#### Scenario: Usuario sin rol ADMIN
- **WHEN** entra un usuario sin rol `ADMIN`
- **THEN** «Catálogos» lista Materiales y Fantasmas, y «Administración» lista solo Usuarios

### Requirement: Solo enlaces con destino
La barra MUST NOT ofrecer enlaces a rutas que la aplicación no tiene. «Recursos» (`/resources`) y «Configuración» (`/settings`) SHALL desaparecer de la barra.

#### Scenario: Enlaces retirados
- **WHEN** se abre cualquiera de los menús de la barra
- **THEN** no aparecen «Recursos» ni «Configuración»

#### Scenario: Todo enlace lleva a una ruta registrada
- **WHEN** se recorre cada enlace de la barra
- **THEN** su destino es una ruta declarada en `App.tsx`

### Requirement: Sección activa
La barra SHALL marcar como activa la sección o el menú que contiene la pantalla actual, incluidas las pantallas de detalle bajo su ruta (p. ej. `/bom/12` enciende «Catálogos» y su ítem Materiales).

#### Scenario: Detalle de una estructura
- **WHEN** la ruta actual es `/bom/12`
- **THEN** el menú «Catálogos» se muestra activo y, al abrirlo, Materiales aparece marcado

### Requirement: Identidad y sesión
La barra SHALL mostrar la marca «Rymel Admin» enlazada al Dashboard y un menú de cuenta con el nombre o correo del usuario, sus roles y la acción «Cerrar sesión».

#### Scenario: Cerrar sesión desde el menú de cuenta
- **WHEN** el usuario abre el menú de cuenta y elige «Cerrar sesión»
- **THEN** se ejecuta el cierre de sesión existente (`useLogout`)

### Requirement: Navegación en pantallas estrechas
En pantallas por debajo del punto `lg`, la barra SHALL sustituir los menús por un botón «Abrir menú» que despliega todas las secciones permitidas, la cuenta y «Cerrar sesión»; elegir un destino SHALL cerrar el menú.

#### Scenario: Navegar desde el menú móvil
- **WHEN** en pantalla estrecha el usuario abre el menú y elige Fantasmas
- **THEN** navega a `/phantom-items` y el menú se cierra
