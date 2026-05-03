-- Seed data para desarrollo y testing
-- Usuarios: 1 administrador, 2 agricultores, 1 técnico (contraseña común Admin123!)
-- Datos voluminosos por usuario para interfaces más pobladas (fincas, lotes, sensores, histórico).

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
-- 1) Roles del sistema
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
-- 2) Usuarios — 101 admin · 102–103 agricultores · 104 técnico
-- =====================================================
WITH datos (num, email, nombre, apellido, telefono, rol_num, activo, ultimo_acceso, created_at, updated_at) AS (
	VALUES
		(
			101,
			'admin@agriprecision.com',
			'Ana Lucia',
			'García de la Torre',
			'+57 310 889 4421',
			1,
			true,
			TIMESTAMP '2026-04-28 14:22:00',
			TIMESTAMP '2025-11-10 09:30:00',
			TIMESTAMP '2026-04-01 09:45:00'
		),
		(
			102,
			'luis.medina@camporico.co',
			'Luis Eduardo',
			'Medina Oviedo',
			'+57 311 204 9932',
			2,
			true,
			TIMESTAMP '2026-04-30 06:58:00',
			TIMESTAMP '2026-03-08 07:45:00',
			TIMESTAMP '2026-04-02 08:40:00'
		),
		(
			103,
			'paula.rojas.verde.agro@gmail.com',
			'Paula Andrea',
			'Rojas Marin',
			'+57 320 551 0876',
			2,
			true,
			TIMESTAMP '2026-04-29 21:03:00',
			TIMESTAMP '2026-03-02 06:55:00',
			TIMESTAMP '2026-04-02 09:10:00'
		),
		(
			104,
			'carlos.gomez@servitecnicarural.org',
			'Carlos Andres',
			'Gomez Ruiz',
			'+57 316 774 0198',
			3,
			true,
			TIMESTAMP '2026-04-30 11:15:00',
			TIMESTAMP '2026-06-01 08:05:00',
			TIMESTAMP '2026-04-03 07:55:00'
		)
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
-- 3) Fincas — 15 fincas (102 y 103 con mayor cartera); admin y técnico con predios de referencia
-- =====================================================
WITH datos (num, nombre, ubicacion, area_hectareas, lon, lat, usuario_num, created_at, updated_at) AS (
	VALUES
		(201, 'Corporativo Centro Monitoreo PN',           'Sesquicentenario, Bucaramanga, Santander',   42.75, -73.1204,   7.1192,   101, TIMESTAMP '2025-11-12 07:45:00', TIMESTAMP '2026-04-10 09:05:00'),
		(202, 'Laboratorio territorial Agriprecision',     'Km 4 Siberia-Cota, Cundinamarca',           68.40, -74.0432,   4.7621,   101, TIMESTAMP '2025-12-01 06:55:00', TIMESTAMP '2026-04-12 07:59:00'),
		(203, 'Los Arrayanes — Maiz tolerante sequia',       'Sabana de Torres, Santander',                156.90, -73.5062,   7.3954,   102, TIMESTAMP '2026-01-07 06:43:00', TIMESTAMP '2026-04-16 06:54:00'),
		(204, 'Los Arrayanes Norte — Pivot y goteo',       'Sabana de Torres, Santander',                224.05, -73.4888,   7.4121,   102, TIMESTAMP '2026-02-07 06:53:00', TIMESTAMP '2026-04-09 06:53:00'),
		(205, 'Santa Helena — Aguacate y tomate tunnel',    'Fredonia, Antioquia',                        92.33, -75.6782,   6.0588,   102, TIMESTAMP '2026-01-07 06:53:00', TIMESTAMP '2026-04-19 06:53:00'),
		(206, 'Laguna Verde — Arroz temporada seca/humeda', 'Palmira, Valle del Cauca',                   310.67, -76.3012,   3.5512,   102, TIMESTAMP '2025-06-06 06:53:00', TIMESTAMP '2026-04-20 06:53:00'),
		(207, 'El Vergel Cafetero altitude media',       'La Plata, Huila',                            138.05, -75.8901,   2.3887,   102, TIMESTAMP '2025-06-06 06:53:00', TIMESTAMP '2026-03-06 06:53:00'),
		(208, 'Brisas del Cauca — Papa y hortalias',       'Morales, Cauca',                             205.88, -76.6301,   2.4544,   103, TIMESTAMP '2025-09-06 06:53:00', TIMESTAMP '2026-04-14 06:53:00'),
		(209, 'Cordillera Alta — Papa semilla certificada', 'Silvia, Cauca',                              174.62, -76.8804,   2.6121,   103, TIMESTAMP '2025-11-06 06:53:00', TIMESTAMP '2026-04-15 06:53:00'),
		(210, 'Llano Bajio — Banana y cacao asociativo',    'Santa Rosa del Sur, Bolivar',                389.41, -74.8901,   6.7432,   103, TIMESTAMP '2024-06-06 06:53:00', TIMESTAMP '2026-04-06 06:53:00'),
		(211, 'Meta Sur — Ganaderia mejorada riego pivote','Castilla la Nueva, Meta',                     442.07, -73.6932,   4.6298,   103, TIMESTAMP '2026-06-06 06:53:00', TIMESTAMP '2026-04-17 06:53:00'),
		(212, 'Orinoquia Centro — Sesamo y sistema mixto','Yopal, Casanare',                            528.93, -72.3987,   5.3376,   103, TIMESTAMP '2026-06-06 06:53:00', TIMESTAMP '2026-04-18 06:53:00'),
		(213, 'Cuenca Alta Rio Opón — Soporte zonificacion','Barbosa, Santander',                        188.74, -73.6132,   5.9321,   104, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-11 06:53:00'),
		(214, 'Valle Medio Magdalena Norte — Auditoria uso agua','Aguazul, Casanare',              356.41, -72.5521,   5.1743,   104, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-12 06:53:00'),
		(215, 'Macizo fluvial Sogamoso — Sensores comunales','Sabana del Torre, Norte de Santander',     267.82, -72.2455,   7.8491,   104, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-21 06:53:00')
)
INSERT INTO finca (id, nombre, ubicacion, area_hectareas, coordenadas, usuario_id, created_at, updated_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre,
	ubicacion,
	area_hectareas,
	json_build_object('lng', lon::double precision, 'lat', lat::double precision)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(usuario_num), 12, '0'))::uuid,
	created_at,
	updated_at
FROM datos;

-- =====================================================
-- 4) Lotes — 60 lotes (4 × 15 fincas), sin random() reproducible en cada carga
-- =====================================================
WITH fincas AS (
	SELECT num, nombre, lon, lat, ca, ua FROM (VALUES
		(201, 'Corporativo Centro Monitoreo PN',           -73.1204::double precision, 7.1192::double precision, TIMESTAMP '2025-11-12 07:45:00', TIMESTAMP '2026-04-10 09:05:00'),
		(202, 'Laboratorio territorial Agriprecision',     -74.0432::double precision, 4.7621::double precision, TIMESTAMP '2025-12-01 06:55:00', TIMESTAMP '2026-04-12 07:59:00'),
		(203, 'Los Arrayanes — Maíz tolerante a sequía',       -73.5062,  7.3954, TIMESTAMP '2026-01-07 06:43:00', TIMESTAMP '2026-04-16 06:54:00'),
		(204, 'Los Arrayanes Norte — Pivots y complemento', -73.4888,  7.4121, TIMESTAMP '2026-02-07 06:53:00', TIMESTAMP '2026-04-09 06:53:00'),
		(205, 'Santa Helena — Aguacate y tomate tunelados', -75.6782,  6.0588, TIMESTAMP '2026-01-07 06:53:00', TIMESTAMP '2026-04-19 06:53:00'),
		(206, 'Laguna Verde — Arroz temporada seca/húmeda', -76.3012,  3.5512, TIMESTAMP '2025-06-06 06:53:00', TIMESTAMP '2026-04-20 06:53:00'),
		(207, 'El Vergel — Café altitud media',       -75.8901,  2.3887, TIMESTAMP '2025-06-06 06:53:00', TIMESTAMP '2026-03-06 06:53:00'),
		(208, 'Brisas del Cauca — Papa y hortícolas',       -76.6301,  2.4544, TIMESTAMP '2025-09-06 06:53:00', TIMESTAMP '2026-04-14 06:53:00'),
		(209, 'Cordillera Alta — Papa semilla certificada', -76.8804,  2.6121, TIMESTAMP '2025-11-06 06:53:00', TIMESTAMP '2026-04-15 06:53:00'),
		(210, 'Llano Bajío — Banana y cacao asociativo',    -74.8901,  6.7432, TIMESTAMP '2024-06-06 06:53:00', TIMESTAMP '2026-04-06 06:53:00'),
		(211, 'Meta Sur — Integración pivote ganadería', -73.6932,  4.6298, TIMESTAMP '2026-06-06 06:53:00', TIMESTAMP '2026-04-17 06:53:00'),
		(212, 'Orinoquia Centro — Sésamo y rotación corta', -72.3987,  5.3376, TIMESTAMP '2026-06-06 06:53:00', TIMESTAMP '2026-04-18 06:53:00'),
		(213, 'Cuenca alta Río Opón — Soporte zonificación', -73.6132,  5.9321, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-11 06:53:00'),
		(214, 'Valle medio Magdalena — Auditoría agua', -72.5521,  5.1743, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-12 06:53:00'),
		(215, 'Macizo Sogamoso — Sensores comunales', -72.2455,  7.8491, TIMESTAMP '2026-05-06 06:53:00', TIMESTAMP '2026-04-21 06:53:00')
	) AS q(num, nombre, lon, lat, ca, ua)
),
slots AS (
	SELECT
		ROW_NUMBER() OVER (ORDER BY f.num, g.n)::int AS seq,
		f.num AS finca_num,
		g.n::int AS celda,
		f.lon + ((g.n - 2.25) * 0.015)::double precision AS lon,
		f.lat + ((g.n - 2.5) * 0.018)::double precision AS lat,
		(ARRAY['arcilloso', 'arenoso', 'limoso', 'franco', 'orgánico'])[
			1 + mod(((f.num + g.n)::int), 5)
		] AS tipo_suelo,
		(round((5.05 + ((((f.num * 17 + g.n * 9) % 35))::numeric * 0.17)), 2))::numeric(10, 2) AS area_ha,
		f.ca AS created_at,
		f.ua AS updated_at
	FROM fincas f
	CROSS JOIN LATERAL generate_series(1, 4) AS g(n)
)
INSERT INTO lote (id, nombre, area_hectareas, tipo_suelo, coordenadas_poligono, finca_id, created_at, updated_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(300 + seq), 12, '0'))::uuid,
	format('Sector %s · celda %s', finca_num::text, celda::text),
	area_ha,
	tipo_suelo::varchar(50),
	(ST_AsGeoJSON(
		ST_MakeEnvelope(lon - 0.006, lat - 0.006, lon + 0.006, lat + 0.006, 4326)::geometry
	)::json)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(finca_num), 12, '0'))::uuid,
	created_at,
	updated_at
