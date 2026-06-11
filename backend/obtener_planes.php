<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    $planes = $conexion->query('SELECT * FROM planes ORDER BY id ASC')->fetchAll();
    responder(['success' => true, 'planes' => $planes]);
} catch (PDOException $e) {
    responder_error('Error al obtener los planes.', 500, $e);
}
