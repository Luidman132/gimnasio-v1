<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

try {
    $miembro = null;

    // Escenario A: registro manual (buscador) — llega miembro_id.
    if (is_numeric(campo($data, 'miembro_id'))) {
        $stmt = $conexion->prepare('SELECT id, nombres, estado, fecha_fin FROM miembros WHERE id = :id AND eliminado = 0 LIMIT 1');
        $stmt->execute([':id' => (int) $data->miembro_id]);
        $miembro = $stmt->fetch();
        if (!$miembro) {
            responder_error('No se encontró el miembro.', 404);
        }
        $mensajeExito = 'Asistencia manual registrada.';
    }
    // Escenario B: registro por código QR.
    elseif (!empty(campo($data, 'qr_token'))) {
        $stmt = $conexion->prepare('SELECT id, nombres, estado, fecha_fin FROM miembros WHERE qr_token = :qr AND eliminado = 0 LIMIT 1');
        $stmt->execute([':qr' => $data->qr_token]);
        $miembro = $stmt->fetch();
        if (!$miembro) {
            responder_error('QR no encontrado en la base de datos.', 404);
        }
        $mensajeExito = '¡Bienvenido, ' . $miembro['nombres'] . '!';
    } else {
        responder_error('No se envió ID ni QR válido.', 400);
    }

    // Validar vigencia de la membresía. Se devuelve miembro_id para que
    // el frontend pueda abrir directamente el flujo de renovación.
    $estado = strtolower((string) $miembro['estado']);
    if ($estado === 'inactivo' || $estado === 'congelado') {
        responder([
            'success' => false,
            'mensaje' => 'La membresía de ' . $miembro['nombres'] . ' está ' . $estado . '.',
            'miembro_id' => (int) $miembro['id'],
        ], 403);
    }
    $vencido = $estado !== 'pase_activo'
        && $miembro['fecha_fin'] !== null
        && $miembro['fecha_fin'] < date('Y-m-d');
    if ($estado === 'vencido' || $vencido) {
        responder([
            'success' => false,
            'mensaje' => 'La membresía de ' . $miembro['nombres'] . ' está vencida.',
            'miembro_id' => (int) $miembro['id'],
        ], 403);
    }

    // Evitar doble registro (ej. QR escaneado dos veces seguidas).
    $stmtDup = $conexion->prepare(
        'SELECT COUNT(*) FROM asistencias
         WHERE miembro_id = :id AND fecha_hora > DATE_SUB(NOW(), INTERVAL 60 SECOND)'
    );
    $stmtDup->execute([':id' => $miembro['id']]);
    if ((int) $stmtDup->fetchColumn() > 0) {
        responder_error('La asistencia de ' . $miembro['nombres'] . ' ya fue registrada hace un momento.', 409);
    }

    // NOW() usa la hora de Perú (zona fijada en conexion.php).
    $conexion->prepare('INSERT INTO asistencias (miembro_id, fecha_hora) VALUES (:id, NOW())')
        ->execute([':id' => $miembro['id']]);

    responder([
        'success' => true,
        'mensaje' => $mensajeExito,
        'nombre' => $miembro['nombres'],
        'miembro_id' => (int) $miembro['id'],
    ]);
} catch (PDOException $e) {
    responder_error('Error al registrar la asistencia.', 500, $e);
}
