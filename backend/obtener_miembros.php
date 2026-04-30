<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

try {
    // 2. La magia del JOIN: Mezclamos la tabla 'miembros' con la tabla 'planes' 
    // para que React sepa el nombre exacto del plan que compró el cliente.
    $sql = "SELECT m.*, p.nombre AS plan_nombre 
            FROM miembros m 
            LEFT JOIN planes p ON m.plan_id = p.id 
            WHERE m.eliminado = 0
            ORDER BY m.id DESC";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    // 3. Empacamos todos los clientes en una lista
    $miembros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Se los enviamos a React
    echo json_encode(["success" => true, "miembros" => $miembros]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error al obtener miembros: " . $e->getMessage()]);
}
?>