-- Seed data para desarrollo y testing
-- Todos los usuarios comparten la contrasena de prueba: Admin123!

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

TRUNCATE TABLE
	alerta,
	reporte,
	prediccion_rendimiento,
	workflow_ejecucion,
	evento_riego,
	lectura_sensor,
	sensor,
	temporada,
	cultivo,
	lote,
	finca,
	usuario,
	rol
RESTART IDENTITY CASCADE;

-- =====================================================
-- 1) Roles
-- =====================================================
WITH datos (num, nombre, descripcion, created_at) AS (
	VALUES
		(1, 'administrador', 'Acceso total al sistema', TIMESTAMP '2026-04-01 08:00:00'),
		(2, 'agricultor', 'Gestion operativa de fincas y lotes', TIMESTAMP '2026-04-01 08:05:00'),
		(3, 'tecnico', 'Monitoreo, riego y analitica', TIMESTAMP '2026-04-01 08:10:00')
)
INSERT INTO rol (id, nombre, descripcion, created_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre,
	descripcion,
	created_at
FROM datos;

-- =====================================================
-- 2) Usuarios
-- =====================================================
WITH datos (num, email, nombre, apellido, telefono, rol_num, activo, ultimo_acceso, created_at, updated_at) AS (
	VALUES
		(101, 'admin@agriprecision.com',   'Ana',       'Torres',   '3005550101', 1, true,  TIMESTAMP '2026-04-30 09:00:00', TIMESTAMP '2026-04-01 09:00:00', TIMESTAMP '2026-04-01 10:00:00'),
		(102, 'luis.medina@agriprecision.com', 'Luis',   'Medina',   '3005550102', 2, true,  TIMESTAMP '2026-04-29 17:10:00', TIMESTAMP '2026-04-01 09:20:00', TIMESTAMP '2026-04-01 10:20:00'),
		(103, 'paula.rojas@agriprecision.com', 'Paula',   'Rojas',    '3005550103', 2, true,  TIMESTAMP '2026-04-28 14:30:00', TIMESTAMP '2026-04-01 09:40:00', TIMESTAMP '2026-04-01 10:40:00'),
		(104, 'carlos.gomez@agriprecision.com', 'Carlos', 'Gomez',    '3005550104', 3, true,  TIMESTAMP '2026-04-29 08:45:00', TIMESTAMP '2026-04-01 10:00:00', TIMESTAMP '2026-04-01 11:00:00'),
		(105, 'marta.herrera@agriprecision.com', 'Marta', 'Herrera',  '3005550105', 2, true,  TIMESTAMP '2026-04-27 13:15:00', TIMESTAMP '2026-04-01 10:20:00', TIMESTAMP '2026-04-01 11:20:00'),
		(106, 'diego.perez@agriprecision.com',  'Diego',   'Perez',    '3005550106', 3, true,  TIMESTAMP '2026-04-28 18:05:00', TIMESTAMP '2026-04-01 10:40:00', TIMESTAMP '2026-04-01 11:40:00'),
		(107, 'sofia.ramirez@agriprecision.com','Sofia',   'Ramirez',  NULL,          2, true,  TIMESTAMP '2026-04-26 12:25:00', TIMESTAMP '2026-04-01 11:00:00', TIMESTAMP '2026-04-01 12:00:00'),
		(108, 'andres.silva@agriprecision.com', 'Andres',   'Silva',    '3005550108', 3, true,  TIMESTAMP '2026-04-29 07:40:00', TIMESTAMP '2026-04-01 11:20:00', TIMESTAMP '2026-04-01 12:20:00'),
		(109, 'valentina.ruiz@agriprecision.com','Valentina','Ruiz',    '3005550109', 2, true,  TIMESTAMP '2026-04-25 15:50:00', TIMESTAMP '2026-04-01 11:40:00', TIMESTAMP '2026-04-01 12:40:00'),
		(110, 'jorge.castillo@agriprecision.com','Jorge',   'Castillo', '3005550110', 1, true,  TIMESTAMP '2026-04-30 06:55:00', TIMESTAMP '2026-04-01 12:00:00', TIMESTAMP '2026-04-01 13:00:00'),
		(111, 'laura.moreno@agriprecision.com',  'Laura',   'Moreno',   '3005550111', 3, true,  TIMESTAMP '2026-04-24 09:10:00', TIMESTAMP '2026-04-01 12:20:00', TIMESTAMP '2026-04-01 13:20:00'),
		(112, 'felipe.vargas@agriprecision.com',  'Felipe',  'Vargas',   '3005550112', 2, false, NULL,                                  TIMESTAMP '2026-04-01 12:40:00', TIMESTAMP '2026-04-01 13:40:00')
)
INSERT INTO usuario (id, email, password_hash, nombre, apellido, telefono, rol_id, activo, ultimo_acceso, created_at, updated_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	email,
	crypt('Admin123!', gen_salt('bf')),
	nombre,
	apellido,
	telefono,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(rol_num), 12, '0'))::uuid,
	activo,
	ultimo_acceso,
	created_at,
	updated_at
