## MODIFIED Requirements

### Requirement: El cliente conserva la lista

`project-front` SHALL ofrecer la pestaña «LISTA DE MATERIALES», generada con las mismas reglas que el admin, y SHALL mostrarla en solo lectura por omisión. El diseñador SHALL poder pasar a edición de forma explícita para ajustarla. La estructura de la lista (estructuras BOM y configuración de la plantilla) SHALL seguir definiéndose solo en el admin: nada de lo que se ajusta en el cliente la cambia.

#### Scenario: Pestaña en solo lectura

- **WHEN** un diseñador abre el diseño 28 y genera su lista
- **THEN** ve la lista con la estructura `1-25-220-120`, y escribir en una celda no la cambia

#### Scenario: Pasar a edición

- **WHEN** el diseñador pulsa «Editar» y cambia la cantidad de un ítem por `=3*4`
- **THEN** la celda muestra 12

#### Scenario: Desplegar solo en lectura

- **WHEN** la hoja está en edición
- **THEN** las celdas ▶/▼ de los semielaborados hijos no despliegan ni pliegan, y lo editado no se pierde

#### Scenario: Ajustar no cambia la estructura

- **WHEN** el diseñador ajusta y guarda la lista del diseño 28
- **THEN** la estructura BOM `1-25-220-120` y la plantilla quedan igual, y el admin en `/design-bom` sigue generando la misma lista

## ADDED Requirements

### Requirement: Las dos listas coinciden

Mientras la lista se arme en el cliente y en el admin, las dos copias de `buildBomSummary` SHALL producir la misma lista generada para los mismos datos. Un cambio de regla SHALL hacerse en las dos a la vez.

#### Scenario: Mismo diseño en los dos lados

- **WHEN** se arma la lista de los `sub_design` 90 y 91 en el cliente (`check-design-bom.ts`) y en el admin (`buildBomSummary.spec.ts`)
- **THEN** las dos coinciden con la misma línea base
