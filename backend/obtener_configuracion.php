<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    $configuracion = $conexion->query('SELECT * FROM configuracion LIMIT 1')->fetch();
    responder(['success' => true, 'configuracion' => $configuracion ?: null]);
} catch (PDOException $e) {
    responder_error('Error al obtener la configuración.', 500, $e);
}