FROM datos;

-- =====================================================
-- 3) Fincas
-- =====================================================
WITH datos (num, nombre, ubicacion, area_hectareas, lon, lat, usuario_num, created_at, updated_at) AS (
	VALUES
		(201, 'Finca El Horizonte',      'Zipaquira, Cundinamarca',        18.50, -74.0721,  4.7110, 101, TIMESTAMP '2026-04-02 08:00:00', TIMESTAMP '2026-04-02 09:00:00'),
		(202, 'Hacienda La Esperanza',   'Rionegro, Antioquia',            24.80, -75.5636,  6.2518, 102, TIMESTAMP '2026-04-02 08:20:00', TIMESTAMP '2026-04-02 09:20:00'),
		(203, 'Agropecuaria La Ceiba',   'Palmira, Valle del Cauca',       32.10, -76.3048,  3.5390, 103, TIMESTAMP '2026-04-02 08:40:00', TIMESTAMP '2026-04-02 09:40:00'),
		(204, 'Finca Los Laureles',      'Ibague, Tolima',                 16.75, -75.2322,  4.4447, 104, TIMESTAMP '2026-04-02 09:00:00', TIMESTAMP '2026-04-02 10:00:00'),
		(205, 'Granja San Isidro',       'Neiva, Huila',                   21.40, -75.2819,  2.9350, 105, TIMESTAMP '2026-04-02 09:20:00', TIMESTAMP '2026-04-02 10:20:00'),
		(206, 'Hacienda El Manantial',   'Villavicencio, Meta',            45.30, -73.6259,  4.1420, 106, TIMESTAMP '2026-04-02 09:40:00', TIMESTAMP '2026-04-02 10:40:00'),
		(207, 'Finca Las Brisas',        'Bucaramanga, Santander',         14.90, -73.1198,  7.1193, 107, TIMESTAMP '2026-04-02 10:00:00', TIMESTAMP '2026-04-02 11:00:00'),
		(208, 'AgroCampo El Roble',      'Tunja, Boyaca',                  28.60, -73.3678,  5.5353, 108, TIMESTAMP '2026-04-02 10:20:00', TIMESTAMP '2026-04-02 11:20:00'),
		(209, 'Finca La Victoria',       'Popayan, Cauca',                 37.20, -76.6132,  2.4448, 109, TIMESTAMP '2026-04-02 10:40:00', TIMESTAMP '2026-04-02 11:40:00'),
		(210, 'Predio Los Naranjos',     'Valledupar, Cesar',              52.80, -73.2532, 10.4631, 110, TIMESTAMP '2026-04-02 11:00:00', TIMESTAMP '2026-04-02 12:00:00'),
		(211, 'Finca Buenavista',        'Pasto, Narino',                  19.60, -77.2811,  1.2136, 111, TIMESTAMP '2026-04-02 11:20:00', TIMESTAMP '2026-04-02 12:20:00'),
		(212, 'Finca Santa Clara',       'Monteria, Cordoba',              41.10, -75.8814,  8.7479, 112, TIMESTAMP '2026-04-02 11:40:00', TIMESTAMP '2026-04-02 12:40:00')
)
INSERT INTO finca (id, nombre, ubicacion, area_hectareas, coordenadas, usuario_id, created_at, updated_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre,
	ubicacion,
	area_hectareas,
	json_build_object('lng', lon::float, 'lat', lat::float)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(usuario_num), 12, '0'))::uuid,
	created_at,
	updated_at
FROM datos;

