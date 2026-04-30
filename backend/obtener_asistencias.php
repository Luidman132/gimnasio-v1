<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

try {
    // 2. Mezclamos asistencias con visitas libres y cobros usando UNION ALL
    $sql = "
        (SELECT 
            a.id, 
            a.fecha_hora, 
            m.nombres, 
            m.apellidos, 
            m.dni, 
            'asistencia' AS tipo 
        FROM asistencias a 
        INNER JOIN miembros m ON a.miembro_id = m.id)

        UNION ALL

        (SELECT 
            v.id, 
            v.fecha_registro AS fecha_hora, 
            v.nombre_completo AS nombres, 
            '' AS apellidos, 
            v.dni, 
            'visita_libre' AS tipo 
        FROM visitas_libres v)

        UNION ALL

        (SELECT 
            t.id, 
            t.fecha AS fecha_hora, 
            m.nombres, 
            m.apellidos, 
            m.dni, 
            'cobro' AS tipo 
        FROM transacciones t 
        INNER JOIN miembros m ON t.miembro_id = m.id)

        ORDER BY fecha_hora DESC 
        LIMIT 50
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    $asistencias = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Enviamos la lista a React
    echo json_encode(["success" => true, "asistencias" => $asistencias]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
?>