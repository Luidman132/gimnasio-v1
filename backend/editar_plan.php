<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

// 2. Recibimos el paquete de React con los datos modificados
$data = json_decode(file_get_contents("php://input"));

// 3. Verificamos que traiga el ID (para saber a quién editar) y los datos básicos
if (isset($data->id) && isset($data->nombre) && isset($data->precio) && isset($data->duracion_dias)) {

    $id = $data->id;
    $nombre = $data->nombre;
    $precio = $data->precio;
    $duracion = $data->duracion_dias;
    $es_promo = (isset($data->es_promocion) && $data->es_promocion) ? 1 : 0;

    // Fechas y notas
    $fecha_inicio = !empty($data->fecha_inicio_venta) ? $data->fecha_inicio_venta : null;
    $fecha_fin = !empty($data->fecha_fin_venta) ? $data->fecha_fin_venta : null;
    $nota = !empty($data->nota) ? $data->nota : null;

    try {
        // 4. Le ordenamos a MySQL que actualice (UPDATE) ese plan específico
        $sql = "UPDATE planes SET nombre = :nombre, precio = :precio, duracion_dias = :duracion, 
                es_promocion = :es_promo, fecha_inicio_venta = :fecha_inicio, fecha_fin_venta = :fecha_fin, nota = :nota 
                WHERE id = :id";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':precio' => $precio,
            ':duracion' => $duracion,
            ':es_promo' => $es_promo,
            ':fecha_inicio' => $fecha_inicio,
            ':fecha_fin' => $fecha_fin,
            ':nota' => $nota,
            ':id' => $id
        ]);

        // 5. Confirmamos el éxito
        echo json_encode(["success" => true, "mensaje" => "¡Plan actualizado con éxito!"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al actualizar: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios para poder editar."]);
}
?>