-- =====================================================
-- 4) Lotes
-- =====================================================
WITH datos (num, nombre, area_hectareas, tipo_suelo, finca_num, lon, lat, created_at, updated_at) AS (
	VALUES
		(301, 'Lote Norte A',      2.40, 'arcilloso', 201, -74.0800,  4.7160, TIMESTAMP '2026-04-03 08:00:00', TIMESTAMP '2026-04-03 09:00:00'),
		(302, 'Lote Sur A',        3.10, 'franco',    201, -74.0620,  4.7050, TIMESTAMP '2026-04-03 08:10:00', TIMESTAMP '2026-04-03 09:10:00'),
		(303, 'Bloque A',          4.20, 'arenoso',   202, -75.5700,  6.2580, TIMESTAMP '2026-04-03 08:20:00', TIMESTAMP '2026-04-03 09:20:00'),
		(304, 'Bloque B',          3.80, 'limoso',    202, -75.5520,  6.2450, TIMESTAMP '2026-04-03 08:30:00', TIMESTAMP '2026-04-03 09:30:00'),
		(305, 'Parcela 1',         5.10, 'franco',    203, -76.3130,  3.5450, TIMESTAMP '2026-04-03 08:40:00', TIMESTAMP '2026-04-03 09:40:00'),
		(306, 'Parcela 2',         4.70, 'arcilloso', 203, -76.2960,  3.5320, TIMESTAMP '2026-04-03 08:50:00', TIMESTAMP '2026-04-03 09:50:00'),
		(307, 'Sector Oeste',      2.80, 'arenoso',   204, -75.2450,  4.4520, TIMESTAMP '2026-04-03 09:00:00', TIMESTAMP '2026-04-03 10:00:00'),
		(308, 'Sector Este',       2.90, 'franco',    204, -75.2230,  4.4380, TIMESTAMP '2026-04-03 09:10:00', TIMESTAMP '2026-04-03 10:10:00'),
		(309, 'Modulo 1',          6.30, 'limoso',    205, -75.2900,  2.9420, TIMESTAMP '2026-04-03 09:20:00', TIMESTAMP '2026-04-03 10:20:00'),
		(310, 'Modulo 2',          5.80, 'arcilloso', 205, -75.2740,  2.9280, TIMESTAMP '2026-04-03 09:30:00', TIMESTAMP '2026-04-03 10:30:00'),
		(311, 'Unidad 3',          4.00, 'franco',    206, -73.6330,  4.1480, TIMESTAMP '2026-04-03 09:40:00', TIMESTAMP '2026-04-03 10:40:00'),
		(312, 'Unidad 4',          3.90, 'arenoso',   206, -73.6170,  4.1370, TIMESTAMP '2026-04-03 09:50:00', TIMESTAMP '2026-04-03 10:50:00'),
		(313, 'Lote Bajo',         7.10, 'limoso',    207, -73.1250,  7.1260, TIMESTAMP '2026-04-03 10:00:00', TIMESTAMP '2026-04-03 11:00:00'),
		(314, 'Lote Alto',         6.60, 'franco',    208, -73.1180,  7.1070, TIMESTAMP '2026-04-03 10:10:00', TIMESTAMP '2026-04-03 11:10:00'),
		(315, 'Lote Central',      8.40, 'arcilloso', 209, -76.6200,  2.4510, TIMESTAMP '2026-04-03 10:20:00', TIMESTAMP '2026-04-03 11:20:00'),
		(316, 'Lote Semillero',    1.90, 'arenoso',   210, -76.6050,  2.4370, TIMESTAMP '2026-04-03 10:30:00', TIMESTAMP '2026-04-03 11:30:00'),
		(317, 'Lote Ensayo',       2.20, 'franco',    211, -77.2870,  1.2200, TIMESTAMP '2026-04-03 10:40:00', TIMESTAMP '2026-04-03 11:40:00'),
		(318, 'Lote Reserva',      3.30, 'limoso',    212, -75.8720,  8.7390, TIMESTAMP '2026-04-03 10:50:00', TIMESTAMP '2026-04-03 11:50:00')
)
INSERT INTO lote (id, nombre, area_hectareas, tipo_suelo, coordenadas_poligono, finca_id, created_at, updated_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre,
	area_hectareas,
	tipo_suelo,
	(ST_AsGeoJSON(
		ST_MakeEnvelope(lon - 0.008, lat - 0.008, lon + 0.008, lat + 0.008, 4326)::geometry
	)::json)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(finca_num), 12, '0'))::uuid,
	created_at,
	updated_at
FROM datos;

