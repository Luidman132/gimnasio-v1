<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

// 2. Recibimos el paquete de React (que solo traerá el ID del plan)
$data = json_decode(file_get_contents("php://input"));

// 3. Verificamos que nos hayan mandado el ID
if (isset($data->id)) {
    $id = $data->id;

    try {
        // Verificar si hay miembros asociados a este plan
        $stmt_check = $conexion->prepare("SELECT COUNT(*) FROM miembros WHERE plan_id = :id");
        $stmt_check->bindParam(':id', $id);
        $stmt_check->execute();
        $count = $stmt_check->fetchColumn();

        if ($count > 0) {
            echo json_encode(["success" => false, "mensaje" => "No se puede eliminar este plan porque tiene {$count} miembros asociados. Te recomendamos desactivarlo en su lugar."]);
            exit;
        }

        // 4. Le ordenamos a MySQL que borre ese registro
        $stmt = $conexion->prepare("DELETE FROM planes WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        // 5. Le confirmamos a React
        echo json_encode(["success" => true, "mensaje" => "¡Plan eliminado para siempre!"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al eliminar: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "No me dijiste qué plan borrar (Falta ID)."]);
}
?>