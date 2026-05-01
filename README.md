# Sistema de Agricultura de Precisión 🌾

> **Una plataforma inteligente que combina IoT, Machine Learning y automatización para optimizar la producción agrícola.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://www.python.org/)

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Desarrollo Local](#-desarrollo-local)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
- [Variables de Entorno](#-variables-de-entorno)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Tests](#-tests)
- [Despliegue](#-despliegue)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🚀 Descripción General

**AgriPrecision** es una plataforma integral de agricultura de precisión que integra:

- 📊 **Monitoreo en Tiempo Real**: Datos de sensores IoT de fincas y lotes
- 🤖 **Machine Learning**: Predicción de rendimientos usando ensemble learning
- 📈 **Análisis Avanzado**: Reportes operacionales y de gestión
- ⚡ **Automatización**: Workflows con n8n para procesos recurrentes
- 💧 **Optimización de Riego**: Recomendaciones basadas en datos históricos y pronósticos
- 🚨 **Sistema de Alertas**: Notificaciones tempranas para toma de decisiones proactiva
- 👥 **Gestión de Usuarios**: Control de acceso basado en roles (Admin, Agricultor, Técnico)

El sistema está diseñado para **pequeños y medianos productores agrícolas** que desean optimizar sus cultivos mediante tecnología moderna.

---

## ✨ Características

### 🎯 Core Features

| Característica | Descripción | Estado |
|---|---|---|
| **Dashboard Interactivo** | Métricas clave, gráficos en tiempo real | ✅ Completo |
| **Gestión de Fincas y Lotes** | CRUD completo, mapas de coordenadas | ✅ Completo |
| **Monitoreo de Sensores** | Integración de datos IoT, históricos | ✅ Completo |
| **Predicciones ML** | Ensemble learning, rendimiento esperado | ✅ Completo |
| **Sistema de Alertas** | Alertas personalizables, notificaciones | ✅ Completo |
| **Gestión de Riego** | Recomendaciones automáticas, históricos | ✅ Completo |
| **Reportes Automáticos** | PDF operacionales y de gestión | ✅ Completo |
| **Workflows Automáticos** | Integración con n8n, procesos recurrentes | ✅ Completo |
| **Autenticación JWT** | Seguridad con tokens, refresh tokens | ✅ Completo |
| **API tRPC** | Type-safe API con validación | ✅ Completo |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                  http://localhost:3000                           │
│  Dashboard | Lotes | Riego | Reportes | Alertas | Configuración │
└────────────────────────┬────────────────────────────────────────┘
                         │ tRPC Client
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (NestJS + tRPC)                         │
│                  http://localhost:4000                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Module  │  │ Farms Module │  │ Predictions Module   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Plots Module │  │ Sensors      │  │ Reports Module       │  │
│  └──────────────┘  │ Module       │  └──────────────────────┘  │
│                    └──────────────┘  ┌──────────────────────┐  │
│  ┌──────────────────────────────┐   │ Irrigation Module    │  │
│  │  Prisma ORM                  │   └──────────────────────┘  │
│  └──────────────┬───────────────┘  ┌──────────────────────┐  │
│                 │                   │ Alerts Module        │  │
│                 ▼                   └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐   ┌─────────┐   ┌─────────────────┐
    │PostgreSQL   │ Redis   │   │ ML Service      │
    │  (15)       │ (7)     │   │ (Flask+Python)  │
    │ http://     │ http:// │   │ http://         │
    │ :5432       │ :6379   │   │ localhost:5000  │
    └─────────────┴─────────┴───┴─────────────────┘
         │
         ▼
    ┌──────────────────────────────┐
    │   n8n Workflows              │
    │   (Automatización)           │
    │   http://localhost:5678      │
    │   - Climate Data Ingestion   │
    │   - Report Generation        │
    │   - Yield Predictions        │
    └──────────────────────────────┘
```

---

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS 10
- **ORM**: Prisma 5
- **API**: tRPC 10 (Type-safe RPC)
- **Autenticación**: JWT + Bcrypt
- **Validación**: Zod + Class Validator
- **Base de Datos**: PostgreSQL 15 + PostGIS
- **Cache**: Redis 7
- **Cron Jobs**: node-cron
- **PDF**: Puppeteer

### Frontend
- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **State**: React Query 4 (TanStack Query)
- **Formularios**: React Hook Form
- **Gráficos**: Recharts
- **UI Atoms**: Radix UI

### Machine Learning
- **Framework**: Python 3.9+
- **Librerías**: scikit-learn, pandas, numpy
- **Servidor**: Flask + Gunicorn
- **Modelos**: Ensemble Learning (Random Forest, Gradient Boosting)

### Infraestructura
- **Containerización**: Docker & Docker Compose
- **Workflow Automation**: n8n
- **Base de Datos**: PostgreSQL con extensión PostGIS
- **Cache Distribuido**: Redis

---

## 📋 Prerrequisitos

### Sistema Operativo
- Windows 10/11, macOS 10.15+, o Linux (Ubuntu 20.04+)

### Software Requerido
- **Docker**: v20.10+ y **Docker Compose**: v2.0+
  - Descargar: https://www.docker.com/products/docker-desktop
- **Git**: v2.30+
  - Descargar: https://git-scm.com/
- **Node.js**: v20 LTS
  - Descargar: https://nodejs.org/
- **PostgreSQL Client** (opcional para desarrollo local sin Docker)
  - Descargar: https://www.postgresql.org/download/
- **Python**: 3.9+ (opcional para ML service local)
  - Descargar: https://www.python.org/

### Recursos Mínimos
- **RAM**: 4 GB (8 GB recomendado)
- **Almacenamiento**: 5 GB libres
- **CPU**: 2 cores (4 cores recomendado)

---

## ⚙️ Instalación

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/precision-agriculture.git
cd precision-agriculture
```

### 2️⃣ Configurar Variables de Entorno

```bash
# Crear archivo .env en la raíz
cat > .env << EOF
# Database
DATABASE_URL=postgresql://admin:secure_password@postgres:5432/agricultura_db

# Backend
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui
NODE_ENV=development

# ML Service
ML_SERVICE_URL=http://ml-service:5000

# n8n
N8N_URL=http://n8n:5678
N8N_USER=admin
N8N_PASSWORD=admin123

# Redis
REDIS_URL=redis://redis:6379
EOF
```

### 3️⃣ Levantar los Servicios con Docker Compose

```bash
# Iniciar todos los servicios en background
docker-compose up -d

# Verificar que todos los servicios están corriendo
docker-compose ps
```

**Servicios levantados:**
- 🐘 **PostgreSQL**: http://localhost:5432
- 🔴 **Redis**: http://localhost:6379
- 📝 **n8n**: http://localhost:5678 (admin/admin123)
- 🐍 **ML Service**: http://localhost:5000
- 🚀 **Backend**: http://localhost:4000

### 4️⃣ Ejecutar Migraciones y Seed

```bash
# Entrar al contenedor del backend
docker-compose exec backend bash

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar base de datos con datos de prueba
npm run prisma:seed

# Salir del contenedor
exit
```

### 5️⃣ Acceder al Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/trpc
- **n8n Dashboard**: http://localhost:5678 (admin/admin123)
- **ML Service API**: http://localhost:5000

**Credenciales de Prueba** (después del seed):
```
Email: admin@agricultura.com
Contraseña: Admin123!
Rol: Administrador
```

---

## 🔧 Desarrollo Local (Sin Docker)

### Backend

```bash
# Entrar al directorio
cd backend

# Instalar dependencias
npm install

# Configurar PostgreSQL localmente (importante)
# Editar el DATABASE_URL en .env

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Ejecutar seed
npm run prisma:seed

# Iniciar en modo desarrollo
npm run start:dev

# Backend estará en http://localhost:4000
```

### Frontend

```bash
# Entrar al directorio
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Frontend estará en http://localhost:3000
```

### ML Service (Python)

```bash
# Entrar al directorio
cd ml-service

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python app.py

# ML Service estará en http://localhost:5000
```

---

## 📁 Estructura del Proyecto

```
precision-agriculture/
├── README.md                          # Este archivo
├── CONTEXTO.md                        # Documentación del negocio
├── docker-compose.yml                 # Orquestación de contenedores
├── .gitignore                         # Archivos ignorados en Git
│
├── backend/                           # NestJS Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts                    # Punto de entrada
│   │   ├── app.module.ts              # Módulo raíz
│   │   ├── auth/                      # Autenticación JWT
│   │   ├── farms/                     # Gestión de fincas
│   │   ├── plots/                     # Gestión de lotes
│   │   ├── sensors/                   # Monitoreo de sensores
│   │   ├── irrigation/                # Control de riego
│   │   ├── predictions/               # Predicciones ML
│   │   ├── reports/                   # Generación de reportes
│   │   ├── alerts/                    # Sistema de alertas
│   │   ├── prisma/                    # ORM y conexión DB
│   │   └── trpc/                      # API tRPC
│   └── prisma/
│       ├── schema.prisma              # Esquema de base de datos
│       └── seed.ts                    # Datos iniciales
│
├── frontend/                          # Next.js Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── app/
│   │   ├── layout.tsx                 # Layout base
│   │   ├── page.tsx                   # Página inicio
│   │   ├── login/                     # Login
│   │   ├── dashboard/                 # Dashboard principal
│   │   ├── lotes/                     # Gestión de lotes
│   │   ├── riego/                     # Control de riego
│   │   ├── reportes/                  # Reportes
│   │   ├── alertas/                   # Alertas
│   │   └── configuracion/             # Configuración
│   ├── components/
│   │   ├── layout/                    # Header, Sidebar
│   │   ├── dashboard/                 # Componentes del dashboard
│   │   ├── plots/                     # Componentes de lotes
│   │   └── ui/                        # UI atoms reutilizables
│   ├── hooks/
│   │   └── use-toast.ts               # Hook de notificaciones
│   ├── lib/
│   │   ├── api.ts                     # Cliente tRPC
│   │   └── utils.ts                   # Utilidades
│   └── globals.css                    # Estilos globales
│
├── ml-service/                        # Python ML Service
│   ├── Dockerfile
│   ├── app.py                         # Servidor Flask
│   ├── requirements.txt               # Dependencias Python
│   └── e2e/
│       └── dashboard.spec.ts          # Tests E2E
│
├── n8n-workflows/                     # Automatización
│   ├── workflow-climate-ingest.json   # Ingesta de datos climáticos
│   ├── workflow-report-generation.json # Generación de reportes
│   └── workflow-yield-prediction.json  # Predicción de rendimiento
│
└── Database/                          # Scripts SQL
    ├── create_database.sql
    ├── seed.sql
    ├── datos.sql
    └── seed.ts
```

---

## 🎯 Módulos y Funcionalidades

### 🔐 Autenticación (Auth Module)
- **Funcionalidades**:
  - Login y logout
  - Registro de usuarios (solo admin)
  - JWT con refresh tokens
  - Control de acceso basado en roles
- **Endpoints tRPC**:
  - `auth.login(email, password)`
  - `auth.logout()`
  - `auth.me()` - Obtener usuario actual

### 🏘️ Gestión de Fincas (Farms Module)
- **Funcionalidades**:
  - Crear, leer, actualizar y eliminar fincas
  - Almacenar ubicación y coordenadas
  - Asociar usuarios a fincas
- **Endpoints tRPC**:
  - `farms.create(data)`
  - `farms.findAll()`
  - `farms.findOne(id)`
  - `farms.update(id, data)`
  - `farms.delete(id)`

### 🌱 Gestión de Lotes (Plots Module)
- **Funcionalidades**:
  - CRUD de lotes dentro de fincas
  - Gestión de tipos de suelo
  - Polígonos de coordenadas para mapeo
- **Endpoints tRPC**:
  - `plots.create(data)`
  - `plots.findAll(fincaId)`
  - `plots.findOne(id)`
  - `plots.update(id, data)`

### 📡 Monitoreo de Sensores (Sensors Module)
- **Funcionalidades**:
  - Registrar datos de sensores IoT
  - Almacenar lecturas de temperatura, humedad, etc.
  - Histórico de datos por sensor
- **Endpoints tRPC**:
  - `sensors.create(data)`
  - `sensors.findByPlot(plotId)`
  - `sensors.getReadings(sensorId, dateRange)`

### 🤖 Predicciones ML (Predictions Module)
- **Funcionalidades**:
  - Predicción de rendimiento con ensemble learning
  - Basado en datos históricos de sensores
  - Modelo entrenado con scikit-learn
- **Endpoints tRPC**:
  - `predictions.generate(plotId)`
  - `predictions.findByPlot(plotId)`
  - `predictions.getHistorical(plotId)`

### 📊 Reportes (Reports Module)
- **Funcionalidades**:
  - Generación de reportes PDF
  - Reportes operacionales y de gestión
  - Estadísticas descriptivas
- **Endpoints tRPC**:
  - `reports.generate(type, filters)`
  - `reports.findAll()`
  - `reports.download(id)`

### 💧 Gestión de Riego (Irrigation Module)
- **Funcionalidades**:
  - Recomendaciones automáticas de riego
  - Histórico de eventos de riego
  - Optimización basada en ML
- **Endpoints tRPC**:
  - `irrigation.createEvent(data)`
  - `irrigation.getRecommendations(plotId)`
  - `irrigation.getHistory(plotId)`

### 🚨 Sistema de Alertas (Alerts Module)
- **Funcionalidades**:
  - Alertas personalizables por lote
  - Notificaciones en tiempo real
  - Diferentes severidades (info, warning, critical)
- **Endpoints tRPC**:
  - `alerts.create(data)`
  - `alerts.findAll()`
  - `alerts.markAsRead(id)`

---

## 🔌 Variables de Entorno

### Backend (.env)

```ini
# Database
DATABASE_URL=postgresql://admin:secure_password@postgres:5432/agricultura_db

# Server
BACKEND_PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRATION=7d

# ML Service
ML_SERVICE_URL=http://ml-service:5000

# n8n
N8N_URL=http://n8n:5678
N8N_API_KEY=your_n8n_api_key

# Redis
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=debug
```

### Frontend (.env.local)

```ini
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=AgriPrecision
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### ML Service (.env)

```ini
FLASK_ENV=development
FLASK_DEBUG=True
API_PORT=5000
```

---

## 🔗 API Endpoints (tRPC)

Todos los endpoints están disponibles en `/trpc` y son **type-safe**.

### Autenticación
```
POST /trpc/auth.login
POST /trpc/auth.logout
GET  /trpc/auth.me
```

### Fincas
```
POST   /trpc/farms.create
GET    /trpc/farms.findAll
GET    /trpc/farms.findOne?id=<id>
PUT    /trpc/farms.update?id=<id>
DELETE /trpc/farms.delete?id=<id>
```

### Lotes
```
POST   /trpc/plots.create
GET    /trpc/plots.findAll?fincaId=<id>
GET    /trpc/plots.findOne?id=<id>
PUT    /trpc/plots.update?id=<id>
```

### Sensores
```
POST   /trpc/sensors.create
GET    /trpc/sensors.findByPlot?plotId=<id>
GET    /trpc/sensors.getReadings?sensorId=<id>&from=<date>&to=<date>
```

### Predicciones
```
POST /trpc/predictions.generate?plotId=<id>
GET  /trpc/predictions.findByPlot?plotId=<id>
GET  /trpc/predictions.getHistorical?plotId=<id>
```

### Reportes
```
POST /trpc/reports.generate
GET  /trpc/reports.findAll
GET  /trpc/reports.download?id=<id>
```

### Riego
```
POST /trpc/irrigation.createEvent
GET  /trpc/irrigation.getRecommendations?plotId=<id>
GET  /trpc/irrigation.getHistory?plotId=<id>
```

### Alertas
```
POST /trpc/alerts.create
GET  /trpc/alerts.findAll
PUT  /trpc/alerts.markAsRead?id=<id>
```

---

## 🗄️ Base de Datos

### Diagrama de Modelos

```
Usuario (1) ──────── (N) Finca
  │
  ├─ Rol (N..1)
  ├─ Reporte (1..N)
  └─ Alerta (1..N)

Finca (1) ──────── (N) Lote
  │
  ├─ Temporada (1..N)
  ├─ Sensor (1..N)
  └─ EventoRiego (1..N)

Lote (1) ──────── (N) Cultivo
  │
  ├─ Sensor (1..N)
  ├─ EventoRiego (1..N)
  ├─ PrediccionRendimiento (1..N)
  └─ Alerta (1..N)

Cultivo (1) ──────── (N) Temporada
  │
  └─ PrediccionRendimiento (1..N)

Sensor (1) ──────── (N) LecturaSensor

Temporada (1) ──────── (N) EventoRiego
```

### Modelos Principales

| Modelo | Descripción | Campos |
|--------|-------------|--------|
| **Usuario** | Usuarios del sistema | id, email, password, nombre, rol, activo |
| **Finca** | Propiedades agrícolas | id, nombre, ubicación, area, coordenadas |
| **Lote** | Parcelas dentro de fincas | id, nombre, area, tipoSuelo, coordenadas |
| **Cultivo** | Tipos de cultivo | id, nombre, cicloVegetativo, requerimientoAgua |
| **Sensor** | Dispositivos IoT | id, tipo, ubicación, ultimoRegistro |
| **LecturaSensor** | Datos de sensores | id, valor, timestamp |
| **Temporada** | Períodos de cultivo | id, inicio, fin, cultivo |
| **PrediccionRendimiento** | Predicciones ML | id, rendimientoEsperado, confianza, fecha |
| **EventoRiego** | Registros de riego | id, fecha, duracion, cantidad |
| **Alerta** | Notificaciones | id, tipo, severidad, mensaje, leido |

---

## 🧪 Tests

### Backend Tests

```bash
cd backend

# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Ejecutar tests
npm run test

# Tests en modo watch
npm run test:watch
```

### E2E Tests

```bash
# Ejecutar tests E2E
npm run test:e2e

# Tests E2E en modo debug
npm run test:e2e -- --debug
```

---

## 📦 Despliegue

### Opciones de Despliegue

| Componente | Plataforma Recomendada | Alternativas |
|---|---|---|
| **Frontend** | Vercel | Netlify, Railway, Heroku |
| **Backend** | Railway | Heroku, Fly.io, DigitalOcean |
| **Base de Datos** | Supabase | Railway, AWS RDS, DigitalOcean |
| **ML Service** | Railway | Heroku, Fly.io |
| **Redis** | Upstash | Redis Cloud, Railway |

### Desplegar en Railway (Recomendado)

1. **Conectar repositorio a Railway**
   ```bash
   # Crear cuenta en https://railway.app
   # Conectar GitHub
   ```

2. **Crear servicios**
   - Database PostgreSQL
   - Backend (Node.js)
   - Frontend (Node.js)
   - ML Service (Python)

3. **Configurar variables de entorno** en cada servicio

4. **Deploy automático** en cada push a main

### Variables de Entorno en Producción

```ini
NODE_ENV=production
JWT_SECRET=<generar-con-crypto.randomBytes(32).toString('hex')>
DATABASE_URL=<conexión-postgresql-production>
FRONTEND_URL=https://tu-dominio.com
```

---

## 🐛 Troubleshooting

### Error: "relation does not exist"

**Problema**: PostgreSQL no encuentra las tablas al ejecutar seeds.

**Soluciones**:
1. Verificar que las migraciones se ejecutaron:
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```
2. Revisar la variable `DATABASE_URL` es correcta
3. Verificar que PostgreSQL está corriendo: `docker-compose ps`
4. Reiniciar servicios:
   ```bash
   docker-compose down && docker-compose up -d
   ```

### Error: "Connection refused" en tRPC

**Problema**: Frontend no puede conectar con el backend.

**Soluciones**:
1. Verificar `NEXT_PUBLIC_API_URL` en frontend
2. Verificar CORS en backend:
   ```typescript
   enableCors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true,
   });
   ```
3. Revisar logs:
   ```bash
   docker-compose logs backend
   ```

### Contenedores no inician

**Soluciones**:
```bash
# Ver logs detallados
docker-compose logs -f

# Reconstruir imágenes
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Puerto ya en uso

```bash
# Liberar puerto (Windows)
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# En macOS/Linux
lsof -ti:4000 | xargs kill -9
```

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/AmazingFeature`
3. Commit tus cambios: `git commit -m 'Add some AmazingFeature'`
4. Push a la rama: `git push origin feature/AmazingFeature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta [LICENSE](LICENSE) para más detalles.
10. ✅ **CI/CD pipeline** automatizado

El sistema está **completamente funcional** y listo para producción. Todos los módulos están integrados y probados.