FROM slots;

-- =====================================================
-- 5) Cultivos — catálogo más descriptivo (IDs 401–410)
-- =====================================================
WITH datos (num, nombre, variedad, ciclo_dias, requerimiento_agua_mm, temperatura_optima, humedad_optima) AS (
	VALUES
		(401, 'Maíz amarillo híbrido', 'DKC 6972',                    118,  515.00, 24.2, 64),
		(402, 'Café arábigo',           'Castillo CL 14',              728,  845.00, 19.6, 76),
		(403, 'Arroz F1 ciclo medio',    'Fedearroz 677',               112,  642.00, 27.4, 69),
		(404, 'Papa Pastusa mejorada',  'Diacol Capira Suprema',       148,  498.00, 15.1, 82),
		(405, 'Cacao fino de aroma',     'ICS 95 Trinidad',             892,  938.00, 26.4, 78),
		(406, 'Tomate chonto vid',       'Roma Plus HID-14',           108,  438.00, 22.0, 59),
		(407, 'Aguacate Hass',           'Lamb Hass / Choquette',       782,  905.00, 18.2, 66),
		(408, 'Banano Cavendish export','Grande nueve FHIA-23',      362,  985.00, 27.8, 74),
		(409, 'Fresa día neutro',        'San Andreas PLUS',           154,  392.00, 17.2, 86),
		(410, 'Sésamo orinoquia',       'Sesaco 668',                  132,  318.00, 28.0, 55)
)
INSERT INTO cultivo (id, nombre, variedad, ciclo_dias, requerimiento_agua_mm, temperatura_optima, humedad_optima)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(num), 12, '0'))::uuid,
	nombre::varchar(100),
	variedad::varchar(100),
	ciclo_dias,
	requerimiento_agua_mm,
	temperatura_optima::numeric(4, 1),
	humedad_optima
