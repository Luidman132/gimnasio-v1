<?php
// Renovación de membresía: actualiza al miembro y registra el cobro en una
// sola transacción SQL. O se guardan ambos, o ninguno (antes la renovación
// podía fallar dejando el cobro registrado).
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

$miembroId = campo($data, 'miembro_id');
$fechaFin = campo($data, 'fecha_fin');
$monto = campo($data, 'monto', 0);

if (!is_numeric($miembroId) || empty($fechaFin)) {
    responder_error('Faltan datos de la renovación (miembro o fecha de fin).', 400);
}
if (!is_numeric($monto) || (float) $monto < 0) {
    responder_error('El monto del cobro no es válido.', 400);
}

try {
    // Resolver el plan (puede venir como id o como nombre).
    $planId = null;
    if (is_numeric(campo($data, 'plan_id'))) {
        $planId = (int) $data->plan_id;
    } elseif (!empty(campo($data, 'plan_nombre'))) {
        $stmtPlan = $conexion->prepare('SELECT id FROM planes WHERE nombre = :nombre LIMIT 1');
        $stmtPlan->execute([':nombre' => $data->plan_nombre]);
        $encontrado = $stmtPlan->fetchColumn();
        $planId = $encontrado !== false ? (int) $encontrado : null;
    }

    $conexion->beginTransaction();

    $stmtMiembro = $conexion->prepare('SELECT id, nombres FROM miembros WHERE id = :id AND eliminado = 0 FOR UPDATE');
    $stmtMiembro->execute([':id' => (int) $miembroId]);
    $miembro = $stmtMiembro->fetch();
    if (!$miembro) {
        $conexion->rollBack();
        responder_error('No se encontró el miembro a renovar.', 404);
    }

    $sets = ["estado = 'Activo'", 'fecha_fin = :fecha_fin'];
    $params = [':fecha_fin' => $fechaFin, ':id' => (int) $miembroId];

    if (!empty(campo($data, 'fecha_inicio'))) {
        $sets[] = 'fecha_inicio = :fecha_inicio';
        $params[':fecha_inicio'] = $data->fecha_inicio;
    }
    if ($planId !== null) {
        $sets[] = 'plan_id = :plan_id';
        $params[':plan_id'] = $planId;
    }
    if (!empty(campo($data, 'turno'))) {
        $sets[] = 'turno = :turno';
        $params[':turno'] = $data->turno;
    }

    $conexion->prepare('UPDATE miembros SET ' . implode(', ', $sets) . ' WHERE id = :id')
        ->execute($params);

    if ((float) $monto > 0) {
        $concepto = campo($data, 'concepto', 'Renovación de Plan');
        $metodoPago = campo($data, 'metodo_pago', 'Efectivo');

        $conexion->prepare(
            'INSERT INTO transacciones (concepto, monto, metodo_pago, miembro_id, usuario_id)
             VALUES (:concepto, :monto, :metodo_pago, :miembro_id, :usuario_id)'
        )->execute([
            ':concepto' => mb_substr((string) $concepto, 0, 100),
            ':monto' => (float) $monto,
            ':metodo_pago' => $metodoPago,
            ':miembro_id' => (int) $miembroId,
            ':usuario_id' => $usuarioActual['id'],
        ]);
    }

    $conexion->commit();

    responder([
        'success' => true,
        'mensaje' => 'Renovación de ' . $miembro['nombres'] . ' registrada con éxito.',
    ]);
} catch (PDOException $e) {
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    responder_error('Error al registrar la renovación. No se aplicó ningún cambio.', 500, $e);
}
