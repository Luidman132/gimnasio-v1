<?php
// Utilidades compartidas por todos los endpoints.

// Envía una respuesta JSON y termina la ejecución.
function responder(array $payload, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Respuesta de error genérica. El detalle técnico va al log del servidor,
// nunca al cliente (evita filtrar estructura de la BD).
function responder_error(string $mensaje, int $codigo = 400, ?Throwable $e = null): never
{
    if ($e !== null) {
        error_log('[gym-api] ' . $_SERVER['REQUEST_URI'] . ' :: ' . $e->getMessage());
    }
    responder(['success' => false, 'mensaje' => $mensaje], $codigo);
}

// Lee y decodifica el cuerpo JSON de la petición.
function leer_json(): object
{
    $data = json_decode(file_get_contents('php://input'));
    return is_object($data) ? $data : new stdClass();
}

// Rechaza la petición si no usa el método HTTP esperado.
function solo_metodo(string $metodo): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        responder_error('Método no permitido.', 405);
    }
}

// Devuelve $data->$campo si viene con contenido, o el valor por defecto.
function campo(object $data, string $nombre, mixed $defecto = null): mixed
{
    return (isset($data->$nombre) && $data->$nombre !== '') ? $data->$nombre : $defecto;
}
