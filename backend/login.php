<?php
require_once 'conexion.php';

solo_metodo('POST');
$data = leer_json();

$correo = trim((string) campo($data, 'correo', ''));
$password = (string) campo($data, 'password', '');

if ($correo === '' || $password === '') {
    responder_error('Faltan datos.', 400);
}

try {
    $stmt = $conexion->prepare(
        'SELECT id, nombre, correo, rol, password, activo
         FROM usuarios WHERE correo = :correo LIMIT 1'
    );
    $stmt->execute([':correo' => $correo]);
    $usuario = $stmt->fetch();

    $valida = false;
    if ($usuario && (int) $usuario['activo'] === 1) {
        $guardada = (string) $usuario['password'];

        if (str_starts_with($guardada, '$2y$') || str_starts_with($guardada, '$argon2')) {
            $valida = password_verify($password, $guardada);
        } else {
            // Contraseña heredada en texto plano: si coincide, se valida y
            // se re-guarda hasheada de inmediato (migración transparente).
            $valida = hash_equals($guardada, $password);
            if ($valida) {
                $conexion->prepare('UPDATE usuarios SET password = :hash WHERE id = :id')
                    ->execute([
                        ':hash' => password_hash($password, PASSWORD_DEFAULT),
                        ':id' => $usuario['id'],
                    ]);
            }
        }
    }

    if (!$valida) {
        usleep(450000); // freno simple contra fuerza bruta
        responder_error('Correo o contraseña incorrectos.', 401);
    }

    $token = crear_sesion($conexion, (int) $usuario['id']);

    responder([
        'success' => true,
        'token' => $token,
        'usuario' => [
            'id' => (int) $usuario['id'],
            'nombre' => $usuario['nombre'],
            'correo' => $usuario['correo'],
            'rol' => $usuario['rol'],
        ],
    ]);
} catch (PDOException $e) {
    responder_error('Error del servidor al iniciar sesión.', 500, $e);
}
