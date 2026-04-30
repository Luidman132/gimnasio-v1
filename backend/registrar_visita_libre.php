<?php
// Permisos CORS explícitos para que el navegador no bloquee la petición
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

if (isset($data->nombre_completo) && isset($data->monto_pagado)) {
    try {
        // Le ponemos ID 1 (Admin) por defecto para que MySQL no se queje
        $usuario_id = 1;

        $sql = "INSERT INTO visitas_libres (dni, nombre_completo, telefono, monto_pagado, metodo_pago, usuario_id) 
                VALUES (:dni, :nombre, :telefono, :monto, :metodo, :usuario_id)";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':dni' => isset($data->dni) ? $data->dni : '',
            ':nombre' => $data->nombre_completo,
            ':telefono' => isset($data->telefono) ? $data->telefono : '',
            ':monto' => $data->monto_pagado,
            ':metodo' => isset($data->metodo_pago) ? $data->metodo_pago : 'Efectivo',
            ':usuario_id' => $usuario_id
        ]);

        echo json_encode(["success" => true, "mensaje" => "Visita libre registrada con éxito."]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error BD: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios."]);
}
?>