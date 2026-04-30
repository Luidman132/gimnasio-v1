<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'conexion.php';

// Leer el JSON que envía React
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(["success" => false, "mensaje" => "ID no proporcionado"]);
    exit;
}

try {
    // Soft Delete: En lugar de borrar, marcamos eliminado = 1
    $sql = "UPDATE miembros SET eliminado = 1 WHERE id = :id";
    $stmt = $conexion->prepare($sql);
    $stmt->execute([':id' => $data->id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "mensaje" => "Miembro eliminado correctamente"]);
    } else {
        echo json_encode(["success" => false, "mensaje" => "No se encontró el miembro o ya estaba eliminado"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error BD: " . $e->getMessage()]);
}
?>