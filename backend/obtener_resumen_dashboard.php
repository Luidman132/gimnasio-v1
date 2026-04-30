<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'conexion.php';

// Sincronizamos el contador con la hora de Perú
date_default_timezone_set('America/Lima');
$fecha_hoy = date('Y-m-d');

try {
    // 1. Ingresos
    $sql_ingresos = "SELECT SUM(monto) as total_hoy FROM transacciones WHERE DATE(fecha) = :hoy";
    $stmt_ingresos = $conexion->prepare($sql_ingresos);
    $stmt_ingresos->execute([':hoy' => $fecha_hoy]);
    $ingresos_hoy = (float) $stmt_ingresos->fetch(PDO::FETCH_ASSOC)['total_hoy'] ?? 0.00;

    // 2. Miembros Activos
    $sql_miembros = "SELECT COUNT(*) as activos FROM miembros WHERE estado = 'Activo'";
    $stmt_miembros = $conexion->prepare($sql_miembros);
    $stmt_miembros->execute();
    $miembros_activos = $stmt_miembros->fetch(PDO::FETCH_ASSOC)['activos'];

    // 3. Asistencias QR y Manuales
    $sql_asist = "SELECT COUNT(*) as total FROM asistencias WHERE DATE(fecha_hora) = :hoy";
    $stmt_asist = $conexion->prepare($sql_asist);
    $stmt_asist->execute([':hoy' => $fecha_hoy]);
    $total_asistencias = $stmt_asist->fetch(PDO::FETCH_ASSOC)['total'];

    // 4. Visitas Libres
    $sql_visitas = "SELECT COUNT(*) as total FROM visitas_libres WHERE DATE(fecha_registro) = :hoy";
    $stmt_visitas = $conexion->prepare($sql_visitas);
    $stmt_visitas->execute([':hoy' => $fecha_hoy]);
    $total_visitas = $stmt_visitas->fetch(PDO::FETCH_ASSOC)['total'];

    echo json_encode([
        "success" => true,
        "ingresos_hoy" => $ingresos_hoy,
        "miembros_activos" => $miembros_activos,
        "asistencias_hoy" => $total_asistencias + $total_visitas
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error: " . $e->getMessage()]);
}
?>