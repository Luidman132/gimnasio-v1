<?php
require_once 'conexion.php';

// Acción destructiva: solo administradores.
$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

solo_metodo('POST');
$data = leer_json();

$id = campo($data, 'id');
if (!is_numeric($id)) {
    responder_error('ID no proporcionado.', 400);
}

try {
    // Soft delete: se marca eliminado = 1, no se borra la fila.
    $stmt = $conexion->prepare('UPDATE miembros SET eliminado = 1 WHERE id = :id AND eliminado = 0');
    $stmt->execute([':id' => (int) $id]);

    if ($stmt->rowCount() > 0) {
        responder(['success' => true, 'mensaje' => 'Miembro eliminado correctamente.']);
    }
    responder_error('No se encontró el miembro o ya estaba eliminado.', 404);
} catch (PDOException $e) {
    responder_error('Error al eliminar el miembro.', 500, $e);
}
