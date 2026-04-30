<?php
// 1. Llamamos a nuestra llave maestra para poder entrar a MySQL
require_once 'conexion.php';

// 2. Recibimos el paquete con el correo y contraseña que nos mandará tu React
$data = json_decode(file_get_contents("php://input"));

// 3. Verificamos que React de verdad nos haya mandado esos datos
if (isset($data->correo) && isset($data->password)) {
    $correo = $data->correo;
    $password = $data->password;

    // 4. Le preguntamos a la base de datos si existe alguien con ese correo y clave
    $stmt = $conexion->prepare("SELECT id, nombre, correo, rol FROM usuarios WHERE correo = :correo AND password = :password");
    $stmt->bindParam(':correo', $correo);
    $stmt->bindParam(':password', $password);
    $stmt->execute();

    // 5. Si encontramos al usuario, le decimos a React "¡Pásale!"
    if ($stmt->rowCount() > 0) {
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "usuario" => $usuario]);
    } else {
        // Si no existe, le decimos "Acceso denegado"
        echo json_encode(["success" => false, "mensaje" => "Correo o contraseña incorrectos."]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos."]);
}
?>