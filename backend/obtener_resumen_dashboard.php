<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    // Rangos en lugar de DATE(col) = ... para que MySQL pueda usar índices.
    // CURDATE()/NOW() corren en hora de Perú (zona fijada en conexion.php).

    // 1. Ingresos de hoy
    $stmt = $conexion->query(
        "SELECT COALESCE(SUM(monto), 0) AS total
         FROM transacciones
         WHERE fecha >= CURDATE() AND fecha < CURDATE() + INTERVAL 1 DAY"
    );
    $ingresosHoy = (float) $stmt->fetchColumn();

    // 2. Miembros activos: no eliminados, no inactivos/congelados a mano,
    //    y con membresía vigente por fecha.
    $stmt = $conexion->query(
        "SELECT COUNT(*) FROM miembros
         WHERE eliminado = 0
           AND estado NOT IN ('Inactivo', 'Congelado')
           AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())"
    );
    $miembrosActivos = (int) $stmt->fetchColumn();

    // 3. Asistencias de hoy (QR y manuales)
    $stmt = $conexion->query(
        "SELECT COUNT(*) FROM asistencias
         WHERE fecha_hora >= CURDATE() AND fecha_hora < CURDATE() + INTERVAL 1 DAY"
    );
    $asistencias = (int) $stmt->fetchColumn();

    // 4. Visitas libres de hoy
    $stmt = $conexion->query(
        "SELECT COUNT(*) FROM visitas_libres
         WHERE fecha_registro >= CURDATE() AND fecha_registro < CURDATE() + INTERVAL 1 DAY"
    );
    $visitas = (int) $stmt->fetchColumn();

    responder([
        'success' => true,
        'ingresos_hoy' => $ingresosHoy,
        'miembros_activos' => $miembrosActivos,
        'asistencias_hoy' => $asistencias + $visitas,
    ]);
} catch (PDOException $e) {
    responder_error('Error al obtener el resumen del día.', 500, $e);
}
