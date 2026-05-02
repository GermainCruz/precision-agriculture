-- Migra tipos GEOGRAPHY (PostGIS) a JSONB para compatibilidad con Prisma Json.
-- Ejecutar UNA vez sobre una base ya cargada (p. ej. tras create_database.sql + datos.sql geography).
--
-- Pasos en psql o pgAdmin, con tu base:
-- \c agricultura_db
-- \i Database/migrate_geography_to_jsonb.sql

BEGIN;

-- Finca: punto → { "lat": number, "lng": number } (orden coherente con el backend/apps)
ALTER TABLE finca
  ALTER COLUMN coordenadas TYPE jsonb USING (
    CASE WHEN coordenadas IS NULL THEN NULL
         ELSE json_build_object(
           'lng', ST_X(coordenadas::geometry)::float,
           'lat', ST_Y(coordenadas::geometry)::float
         )::jsonb
    END
  );

-- Lote: polígono como GeoJSON (objeto tipo Geometry)
ALTER TABLE lote
  ALTER COLUMN coordenadas_poligono TYPE jsonb USING (
    CASE WHEN coordenadas_poligono IS NULL THEN NULL
         ELSE (ST_AsGeoJSON(coordenadas_poligono::geometry)::json)::jsonb
    END
  );

-- Sensor: punto igual que finca
ALTER TABLE sensor
  ALTER COLUMN ubicacion TYPE jsonb USING (
    CASE WHEN ubicacion IS NULL THEN NULL
         ELSE json_build_object(
           'lng', ST_X(ubicacion::geometry)::float,
           'lat', ST_Y(ubicacion::geometry)::float
         )::jsonb
    END
  );

COMMIT;
