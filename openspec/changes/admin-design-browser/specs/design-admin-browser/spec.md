## ADDED Requirements

### Requirement: Listado de diseños con filtros

El admin SHALL ofrecer, solo a administradores, una sección «Diseños» con un listado paginado de todos los diseños activos. Cada fila SHALL mostrar el código, el nombre, el tipo y el subtipo, la norma, el país, los elementos con su referencia ERP, la fecha de creación y la de actualización, si alguna de sus hojas está desactualizada y si su lista de materiales la ajustó el cliente. El listado SHALL filtrarse por código o nombre, norma, país, tipo, subtipo, referencia ERP del elemento, rango de fechas (de creación o de actualización), desactualizado y con lista ajustada. Los filtros SHALL combinarse, y cambiar uno SHALL volver a la primera página.

#### Scenario: Todos los diseños

- **WHEN** el administrador abre la sección sin filtros
- **THEN** ve los 21 diseños activos, paginados y ordenados del más reciente al más antiguo

#### Scenario: Filtros combinados

- **WHEN** el administrador elige una norma y marca «desactualizado»
- **THEN** ve solo los diseños con algún elemento de esa norma y alguna hoja desactualizada

#### Scenario: Acceso

- **WHEN** un usuario sin rol de administrador intenta abrir la sección o llamar a `POST /admin/designs`
- **THEN** no puede (403 en la ruta)

### Requirement: Detalle de solo lectura

Al abrir un diseño, el admin SHALL mostrar toda su información en solo lectura:

- la cabecera (código, nombre, tipo, subtipo y fechas);
- los elementos con su referencia ERP, su norma, su país y sus características técnicas;
- las hojas de diseño y las de costos, como hoja de cálculo que no se puede editar;
- el estado de versiones de cada hoja (fórmulas usadas y si está desactualizada);
- la lista de materiales tal como la ve el cliente: la ajustada, con autor y fecha, si la ajustó, o si no la generada a partir de su plantilla y su elemento.

#### Scenario: Ver las hojas

- **WHEN** el administrador abre el diseño 28 y elige su hoja de diseño
- **THEN** ve sus celdas con los valores calculados, y escribir en ellas no cambia nada

#### Scenario: Lista ajustada

- **WHEN** el cliente ajustó la lista del diseño y el administrador la abre
- **THEN** ve la lista ajustada, marcada como ajustada, con autor y fecha, y sin acciones para modificarla

#### Scenario: Lista sin estructura

- **WHEN** el diseño no tiene ajuste y ninguna estructura BOM coincide con la referencia de su elemento
- **THEN** la sección de lista de materiales lo dice, y el resto del detalle se ve igual

### Requirement: Desactivar un diseño

El administrador SHALL poder desactivar un diseño (borrado lógico, `DELETE /design/:id`) después de confirmarlo. Un diseño desactivado SHALL dejar de aparecer en el listado del admin y en el del cliente.

#### Scenario: Confirmar

- **WHEN** el administrador pulsa «Desactivar» y confirma
- **THEN** el diseño sale del listado, y sus hojas y su lista ajustada quedan borradas lógicamente

#### Scenario: Cancelar

- **WHEN** el administrador cancela la confirmación
- **THEN** no cambia nada

### Requirement: Recalcular un diseño desactualizado

Para un diseño con alguna hoja desactualizada, el administrador SHALL poder primero **simular** el recálculo y ver, por hoja, si se recalcularía, si quedaría sin cambios, si se omitiría o si fallaría, y después **aplicarlo**. El recálculo SHALL seguir las reglas de `design-recalculation`: transaccional por hoja, los valores manuales intactos y registrado con el usuario que lo pidió.

#### Scenario: Simular y aplicar

- **WHEN** el administrador simula el recálculo de un diseño con una hoja desactualizada y después lo aplica
- **THEN** la simulación no escribe nada y muestra el resultado previsto; al aplicar, la hoja queda con la versión vigente y deja de estar desactualizada

#### Scenario: Sin hojas desactualizadas

- **WHEN** el diseño no tiene hojas desactualizadas
- **THEN** la acción de recalcular no está disponible

### Requirement: Exportar un diseño

El administrador SHALL poder exportar un diseño a un archivo Excel (`.xlsx`) con una pestaña por hoja de diseño, una por hoja de costos y una con la lista de materiales que ve el cliente, con los valores calculados.

#### Scenario: Exportar

- **WHEN** el administrador exporta el diseño 28
- **THEN** descarga un `.xlsx` con sus hojas de diseño, sus hojas de costos y su lista de materiales, cada una en su pestaña

### Requirement: Una sola regla para la lista de materiales

La regla con la que se arma la lista de materiales (`buildBomSummaryCells`) y su huella SHALL vivir en `@rymel/design-template`, y el cliente y el admin SHALL importarlas de ahí. El cambio SHALL NOT alterar la lista que ve el cliente.

#### Scenario: Sin cambios en el cliente

- **WHEN** el cliente pasa a importar la regla del paquete
- **THEN** `check-bom-cases.ts` y `check-design-bom.ts` siguen dando su línea base
