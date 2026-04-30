<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

// 2. Recibimos el paquete de React
$data = json_decode(file_get_contents("php://input"));

// 3. Verificamos que traiga el ID del plan y el nuevo estado (activo/inactivo)
if (isset($data->id) && isset($data->activo)) {

    $id = $data->id;
    // Si React manda true, MySQL guarda 1. Si manda false, guarda 0.
    $activo = $data->activo ? 1 : 0;

    try {
        // 4. Le ordenamos a MySQL que actualice solo la columna 'activo'
        $sql = "UPDATE planes SET activo = :activo WHERE id = :id";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':activo' => $activo,
            ':id' => $id
        ]);

        // 5. Confirmamos el éxito
        echo json_encode(["success" => true, "mensaje" => "Estado del plan actualizado."]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al actualizar estado: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos (ID o estado)."]);
}
?>