-- =====================================================
-- 5) Cultivos
-- =====================================================
WITH datos (num, nombre, variedad, ciclo_dias, requerimiento_agua_mm, temperatura_optima, humedad_optima) AS (
	VALUES
		(401, 'Maiz Amarillo',   'Hibrido 30F35',    120,  520.00, 24.5, 65),
		(402, 'Cafe Arabe',      'Castillo Mejorado', 720, 850.00, 20.0, 75),
		(403, 'Arroz F1',        'Corte Alto',       110,  650.00, 28.0, 70),
		(404, 'Papa Pastusa',    'Pastusa Suprema',  150,  500.00, 15.0, 80),
		(405, 'Cacao Fino',      'Trinitario',       900, 950.00, 26.0, 78),
		(406, 'Tomate Chonto',   'Rio Grande',       110,  450.00, 22.0, 60),
		(407, 'Aguacate Hass',   'Hass Premium',     800, 900.00, 18.5, 68),
		(408, 'Banano',          'Cavendish',        365, 990.00, 27.0, 75),
		(409, 'Fresa',           'San Andreas',      150,  400.00, 17.0, 85),
		(410, 'Cebolla Larga',   'Larga de Rama',    130,  350.00, 19.0, 70)
)
INSERT INTO cultivo (id, nombre, variedad, ciclo_dias, requerimiento_agua_mm, temperatura_optima, humedad_optima)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre,
	variedad,
	ciclo_dias,
	requerimiento_agua_mm,
	temperatura_optima,
	humedad_optima
FROM datos;

