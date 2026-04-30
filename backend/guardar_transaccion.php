<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

// 2. Verificamos que nos envíen los datos mínimos de un cobro (monto y concepto)
if (isset($data->monto) && isset($data->concepto)) {

    // Si no nos pasan un método de pago, asumimos Efectivo
    $metodo_pago = isset($data->metodo_pago) ? $data->metodo_pago : 'Efectivo';

    // Si no hay ID de miembro (ej. Visita Libre), lo dejamos en NULL
    $miembro_id = (isset($data->miembro_id) && is_numeric($data->miembro_id)) ? $data->miembro_id : null;

    // Si no hay ID de usuario que cobra, lo dejamos en NULL
    $usuario_id = (isset($data->usuario_id) && is_numeric($data->usuario_id)) ? $data->usuario_id : 1;

    try {
        // 3. Insertamos el dinero en la caja fuerte (tabla transacciones)
        $sql = "INSERT INTO transacciones (concepto, monto, metodo_pago, miembro_id, usuario_id) 
                VALUES (:concepto, :monto, :metodo_pago, :miembro_id, :usuario_id)";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':concepto' => $data->concepto,
            ':monto' => $data->monto,
            ':metodo_pago' => $metodo_pago,
            ':miembro_id' => $miembro_id,
            ':usuario_id' => $usuario_id
        ]);

        echo json_encode(["success" => true, "mensaje" => "Transacción guardada correctamente."]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al guardar transacción: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios (monto o concepto)."]);
}
?>