<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

// 2. Verificamos SOLO lo más vital: DNI y Nombre
if (isset($data->dni) && isset($data->nombre)) {

    // 3. Generamos el código QR
    $qr_token = uniqid('tramusa_qr_');

    // Si viene un plan_id y es un número, lo usamos. Si no, lo dejamos en NULL
    $plan_id = (isset($data->plan_id) && is_numeric($data->plan_id)) ? $data->plan_id : null;

    try {
        // AÑADIMOS LAS 3 COLUMNAS NUEVAS AL SQL
        $sql = "INSERT INTO miembros (dni, nombres, apellidos, telefono, email, contacto_emergencia_nombre, contacto_emergencia_telefono, plan_id, fecha_inicio, fecha_fin, qr_token, estado) 
                VALUES (:dni, :nombres, '', :telefono, :email, :contacto_emergencia_nombre, :contacto_emergencia_telefono, :plan_id, :fecha_inicio, :fecha_fin, :qr_token, 'Activo')";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':dni' => $data->dni,
            ':nombres' => $data->nombre,
            ':telefono' => isset($data->celular) ? $data->celular : '',
            // CAPTURAMOS LOS DATOS NUEVOS
            ':email' => isset($data->email) ? $data->email : null,
            ':contacto_emergencia_nombre' => isset($data->contacto_emergencia_nombre) ? $data->contacto_emergencia_nombre : null,
            ':contacto_emergencia_telefono' => isset($data->contacto_emergencia_telefono) ? $data->contacto_emergencia_telefono : null,
            // ---------------------------
            ':plan_id' => $plan_id,
            ':fecha_inicio' => isset($data->fecha_inicio) ? $data->fecha_inicio : null,
            ':fecha_fin' => isset($data->fecha_fin) ? $data->fecha_fin : null,
            ':qr_token' => $qr_token
        ]);

        echo json_encode(["success" => true, "mensaje" => "¡Cliente inscrito con éxito!", "qr_token" => $qr_token]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al guardar en BD: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios (DNI o Nombre)."]);
}
?>