-- =====================================================
-- 6) Temporadas
-- =====================================================
WITH base AS (
	SELECT
		gs AS seq,
		301 + ((gs - 1) % 18) AS lote_num,
		401 + ((gs - 1) % 10) AS cultivo_num,
		DATE '2025-12-01' + ((gs - 1) * 12) AS fecha_siembra,
		CASE
			WHEN gs IN (1, 5, 10) THEN 'planificado'
			WHEN gs IN (3, 6, 9, 12, 15) THEN 'cosechado'
			WHEN gs IN (4, 8, 13) THEN 'fallido'
			ELSE 'activo'
		END AS estado,
		CASE 401 + ((gs - 1) % 10)
			WHEN 401 THEN 120
			WHEN 402 THEN 720
			WHEN 403 THEN 110
			WHEN 404 THEN 150
			WHEN 405 THEN 900
			WHEN 406 THEN 110
			WHEN 407 THEN 800
			WHEN 408 THEN 365
			WHEN 409 THEN 150
			WHEN 410 THEN 130
		END AS ciclo_dias
	FROM generate_series(1, 15) AS gs
)
INSERT INTO temporada (id, cultivo_id, lote_id, fecha_siembra, fecha_cosecha_estimada, fecha_cosecha_real, estado, created_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(500 + seq), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(cultivo_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	fecha_siembra,
	fecha_siembra + ciclo_dias,
	CASE
		WHEN estado = 'cosechado' THEN fecha_siembra + (ciclo_dias - 7)
		ELSE NULL
	END,
	estado,
	TIMESTAMP '2026-04-04 08:00:00' + ((seq - 1) * INTERVAL '3 hours')
FROM base;

-- =====================================================
-- 7) Sensores
-- =====================================================
WITH datos (num, codigo, tipo, lote_num, lon, lat, instalado_en, ultimo_mantenimiento, activo) AS (
	VALUES
		(601, 'SEN-CLM-001', 'clima',       301, -74.0790,  4.7155, TIMESTAMP '2026-03-02 07:10:00', TIMESTAMP '2026-04-20 09:00:00', true),
		(602, 'SEN-SUE-002', 'suelo',       302, -74.0630,  4.7045, TIMESTAMP '2026-03-03 07:20:00', TIMESTAMP '2026-04-19 09:00:00', true),
		(603, 'SEN-HUM-003', 'humedad',     303, -75.5690,  6.2570, TIMESTAMP '2026-03-04 07:30:00', TIMESTAMP '2026-04-18 09:30:00', true),
		(604, 'SEN-TMP-004', 'temperatura', 304, -75.5510,  6.2440, TIMESTAMP '2026-03-05 07:40:00', TIMESTAMP '2026-04-17 10:00:00', true),
		(605, 'SEN-CLM-005', 'clima',       305, -76.3120,  3.5440, TIMESTAMP '2026-03-06 07:50:00', TIMESTAMP '2026-04-16 10:00:00', true),
		(606, 'SEN-SUE-006', 'suelo',       306, -76.2970,  3.5310, TIMESTAMP '2026-03-07 08:00:00', TIMESTAMP '2026-04-15 10:30:00', true),
		(607, 'SEN-HUM-007', 'humedad',     307, -75.2440,  4.4510, TIMESTAMP '2026-03-08 08:10:00', TIMESTAMP '2026-04-14 10:30:00', true),
		(608, 'SEN-TMP-008', 'temperatura', 308, -75.2220,  4.4370, TIMESTAMP '2026-03-09 08:20:00', TIMESTAMP '2026-04-13 11:00:00', true),
		(609, 'SEN-CLM-009', 'clima',       309, -75.2890,  2.9410, TIMESTAMP '2026-03-10 08:30:00', TIMESTAMP '2026-04-12 11:00:00', true),
		(610, 'SEN-SUE-010', 'suelo',       310, -75.2730,  2.9270, TIMESTAMP '2026-03-11 08:40:00', TIMESTAMP '2026-04-11 11:30:00', true),
		(611, 'SEN-HUM-011', 'humedad',     311, -73.6320,  4.1470, TIMESTAMP '2026-03-12 08:50:00', TIMESTAMP '2026-04-10 11:30:00', true),
		(612, 'SEN-TMP-012', 'temperatura', 312, -73.6160,  4.1360, TIMESTAMP '2026-03-13 09:00:00', TIMESTAMP '2026-04-09 12:00:00', true),
		(613, 'SEN-CLM-013', 'clima',       313, -73.1240,  7.1250, TIMESTAMP '2026-03-14 09:10:00', TIMESTAMP '2026-04-08 12:00:00', true),
		(614, 'SEN-SUE-014', 'suelo',       314, -73.1170,  7.1060, TIMESTAMP '2026-03-15 09:20:00', TIMESTAMP '2026-04-07 12:30:00', false),
		(615, 'SEN-HUM-015', 'humedad',     315, -76.6190,  2.4500, TIMESTAMP '2026-03-16 09:30:00', TIMESTAMP '2026-04-06 12:30:00', false)
)
INSERT INTO sensor (id, codigo, tipo, ubicacion, lote_id, instalado_en, ultimo_mantenimiento, activo)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	codigo,
	tipo,
	json_build_object('lng', lon::float, 'lat', lat::float)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	instalado_en,
	ultimo_mantenimiento,
	activo
FROM datos;

-- =====================================================
-- 8) Lecturas de sensores
-- =====================================================
INSERT INTO lectura_sensor (
	id,
	sensor_id,
	timestamp,
	temperatura,
	humedad_suelo,
	humedad_ambiente,
	precipitacion,
	radiacion_solar,
	velocidad_viento,
	presion_atmosferica,
	created_at
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(700 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(601 + ((gs - 1) % 15)), 12, '0'))::uuid,
	TIMESTAMP '2026-04-01 06:00:00' + ((gs - 1) * INTERVAL '6 hours'),
	round((18.0 + ((gs - 1) % 12) * 0.8)::numeric, 1),
	35 + ((gs * 5) % 45),
	55 + ((gs * 4) % 35),
	round(((gs % 6) * 1.7)::numeric, 1),
	round((420 + ((gs * 17) % 390))::numeric, 1),
	round((1.1 + ((gs * 3) % 18) * 0.12)::numeric, 2),
	round((1007.5 + ((gs * 2) % 10) * 0.7)::numeric, 2),
	TIMESTAMP '2026-04-01 06:05:00' + ((gs - 1) * INTERVAL '6 hours')
FROM generate_series(1, 60) AS gs;

