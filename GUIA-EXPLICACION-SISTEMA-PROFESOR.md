# Guía para explicar **AgriPrecision** al profesor

Documento pensado como **guión oral**: puedes seguir los apartados en orden durante una demo o exposición.

---

## 1. Qué problema resuelve

**AgriPrecision** es una plataforma de **agricultura de precisión** para que un operador agrícola registre **fincas y lotes**, monitoree **datos ambientales/edáficos** vía sensores (reales o de demostración), reciba **recomendaciones de riego** con apoyo meteorológico, consulte **predicciones de rendimiento** cuando el servicio de ML está activo, genere **alertas**, y (según perfil) use **dashboard**, **reportes PDF** y **administración de usuarios**.

---

## 2. Arquitectura técnica (resumen para el profesor)

| Capa | Tecnología | Función |
|------|------------|--------|
| **Frontend** | Next.js (React) | Interfaz web: menús, formularios, gráficas, llamadas al API |
| **API** | NestJS + **tRPC** | Un solo punto de entrada tipado sobre HTTP (`/trpc`) |
| **Datos** | PostgreSQL + **Prisma** | Modelo relacional (usuarios, fincas, lotes, temporadas, sensores, lecturas, riego, predicciones, alertas, reportes, auditoría admin) |
| **ML** (opcional) | Servicio Flask (`ML_SERVICE_URL`) | Predicciones de rendimiento y, en algunos flujos, apoyo en recomendaciones de riego |
| **Clima en riego** | OpenWeather (si hay API key) y **Open-Meteo** (sin key, con coordenadas) | Pronóstico de precipitación reciente para orientar riego |

**Opcional fuera del core de la app:** workflows en **n8n** (carpeta `n8n-workflows`) para automatizar ingesta de clima u otras integraciones si el equipo lo monta.

---

## 3. Roles y permisos (aspecto muy importante para la defensa)

| Rol | Puede destacar ante el profesor |
|-----|-------------------------------|
| **Agricultor** | Gestiona fincas, lotes, temporadas, riego propio; ve **predicciones**, **monitoreo** y lecturas; **no** tiene dashboard agregado ni módulo de reportes PDF; **no** puede crear/editar/eliminar sensores (solo técnicos y administradores lo hacen desde el sistema). |
| **Técnico** | Todo lo anterior **más**: **dashboard**, **reportes**, **alertas completas**, **CRUD de sensores** sobre los lotes. |
| **Administrador** | Todo lo anterior **más**: **gestión de usuarios**, **activar/desactivar**, **asignación de rol** y **auditoría básica** de acciones administrativas. |

El **JWT** lleva el rol y el backend rechaza llamadas fuera del permiso correspondiente.

---

## 4. Módulos de la aplicación web (menú lateral)

Aquí tienes **qué decir** de cada pantalla cuando la muestres.

### 4.1 Inicio / modo invitado

- Quien entre sin login puede navegar parte del menú; las pantallas con datos muestran un aviso para identificarse.
- El landing orienta sobre el alcance del sistema.

### 4.2 Autenticación (`/login`, `/register`)

- **Registro / login**: credenciales, token en el cliente para las siguientes peticiones a tRPC.

### 4.3 Dashboard (`/dashboard`) — solo admin y técnico

- **Métricas agregadas** de la cuenta (fincas, lotes, rendimientos estimados recientes, alertas no leídas, eficiencia de riego semanal orientativa).
- **Gráficos** (rendimiento, riego, clima simplificado desde lecturas disponibles).

### 4.4 Fincas y lotes (`/lotes`)

- **Alta/edición/eliminación** de **fincas** y **lotes**.
- **Temporadas de cultivo** (inicio y cierre): cultivo elegido desde catálogo, fechas de siembra/cosecha.
- **Detalle por lote** (dialog): información general, **sensores** (lecturas; alta/baja/edición solo técnico o admin), **predicción actual** con botón de **recalcular** si ML responde.
- Soporte para enlace **`/lotes?plot=id`** cuando el usuario llega desde **alertas (“Ir al lote”)**.

### 4.5 Predicciones (`/predicciones`)

- **Resumen tipo manual §7** por cada lote: rendimiento orientativo (`kg/ha`), intervalo/confianza, texto de nivel de confianza, fecha de cosecha y calidad de grano **orientativa**, factores guardados por el modelo.
- Depende del **servicio ML** cuando se dispara/genera predicción; si no está levantado, se explica ese límite de entorno.

### 4.6 Monitoreo (`/monitoreo`)

