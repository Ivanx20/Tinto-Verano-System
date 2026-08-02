-- Tinto Verano — creación de usuario y base (PostgreSQL)
-- Ejecutar como superusuario:
--   psql -U postgres -f scripts/create_postgresql_database.sql
--
-- Si el usuario o la base ya existen, ignora esos errores y sigue.

CREATE USER tinto_user WITH PASSWORD 'tinto_password';
CREATE DATABASE tinto_verano_db OWNER tinto_user;
GRANT ALL PRIVILEGES ON DATABASE tinto_verano_db TO tinto_user;
