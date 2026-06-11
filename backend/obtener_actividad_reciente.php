<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    // Cada rama se limita a sus 10 registros más recientes ANTES del UNION,
    // así MySQL no ordena tablas completas para quedarse con 10 filas.
    $sql = "
        (SELECT 'asistencia' AS tipo,
                m.nombres AS titulo,
                a.fecha_hora AS fecha,
                'Asistencia Regular' AS detalle
         FROM asistencias a
         JOIN miembros m ON a.miembro_id = m.id
         ORDER BY a.fecha_hora DESC LIMIT 10)

        UNION ALL

        (SELECT 'visita_libre' AS tipo,
                v.nombre_completo AS titulo,
                v.fecha_registro AS fecha,
                'Visita Libre' AS detalle
         FROM visitas_libres v
         ORDER BY v.fecha_registro DESC LIMIT 10)

        UNION ALL

        (SELECT 'nuevo_miembro' AS tipo,
                nombres AS titulo,
                created_at AS fecha,
                'Nuevo Miembro' AS detalle
         FROM miembros
         WHERE eliminado = 0
         ORDER BY created_at DESC LIMIT 10)

        UNION ALL

        (SELECT 'pago' AS tipo,
                CONCAT('Pago de ', m.nombres) AS titulo,
                t.fecha AS fecha,
                t.concepto AS detalle
         FROM transacciones t
         JOIN miembros m ON t.miembro_id = m.id
         ORDER BY t.fecha DESC LIMIT 10)

        ORDER BY fecha DESC
        LIMIT 10
    ";

    $actividad = $conexion->query($sql)->fetchAll();

    responder(['success' => true, 'actividad_reciente' => $actividad]);
} catch (PDOException $e) {
    responder_error('Error al obtener la actividad reciente.', 500, $e);
}
