<?php
// Punto de entrada común: CORS, JSON, zona horaria y conexión PDO.
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';

// --- CORS ---
// Con el proxy /api de nginx el frontend y la API comparten origen y no
// hace falta CORS. ALLOWED_ORIGINS (separados por coma) cubre los casos
// donde se acceda a la API desde otro origen (ej. desarrollo con Vite).
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$permitidos = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));

if ($origen !== '' && in_array($origen, $permitidos, true)) {
    header("Access-Control-Allow-Origin: $origen");
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

// Hora de Perú en PHP y en la sesión de MySQL, para que NOW()/CURDATE()
// coincidan con la hora local (el contenedor de MySQL corre en UTC).
date_default_timezone_set('America/Lima');

$host = getenv('DB_HOST') !== false ? getenv('DB_HOST') : 'gym-db';
$dbname = getenv('DB_NAME') !== false ? getenv('DB_NAME') : 'tramusagym_db';
$username = getenv('DB_USER') !== false ? getenv('DB_USER') : 'root';
$password = getenv('DB_PASS');

if ($password === false) {
    responder_error('Configuración de base de datos incompleta en el servidor.', 500);
}

try {
    $conexion = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $conexion->exec("SET time_zone = '-05:00'");
} catch (PDOException $e) {
    responder_error('No se pudo conectar a la base de datos.', 500, $e);
}
