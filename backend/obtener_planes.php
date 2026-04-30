<?php
// 1. Llamamos a nuestra llave maestra
require_once 'conexion.php';

// 2. Intentamos buscar los planes en la base de datos
try {
    // Le pedimos a MySQL todos los planes ordenados por id
    $stmt = $conexion->prepare("SELECT * FROM planes ORDER BY id ASC");
    $stmt->execute();

    // Sacamos todos los resultados en formato de lista (Array)
    $planes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Le enviamos la lista a React en formato JSON
    echo json_encode(["success" => true, "planes" => $planes]);

} catch (PDOException $e) {
    // Si algo sale mal, le avisamos a React
    echo json_encode(["success" => false, "mensaje" => "Error al obtener los planes: " . $e->getMessage()]);
}
?>