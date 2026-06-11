<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

$dni = trim((string) campo($data, 'dni', ''));
$nombre = trim((string) campo($data, 'nombre', ''));

if ($dni === '' || $nombre === '') {
    responder_error('Faltan datos obligatorios (DNI o Nombre).', 400);
}

// Token QR impredecible (uniqid() era adivinable por ser un timestamp).
$qrToken = 'tramusa_qr_' . bin2hex(random_bytes(16));

$planId = is_numeric(campo($data, 'plan_id')) ? (int) $data->plan_id : null;

try {
    $sql = 'INSERT INTO miembros
                (dni, nombres, apellidos, telefono, email,
                 contacto_emergencia_nombre, contacto_emergencia_telefono,
                 plan_id, fecha_inicio, fecha_fin, turno, qr_token, estado)
            VALUES
                (:dni, :nombres, \'\', :telefono, :email,
                 :contacto_nombre, :contacto_telefono,
                 :plan_id, :fecha_inicio, :fecha_fin, :turno, :qr_token, \'Activo\')';

    $conexion->prepare($sql)->execute([
        ':dni' => $dni,
        ':nombres' => $nombre,
        ':telefono' => campo($data, 'celular', ''),
        ':email' => campo($data, 'email'),
        ':contacto_nombre' => campo($data, 'contacto_emergencia_nombre'),
        ':contacto_telefono' => campo($data, 'contacto_emergencia_telefono'),
        ':plan_id' => $planId,
        ':fecha_inicio' => campo($data, 'fecha_inicio'),
        ':fecha_fin' => campo($data, 'fecha_fin'),
        ':turno' => campo($data, 'turno'),
        ':qr_token' => $qrToken,
    ]);

    responder([
        'success' => true,
        'mensaje' => '¡Cliente inscrito con éxito!',
        'qr_token' => $qrToken,
        'id' => (int) $conexion->lastInsertId(),
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        responder_error('Ya existe un miembro registrado con ese DNI.', 409);
    }
    responder_error('Error al inscribir al cliente.', 500, $e);
}
