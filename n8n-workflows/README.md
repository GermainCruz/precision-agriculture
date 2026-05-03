# Workflows n8n — AgriPrecision

JSON para **importar** en n8n. Scripts locales automatizan carga de variables, arranque e import CLI.

---

## Opción A — Local **sin Docker**

### Requisitos

- Node.js **18+** (`node -v`).
- PostgreSQL en tu PC con la base **`agricultura_db`** (la del backend).
- Para probar el flujo de clima: al menos un sensor **`tipo = 'clima'`** (p. ej. `Database/datos.sql`).

### Primera vez: import rápido (opcional)

1. **Cierra** n8n si estaba abierto.
2. Ejecuta **`import-workflows.bat`** (usa la misma carpeta `n8n-local-data` que el arranque).
3. Luego **`run-local.bat`**.

Igual tienes que **asignar la credencial Postgres** en cada nodo en la interfaz.

### Arrancar n8n (`run-local.bat` → `n8n-local.mjs`)

- Lee **`backend/.env`** completo y, desde el **`.env` raíz del repo**, **solo**: `OPENWEATHER_API_KEY`, `N8N_ENCRYPTION_KEY`, `N8N_BASIC_AUTH_*`, `WEBHOOK_URL`, `N8N_WEBHOOK_URL`, `N8N_SECURE_COOKIE` (así **no** se sobrescribe tu `DATABASE_URL` local si el `.env` raíz trae valores de Docker).
- Crea **`n8n-local-data/`** (SQLite), abre **http://localhost:5678**, usuario/contraseña de desarrollo `admin` / `admin123`.
- En consola muestra host, usuario y base inferidos de **`DATABASE_URL`** (sin mostrar contraseña).

**Línea de comandos:**

```bash
cd n8n-workflows
node n8n-local.mjs           # iniciar
node n8n-local.mjs import    # importar JSON con n8n cerrado
```

### Credencial Postgres en n8n (datos de negocio)

**Credentials → Postgres**, nombre tipo **`Postgres Agricultura`**:

| Campo    | Normalmente en local    |
|----------|--------------------------|
| Host     | **`localhost`**          |
| Puerto   | **`5432`**               |
| Base     | **`agricultura_db`**     |
| Usuario/contraseña | los de **`DATABASE_URL` en backend/.env** |
| SSL      | Desactivado              |

La carpeta **`n8n-local-data`** es la base interna de n8n; **no** va en ese formulario.

### Firewall / antivirus

Permite Node en **localhost:5678** si no abre la página.

---

## Opción B — Docker Compose

1. **`docker compose up`** con **postgres** y **n8n**.
2. **`.env`** en la raíz con `OPENWEATHER_API_KEY`, `N8N_ENCRYPTION_KEY`; luego `docker compose restart n8n`.

Credencial Postgres hacia tus datos:

| Host | `postgres` | Base | `agricultura_db` | Usuario/contraseña | las del Compose (p. ej. admin / secure_password) |

Si falta la base **`n8n`** en Postgres (volumen antiguo):

```bash
docker compose exec postgres psql -U admin -d postgres -c "CREATE DATABASE n8n;"
docker compose restart n8n
```

---

## Pasos comunes (tras import y credencial)

### Abrir n8n

**http://localhost:5678** — **`admin`** / **`admin123`** (solo desarrollo).

### Importar workflows si no usaste `.bat`

- **Workflows → Import from File** → `workflow-heartbeat.json` y `workflow-climate-ingest.json`.

### Credencial en cada nodo Postgres

En cada workflow, cada nodo Postgres → **Credential** → tu credencial → **Save**.

### Probar latido

Workflow **AgriPrecision — latido n8n** → **Execute workflow** → revisar tabla **`workflow_ejecucion`**.

### Probar clima

Con **`OPENWEATHER_API_KEY`** definida donde corre n8n: ejecutar el workflow de ingesta o esperar el cron de 6 h → **`lectura_sensor`**.

### Activar

Interruptor **Active** → **On** cuando todo esté probado.

---

## Archivos

| Archivo | Uso |
|---------|-----|
| `n8n-local.mjs` | Fusiona `.env`, hints Postgres, `npx n8n` e `import`. |
| `run-local.bat` | Inicia (`node n8n-local.mjs`). |
| `import-workflows.bat` | Import CLI (con n8n cerrado). |
| `workflow-heartbeat.json` | Inserta fila en `workflow_ejecucion`. |
| `workflow-climate-ingest.json` | OpenWeather → `lectura_sensor`. |
