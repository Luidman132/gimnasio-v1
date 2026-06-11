<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    // Mezcla asistencias, visitas libres y cobros. Cada rama limita sus
    // 50 más recientes antes del UNION para no ordenar tablas completas.
    $sql = "
        (SELECT a.id,
                a.fecha_hora,
                m.nombres,
                m.apellidos,
                m.dni,
                'asistencia' AS tipo
         FROM asistencias a
         INNER JOIN miembros m ON a.miembro_id = m.id
         ORDER BY a.fecha_hora DESC LIMIT 50)

        UNION ALL

        (SELECT v.id,
                v.fecha_registro AS fecha_hora,
                v.nombre_completo AS nombres,
                '' AS apellidos,
                v.dni,
                'visita_libre' AS tipo
         FROM visitas_libres v
         ORDER BY v.fecha_registro DESC LIMIT 50)

        UNION ALL

        (SELECT t.id,
                t.fecha AS fecha_hora,
                m.nombres,
                m.apellidos,
                m.dni,
                'cobro' AS tipo
         FROM transacciones t
         INNER JOIN miembros m ON t.miembro_id = m.id
         ORDER BY t.fecha DESC LIMIT 50)

        ORDER BY fecha_hora DESC
        LIMIT 50
    ";

    $asistencias = $conexion->query($sql)->fetchAll();

    responder(['success' => true, 'asistencias' => $asistencias]);
} catch (PDOException $e) {
    responder_error('Error al obtener el historial de asistencias.', 500, $e);
}
