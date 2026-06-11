<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

solo_metodo('POST');
$data = leer_json();

$nombreGimnasio = trim((string) campo($data, 'nombre_gimnasio', ''));
if ($nombreGimnasio === '') {
    responder_error('Faltan datos obligatorios (Nombre del gimnasio).', 400);
}

// El logo se guarda en base64; 2 MB de límite para no inflar la BD
// ni las respuestas de obtener_configuracion.
$logo = campo($data, 'logo_base64');
if (is_string($logo) && strlen($logo) > 2 * 1024 * 1024) {
    responder_error('El logo es demasiado pesado (máximo 2 MB). Usa una imagen más pequeña.', 413);
}

try {
    $sql = 'UPDATE configuracion SET
                nombre_gimnasio = :nombre,
                telefono = :telefono,
                moneda = :moneda,
                mensaje_ticket = :mensaje,
                direccion = :direccion,
                logo_base64 = :logo,
                plantilla_whatsapp = :plantilla_wa
            WHERE id = 1';

    $conexion->prepare($sql)->execute([
        ':nombre' => $nombreGimnasio,
        ':telefono' => campo($data, 'telefono', ''),
        ':moneda' => campo($data, 'moneda', 'S/'),
        ':mensaje' => campo($data, 'mensaje_ticket', ''),
        ':direccion' => campo($data, 'direccion', ''),
        ':logo' => $logo,
        ':plantilla_wa' => campo($data, 'plantilla_whatsapp'),
    ]);

    responder(['success' => true, 'mensaje' => '¡Configuración actualizada con éxito!']);
} catch (PDOException $e) {
    responder_error('Error al guardar la configuración.', 500, $e);
}
