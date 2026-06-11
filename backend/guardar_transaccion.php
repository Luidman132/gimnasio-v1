<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

$monto = campo($data, 'monto');
$concepto = trim((string) campo($data, 'concepto', ''));

if ($concepto === '' || !is_numeric($monto) || (float) $monto <= 0) {
    responder_error('Faltan datos obligatorios o el monto no es válido.', 400);
}

$miembroId = is_numeric(campo($data, 'miembro_id')) ? (int) $data->miembro_id : null;

try {
    // El usuario que cobra es el de la sesión, no un valor del cliente:
    // así cada cobro queda asociado a quien realmente lo registró.
    $sql = 'INSERT INTO transacciones (concepto, monto, metodo_pago, miembro_id, usuario_id)
            VALUES (:concepto, :monto, :metodo_pago, :miembro_id, :usuario_id)';

    $conexion->prepare($sql)->execute([
        ':concepto' => mb_substr($concepto, 0, 100),
        ':monto' => (float) $monto,
        ':metodo_pago' => campo($data, 'metodo_pago', 'Efectivo'),
        ':miembro_id' => $miembroId,
        ':usuario_id' => $usuarioActual['id'],
    ]);

    responder(['success' => true, 'mensaje' => 'Transacción guardada correctamente.']);
} catch (PDOException $e) {
    responder_error('Error al guardar la transacción.', 500, $e);
}
