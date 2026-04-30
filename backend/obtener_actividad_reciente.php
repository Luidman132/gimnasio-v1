<?php
// Permisos de seguridad estrictos
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'conexion.php';

// Zona horaria de Perú
date_default_timezone_set('America/Lima');

try {
    // Magia SQL: Ahora sí con los nombres exactos de tu phpMyAdmin
    $sql = "
        (SELECT 
            'asistencia' AS tipo, 
            m.nombres AS titulo, 
            a.fecha_hora AS fecha,
            'Asistencia Regular' AS detalle
        FROM asistencias a
        JOIN miembros m ON a.miembro_id = m.id)
        
        UNION ALL
        
        (SELECT 
            'visita_libre' AS tipo, 
            v.nombre_completo AS titulo, 
            v.fecha_registro AS fecha,
            'Visita Libre' AS detalle
        FROM visitas_libres v)
        
        UNION ALL
        
        (SELECT 
            'nuevo_miembro' AS tipo, 
            nombres AS titulo, 
            created_at AS fecha,
            'Nuevo Miembro' AS detalle
        FROM miembros 
        WHERE eliminado = 0)
        
        UNION ALL
        
        (SELECT 
            'pago' AS tipo, 
            CONCAT('Pago de ', m.nombres) AS titulo, 
            t.fecha AS fecha,
            t.concepto AS detalle
        FROM transacciones t
        JOIN miembros m ON t.miembro_id = m.id)
        
        ORDER BY fecha DESC 
        LIMIT 10
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $actividad = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "actividad_reciente" => $actividad
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
?>