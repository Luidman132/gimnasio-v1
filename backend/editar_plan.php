<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

solo_metodo('POST');
$data = leer_json();

$id = campo($data, 'id');
$nombre = trim((string) campo($data, 'nombre', ''));
$precio = campo($data, 'precio');
$duracion = campo($data, 'duracion_dias');

if (!is_numeric($id) || $nombre === '' || !is_numeric($precio) || !is_numeric($duracion)) {
    responder_error('Faltan datos obligatorios para poder editar.', 400);
}
if ((float) $precio < 0 || (int) $duracion <= 0) {
    responder_error('El precio o la duración del plan no son válidos.', 400);
}

try {
    $sql = 'UPDATE planes SET
                nombre = :nombre,
                precio = :precio,
                duracion_dias = :duracion,
                es_promocion = :es_promo,
                fecha_inicio_venta = :fecha_inicio,
                fecha_fin_venta = :fecha_fin,
                nota = :nota
            WHERE id = :id';

    $conexion->prepare($sql)->execute([
        ':nombre' => $nombre,
        ':precio' => (float) $precio,
        ':duracion' => (int) $duracion,
        ':es_promo' => !empty($data->es_promocion) ? 1 : 0,
        ':fecha_inicio' => campo($data, 'fecha_inicio_venta'),
        ':fecha_fin' => campo($data, 'fecha_fin_venta'),
        ':nota' => campo($data, 'nota'),
        ':id' => (int) $id,
    ]);

    responder(['success' => true, 'mensaje' => '¡Plan actualizado con éxito!']);
} catch (PDOException $e) {
    responder_error('Error al actualizar el plan.', 500, $e);
}
