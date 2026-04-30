<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'conexion.php';

date_default_timezone_set('America/Lima');

// Si recibimos 0, significa "General / Histórico Total"
$dias = isset($_GET['dias']) ? (int) $_GET['dias'] : 7;

$filtro_fecha = "";
$params = [];
$formato_fecha = "DATE(fecha_hora)"; // Por defecto, agrupamos por Día

if ($dias > 0) {
    // Si pide 7, 14 o 30 días, filtramos
    $filtro_fecha = "WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL :dias DAY)";
    $filtro_fecha_asist = "WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL :dias DAY)";
    $params[':dias'] = $dias;
} else {
    // Si es 0 (General), no filtramos fechas, pero agrupamos por MES (Ej: 2026-03)
    $filtro_fecha_asist = "";
    $formato_fecha = "DATE_FORMAT(fecha_hora, '%Y-%m')";
}

try {
    // 1. Traer transacciones
    $sql_transacciones = "
        SELECT id, concepto, monto, metodo_pago, fecha, miembro_id
        FROM transacciones
        $filtro_fecha
        ORDER BY fecha DESC
    ";
    $stmt_trans = $conexion->prepare($sql_transacciones);
    $stmt_trans->execute($params);
    $transacciones = $stmt_trans->fetchAll(PDO::FETCH_ASSOC);

    // 2. Traer asistencias para el gráfico con la agrupación dinámica (Día o Mes)
    $sql_asistencias = "
        SELECT $formato_fecha as fecha, COUNT(*) as total 
        FROM asistencias 
        $filtro_fecha_asist
        GROUP BY $formato_fecha
        ORDER BY $formato_fecha ASC
    ";
    $stmt_asist = $conexion->prepare($sql_asistencias);
    $stmt_asist->execute($params);
    $asistencias_por_dia = $stmt_asist->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "transacciones" => $transacciones,
        "asistencias_grafico" => $asistencias_por_dia,
        "granularidad" => ($dias > 0) ? "dia" : "mes" // Le avisamos a React qué le estamos mandando
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "mensaje" => "Error BD: " . $e->getMessage()]);
}
?>