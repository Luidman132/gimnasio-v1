<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

solo_metodo('POST');
$data = leer_json();

$id = campo($data, 'id');
if (!is_numeric($id) || !isset($data->activo)) {
    responder_error('Faltan datos (ID o estado).', 400);
}

try {
    $conexion->prepare('UPDATE planes SET activo = :activo WHERE id = :id')->execute([
        ':activo' => $data->activo ? 1 : 0,
        ':id' => (int) $id,
    ]);

    responder(['success' => true, 'mensaje' => 'Estado del plan actualizado.']);
} catch (PDOException $e) {
    responder_error('Error al actualizar el estado del plan.', 500, $e);
}
