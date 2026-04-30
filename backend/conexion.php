<?php
// 1. CORS (para React)
header("Access-Control-Allow-Origin: https://gimnasio.tramusaservice.com");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");

// 2. Manejo de preflight (React)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Leer las variables inyectadas por Docker. Si no existen, usar valores por defecto para Docker.
$host = getenv('DB_HOST') !== false ? getenv('DB_HOST') : "gym-db";
$dbname = getenv('DB_NAME') !== false ? getenv('DB_NAME') : "tramusagym_db";
$username = getenv('DB_USER') !== false ? getenv('DB_USER') : "root";
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "tramusa_db_password";

// 4. Conexión a la base de datos
try {
    $conexion = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Opcional (debug)
    // echo "Conexión exitosa";

} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage();
    die();
}
