-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:8889
-- Tiempo de generación: 17-04-2026 a las 15:38:18
-- Versión del servidor: 8.0.44
-- Versión de PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tramusagym_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencias`
--

CREATE TABLE `asistencias` (
  `id` int NOT NULL,
  `miembro_id` int NOT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int NOT NULL,
  `nombre_gimnasio` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `moneda` varchar(10) DEFAULT 'S/',
  `mensaje_ticket` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `logo_base64` mediumtext,
  `plantilla_whatsapp` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `nombre_gimnasio`, `telefono`, `moneda`, `mensaje_ticket`, `direccion`, `logo_base64`, `plantilla_whatsapp`) VALUES
(1, 'Tramusa S.A.', '+51 999 888 777', 'S/', '¡Gracias por entrenar con nosotros! Pase oficial de acceso.', 'Av. Anta 13, Cusco 08002', 'data:image/jpeg;base64,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GWs3OoaH5gvIqLLykZSiCy8MF4OOHnMDFHLN2GIEopt7az9UAhyBXI8MRPsyvwkWDs/4MjW+Zld6c3G6szTZhpA0rjME65CD8xQOSOGGdw5VsPk795QDmyN+8GZHRvod5RuxqrNL3K/03gJUBcg1hPrcXcXAJXvDtRRYMu1zcgCx1d5jrR2FV6zV/pW+iXG9dtIyc73CtUIbZ0qqudoii3fF94o3TaSsmXXH1Y6EIJxZevMubNog1mniG8UW2CWZPwinKDYesNbhiXh3S5PLitwIG8oEFR7UsmEMRon4ifRoGDbjWUnxNGvEmkPiHehU2kvM1QeTGD4mMMJkmGrSXFYoagZvUyWELNG3pNCZDAQKCbH63l5X/KpsPXabDh6/wYwIR5Ww0MsVACZCDQ7N/TltaUa/DNFXr5c6l17Ca6mrAK9V6I7D9f3y6xVIdq4lx1F9NSs0J4c4lFlLbGZTufKDmzRmy4odxmEmXqeLOqdrZeZJUCZI9Ar0l2ULIoL9yV4ccQwAkIlBldCx7E69cFgbxb06lgw4KK+INXqwvMtXjAYF9y7p0sX7lGa5XoixQp3OzGBhihgZrWAn+GKECCum3uQrGznS4uyZo24BsV4oJQqYWRdLXA3p0zqD2IKF4rxlX50n173wI9TT6wPmgWCatiZlG2JsYYEaVU41XhjEAWRRtUF6FdS1CQ2HGH2PYjSQs2LrXDdYuOcFIiHt2AQjWUzVtTGM5i9iyEd/dl92XEIWkLw11z5mWw2BOWdABdPWPB/hdAGEpVxCKwY4dRrIoxa7eqKsLs2h0tzXaBxgVBoDvzFnP22LrXDdcwKdrAAfBxx0igGkPi2NbeesDQBy/SGOOOkL1FY3Ma9c89Zb3yjG26/1j//aAAwDAQACAAMAAAAQ8888888888888888888888888888888888888888888888880888646U888osH888qdaZk5qc2+P889whfLMNZobLX8tqI9k3MW83PU85c2BbR7NM9To88888888888888888888888888888888888888888888888888888//EACgRAQEAAgICAQIGAwEAAAAAAAERACExQVFhcRCRUIGhsdHwIMHh8f/aAAgBAwEBPxD8PAj/ABDEq8Btc53mhY/rHwo+sc5eHCjg2Negr3IYu1HJR7EaRncg5A2/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', '¡Hola [NOMBRE]! Te escribimos de [GIMNASIO] para avisarte que tu [PLAN] vence [DIAS].');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `miembros`
--

CREATE TABLE `miembros` (
  `id` int NOT NULL,
  `dni` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL DEFAULT '',
  `telefono` varchar(20) DEFAULT NULL,
  `plan_id` int DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `qr_token` varchar(100) NOT NULL,
  `notas` text,
  `estado` enum('Activo','Vencido','Congelado') NOT NULL DEFAULT 'Activo',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email` varchar(100) DEFAULT NULL,
  `contacto_emergencia_nombre` varchar(100) DEFAULT NULL,
  `contacto_emergencia_telefono` varchar(20) DEFAULT NULL,
  `eliminado` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planes`
--

CREATE TABLE `planes` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion_dias` int NOT NULL,
  `es_promocion` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_inicio_venta` date DEFAULT NULL,
  `fecha_fin_venta` date DEFAULT NULL,
  `nota` text,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `planes`
--

INSERT INTO `planes` (`id`, `nombre`, `precio`, `duracion_dias`, `es_promocion`, `fecha_inicio_venta`, `fecha_fin_venta`, `nota`, `activo`, `created_at`, `updated_at`) VALUES
(2, 'Plan Verano - TramusaFit', 346.66, 180, 0, NULL, NULL, NULL, 1, '2026-03-23 19:26:11', '2026-03-24 09:38:16'),
(4, 'Semanal', 40.00, 6, 0, NULL, NULL, NULL, 1, '2026-03-24 10:43:02', '2026-03-24 10:43:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones`
--

