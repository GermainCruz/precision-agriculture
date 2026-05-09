# Guía: conectar AgriPrecision (sin Docker) con n8n local

Esta guía asume **Windows**, **Node.js** instalado y que **no** usas Docker para n8n. El proyecto usa el script `n8n-local.mjs` y la carpeta `n8n-workflows/n8n-local-data/` para los datos internos de n8n (SQLite).

---

## 1. Qué se “conecta” en realidad

| Pieza | Rol |
|--------|-----|
| **PostgreSQL** (`agricultura_db`) | Misma base que usa el **backend** del proyecto. Los workflows escriben aquí (por ejemplo `workflow_ejecucion`, `lectura_sensor`). |
| **n8n** (proceso local) | Orquestador: lee APIs, ejecuta SQL con una **credencial Postgres** que tú creas en la UI de n8n. |
| **`.env` en la raíz del repo** | Solo algunas variables para n8n (`N8N_*`, OpenWeather, etc.). **No** debe pisar tu `DATABASE_URL` del backend (el script está diseñado para eso). |
| **`backend/.env`** | Aquí va tu `DATABASE_URL` hacia `localhost` (o el host de tu Postgres). El script `n8n-local.mjs` lo lee para **mostrarte** host, puerto, usuario y base al crear la credencial en n8n. |

n8n **no** se “conecta” al backend HTTP por defecto: se conecta a la **base de datos** si tú configuras la credencial Postgres en los nodos.

---

## 2. Requisitos previos

1. **PostgreSQL** en marcha, con la base **`agricultura_db`** creada y el esquema cargado (según el README del repo / `Database/create_database.sql`).
2. **`backend/.env`** con `DATABASE_URL` correcta, por ejemplo:
   - `postgresql://USUARIO:CLAVE@localhost:5432/agricultura_db`
3. **Node.js 18+** (recomendado LTS).
4. Cerrar cualquier ventana donde ya esté corriendo n8n antes de ejecutar **`import`** (ver sección 7).

---

## 3. Archivos `.env` (dos ubicaciones)

| Archivo | Qué poner |
|---------|-----------|
| **`precision-agriculture/backend/.env`** | `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `ML_SERVICE_URL` (en local suele ser `http://127.0.0.1:5000`), etc. |
| **`precision-agriculture/.env`** (raíz del repo) | `N8N_ENCRYPTION_KEY`, `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD`, opcional `OPENWEATHER_API_KEY`. |

**Importante:** el archivo **`.env` raíz está en `.gitignore`**. No subas credenciales al repositorio. Copia plantillas desde `.env.example` y rellena solo en tu máquina.

---

## 4. Credenciales: dos capas distintas

### 4.1 Basic Auth (navegador)

Es el cuadro de usuario/contraseña **antes** o **al entrar** a la URL de n8n (según versión). La controlan las variables de entorno:

- `N8N_BASIC_AUTH_USER`
- `N8N_BASIC_AUTH_PASSWORD`

Puedes usar tu correo como usuario de Basic Auth, por ejemplo:

- `N8N_BASIC_AUTH_USER=germalexcv@gmail.com`
- `N8N_BASIC_AUTH_PASSWORD=` *(la contraseña que elijas; ponla solo en `.env` local, no en documentos versionados)*

### 4.2 Cuenta “propietario” dentro de n8n (UI)

Si n8n te pide **registro o inicio de sesión** dentro de la aplicación (correo + contraseña del producto), eso va en la **base interna** de n8n (`n8n-local-data`), **no** se sustituye solo con las variables `N8N_BASIC_AUTH_*`. Puedes usar el mismo correo y una contraseña que recuerdes; Basic Auth y login interno pueden convivir.

---

## 5. `N8N_ENCRYPTION_KEY`: una sola clave, siempre la misma

n8n cifra credenciales y datos sensibles con **`N8N_ENCRYPTION_KEY`**. Esa cadena debe:

- Tener **al menos ~32 caracteres**.
- Ser **la misma** en cada arranque e importación que use la misma carpeta **`n8n-workflows/n8n-local-data/`**.
- Si la cambias respecto a la clave con la que se creó esa carpeta, aparece el error de **claves no coincidentes** (siguiente sección).

---

## 6. Error: `Mismatching encryption keys`

### Qué significa

El archivo de configuración dentro de:

`n8n-workflows/n8n-local-data/.n8n/config`

quedó asociado a **una** clave de cifrado, pero al ejecutar `node n8n-local.mjs import` la variable de entorno **`N8N_ENCRYPTION_KEY`** es **otra** (por ejemplo la definiste en `.env` raíz después de haber arrancado n8n la primera vez con la clave por defecto del script).

**Actualización del proyecto:** el script `n8n-local.mjs` intenta **leer la clave desde `.n8n/config`** y alinear `N8N_ENCRYPTION_KEY` antes de arrancar n8n, para evitar este error sin borrar datos. Si ves un aviso en consola, copia la misma clave a tu `.env` raíz para que todo quede consistente.

### Solución A — Conservar la carpeta `n8n-local-data` (si ya tienes flujos/credenciales)

#### Atajo típico en este repositorio

Si la primera vez que arrancaste n8n **no** tenías `N8N_ENCRYPTION_KEY` en el `.env` raíz, el script `n8n-local.mjs` usó esta clave por defecto:

```text
local-n8n-agriprecision-key-min-32-chars-change-me-ok
```

Si después añadiste al `.env` raíz **otra** `N8N_ENCRYPTION_KEY` (por ejemplo una cadena larga nueva), aparece el error de mismatch. Para alinear sin borrar datos, en **`.env` raíz** deja:

```env
N8N_ENCRYPTION_KEY=local-n8n-agriprecision-key-min-32-chars-change-me-ok
```

