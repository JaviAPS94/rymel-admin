---
name: respaldo-bdd
description: Genera un respaldo .bak verificado de la base SQL Server `project` de Rymel (contenedor Docker `sqlserver`) y lo copia a Rymel/backups/. Úsala cuando el usuario pida «respaldo», «backup», «.bak» o «sacar copia de la base», y siempre ANTES de correr una migración, un script de datos o un RESTORE sobre la base real.
---

# Respaldo de la base `project`

La base del sistema Rymel es SQL Server, corre en el contenedor Docker `sqlserver` y la usa `project-back` (conexión en `project-back/.env`). Los respaldos se guardan en `/Users/alex.pinaida/Resplados/Code/Rymel/backups/` con el nombre `project_AAAAMMDD_HHMM[_motivo].bak`.

## Generar un respaldo

```bash
node /Users/alex.pinaida/Resplados/Code/Rymel/project-admin/.claude/skills/respaldo-bdd/scripts/respaldo.mjs "<motivo opcional>"
```

- El motivo es corto y descriptivo, por ejemplo `antes migracion autoria`. Se normaliza a `antes_migracion_autoria`.
- El script hace, en orden:
  1. Comprueba que Docker y el contenedor estén arriba.
  2. Ejecuta `BACKUP DATABASE ... WITH COPY_ONLY, INIT, FORMAT, CHECKSUM`.
  3. Ejecuta `RESTORE VERIFYONLY ... WITH CHECKSUM`.
  4. Copia el archivo con `docker cp` y borra la copia del contenedor.
- Usa el driver `mssql` que ya está en `project-back/node_modules`. No necesita `sqlcmd`.
- La contraseña se lee de `.env` y nunca se imprime. No la copies en comandos ni en archivos.

Si falla:
- «Docker no está corriendo»: ejecuta `open -a Docker`, espera a que `docker info` responda y reintenta.
- «Contenedor detenido»: ejecuta `docker start sqlserver`.
- Si el `docker cp` falla, el `.bak` queda en `/var/opt/mssql/data/` dentro del contenedor. El script imprime la ruta.

Para ver los respaldos existentes: `node .../respaldo.mjs --listar`.

Al terminar, informa al usuario la ruta completa del `.bak` y su tamaño.

## Restaurar (solo con confirmación explícita)

Restaurar **sobrescribe la base entera**. No lo hagas por iniciativa propia. Antes de restaurar:
1. Haz un respaldo del estado actual con motivo `antes_restore`.
2. Pide confirmación al usuario indicando qué archivo se va a restaurar.

```bash
docker cp /Users/alex.pinaida/Resplados/Code/Rymel/backups/<archivo>.bak sqlserver:/var/opt/mssql/data/<archivo>.bak
```

Después, conectado a `master` (con un script de un solo uso en el scratchpad que use el mismo driver):

```sql
ALTER DATABASE [project] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [project] FROM DISK = N'/var/opt/mssql/data/<archivo>.bak' WITH REPLACE, CHECKSUM;
ALTER DATABASE [project] SET MULTI_USER;
```

Si el `RESTORE` falla, la base puede quedar en `SINGLE_USER`. Ejecuta el `SET MULTI_USER` de todas formas.
