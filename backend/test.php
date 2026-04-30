<?php
require_once 'conexion.php';
try {
    $stmt = $conexion->query("SHOW COLUMNS FROM miembros");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
