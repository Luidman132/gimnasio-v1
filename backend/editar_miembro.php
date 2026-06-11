<?php
require_once 'conexion.php';

$usuarioActual = requerir_sesion($conexion);

solo_metodo('POST');
$data = leer_json();

$id = campo($data, 'id');
if (!is_numeric($id)) {
    responder_error('Falta el ID del miembro.', 400);
}

// Actualización parcial: solo se modifican los campos que llegan en la
// petición. Mapa payload (frontend) → columna real.
$mapa = [
    'nombre' => 'nombres',
    'dni' => 'dni',
    'celular' => 'telefono',
    'email' => 'email',
    'estado' => 'estado',
    'fecha_inicio' => 'fecha_inicio',
    'fecha_fin' => 'fecha_fin',
    'turno' => 'turno',
    'dias_restantes' => 'dias_restantes',
    'contacto_emergencia_nombre' => 'contacto_emergencia_nombre',
    'contacto_emergencia_telefono' => 'contacto_emergencia_telefono',
];

// Normalización de estados del frontend (minúsculas) al enum de la BD.
$estadosValidos = [
    'activo' => 'Activo',
    'vencido' => 'Vencido',
    'congelado' => 'Congelado',
    'inactivo' => 'Inactivo',
    'pase_activo' => 'Pase_Activo',
];

try {
    $sets = [];
    $params = [':id' => (int) $id];

    foreach ($mapa as $campoPayload => $columna) {
        if (!property_exists($data, $campoPayload)) {
            continue;
        }
        $valor = $data->$campoPayload;
        if ($valor === '') {
            $valor = null;
        }

        if ($columna === 'estado') {
            $clave = strtolower((string) $valor);
            if (!isset($estadosValidos[$clave])) {
                responder_error('Estado de miembro no válido.', 400);
            }
            $valor = $estadosValidos[$clave];
        }

        if ($columna === 'nombres' && ($valor === null || trim((string) $valor) === '')) {
            responder_error('El nombre no puede quedar vacío.', 400);
        }

        $sets[] = "$columna = :$columna";
        $params[":$columna"] = $valor;
    }

    // El plan puede llegar como plan_id (numérico) o plan_nombre (texto).
    if (property_exists($data, 'plan_id') && is_numeric($data->plan_id)) {
        $sets[] = 'plan_id = :plan_id';
        $params[':plan_id'] = (int) $data->plan_id;
    } elseif (!empty($data->plan_nombre)) {
        $stmtPlan = $conexion->prepare('SELECT id FROM planes WHERE nombre = :nombre LIMIT 1');
        $stmtPlan->execute([':nombre' => $data->plan_nombre]);
        $planId = $stmtPlan->fetchColumn();
        if ($planId !== false) {
            $sets[] = 'plan_id = :plan_id';
            $params[':plan_id'] = (int) $planId;
        }
    }

    if (empty($sets)) {
        responder_error('No se envió ningún campo para actualizar.', 400);
    }

    // Verificar que el miembro exista (rowCount de UPDATE no distingue
    // "no existe" de "no hubo cambios").
    $stmtExiste = $conexion->prepare('SELECT id FROM miembros WHERE id = :id AND eliminado = 0');
    $stmtExiste->execute([':id' => (int) $id]);
    if ($stmtExiste->fetchColumn() === false) {
        responder_error('No se encontró el miembro.', 404);
    }

    $sql = 'UPDATE miembros SET ' . implode(', ', $sets) . ' WHERE id = :id AND eliminado = 0';
    $conexion->prepare($sql)->execute($params);

    responder(['success' => true, 'mensaje' => '¡Datos del cliente actualizados!']);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        responder_error('Ya existe otro miembro con ese DNI.', 409);
    }
    responder_error('Error al actualizar los datos del cliente.', 500, $e);
}
