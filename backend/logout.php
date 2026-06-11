<?php
require_once 'conexion.php';

solo_metodo('POST');

$token = obtener_token();
if ($token !== null) {
    try {
        cerrar_sesion($conexion, $token);
    } catch (PDOException $e) {
        error_log('[gym-api] logout: ' . $e->getMessage());
    }
}

responder(['success' => true]);
