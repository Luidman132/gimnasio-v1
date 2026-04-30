<?php
// 1. Llamamos a la llave maestra
require_once 'conexion.php';
$data = json_decode(file_get_contents("php://input"));

// 2. Verificamos que al menos nos envíen a quién editar (ID) y su nombre
if (isset($data->id) && isset($data->nombre)) {

    try {
        // AÑADIMOS LAS 3 COLUMNAS NUEVAS AL UPDATE
        $sql = "UPDATE miembros SET 
                nombres = :nombres, 
                dni = :dni, 
                telefono = :telefono,
                email = :email,
                contacto_emergencia_nombre = :contacto_emergencia_nombre,
                contacto_emergencia_telefono = :contacto_emergencia_telefono,
                estado = :estado 
                WHERE id = :id";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([
            ':nombres' => $data->nombre,
            ':dni' => isset($data->dni) ? $data->dni : '',
            ':telefono' => isset($data->celular) ? $data->celular : '',
            // CAPTURAMOS LOS DATOS NUEVOS
            ':email' => isset($data->email) ? $data->email : null,
            ':contacto_emergencia_nombre' => isset($data->contacto_emergencia_nombre) ? $data->contacto_emergencia_nombre : null,
            ':contacto_emergencia_telefono' => isset($data->contacto_emergencia_telefono) ? $data->contacto_emergencia_telefono : null,
            // ---------------------------
            ':estado' => isset($data->estado) ? $data->estado : 'Activo',
            ':id' => $data->id
        ]);

        // 4. Confirmamos el éxito a React
        echo json_encode(["success" => true, "mensaje" => "¡Datos del cliente actualizados!"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "mensaje" => "Error al actualizar en BD: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "mensaje" => "Faltan datos obligatorios (ID o Nombre)."]);
}
?>