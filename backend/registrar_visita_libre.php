<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

$nombre = trim((string) campo($data, 'nombre_completo', ''));
$monto = campo($data, 'monto_pagado');

if ($nombre === '' || !is_numeric($monto) || (float) $monto < 0) {
    responder_error('Faltan datos obligatorios o el monto no es válido.', 400);
}

try {
    $sql = 'INSERT INTO visitas_libres (dni, nombre_completo, telefono, monto_pagado, metodo_pago, usuario_id)
            VALUES (:dni, :nombre, :telefono, :monto, :metodo, :usuario_id)';

    $conexion->prepare($sql)->execute([
        ':dni' => campo($data, 'dni', ''),
        ':nombre' => mb_substr($nombre, 0, 200),
        ':telefono' => campo($data, 'telefono', ''),
        ':monto' => (float) $monto,
        ':metodo' => campo($data, 'metodo_pago', 'Efectivo'),
        ':usuario_id' => $usuarioActual['id'],
    ]);

    responder(['success' => true, 'mensaje' => 'Visita libre registrada con éxito.']);
} catch (PDOException $e) {
    responder_error('Error al registrar la visita libre.', 500, $e);
}