FROM datos;

-- =====================================================
-- 6) Temporadas — una fila por lote (IDs 501–560)
-- =====================================================
WITH base AS (
	SELECT
		seq,
		300 + seq AS lote_num,
		401 + ((seq - 1) % 10) AS cultivo_num,
		(DATE '2025-06-03' + (seq * 2))::date AS fecha_siembra,
		CASE
			WHEN seq % 9 = 0 THEN 'planificado'
			WHEN seq % 7 = 0 THEN 'cosechado'
			WHEN seq % 11 = 0 THEN 'fallido'
			ELSE 'activo'
		END AS estado,
		CASE 401 + ((seq - 1) % 10)
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
			ELSE 120
		END AS ciclo_dias
	FROM generate_series(1, 60) AS seq
)
INSERT INTO temporada (id, cultivo_id, lote_id, fecha_siembra, fecha_cosecha_estimada, fecha_cosecha_real, estado, created_at)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(500 + seq), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(cultivo_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	fecha_siembra,
	fecha_siembra + ciclo_dias,
	CASE WHEN estado = 'cosechado' THEN fecha_siembra + (ciclo_dias - 9) ELSE NULL END,
	estado,
	TIMESTAMP '2026-04-04 08:00:00' + ((seq - 1) * INTERVAL '45 minutes')
FROM base;

-- =====================================================
-- 7) Sensores — 120 equipos (2 por cada uno de los 60 lotes, IDs 601–720)
-- =====================================================
WITH parejas AS (
	SELECT
		300 + l.n AS lote_num,
		g.tipo,
		g.dx
	FROM generate_series(1, 60) AS l(n)
	CROSS JOIN LATERAL (
		VALUES
			('clima'::varchar(50), 1),
			('suelo'::varchar(50), 2)
	) AS g(tipo, dx)
),
enumerado AS (
	SELECT
		ROW_NUMBER() OVER (ORDER BY lote_num, dx)::int AS rn,
		lote_num,
		tipo
	FROM parejas
)
INSERT INTO sensor (id, codigo, tipo, ubicacion, lote_id, instalado_en, ultimo_mantenimiento, activo)
SELECT
	format('00000000-0000-0000-0000-%s', lpad(to_hex(600 + rn), 12, '0'))::uuid,
	format('SENS-%s-%s',
		CASE tipo
			WHEN 'clima' THEN 'CLM' WHEN 'suelo' THEN 'SUE'
			WHEN 'humedad' THEN 'HUM' ELSE 'TMP'
		END,
		LPAD(rn::text, 4, '0')
	),
	tipo,
	json_build_object(
		'lng', (-73.0 + ((((rn % 120))::numeric) * 0.04))::double precision,
		'lat', (2.8 + ((((rn % 90))::numeric) * 0.035))::double precision
	)::jsonb,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	TIMESTAMP '2025-06-07 06:05:00' + ((rn - 1) * INTERVAL '3 hours'),
	TIMESTAMP '2026-04-18 08:00:00' - ((rn % 31) * INTERVAL '1 day'),
	(rn % 13 <> 0)
