-- ============================================================
-- Seed de datos iniciales para agricultura_db
-- ============================================================

-- Roles del sistema
INSERT INTO rol (id, nombre, descripcion) VALUES
  (uuid_generate_v4(), 'administrador', 'Acceso completo al sistema y gestión de usuarios'),
  (uuid_generate_v4(), 'agricultor',   'Gestión de fincas, lotes y cultivos propios'),
  (uuid_generate_v4(), 'tecnico',      'Monitoreo, análisis y generación de reportes')
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de cultivos predefinidos (según CONTEXTO.md §5.2)
INSERT INTO cultivo (id, nombre, variedad, ciclo_dias, requerimiento_agua_mm, temperatura_optima, humedad_optima) VALUES
  (uuid_generate_v4(), 'Maíz',    'Hibrido DK7500', 120, 500.00, 25.0, 65),
  (uuid_generate_v4(), 'Soja',    'DM 4670',        110, 450.00, 24.0, 60),
  (uuid_generate_v4(), 'Trigo',   'Buck Pleno',     130, 400.00, 20.0, 55),
  (uuid_generate_v4(), 'Girasol', 'Paraiso 20',     115, 480.00, 22.0, 50)
ON CONFLICT DO NOTHING;

-- Usuario administrador de prueba
-- Contraseña: Admin123! (hash bcrypt rounds=10)
-- DECISIÓN: Se genera el hash externamente; cambiar en producción
INSERT INTO usuario (id, email, password_hash, nombre, apellido, telefono, rol_id, activo)
SELECT
  uuid_generate_v4(),
  'admin@agriprecision.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y', -- Admin123!
  'Administrador',
  'Sistema',
  '+54 9 261 000-0000',
  r.id,
  true
FROM rol r
WHERE r.nombre = 'administrador'
ON CONFLICT (email) DO NOTHING;

-- Usuario agricultor de demo
INSERT INTO usuario (id, email, password_hash, nombre, apellido, telefono, rol_id, activo)
SELECT
  uuid_generate_v4(),
  'agricultor@agriprecision.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y', -- Admin123!
  'Juan',
  'González',
  '+54 9 261 123-4567',
  r.id,
  true
FROM rol r
WHERE r.nombre = 'agricultor'
ON CONFLICT (email) DO NOTHING;