Guarda el archivo, cierra n8n y vuelve a ejecutar `node n8n-local.mjs import`.

*(Si tú ya habías definido otra clave desde el primer arranque, entonces la que vale es la que quedó grabada en tu instancia; en ese caso usa la **Solución A avanzada** o la **B**.)*

#### Solución A avanzada

1. Abre el archivo que indica el propio error, normalmente:
   - `n8n-workflows/n8n-local-data/.n8n/config`
2. Comprueba la documentación de tu versión de n8n sobre dónde queda persistida la clave ([encryption key](https://docs.n8n.io/hosting/environment-variables/configuration-methods/#encryption-key)).
3. Copia **exactamente** la clave que corresponda a tu **`.env` raíz`** como `N8N_ENCRYPTION_KEY=...`
4. Con n8n cerrado: `node n8n-local.mjs import`

Si no encuentras la clave o dudas, usa la **Solución B**.

### Solución B — Empezar limpio (recomendada si aún no tienes flujos importantes)

1. **Cierra** n8n (ventana donde corre `run-local.bat` o `node n8n-local.mjs`).
2. Borra la carpeta completa:
   - `n8n-workflows/n8n-local-data`
3. En **`.env` raíz** define una **`N8N_ENCRYPTION_KEY`** larga y **no la cambies** en adelante (o guárdala en un gestor de contraseñas).
4. Desde `n8n-workflows`, ejecuta:
   - `node n8n-local.mjs import`
5. Luego arranca la UI:
   - `run-local.bat`  
   o  
   - `node n8n-local.mjs`
6. Completa el asistente de n8n si te lo pide (propietario / cuenta interna).

**Advertencia:** borrar `n8n-local-data` elimina workflows y credenciales guardadas **solo en n8n** (no borra `agricultura_db`).

---

## 7. Orden recomendado: importar workflows

1. Asegura **`.env` raíz** con `N8N_ENCRYPTION_KEY` estable y `N8N_BASIC_AUTH_*` si los usas.
2. Asegura **`backend/.env`** con `DATABASE_URL` válida.
3. **Cierra** cualquier instancia de n8n.
4. En PowerShell:

```powershell
cd "RUTA\precision-agriculture\n8n-workflows"
node n8n-local.mjs import
```

5. Si no hay error, inicia n8n:

```powershell
.\run-local.bat
```

6. Abre **http://localhost:5678** y autentícate con Basic Auth (usuario/contraseña de tu `.env` raíz).

---

## 8. Credencial Postgres dentro de n8n (conexión al proyecto)

En n8n: **Credentials → Postgres** (nombre sugerido: `Postgres Agricultura`).

Usa los **mismos** datos que en `DATABASE_URL` del `backend/.env`:

| Campo | Valor típico en local |
|--------|------------------------|
| Host | `localhost` |
| Puerto | `5432` |
| Database | `agricultura_db` |
| User / Password | Los de tu cadena `DATABASE_URL` |

La carpeta **`n8n-local-data`** no es el “host” de Postgres: es solo el almacenamiento interno de n8n.

Asigna esta credencial a **cada nodo Postgres** de los workflows importados y guarda.

---

## 9. Probar que todo habla con la base

1. Abre el workflow tipo **latido** (nombre similar a `AgriPrecision — latido n8n`).
2. **Execute workflow**.
3. En Postgres, revisa la tabla **`workflow_ejecucion`** (debe aparecer una fila nueva si el SQL del workflow es el esperado).

---

## 10. OpenWeather (`workflow-climate-ingest.json`)

1. Define **`OPENWEATHER_API_KEY`** en el **`.env` raíz** del repositorio (misma carpeta que `docker-compose.yml`). También puedes ponerla en **`backend/.env`**; el script `n8n-local.mjs` carga primero `backend/.env` y luego fusiona variables permitidas desde el `.env` raíz (si la misma clave está en ambos, gana el `.env` raíz para `OPENWEATHER_API_KEY`).
2. Arranca n8n **solo** con **`run-local.bat`** o **`node n8n-local.mjs`** desde `n8n-workflows`, para que el proceso herede la variable. Si abres `npx n8n` a mano sin esas variables, el nodo HTTP no tendrá la clave.
3. El workflow usa la expresión **`{{ $env.OPENWEATHER_API_KEY }}`** en el parámetro `appid`. El script local fuerza **`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`** para que `$env` funcione en nodos y expresiones.
4. En consola deberías ver una línea del estilo `OPENWEATHER_API_KEY lista para $env` (valor **enmascarado**). Reinicia n8n tras cambiar el `.env`.

---

## 11. Checklist rápido

- [ ] `backend/.env` → `DATABASE_URL` correcta.
- [ ] `.env` raíz → `N8N_ENCRYPTION_KEY` fija y coincidente con la carpeta `n8n-local-data` (o carpeta borrada y clave nueva una sola vez).
- [ ] `.env` raíz → `N8N_BASIC_AUTH_*` si usas Basic Auth (contraseña solo en `.env`).
- [ ] `.env` raíz (o `backend/.env`) → `OPENWEATHER_API_KEY` para el workflow de clima; arranque con `run-local.bat`.
- [ ] n8n **cerrado** antes de `node n8n-local.mjs import`.
- [ ] Credencial Postgres creada en n8n y asignada a los nodos.
- [ ] Prueba de ejecución del workflow y verificación en BD.

---

## 12. Seguridad

- No pegues **contraseñas reales** en archivos `.md` del repo ni en chats públicos.
- Si una contraseña quedó expuesta, **cámbiala** y actualiza solo tu `.env` local.

Para más contexto del repo, sigue también **`n8n-workflows/README.md`** y la sección de n8n del **`README.md`** principal.