- Selección de **finca → lote → sensor** y rango de fechas.
- **Serie diaria agregada** (promedios) y texto de **rangos objetivo** coherentes con tipo de sensor y temporada activa.
- **Exportación CSV** de lecturas en el período seleccionado.

### 4.7 Riego (`/riego`)

- Selección de finca/lote.
- **Recomendación** combinando lectura más reciente, cultivo, etapa fenológica, tipo de suelo (textos de retención), pronóstico de lluvia (**OpenWeather y/o Open-Meteo**) y llamada al modelo de riego en ML cuando existe; si ML falla, hay **mensaje fallback** desde humedad.
- **Programación manual** de eventos de riego (fecha, duración, tipo).
- **Historial** del último mes.

### 4.8 Reportes (`/reportes`) — solo admin y técnico

- Listado de reportes ya generados; **filtro por tipo** y **por rango de fechas de generación**.
- **Generación**: operacional (lote + rango fechas), gestión (finca).
- **Descarga**: PDF cuando la URL estándar existe; caso contrario se puede **generar/exportar PDF desde parámetros** guardados en la fila del reporte.
- **Índice en CSV / JSON** de la lista filtrada.
- **Compartir por correo**: abre cliente de correo (`mailto`) con texto prellenado; el PDF típicamente lo adjunta el usuario (no hay servidor SMTP obligatorio).

### 4.9 Alertas (`/alertas`)

- Listado paginado y **filtros** (tipo, severidad, leída/no, lote, fechas).
- **Marcar leídas** individuales o todas.
- **Ir al lote** si la alerta trae referencia.

### 4.10 Configuración (`/configuracion`)

- **Perfil**, **contraseña**, **preferencias de alertas** (email/push/SMS opcionales) y **umbrales globales** de humedad suelo (JSON en BD).
- **Administración**: si el usuario es **administrador**, alta de usuarios, cambiar rol / activación y **consulta corta de auditoría**.

---

## 5. Módulos del backend (alineados conNestJS)

Útil si el profesor pregunta “¿dónde está la lógica?”:

| Carpeta backend | Responsabilidad |
|------------------|----------------|
| **`auth`** | Login, registro, hash de contraseña, JWT, datos del usuario (`me`). |
| **`farms`** | CRUD fincas ligadas al usuario. |
| **`plots`** | CRUD lotes, inclusión de temporadas y sensores en consultas donde aplica. |
| **`predictions`** | Obtener historiales, predicción actual por lote, disparar predicción (HTTP → ML), resumen panorama por usuario. |
| **`sensors`** | Lecturas, series por día, CSV, CRUD solo para roles permitidos middleware, rangos objetivo por sensor/lote/temporada. |
| **`irrigation`** | Eventos de riego, recomendaciones (ML + meteorología OpenWeather/Open-Meteo + factores agronómicos), eficiencias y datos para dashboard. |
| **`alerts`** | Listado, marcar leídas, crear alertas desde otros procesos si existen; preferencias de alertas persistidas en usuario. |
| **`reports`** | Generación de reportes, PDF on-demand, export índice, mailto de compartir. |
| **`admin`** | Listar/crear/actualizar usuarios; auditoría en tabla dedicada. |
| **`trpc`** | **`trpc.router`**: todas las rutas públicas agrupadas; middlewares por rol (`reports`, `dashboard`, `sensor manage`, etc.). |

---

## 6. Aspectos destacables ante un jurado docente

- **Separación de responsabilidades** (UI / API / persistencia).
- **Control de acceso por rol**, no solo ocultando botones en el frontend.
- **Integración opcional ML** bien acotada: el sistema puede explicarse incluso si el Flask no está en marcha esa clase.
- **Datos externos** con política práctica (Open-Meteo sin clave donde hay ubicación geográfica).
- **Manual de usuario** alineado: `CONTEXTO.md`.
- Posible extensión: **automatización n8n** para ingesta de clima desde la infraestructura del proyecto.

---

## 7. Cómo sugerir la demo en 10 minutos

1. Roles: mostrar mismo flujo como **admin/técnico** (dashboard + reportes) y como **agricultor** (entra por lotes).
2. **Lotes**: finca nueva, lote, temporada corta de demo.
3. **Riego** en ese lote: recomendación y un evento programado si hay tiempo.
4. **Predicciones** o **monitoreo** según datos semilla/demo.
5. **Alertas** con un filtro.
6. Cerrar con **Configurable** admin (usuario de prueba) si el público ya conoce el resto.

---

*Documento generado para soporte oral; el detalle de APIs y modelo de BD está principalmente en el código (`CONTEXTO.md`, `README.md`, carpeta `Database/`).* 
