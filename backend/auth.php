<?php
// Autenticación por token de sesión (tabla `sesiones`).
// El token viaja en el header "Authorization: Bearer <token>".
// En la BD solo se guarda su hash SHA-256: si la tabla se filtra,
// los tokens no son utilizables.

const SESION_DURACION_HORAS = 12;

function obtener_token(): ?string
{
    $header = null;

    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $clave => $valor) {
            if (strtolower($clave) === 'authorization') {
                $header = $valor;
                break;
            }
        }
    }

    $header = $header
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? null;

    if ($header !== null && preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

// Valida la sesión y devuelve el usuario autenticado.
// Con $soloAdmin = true exige rol Admin (403 si no lo tiene).
function requerir_sesion(PDO $conexion, bool $soloAdmin = false): array
{
    $token = obtener_token();
    if ($token === null) {
        responder_error('No autorizado. Inicia sesión nuevamente.', 401);
    }

    try {
        $stmt = $conexion->prepare(
            'SELECT s.id AS sesion_id, s.expira_en,
                    u.id, u.nombre, u.correo, u.rol
             FROM sesiones s
             JOIN usuarios u ON u.id = s.usuario_id
             WHERE s.token_hash = :hash AND s.expira_en > NOW() AND u.activo = 1
             LIMIT 1'
        );
        $stmt->execute([':hash' => hash('sha256', $token)]);
        $fila = $stmt->fetch();
    } catch (PDOException $e) {
        // Si la tabla `sesiones` no existe, falta correr la migración 001.
        responder_error('Error de autenticación en el servidor.', 500, $e);
    }

    if (!$fila) {
        responder_error('Sesión expirada o inválida. Inicia sesión nuevamente.', 401);
    }

    // Renovación deslizante: extender solo cuando quedan menos de 6 horas.
    if (strtotime($fila['expira_en']) - time() < 6 * 3600) {
        $conexion->prepare('UPDATE sesiones SET expira_en = DATE_ADD(NOW(), INTERVAL ' . SESION_DURACION_HORAS . ' HOUR) WHERE id = :id')
            ->execute([':id' => $fila['sesion_id']]);
    }

    if ($soloAdmin && strtolower($fila['rol']) !== 'admin') {
        responder_error('Se requiere rol de administrador para esta acción.', 403);
    }

    return [
        'id' => (int) $fila['id'],
        'nombre' => $fila['nombre'],
        'correo' => $fila['correo'],
        'rol' => $fila['rol'],
    ];
}

function crear_sesion(PDO $conexion, int $usuarioId): string
{
    $token = bin2hex(random_bytes(32));

    // Limpieza oportunista de sesiones vencidas.
    $conexion->exec('DELETE FROM sesiones WHERE expira_en < NOW()');

    $stmt = $conexion->prepare(
        'INSERT INTO sesiones (usuario_id, token_hash, expira_en)
         VALUES (:usuario_id, :hash, DATE_ADD(NOW(), INTERVAL ' . SESION_DURACION_HORAS . ' HOUR))'
    );
    $stmt->execute([
        ':usuario_id' => $usuarioId,
        ':hash' => hash('sha256', $token),
    ]);

    return $token;
}

function cerrar_sesion(PDO $conexion, string $token): void
{
    $conexion->prepare('DELETE FROM sesiones WHERE token_hash = :hash')
        ->execute([':hash' => hash('sha256', $token)]);
}