-- =====================================================
-- 9) Eventos de riego
-- =====================================================
WITH base AS (
	SELECT
		gs,
		301 + ((gs - 1) % 18) AS lote_num,
		(ARRAY['goteo', 'aspersion', 'inundacion', 'subterraneo'])[((gs - 1) % 4) + 1] AS tipo_riego,
		(ARRAY['manual', 'automatico', 'prediccion_ml', 'programado'])[((gs - 1) % 4) + 1] AS origen_decision
	FROM generate_series(1, 18) AS gs
)
INSERT INTO evento_riego (
	id,
	lote_id,
	fecha_hora,
	duracion_minutos,
	volumen_m3,
	tipo_riego,
	origen_decision,
	eficiencia,
	created_at
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(800 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	TIMESTAMP '2026-04-05 05:30:00' + ((gs - 1) * INTERVAL '1 day'),
	25 + ((gs - 1) % 6) * 10,
	round((4.50 + ((gs - 1) * 0.55))::numeric, 2),
	tipo_riego,
	origen_decision,
	round((0.72 + ((gs - 1) % 8) * 0.03)::numeric, 2),
	TIMESTAMP '2026-04-05 06:10:00' + ((gs - 1) * INTERVAL '1 day')
FROM base;

-- =====================================================
-- 10) Ejecuciones de workflows
-- =====================================================
WITH base AS (
	SELECT
		gs,
		(ARRAY['ingesta_clima', 'generacion_reporte', 'prediccion_rendimiento'])[((gs - 1) % 3) + 1] AS workflow_nombre,
		(ARRAY['ejecutando', 'completado', 'fallido', 'cancelado'])[((gs - 1) % 4) + 1] AS estado,
		TIMESTAMP '2026-04-01 05:00:00' + ((gs - 1) * INTERVAL '8 hours') AS inicio_ejecucion
	FROM generate_series(1, 15) AS gs
)
INSERT INTO workflow_ejecucion (
	id,
	workflow_nombre,
	inicio_ejecucion,
	fin_ejecucion,
	estado,
	parametros_entrada,
	resultado_salida,
	error_mensaje,
	created_at
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(900 + gs), 12, '0'))::uuid,
	workflow_nombre,
	inicio_ejecucion,
	CASE
		WHEN estado = 'ejecutando' THEN NULL
		ELSE inicio_ejecucion + INTERVAL '22 minutes' + ((gs % 5) * INTERVAL '3 minutes')
	END,
	estado,
	jsonb_build_object(
		'fuente', 'n8n',
		'ventana_horas', 24,
		'prioridad', CASE WHEN gs % 2 = 0 THEN 'alta' ELSE 'media' END,
		'ambiente', 'development'
	),
	CASE
		WHEN estado = 'completado' THEN jsonb_build_object('filas_procesadas', 120 + (gs * 7), 'registros_validos', 115 + (gs * 6), 'duracion_segundos', 85 + (gs * 4))
		WHEN estado = 'fallido' THEN jsonb_build_object('filas_procesadas', 90 + (gs * 5), 'registros_validos', 84 + (gs * 4))
		WHEN estado = 'cancelado' THEN jsonb_build_object('motivo', 'cancelacion_manual')
		ELSE NULL
	END,
	CASE
		WHEN estado = 'fallido' THEN 'Timeout al consultar fuente externa de clima'
		WHEN estado = 'cancelado' THEN 'Ejecucion cancelada por mantenimiento'
		ELSE NULL
	END,
	TIMESTAMP '2026-04-01 05:10:00' + ((gs - 1) * INTERVAL '8 hours')
FROM base;

-- =====================================================
-- 11) Predicciones de rendimiento
-- =====================================================
WITH base AS (
	SELECT
		gs,
		301 + ((gs - 1) % 18) AS lote_num,
		501 + (gs - 1) AS temporada_num,
		DATE '2026-04-02' + ((gs - 1) * 2) AS fecha_prediccion,
		(ARRAY['random_forest', 'gradient_boosting', 'ensemble_stack'])[((gs - 1) % 3) + 1] AS modelo_utilizado
	FROM generate_series(1, 15) AS gs
)
INSERT INTO prediccion_rendimiento (
	id,
	lote_id,
	temporada_id,
	fecha_prediccion,
	rendimiento_estimado_kg_ha,
	intervalo_confianza_inf,
	intervalo_confianza_sup,
	factores_influencia,
	modelo_utilizado,
	precision_modelo,
	created_at
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(1000 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(temporada_num), 12, '0'))::uuid,
	fecha_prediccion,
	round((4200 + (gs * 180))::numeric, 2),
	round((4200 + (gs * 180) - 280)::numeric, 2),
	round((4200 + (gs * 180) + 310)::numeric, 2),
	jsonb_build_object(
		'temperatura_promedio', round((18.5 + ((gs - 1) % 6) * 1.2)::numeric, 1),
		'humedad_suelo', 38 + ((gs * 4) % 40),
		'precipitacion_mm', round((((gs - 1) % 5) * 2.3)::numeric, 1),
		'ndvi', round((0.62 + ((gs - 1) % 5) * 0.04)::numeric, 2)
	),
	modelo_utilizado,
	round((0.842 + ((gs - 1) % 7) * 0.011)::numeric, 3),
	TIMESTAMP '2026-04-02 07:00:00' + ((gs - 1) * INTERVAL '5 hours')