FROM enumerado;

-- =====================================================
-- 8) Lecturas — 320 muestras (histórico denso últimas semanas)
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
	format('00000000-0000-0000-0000-%s', lpad(to_hex(770 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(601 + ((gs - 1) % 120)), 12, '0'))::uuid,
	TIMESTAMP '2026-03-15 04:30:00' + ((gs - 1) * INTERVAL '3 hours'),
	round((16.8 + ((gs % 18) * 1.07))::numeric, 1),
	32 + ((gs * 5) % 45),
	53 + ((gs * 11) % 33),
	round(((gs % 9)::numeric * 1.42), 1),
	round((430 + ((gs * 19) % 380))::numeric, 1),
	round((0.92 + ((gs % 24) * 0.095))::numeric, 2),
	round((1006.9 + ((gs % 18) * 0.82))::numeric, 2),
	TIMESTAMP '2026-03-15 04:42:00' + ((gs - 1) * INTERVAL '3 hours')
FROM generate_series(1, 320) AS gs;

-- =====================================================
-- 9) Eventos de riego (88 registros ciclando 60 lotes)
-- =====================================================
WITH base AS (
	SELECT
		gs,
		301 + ((gs - 1) % 60) AS lote_num,
		(ARRAY['goteo', 'aspersion', 'inundacion', 'subterraneo'])[((gs - 1) % 4) + 1]::varchar(20) AS tipo_riego,
		(ARRAY['manual', 'automatico', 'prediccion_ml', 'programado'])[((gs - 1) % 4) + 1]::varchar(50) AS origen_decision
	FROM generate_series(1, 88) AS gs
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
	format('00000000-0000-0000-0000-%s', lpad(to_hex(830 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	TIMESTAMP '2026-01-08 03:35:00' + ((gs - 1) * INTERVAL '18 hours'),
	22 + ((gs % 9) * 12),
	round((4.20 + ((gs % 62)::numeric * 0.14))::numeric, 2),
	tipo_riego,
	origen_decision,
	round((0.68 + ((gs % 9) * 0.029))::numeric, 2),
	TIMESTAMP '2026-01-08 04:06:00' + ((gs - 1) * INTERVAL '18 hours')
FROM base;

-- =====================================================
-- 10) Workflows (IDs 891–930)
-- =====================================================
WITH base AS (
	SELECT
		gs,
		(ARRAY['ingesta_clima', 'generacion_reporte', 'prediccion_rendimiento'])[((gs - 1) % 3) + 1]::varchar(100) AS workflow_nombre,
		(ARRAY['ejecutando', 'completado', 'fallido', 'cancelado'])[((gs - 1) % 4) + 1]::varchar(20) AS estado,
		TIMESTAMP '2026-01-03 03:05:00' + ((gs - 1) * INTERVAL '5 hours') AS inicio_ejecucion
	FROM generate_series(1, 40) AS gs
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
	format('00000000-0000-0000-0000-%s', lpad(to_hex(890 + gs), 12, '0'))::uuid,
	workflow_nombre,
	inicio_ejecucion,
	CASE
		WHEN estado = 'ejecutando' THEN NULL
		ELSE inicio_ejecucion + INTERVAL '19 minutes' + ((gs % 7) * INTERVAL '2 minutes')
	END,
	estado,
	jsonb_build_object(
		'fuente', 'automacion',
		'ventana_horas', 168,
		'prioridad', CASE WHEN gs % 2 = 0 THEN 'alta' ELSE 'media' END,
		'ambiente', 'development',
		'correlativo', gs
	),
	CASE
		WHEN estado = 'completado' THEN jsonb_build_object(
			'filas_procesadas', 210 + gs * 6,
			'registros_validos', 198 + gs * 5,
			'duracion_segundos', 74 + gs * 3
		)
		WHEN estado = 'fallido' THEN jsonb_build_object(
			'filas_procesadas', 110 + gs * 3,
			'registros_validos', 96 + gs * 2
		)
		WHEN estado = 'cancelado' THEN jsonb_build_object('motivo', 'prioridad_operativa')
		ELSE NULL
	END,
	CASE
		WHEN estado = 'fallido' THEN 'El conector meteo superó SLA (45 segundos)'
		WHEN estado = 'cancelado' THEN 'Ejecución anulada por ventana mantenimiento'
		ELSE NULL
	END,
	TIMESTAMP '2026-01-03 03:09:00' + ((gs - 1) * INTERVAL '5 hours')
FROM base;

-- =====================================================
-- 11) Predicciones ligadas temporada 501…560
-- =====================================================
WITH base AS (
	SELECT
		seq,
		301 + ((seq - 1) % 60) AS lote_num,
		500 + seq AS temporada_num,
		DATE '2026-03-06' + (seq % 41) AS fecha_prediccion,
		(ARRAY['random_forest', 'gradient_boosting', 'ensemble_stack'])[((seq - 1) % 3) + 1]::varchar(100) AS modelo_utilizado
	FROM generate_series(1, 60) AS seq
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
	format('00000000-0000-0000-0000-%s', lpad(to_hex(940 + seq), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(temporada_num), 12, '0'))::uuid,
	fecha_prediccion,
	round((3980 + (seq * 185))::numeric, 2),
	round((3980 + (seq * 185) - 310)::numeric, 2),
	round((3980 + (seq * 185) + 336)::numeric, 2),
	jsonb_build_object(
		'temperatura_promedio', round((17.4 + ((seq % 9) * 1.06))::numeric, 1),
		'humedad_suelo', 37 + ((seq * 13) % 38),
		'precipitacion_mm', round((((seq % 6) + 1) * 2.41)::numeric, 1),
		'ndvi', round((0.61 + ((seq % 7) * 0.036))::numeric, 3)
	),
	modelo_utilizado,
	round((0.831 + ((seq % 8) * 0.012))::numeric, 3),
	TIMESTAMP '2026-03-06 05:42:00' + ((seq - 1) * INTERVAL '70 minutes')
FROM base;

-- =====================================================
-- 12) Reportes — mezcla de parámetros genéricos y útiles para PDF
-- =====================================================
WITH base AS (
	SELECT
		gs,
		CASE mod(gs - 1, 6)
			WHEN 0 THEN 101
			WHEN 1 THEN 102
			WHEN 2 THEN 102
			WHEN 3 THEN 103
			WHEN 4 THEN 103
			ELSE 104
		END AS usuario_num,
		CASE WHEN mod(gs, 2) = 0 THEN 890 + mod(gs - 1, 40) + 1 ELSE NULL END AS workflow_num,
		(ARRAY['operacional', 'gestion', 'prediccion', 'riego'])[mod(gs - 1, 4) + 1]::varchar(50) AS tipo,
		TIMESTAMP '2026-04-03 08:00:00' + ((gs - 1) * INTERVAL '20 hours') AS generado_en
	FROM generate_series(1, 32) AS gs
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
	(ARRAY['pdf', 'pdf', 'csv'])[mod(gs - 1, 3) + 1]::varchar(20),
	NULL,
	CASE tipo
		WHEN 'operacional' THEN jsonb_build_object(
			'loteId', format('00000000-0000-0000-0000-%s', lpad(to_hex(304 + mod(gs, 12)), 12, '0'))::text,
			'startDate', '2025-11-01T05:00:00.000Z',
			'endDate', '2026-03-29T05:00:00.000Z'
		)
		WHEN 'gestion' THEN jsonb_build_object(
			'fincaId', format('00000000-0000-0000-0000-%s', lpad(to_hex(202 + mod(gs, 8)), 12, '0'))::text,
			'temporadaFiltrada', 'activos'
		)
		ELSE jsonb_build_object(
			'rango', CASE WHEN gs % 2 = 0 THEN 'trimestral' ELSE 'mensual' END::text,
			'tipo', tipo::text,
			'nombre_finca_visual', CASE
				WHEN usuario_num IN (101, 102) THEN 'Cartera Andina'
				WHEN usuario_num = 103 THEN 'Llanos / Orinoquia'
				ELSE 'Supervisión multi-región'
			END
		)
	END,
	185000 + (gs * 7200),
	generado_en,
	CASE WHEN mod(gs, 3) = 0 THEN generado_en + INTERVAL '16 hours' ELSE NULL END
FROM base;

-- =====================================================
-- 13) Alertas — avisos recientes distribuidos en 4 usuarios
-- =====================================================
WITH base AS (
	SELECT
		gs,
		CASE mod(gs - 1, 6)
			WHEN 0 THEN 101
			WHEN 1 THEN 102
			WHEN 2 THEN 102
			WHEN 3 THEN 103
			WHEN 4 THEN 103
			ELSE 104
		END AS usuario_num,
		301 + mod(gs - 1, 60) AS lote_num,
		(ARRAY['riego', 'clima', 'plaga', 'rendimiento', 'sistema'])[mod(gs - 1, 5) + 1]::varchar(50) AS tipo,
		(ARRAY['info', 'advertencia', 'critica', 'emergencia'])[mod(gs - 1, 4) + 1]::varchar(20) AS severidad,
		TIMESTAMP '2026-04-02 06:30:00' + ((gs - 1) * INTERVAL '6 hours') AS creada_en,
		mod(gs, 2) = 0 AS leida
	FROM generate_series(1, 36) AS gs
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
	format('00000000-0000-0000-0000-%s', lpad(to_hex(1290 + gs), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(usuario_num), 12, '0'))::uuid,
	format('00000000-0000-0000-0000-%s', lpad(to_hex(lote_num), 12, '0'))::uuid,
	tipo,
	severidad,
	CASE tipo
		WHEN 'riego' THEN 'Humedad de suelo bajo punto de recarga programada en celda enlazada al lote ' || lote_num::text
		WHEN 'clima' THEN 'Frente lluvioso pronosticado: revisar ventana de pulverización cercana al lote ' || lote_num::text
		WHEN 'plaga' THEN 'Anomalía térmica correlacionada con riesgo fitosanitario en lote ' || lote_num::text
		WHEN 'rendimiento' THEN 'Diferencia estadística contra meta de campo en lote ' || lote_num::text || ' (>8 %)'
		ELSE 'Conector webhook n8n devolvió código 524 en job nocturno'
	END,
	jsonb_build_object(
		'umbral_objetivo', CASE tipo WHEN 'riego' THEN 36 WHEN 'clima' THEN 82 WHEN 'plaga' THEN 72 WHEN 'rendimiento' THEN 4800 ELSE 1 END,
		'valor_observado', CASE tipo WHEN 'riego' THEN 29 WHEN 'clima' THEN 93 WHEN 'plaga' THEN 78 WHEN 'rendimiento' THEN 4420 ELSE 524 END,
		'origen_demostracion', 'seed_datos.sql'
	),
	leida,
	creada_en,
	CASE WHEN leida THEN creada_en + INTERVAL '2 hours 45 minutes' ELSE NULL END
FROM base;

COMMIT;
