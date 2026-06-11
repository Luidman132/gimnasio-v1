<?php
// Datos completos para la exportación a Excel de la vista Miembros.
// Disponible para Admin y Recepción (pedido del cliente).
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    // 1. Miembros con su plan y totales (asistencias y pagos por miembro)
    $miembros = $conexion->query(
        'SELECT m.id, m.dni, m.nombres, m.telefono, m.email,
                p.nombre AS plan_nombre,
                m.fecha_inicio, m.fecha_fin, m.estado, m.turno,
                m.contacto_emergencia_nombre, m.contacto_emergencia_telefono,
                m.created_at AS fecha_registro,
                (SELECT COUNT(*) FROM asistencias a WHERE a.miembro_id = m.id) AS total_asistencias,
                (SELECT MAX(a.fecha_hora) FROM asistencias a WHERE a.miembro_id = m.id) AS ultima_asistencia,
                (SELECT COUNT(*) FROM transacciones t WHERE t.miembro_id = m.id) AS total_pagos,
                (SELECT COALESCE(SUM(t.monto), 0) FROM transacciones t WHERE t.miembro_id = m.id) AS total_pagado
         FROM miembros m
         LEFT JOIN planes p ON m.plan_id = p.id
         WHERE m.eliminado = 0
         ORDER BY m.nombres ASC'
    )->fetchAll();

    // 2. Historial completo de asistencias (incluye visitas libres)
    $asistencias = $conexion->query(
        "(SELECT a.fecha_hora, m.nombres, m.dni, 'Asistencia' AS tipo
          FROM asistencias a
          JOIN miembros m ON a.miembro_id = m.id)
         UNION ALL
         (SELECT v.fecha_registro AS fecha_hora, v.nombre_completo AS nombres, v.dni, 'Visita Libre' AS tipo
          FROM visitas_libres v)
         ORDER BY fecha_hora DESC"
    )->fetchAll();

    // 3. Pagos: inscripciones, renovaciones, pases y visitas, con quién cobró
    $pagos = $conexion->query(
        'SELECT t.fecha, t.concepto, t.monto, t.metodo_pago,
                m.nombres AS miembro, m.dni,
                u.nombre AS registrado_por
         FROM transacciones t
         LEFT JOIN miembros m ON t.miembro_id = m.id
         LEFT JOIN usuarios u ON t.usuario_id = u.id
         ORDER BY t.fecha DESC'
    )->fetchAll();

    responder([
        'success' => true,
        'miembros' => $miembros,
        'asistencias' => $asistencias,
        'pagos' => $pagos,
    ]);
} catch (PDOException $e) {
    responder_error('Error al preparar los datos de exportación.', 500, $e);
}
