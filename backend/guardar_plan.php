<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';

// 2. Recibimos el paquete de datos del formulario de React
$data = json_decode(file_get_contents("php://input"));

// 3. Verificamos que al menos traiga nombre, precio y duración
if (isset($data->nombre) && isset($data->precio) && isset($data->duracion_dias)) {
    $nombre = $data->nombre;
    $precio = $data->precio;
    $duracion = $data->duracion_dias;

    // React manda true/false, MySQL usa 1 o 0
    $es_promo = (isset($data->es_promocion) && $data->es_promocion) ? 1 : 0;

    // Si las fechas o notas vienen vacías, las guardamos como NULL
    $fecha_inicio = !empty($data->fecha_inicio_venta) ? $data->fecha_inicio_venta : null;
    $fecha_fin = !empty($data->fecha_fin_venta) ? $data->fecha_fin_venta : null;
    $nota = !empty($data->nota) ? $data->nota : null;

    try {
        // 4. Preparamos la instrucción SQL para insertar
        $sql = "INSERT INTO planes (nombre, precio, duracion_dias, es_promocion, fecha_inicio_venta, fecha_fin_venta, nota, activo) 
                VALUES (:nombre, :precio, :duracion, :es_promo, :fecha_inicio, :fecha_fin, :nota, 1)";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':precio' => $precio,
            ':duracion' => $duracion,
            ':es_promo' => $es_promo,
            ':fecha_inicio' => $fecha_inicio,
            ':fecha_fin' => $fecha_fin,
            ':nota' => $nota
        ]);

        // 5. Le avisamos a React que todo salió bien
        echo json_encode(["success" => true, "mensaje" => "¡Plan guardado con éxito!"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al guardar en BD: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios del plan."]);
}
?>