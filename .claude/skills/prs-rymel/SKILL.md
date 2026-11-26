---
name: prs-rymel
description: Abre (o actualiza) los pull requests de una misma rama en todos los repos de Rymel —project-back, project-admin, project-front, rymel-design-template, rymel-formula-engine, rymel-ui y secure-function-engine-api—, enlazados entre sí y con el orden de despliegue. Úsala cuando el usuario pida «crear los PRs», «abrir PRs en todos los repos» o «subir la rama a todos los proyectos».
---

# PRs coordinados en los repos de Rymel

Rymel está repartido en repos independientes de GitHub (owner `JaviAPS94`). Un mismo cambio suele usar el **mismo nombre de rama** en varios de ellos. Esta skill detecta en qué repos hay trabajo en esa rama, redacta un PR por repo y los enlaza entre sí.

## 1. Diagnóstico (solo lectura)

```bash
bash /Users/alex.pinaida/Resplados/Code/Rymel/project-admin/.claude/skills/prs-rymel/scripts/estado.sh [rama]
```

Si no se indica la rama, el script usa la rama actual de `project-admin`. Por cada repo muestra:
- la rama base;
- cuántos commits lleva la rama por delante y por detrás de la base;
- si la rama está empujada;
- si ya tiene PR;
- si hay cambios sin commit.

Un repo **entra** si tiene la rama local con al menos un commit por delante de la base. Los que no tienen la rama, o tienen 0 commits por delante, se omiten.

Detente y avisa si en un repo que entra:
- hay cambios sin commit. Pregunta si se hace commit antes; no lo hagas por tu cuenta.
- la rama va por detrás de la base. Menciónalo en el plan; no hagas rebase sin que te lo pidan.

## 2. Redactar cada PR

Para cada repo que entra, lee `git log` y `git diff origin/<base>...<rama> --stat`. Si hace falta entender el cambio, lee también el diff de los archivos clave. Con eso redacta:

- **Título**: en español, en el estilo de los commits del repo. Que diga qué cambia para quien usa el sistema, no el nombre de la rama.
- **Cuerpo** (en español):
  - `## Qué cambia`: 2–5 viñetas.
  - `## Por qué`: si existe un change de OpenSpec para esta rama (`project-admin/openspec/changes/<nombre>/`, o el mismo nombre en `archive/`), enlaza su `proposal.md` y resume el motivo.
  - `## Cómo probarlo`: comandos o pasos reales del repo (tests, `npm run build`, la pantalla que hay que abrir).
  - `## Despliegue`: el orden y las dependencias (ver abajo).
  - `## PRs relacionados`: se rellena en el paso 4.
  - Termina con la línea de atribución que indique la conversación.

**Orden de despliegue y merge.** Los paquetes compartidos se consumen por tag de GitHub (`github:JaviAPS94/<repo>#vX.Y.Z`):

1. `rymel-design-template`, `rymel-formula-engine` y `rymel-ui` van primero. Hay que mergearlos **y etiquetarlos**.
2. Después, cada consumidor actualiza el tag en su `package.json`. Comprueba que el `package.json` de la rama apunte al tag nuevo; si sigue en el viejo, avísalo.
3. Luego `secure-function-engine-api` y `project-back`, que pueden incluir migraciones. Recomienda la skill `respaldo-bdd` antes de correrlas.
4. Al final, `project-admin` y `project-front`.

## 3. Confirmar y crear

Abrir PRs es una acción visible para otros. **Muestra el plan** (repo → título, base, si hay que empujar, PR nuevo o existente) **y espera el sí del usuario**. Después, en cada repo:

```bash
git -C <repo> push -u origin <rama>
gh pr create -R <slug> --base <base> --head <rama> --title "<título>" --body-file <archivo en el scratchpad>
```

- Si el repo ya tiene un PR abierto para esa rama, no crees otro: actualiza su cuerpo con `gh pr edit`, pero solo si el usuario lo pidió o si falta la sección de PRs relacionados.
- Si el último PR de la rama está **mergeado** y la rama tiene commits nuevos por delante de la base, es normal: la rama se reutiliza. En ese caso se abre un PR nuevo desde la misma rama. Indícalo en el plan («PR nuevo; el #N anterior ya se mergeó») y redacta el cuerpo **solo con los commits posteriores a ese merge**.
- Si el PR está **cerrado sin merge**, avisa y no abras uno nuevo sin preguntar.
- No uses `--draft` salvo que el usuario lo pida. Nunca hagas merge.

## 4. Enlazar

Cuando tengas todas las URLs, edita **cada** PR (`gh pr edit <n> -R <slug> --body-file ...`). En la sección `## PRs relacionados` lista los demás con el formato `JaviAPS94/<repo>#<n>`, en el orden de despliegue.

## 5. Informe

Termina con una tabla: repo, PR (URL), estado (nuevo, actualizado u omitido y por qué) y el orden de merge.
