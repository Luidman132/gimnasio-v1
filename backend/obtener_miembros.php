<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

try {
    $sql = 'SELECT m.*, p.nombre AS plan_nombre
            FROM miembros m
            LEFT JOIN planes p ON m.plan_id = p.id
            WHERE m.eliminado = 0
            ORDER BY m.id DESC';

    $miembros = $conexion->query($sql)->fetchAll();

    responder(['success' => true, 'miembros' => $miembros]);
} catch (PDOException $e) {
    responder_error('Error al obtener los miembros.', 500, $e);
}
