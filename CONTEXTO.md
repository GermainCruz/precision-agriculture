# Manual de Usuario - Sistema de Agricultura de Precisión

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Primeros Pasos](#2-primeros-pasos)
   - [2.4 Modo invitado](#24-modo-invitado)
3. [Dashboard](#3-dashboard)
4. [Gestión de Fincas y Lotes](#4-gestión-de-fincas-y-lotes)
5. [Monitoreo de Cultivos](#5-monitoreo-de-cultivos)
6. [Gestión de Riego](#6-gestión-de-riego)
7. [Predicciones y Alertas](#7-predicciones-y-alertas)
8. [Generación de Reportes](#8-generación-de-reportes)
9. [Configuración del Sistema](#9-configuración-del-sistema)
10. [Soporte y Preguntas Frecuentes](#10-soporte-y-preguntas-frecuentes)

---

## 1. Introducción

### 1.1 Acerca del Sistema

El Sistema de Agricultura de Precisión es una plataforma inteligente que combina tecnologías de machine learning, automatización y análisis de datos para optimizar la producción agrícola. El sistema permite:

- Monitoreo en tiempo real de cultivos y condiciones climáticas
- Predicción de rendimientos usando modelos de ensemble learning
- Optimización de riego basada en datos históricos y pronósticos
- Generación de reportes operacionales y de gestión
- Alertas tempranas para toma de decisiones proactiva

### 1.2 Perfiles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| Administrador | Gestión completa del sistema | Todos los permisos, configuración de usuarios |
| Agricultor | Gestión de fincas y cultivos | Crear/editar fincas, lotes, ver predicciones |
| Técnico | Monitoreo y análisis | Ver datos, generar reportes, gestionar alertas |

### 1.3 Navegación Principal

```
┌─────────────────────────────────────────────────────────┐
│  AgriPrecision                    [Usuario ▼] [Notif]   │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│  Dashboard    │         Contenido Principal             │
│  Lotes        │                                         │
│  Riego        │                                         │
│  Reportes     │                                         │
│  Alertas      │                                         │
│  Config       │                                         │
│               │                                         │
├──────────────┴──────────────────────────────────────────┤
│                   © 2024 AgriPrecision                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Primeros Pasos

### 2.1 Acceso al Sistema

1. Abrir navegador web y acceder a: `https://tu-dominio.com`
2. Ingresar credenciales proporcionadas:
   ```
   Email: tu-email@ejemplo.com
   Contraseña: ********
   ```
3. Click en **"Ingresar"**

### 2.2 Primera Vez: Configuración Inicial

Al ingresar por primera vez, el sistema te guiará a través de:

1. **Completar perfil:** Actualizar información personal
2. **Crear primera finca:** Registrar tu propiedad agrícola
3. **Agregar lotes:** Definir parcelas dentro de la finca
4. **Configurar cultivos:** Registrar temporada actual

### 2.3 Pantalla de Inicio

El Dashboard es tu punto de control central.

### 2.4 Modo invitado

Puedes entrar a la aplicación **sin iniciar sesión** y recorrer el menú. En modo invitado verás mensajes que invitan a identificarte en las pantallas que guardan datos de tu cuenta (lotes, riego, reportes, alertas, configuración, etc.). El **Dashboard** muestra una bienvenida orientativa.

**Cerrar sesión** te devuelve al **Dashboard en modo invitado** (ya no tienes token de sesión), no obligatoriamente a la pantalla de inicio de sesión.

---

## 3. Dashboard

### 3.1 Métricas Clave

| Métrica | Descripción | Interpretación |
|---------|-------------|----------------|
| Total Fincas | Número de propiedades registradas | — |
| Total Lotes | Parcelas activas | — |
| Rendimiento Promedio | kg/ha estimado | >5000 kg/ha = Bueno / 3000-5000 = Regular / <3000 = Crítico |
| Alertas No Leídas | Notificaciones pendientes | Rojo si >0 |

### 3.2 Gráficos Interactivos

**Rendimiento por Cultivo**

- Click en pestañas: "Rendimiento", "Riego", "Clima"
- Hover sobre gráficos para ver valores detallados
- Click en leyenda para filtrar series

**Eficiencia de Riego**

- 🟢 Verde: Eficiencia >80%
- 🟡 Amarillo: 60-80%
- 🔴 Rojo: <60%

### 3.3 Alertas Recientes

Panel de alertas muestra:

- **Críticas:** Acción inmediata requerida
- **Advertencias:** Monitorear situación
- **Informativas:** Datos para referencia

**Acciones:**

- Click en alerta para ver detalles
- "Marcar como leída" para eliminar de lista
- "Ver todas" para historial completo

---

## 4. Gestión de Fincas y Lotes

### 4.1 Crear una Finca

**Pasos:**

1. Ir a menú **"Lotes"** → **"Nueva Finca"**
2. Completar formulario:
   ```yaml
   Nombre: "Finca El Paraíso"
   Ubicación: "Km 12 Ruta 5, Mendoza"
   Área: 50.5 hectáreas
   Coordenadas: -32.89, -68.84 (opcional)
   ```
3. Click **"Guardar"**

### 4.2 Agregar Lotes

Dentro de una finca, puedes crear lotes:

1. Seleccionar finca del desplegable
2. Click **"Nuevo Lote"**
3. Ingresar datos:

| Campo | Ejemplo | Nota |
|-------|---------|------|
| Nombre | "Lote Norte" | Identificador único |
| Área | 12.3 ha | Usar decimales |
| Tipo de Suelo | "Franco" | Seleccionar de lista |
| Polígono | Dibujar en mapa | Opcional para georreferenciación |

### 4.3 Editar y Eliminar

**Editar:**
- Click en lote → ícono ✏️
- Modificar campos permitidos
- Guardar cambios

**Eliminar:**
- Solo si no tiene datos asociados
- Confirmar eliminación
- ⚠️ No se puede recuperar

### 4.4 Visualización de Lotes

Cada tarjeta de lote muestra:

- Nombre y área
- Cultivo actual (si aplica)
- Tipo de suelo
- Estado de temporada

---

## 5. Monitoreo de Cultivos

### 5.1 Registrar Temporada de Cultivo

Desde la pantalla de Lote:

1. Click en **"Iniciar Temporada"**
2. Seleccionar cultivo del catálogo
3. Ingresar fecha de siembra
4. Estimar fecha de cosecha

### 5.2 Catálogo de Cultivos

El sistema incluye cultivos predefinidos:

| Cultivo | Ciclo (días) | Agua Requerida | Temp. Óptima |
|---------|-------------|----------------|--------------|
| Maíz | 120 | 500 mm | 25°C |
| Soja | 110 | 450 mm | 24°C |
| Trigo | 130 | 400 mm | 20°C |
| Girasol | 115 | 480 mm | 22°C |

### 5.3 Datos de Sensores (IoT)

Si tienes sensores instalados:

**Lecturas disponibles:**
- Temperatura del suelo/aire
- Humedad del suelo
- Precipitación
- Velocidad del viento
- Radiación solar

**Visualización:**
- Gráficos históricos por período
- Comparación con valores óptimos
- Exportar datos a CSV

---

## 6. Gestión de Riego

### 6.1 Panel de Riego

Accede a **"Riego"** en el menú principal:

```
┌─────────────────────────────────────────────┐
│  Lote: Lote Norte           [Cambiar Lote ▼]│
├─────────────────────────────────────────────┤
│  Humedad Actual: 45%  (Óptimo: 60-80%)      │
│  Eficiencia: 82%                            │
│  Recomendación: Regar en 2 días             │
├─────────────────────────────────────────────┤
│  [Programar Riego]  [Historial]  [Config]   │
└─────────────────────────────────────────────┘
```

### 6.2 Recomendaciones Automáticas

El sistema genera recomendaciones basadas en:

1. Datos de sensores (humedad actual)
2. Pronóstico climático (lluvias próximas)
3. Etapa del cultivo (crecimiento, floración)
4. Tipo de suelo (capacidad de retención)

**Interpretación:**

- **"Regar ahora":** Urgente, humedad crítica
- **"Regar en X días":** Programar según necesidad
- **"No regar":** Condiciones óptimas

### 6.3 Programar Riego Manual

**Programación simple:**

1. Click **"Programar Riego"**
2. Seleccionar fecha y hora
3. Definir duración (minutos)
4. Elegir tipo de riego
5. Confirmar

**Programación avanzada:**

- Riego por ciclos (ej: 30 min cada 2 horas)
- Repetición diaria/semanal
- Condiciones automáticas (ej: si humedad <40%)

### 6.4 Historial de Riego

Visualización completa:

- Calendario de eventos
- Volumen de agua aplicado
- Eficiencia por evento
- Comparativa campañas anteriores

---

## 7. Predicciones y Alertas

### 7.1 Predicciones de Rendimiento

**Acceso:** Dashboard → Sección "Predicciones"

**Entorno de desarrollo:** las predicciones de rendimiento dependen de un **microservicio ML** (Flask) que debe estar en ejecución. Si no está disponible, la aplicación mostrará un error indicando que no se pudo contactar al servicio; en ese caso hay que arrancar el proyecto del servicio ML y comprobar la URL configurada en el backend (en Windows suele recomendarse `http://127.0.0.1:5000` en lugar de `localhost`). Abrir la raíz del servicio en el navegador puede mostrar un JSON informativo; la ruta **`/health`** confirma que el servicio responde.

El sistema utiliza modelos de machine learning para estimar:

| Variable | Predicción | Factores Considerados |
|----------|-----------|----------------------|
| Rendimiento | kg/ha | Historial, clima, riego, suelo |
| Cosecha | Fecha estimada | Ciclo, temperaturas |
| Calidad | % grano/grano | Condiciones durante ciclo |

**Niveles de Confianza:**

- 🟢 **Alta:** >85% — Datos suficientes
- 🟡 **Media:** 70-85% — Más datos requeridos
- 🔴 **Baja:** <70% — Monitorear más variables

### 7.2 Tipos de Alertas

| Tipo | Descripción | Acción Recomendada |
|------|-------------|-------------------|
| 🌩️ Clima | Helada, granizo, sequía | Proteger cultivos |
| 💧 Riego | Humedad crítica | Activar riego |
| 🐛 Plagas | Riesgo de infestación | Inspeccionar lote |
| 📉 Rendimiento | Predicción baja | Revisar prácticas |
| ⚙️ Sistema | Sensor offline | Mantenimiento |

### 7.3 Gestionar Alertas

En panel de alertas:

1. Ver alertas por severidad (color)
2. Click en alerta para detalles
3. Opciones disponibles:
   - **Marcar como leída:** Archivar
   - **Ver lote asociado:** Navegar al lote
   - **Tomar acción:** Programar riego, etc.

**Configurar notificaciones:**

- **Email:** recibir alertas por correo
- **Push:** notificaciones en navegador
- **SMS:** para emergencias (configurar)

---

## 8. Generación de Reportes

### 8.1 Tipos de Reportes

**Reportes Operacionales** — Detalle diario de actividades:

```yaml
Contenido:
  - Resumen de riego (volumen, duración)
  - Lecturas de sensores
  - Actividades realizadas
  - Observaciones del técnico
Uso: Control diario, cuaderno de campo digital
```

**Reportes de Gestión** — Análisis estratégico:

```yaml
Contenido:
  - Comparativa rendimiento por lote
  - Eficiencia hídrica por cultivo
  - Tendencias por campaña
  - Análisis económico
Uso: Toma de decisiones, planificación
```

### 8.2 Generar un Reporte

**Pasos:**

1. Ir a **"Reportes"**
2. Seleccionar tipo: "Operacional" o "Gestión"
3. Configurar parámetros:
   ```
   Lote:         [Seleccionar lote]
   Fecha Inicio: [dd/mm/yyyy]
   Fecha Fin:    [dd/mm/yyyy]
   Formato:       PDF / CSV / JSON
   ```
4. Click **"Generar Reporte"**
5. Esperar procesamiento (5-30 segundos)
6. Descargar cuando esté listo

### 8.3 Visualizar Reportes

Lista de reportes generados:

- Ordenados por fecha (más reciente primero)
- Filtros por tipo y rango de fechas
- Opciones:
  - Descargar PDF
  - Enviar por email
  - Eliminar (si no necesario)

### 8.4 Reportes Automáticos

Configurar programación:

1. Ir a **"Configuración"** → **"Reportes Automáticos"**
2. Definir frecuencia: Diario / Semanal / Mensual
3. Seleccionar destinatarios (email)
4. Guardar configuración

---

## 9. Configuración del Sistema

### 9.1 Perfil de Usuario

**Acceso:** Click en nombre de usuario → "Mi Perfil"

Campos editables:

- Nombre y apellido
- Email (requiere verificación)
- Teléfono
- Contraseña (cambiar periódicamente)

### 9.2 Preferencias de Notificación

```
✉ Email:  [X] Alertas críticas
           [ ] Reportes diarios

🔔 Push:  [X] Todas las alertas

📱 SMS:   [ ] Solo emergencias
```

### 9.3 Integraciones (Avanzado)

**Sensores IoT:**
- Agregar nuevo sensor
- Configurar frecuencia de lectura
- Calibrar valores umbral

**APIs Externas:**
- Conectar estación meteorológica
- Importar datos de drones/satélites

### 9.4 Administración de Usuarios *(Solo Admin)*

**Agregar usuario:**

1. Ir a **"Configuración"** → **"Usuarios"**
2. Click **"Nuevo Usuario"**
3. Completar:
   - Email
   - Rol (Agricultor / Técnico / Admin)
   - Asignar fincas (si aplica)
4. El usuario recibirá email con credenciales

**Gestionar permisos:**

- Editar rol existente
- Desactivar usuario
- Ver historial de actividad

---

## 10. Soporte y Preguntas Frecuentes

### 10.1 Preguntas Frecuentes

**¿Cómo actualizo los datos de sensores?**

Los sensores se integran automáticamente. Si no ves datos:

1. Verificar conexión del sensor
2. Revisar estado en "Configuración → Sensores"
3. Contactar soporte técnico

**¿Por qué mis predicciones tienen baja confianza?**

La confianza aumenta con:

- Más datos históricos (>3 meses)
- Sensores calibrados
- Datos completos de riego y clima

**¿Puedo exportar mis datos?**

Sí, todos los módulos permiten exportar:

- Gráficos → PNG
- Tablas → CSV
- Reportes → PDF

**¿Cómo comparto reportes con mi equipo?**

1. Generar reporte
2. Usar opción "Compartir" o "Enviar por email"
3. También puedes descargar y compartir el archivo

### 10.2 Solución de Problemas Comunes

| Problema | Posible Causa | Solución |
|----------|--------------|----------|
| No carga el dashboard | Internet lento | Recargar página |
| No veo mis lotes | Filtro activo | Limpiar filtros |
| Error al generar PDF | Datos incompletos | Completar datos requeridos |
| Alertas no llegan | Configuración email | Verificar spam, actualizar email |
| Error al predecir rendimiento (“no se pudo contactar el servicio de ML”) | Microservicio ML apagado o URL incorrecta | Arrancar el servicio ML; probar `http://127.0.0.1:5000/health`; revisar `ML_SERVICE_URL` en el backend |
| “Not Found” en la URL del servicio ML (puerto 5000) | Se abrió solo la ruta `/` en un navegador | Normal si no hay página HTML: usar `/` (JSON), `/health` o dejar que la app llame a `/predict/yield` |

### 10.3 Soporte Técnico

**Canales de contacto:**

- 📧 **Email:** soporte@agricultura-precision.com
- 📞 **Teléfono:** +54 9 261 123-4567 (Lun-Vie 9-18h)
- 💬 **Chat:** Disponible en el sistema (ícono abajo derecha)

Al contactar soporte, incluir:

- Nombre de usuario
- Finca/Lote afectado
- Captura de pantalla (si aplica)
- Descripción del problema

### 10.4 Capacitación

Recursos disponibles:

- **Videotutoriales:** En la sección "Ayuda"
- **Documentación:** Manuales técnicos
- **Webinars:** Programados mensualmente
- **Soporte in situ:** Para fincas grandes

### 10.5 Glosario de Términos

| Término | Definición |
|---------|-----------|
| Ensemble Learning | Combinación de múltiples modelos para mejor precisión |
| Eficiencia Hídrica | Relación agua aplicada / agua aprovechada por cultivo |
| Hectárea (ha) | Unidad de área = 10,000 m² |
| mm de agua | Milímetros de precipitación (1 mm = 10 m³/ha) |
| tRPC | Tecnología de comunicación tipo-segura entre frontend y backend |
| Workflow | Secuencia automatizada de tareas |

---

## 11. Anexos

### 11.1 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + K` | Buscar lote/finca |
| `Ctrl + R` | Generar reporte rápido |
| `Esc` | Cerrar modal |
| `Ctrl + ?` | Ver ayuda contextual |

### 11.2 Iconos y Significados

| Icono | Significado | Acción |
|-------|-------------|--------|
| 🏠 | Dashboard | Vista principal |
| 🌱 | Lote | Gestión de parcelas |
| 💧 | Riego | Configuración de riego |
| 📄 | Reporte | Documentos generados |
| 🔔 | Alerta | Notificaciones |
| ⚙️ | Configuración | Ajustes del sistema |
| ✅ | Activo | Sistema funcionando |
| ⚠️ | Atención | Requiere revisión |
| 🔴 | Crítico | Acción inmediata |

### 11.3 Ejemplo de Uso: Día Típico de un Agricultor

**🌅 7:00 AM — Revisión Matutina**

1. Ingresar al sistema
2. Ver dashboard: rendimientos, alertas
3. Revisar recomendación de riego
4. Si alerta crítica → tomar acción inmediata

**🌾 10:00 AM — Gestión de Lotes**

1. Revisar lotes con humedad baja
2. Programar riego para los más críticos
3. Verificar predicciones de rendimiento

**🔍 2:00 PM — Monitoreo**

1. Consultar datos de sensores
2. Comparar con pronóstico climático
3. Ajustar programaciones si es necesario

**📊 4:00 PM — Reportes**

1. Generar reporte operacional del día
2. Registrar observaciones
3. Programar reporte semanal automático

**🔒 5:00 PM — Cierre**

1. Verificar alertas pendientes
2. Revisar predicciones para mañana
3. Cerrar sesión (vuelves al Dashboard en modo invitado)

---

## 12. Mejores Prácticas

### 12.1 Para Mejorar Predicciones

✅ **Hacer:**

- Registrar todas las actividades de riego
- Mantener sensores calibrados
- Completar datos de cosecha real
- Documentar eventos climáticos atípicos

❌ **Evitar:**

- Saltar registros de actividades
- Ignorar alertas tempranas
- Modificar datos históricos sin justificación

### 12.2 Optimización de Riego

- **Monitoreo continuo:** Revisar humedad al menos 2 veces/día
- **Riego nocturno:** Reducir evaporación
- **Ajuste por etapa:** Más agua en floración, menos en madurez
- **Aprovechar lluvias:** Suspender riego programado si hay precipitación

### 12.3 Gestión de Alertas

1. Configurar umbrales adecuados según cultivo
2. Revisar alertas al menos 3 veces al día
3. Actuar rápido en alertas críticas
4. Documentar acciones tomadas

---

## 13. Actualizaciones y Nuevas Funcionalidades

### 13.1 Historial de Versiones

| Versión | Fecha | Novedades |
|---------|-------|-----------|
| 1.0 | Ene 2026 | Lanzamiento inicial |
| 1.1 | Mar 2026 | Reportes PDF, nuevos gráficos |
| 1.2 | Actual | Predicciones ML mejoradas, plantillas n8n documentadas |

### 13.2 Próximas Funcionalidades

- Integración con drones para imágenes multiespectrales
- App móvil con notificaciones push
- Asistente virtual para recomendaciones
- API pública para integración con sistemas externos

### 13.3 Automatización con n8n (entorno técnico)

El equipo puede usar **n8n** como orquestador (tareas por horario, ingestión climática externa, etc.) y que escriba en la misma PostgreSQL que AgriPrecision. Funciona **en local sin Docker** (script `n8n-workflows/run-local.bat` + Node.js) o **con Docker Compose**. **No forma parte obligatoria** del manual de usuario hasta que alguien configure flujos y credenciales.

Resumen para quien monta el sistema:

1. Interfaz típica en **http://localhost:5678** (plantilla de desarrollo del proyecto).
2. Los flujos importados desde `n8n-workflows/` pueden **registrar pruebas** en `workflow_ejecucion` o **añadir lecturas** en `lectura_sensor`, según el JSON activo.
3. Pasos detallados (local vs Docker, credencial Postgres, OpenWeather) en **`n8n-workflows/README.md`** y resumen en **`README.md`** del proyecto.

---

> ¡Gracias por usar el Sistema de Agricultura de Precisión!
>
> Estamos comprometidos con ayudarte a optimizar tu producción agrícola mediante tecnología de vanguardia. Para sugerencias o comentarios, no dudes en contactarnos.

---

*Manual actualizado: Mayo 2026 — Versión 1.2*