CREATE TABLE `transacciones` (
  `id` int NOT NULL,
  `concepto` varchar(100) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `tipo_transaccion` enum('Ingreso','Egreso') NOT NULL DEFAULT 'Ingreso',
  `metodo_pago` enum('Efectivo','Yape','Tarjeta') NOT NULL DEFAULT 'Efectivo',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `miembro_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('Admin','Recepcion') NOT NULL DEFAULT 'Recepcion',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--
-- NOTA DE SEGURIDAD: cuentas SEMILLA solo para instalaciones NUEVAS (vacías).
-- Las contraseñas van hasheadas con bcrypt (no en texto plano). Las
-- credenciales por defecto y la advertencia de cambiarlas están en DEPLOY.md
-- (Parte F). En una actualización de producción este bloque se IGNORA porque
-- el volumen de datos ya existe.
--

INSERT INTO `usuarios` (`id`, `nombre`, `correo`, `password`, `rol`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Julio', 'julio@tramusa.pe', '$2y$12$wJuh5xiDNPoOCb2c6LtknesVhwasv8uR2gl8dysnXWobL9ikzFHZG', 'Admin', 1, '2026-03-23 12:26:30', '2026-03-23 21:08:44'),
(2, 'Dina', 'dina@tramusa.pe', '$2y$12$xAR..HJUpxS5PIfR789eP.f.UuYIgP4HlAve1hs43iEBYy4EetoSa', 'Recepcion', 1, '2026-03-23 12:26:30', '2026-03-23 21:08:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `visitas_libres`
--

CREATE TABLE `visitas_libres` (
  `id` int NOT NULL,
  `dni` varchar(20) NOT NULL,
  `nombre_completo` varchar(200) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `metodo_pago` enum('Efectivo','Yape','Tarjeta') NOT NULL DEFAULT 'Efectivo',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_asistencias_miembro` (`miembro_id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `miembros`
--
ALTER TABLE `miembros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD UNIQUE KEY `qr_token` (`qr_token`),
  ADD KEY `fk_miembros_plan` (`plan_id`);

--
-- Indices de la tabla `planes`
--
ALTER TABLE `planes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_transacciones_miembro` (`miembro_id`),
  ADD KEY `fk_transacciones_usuario` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `visitas_libres`
--
ALTER TABLE `visitas_libres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_visitas_usuario` (`usuario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asistencias`
--
ALTER TABLE `asistencias`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `miembros`
--
ALTER TABLE `miembros`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `planes`
--
ALTER TABLE `planes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `transacciones`
--
ALTER TABLE `transacciones`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `visitas_libres`
--
ALTER TABLE `visitas_libres`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asistencias`
--
ALTER TABLE `asistencias`
  ADD CONSTRAINT `fk_asistencias_miembro` FOREIGN KEY (`miembro_id`) REFERENCES `miembros` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `miembros`
--
ALTER TABLE `miembros`
  ADD CONSTRAINT `fk_miembros_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `transacciones`
--
ALTER TABLE `transacciones`
  ADD CONSTRAINT `fk_transacciones_miembro` FOREIGN KEY (`miembro_id`) REFERENCES `miembros` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transacciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `visitas_libres`
--
ALTER TABLE `visitas_libres`
  ADD CONSTRAINT `fk_visitas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
