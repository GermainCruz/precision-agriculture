-- Ejecutado solo en el primer arranque del volumen Postgres (docker-entrypoint-initdb.d).
-- Base separada para n8n: no usar agricultura_db (Prisma/evita conflicto de tablas internas).

CREATE DATABASE n8n;
