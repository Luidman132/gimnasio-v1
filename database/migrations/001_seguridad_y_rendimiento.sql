-- ============================================================
-- Migración 001 — Seguridad y rendimiento
-- ============================================================
-- SOLO CAMBIOS ADITIVOS: no modifica ni borra ningún dato.
-- IDEMPOTENTE: ejecutarla dos veces no produce errores ni daños.
--
-- Aplicar SIEMPRE con backup previo:
--   docker exec gym_database mysqldump -uroot -p"$DB_PASS" tramusagym_db > backup_$(date +%F).sql
--   docker exec -i gym_database mysql -uroot -p"$DB_PASS" tramusagym_db < 001_seguridad_y_rendimiento.sql
-- ============================================================

-- 1. Tabla de sesiones (autenticación por token).
--    Solo se guarda el hash SHA-256 del token, nunca el token.
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expira_en` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sesiones_token` (`token_hash`),
  KEY `idx_sesiones_expira` (`expira_en`),
  KEY `fk_sesiones_usuario` (`usuario_id`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Columnas e índices condicionales (MySQL no soporta IF NOT EXISTS
--    en ALTER TABLE, así que se verifica contra information_schema).
DROP PROCEDURE IF EXISTS migracion_001;

DELIMITER //
CREATE PROCEDURE migracion_001()
BEGIN
  -- 2a. miembros.turno: el frontend ya lo usaba pero la columna no existía.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'miembros' AND COLUMN_NAME = 'turno'
  ) THEN
    ALTER TABLE `miembros` ADD COLUMN `turno` VARCHAR(20) NULL DEFAULT NULL AFTER `fecha_fin`;
  END IF;

  -- 2b. miembros.dias_restantes: usado por los pases temporales del frontend.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'miembros' AND COLUMN_NAME = 'dias_restantes'
  ) THEN
    ALTER TABLE `miembros` ADD COLUMN `dias_restantes` INT NULL DEFAULT NULL AFTER `turno`;
  END IF;

  -- 2c. Ampliar el enum de estado con los valores que el frontend ya maneja.
  --     Agregar valores AL FINAL de un enum es un cambio de metadatos:
  --     no reescribe la tabla ni altera los valores existentes.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'miembros' AND COLUMN_NAME = 'estado'
      AND COLUMN_TYPE LIKE '%Pase_Activo%'
  ) THEN
    ALTER TABLE `miembros`
      MODIFY `estado` ENUM('Activo','Vencido','Congelado','Inactivo','Pase_Activo')
      NOT NULL DEFAULT 'Activo';
  END IF;

  -- 2d. Índices en columnas de fecha (dashboard, actividad, reportes).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias' AND INDEX_NAME = 'idx_asistencias_fecha'
  ) THEN
    ALTER TABLE `asistencias` ADD INDEX `idx_asistencias_fecha` (`fecha_hora`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transacciones' AND INDEX_NAME = 'idx_transacciones_fecha'
  ) THEN
    ALTER TABLE `transacciones` ADD INDEX `idx_transacciones_fecha` (`fecha`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'visitas_libres' AND INDEX_NAME = 'idx_visitas_fecha'
  ) THEN
    ALTER TABLE `visitas_libres` ADD INDEX `idx_visitas_fecha` (`fecha_registro`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'miembros' AND INDEX_NAME = 'idx_miembros_fecha_fin'
  ) THEN
    ALTER TABLE `miembros` ADD INDEX `idx_miembros_fecha_fin` (`fecha_fin`);
  END IF;
END //
DELIMITER ;

CALL migracion_001();
DROP PROCEDURE migracion_001;

-- NOTA: las contraseñas de `usuarios` NO se tocan aquí. El nuevo login.php
-- las migra a hash bcrypt automáticamente en el primer inicio de sesión
-- exitoso de cada usuario (migración transparente, sin riesgo de bloqueo).
