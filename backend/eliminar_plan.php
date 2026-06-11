<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

solo_metodo('POST');
$data = leer_json();

$id = campo($data, 'id');
if (!is_numeric($id)) {
    responder_error('Falta el ID del plan a eliminar.', 400);
}

try {
    // No se elimina un plan con miembros asociados (se perdería el historial).
    $stmt = $conexion->prepare('SELECT COUNT(*) FROM miembros WHERE plan_id = :id');
    $stmt->execute([':id' => (int) $id]);
    $asociados = (int) $stmt->fetchColumn();

    if ($asociados > 0) {
        responder_error(
            "No se puede eliminar este plan porque tiene {$asociados} miembros asociados. Te recomendamos desactivarlo en su lugar.",
            409
        );
    }

    $conexion->prepare('DELETE FROM planes WHERE id = :id')->execute([':id' => (int) $id]);

    responder(['success' => true, 'mensaje' => 'Plan eliminado.']);
} catch (PDOException $e) {
    responder_error('Error al eliminar el plan.', 500, $e);
}
