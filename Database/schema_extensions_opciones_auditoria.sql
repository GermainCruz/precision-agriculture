-- Ejecutar en bases ya creadas: extiende usuario/sensor y añade auditoría admin (Prisma migrate / db push).
-- En instalaciones nuevas, integrar en create_database.sql o aplicar después del esquema base.

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS preferencias_alertas JSONB DEFAULT '{}'::jsonb;

ALTER TABLE sensor ADD COLUMN IF NOT EXISTS metadatos_sensor JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS auditoria_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    accion VARCHAR(160) NOT NULL,
    entidad_tipo VARCHAR(60),
    entidad_id UUID,
    payload JSONB,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_actor ON auditoria_admin(actor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_creado ON auditoria_admin(creado_en);