FROM base;

-- =====================================================
-- 12) Reportes
-- =====================================================
WITH base AS (
	SELECT
		gs,
		101 + ((gs - 1) % 12) AS usuario_num,
		CASE WHEN gs % 2 = 0 THEN 901 + ((gs - 1) % 15) ELSE NULL END AS workflow_num,
		(ARRAY['operacional', 'gestion', 'prediccion', 'riego'])[((gs - 1) % 4) + 1] AS tipo,
		(ARRAY['pdf', 'csv', 'json'])[((gs - 1) % 3) + 1] AS formato,
		TIMESTAMP '2026-04-03 08:00:00' + ((gs - 1) * INTERVAL '1 day') AS generado_en
	FROM generate_series(1, 12) AS gs
)
INSERT INTO reporte (
	id,
	usuario_id,
	workflow_ejecucion_id,
	tipo,
	formato,
	url_archivo,
	parametros_filtros,
	tamanio_bytes,
	generado_en,
	descargado_en
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(1100 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(usuario_num), 12, '0'))::uuid,
	CASE
		WHEN workflow_num IS NULL THEN NULL
		ELSE format('00000000-0000-0000-0000-%s', lpad(to_hex(workflow_num), 12, '0'))::uuid
	END,
	tipo,
	formato,
	NULL,
	jsonb_build_object(
		'rango', CASE WHEN gs % 2 = 0 THEN 'mensual' ELSE 'semanal' END,
		'tipo', tipo,
		'finca', CASE
			WHEN gs <= 4 THEN 'Zona Norte'
			WHEN gs <= 8 THEN 'Zona Centro'
			ELSE 'Zona Sur'
		END
	),
	180000 + (gs * 8500),
	generado_en,
	CASE WHEN gs % 3 = 0 THEN generado_en + INTERVAL '18 hours' ELSE NULL END
FROM base;

-- =====================================================
-- 13) Alertas
-- =====================================================
WITH base AS (
	SELECT
		gs,
		101 + ((gs - 1) % 12) AS usuario_num,
		301 + ((gs - 1) % 18) AS lote_num,
		(ARRAY['riego', 'clima', 'plaga', 'rendimiento', 'sistema'])[((gs - 1) % 5) + 1] AS tipo,
		(ARRAY['info', 'advertencia', 'critica', 'emergencia'])[((gs - 1) % 4) + 1] AS severidad,
		TIMESTAMP '2026-04-04 06:30:00' + ((gs - 1) * INTERVAL '10 hours') AS creada_en,
		CASE WHEN gs % 2 = 0 THEN true ELSE false END AS leida
	FROM generate_series(1, 15) AS gs
)
INSERT INTO alerta (
	id,
	usuario_id,
	lote_id,
	tipo,
	severidad,
	mensaje,
	datos_contexto,
	leida,
	creada_en,
	leida_en
)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(1200 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(usuario_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	tipo,
	severidad,
	CASE tipo
		WHEN 'riego' THEN 'Humedad del suelo por debajo del umbral recomendado en el lote ' || lote_num::text
		WHEN 'clima' THEN 'Pronostico de lluvia intensa para el lote ' || lote_num::text
		WHEN 'plaga' THEN 'Posible riesgo de plaga detectado por analitica historica en el lote ' || lote_num::text
		WHEN 'rendimiento' THEN 'El rendimiento estimado descendio respecto a la prediccion anterior en el lote ' || lote_num::text
		ELSE 'Servicio de integracion con n8n requiere revision'
	END,
	jsonb_build_object(
		'umbral', CASE tipo WHEN 'riego' THEN 35 WHEN 'clima' THEN 80 WHEN 'plaga' THEN 70 WHEN 'rendimiento' THEN 15 ELSE 1 END,
		'valor_detectado', CASE tipo WHEN 'riego' THEN 28 WHEN 'clima' THEN 91 WHEN 'plaga' THEN 76 WHEN 'rendimiento' THEN 12 ELSE 0 END,
		'origen', 'seed'
	),
	leida,
	creada_en,
	CASE WHEN leida THEN creada_en + INTERVAL '2 hours' ELSE NULL END
FROM base;

COMMIT;
