<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

try {
    // 2. Buscamos la fila número 1 de configuración
    $sql = "SELECT * FROM configuracion LIMIT 1";
    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    $configuracion = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Enviamos los datos a React
    echo json_encode(["success" => true, "configuracion" => $configuracion]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error al obtener configuración: " . $e->getMessage()]);
}
?>