<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

// 2. Verificamos que al menos nos envíe el nombre del gimnasio
if (isset($data->nombre_gimnasio)) {
    try {
        // 3. Actualizamos la fila número 1 (¡AHORA CON DIRECCIÓN!)
        $sql = "UPDATE configuracion SET
                nombre_gimnasio = :nombre,
                telefono = :telefono,
                moneda = :moneda,
                mensaje_ticket = :mensaje,
                direccion = :direccion,
                logo_base64 = :logo,
                plantilla_whatsapp = :plantilla_wa
                WHERE id = 1";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $data->nombre_gimnasio,
            ':telefono' => isset($data->telefono) ? $data->telefono : '',
            ':moneda' => isset($data->moneda) ? $data->moneda : 'S/',
            ':mensaje' => isset($data->mensaje_ticket) ? $data->mensaje_ticket : '',
            ':direccion' => isset($data->direccion) ? $data->direccion : '',
            ':logo' => isset($data->logo_base64) ? $data->logo_base64 : null,
            ':plantilla_wa' => isset($data->plantilla_whatsapp) ? $data->plantilla_whatsapp : null
        ]);

        echo json_encode(["success" => true, "mensaje" => "¡Configuración actualizada con éxito!"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al guardar en BD: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios (Nombre del gimnasio)."]);
}
?>