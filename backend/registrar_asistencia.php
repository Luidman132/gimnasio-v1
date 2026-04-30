<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

// Forzamos la zona horaria a Perú
date_default_timezone_set('America/Lima');
$fecha_actual = date('Y-m-d H:i:s');

try {
    $miembro_id = null;
    $mensaje_exito = "Asistencia registrada.";

    // Escenario A: Registro MANUAL (Buscador)
    if (isset($data->miembro_id) && !empty($data->miembro_id)) {
        $miembro_id = $data->miembro_id;
        $mensaje_exito = "Asistencia manual registrada.";
    }
    // Escenario B: Registro por Código QR
    elseif (isset($data->qr_token) && !empty($data->qr_token)) {
        $sql_qr = "SELECT id, nombres FROM miembros WHERE qr_token = :qr_token LIMIT 1";
        $stmt_qr = $conexion->prepare($sql_qr);
        $stmt_qr->execute([':qr_token' => $data->qr_token]);
        $miembro = $stmt_qr->fetch(PDO::FETCH_ASSOC);

        if ($miembro) {
            $miembro_id = $miembro['id'];
            $mensaje_exito = "¡Bienvenido, " . $miembro['nombres'] . "!";
        } else {
            echo json_encode(["success" => false, "mensaje" => "QR no encontrado en la base de datos."]);
            exit;
        }
    } else {
        echo json_encode(["success" => false, "mensaje" => "No se envió ID ni QR válido."]);
        exit;
    }

    // Insertamos la asistencia usando la hora de Perú
    if ($miembro_id) {
        $sql_insert = "INSERT INTO asistencias (miembro_id, fecha_hora) VALUES (:miembro_id, :fecha)";
        $stmt_insert = $conexion->prepare($sql_insert);

        // Ejecutamos y guardamos el resultado
        $exito = $stmt_insert->execute([
            ':miembro_id' => $miembro_id,
            ':fecha' => $fecha_actual
        ]);

        // ¡LA TRAMPA PARA ERRORES SILENCIOSOS!
        if (!$exito) {
            $error = $stmt_insert->errorInfo();
            echo json_encode(["success" => false, "mensaje" => "MySQL rechazó el dato: " . $error[2]]);
            exit;
        }

        echo json_encode(["success" => true, "mensaje" => $mensaje_exito]);
    }

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error BD: " . $e->getMessage()]);
}
?>