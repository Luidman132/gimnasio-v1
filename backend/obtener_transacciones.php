<?php
require_once 'conexion.php';

// Finanzas es una vista exclusiva de administradores.
$usuarioActual = requerir_sesion($conexion, soloAdmin: true);

// dias = 0 significa "histórico total" (agrupado por mes en el gráfico).
$dias = isset($_GET['dias']) ? max(0, (int) $_GET['dias']) : 7;

try {
    $params = [];
    $filtroTrans = '';
    $filtroAsist = '';
    $formatoFecha = 'DATE(fecha_hora)';

    if ($dias > 0) {
        $filtroTrans = 'WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL :dias DAY)';
        $filtroAsist = 'WHERE fecha_hora >= DATE_SUB(CURDATE(), INTERVAL :dias DAY)';
        $params[':dias'] = $dias;
    } else {
        $formatoFecha = "DATE_FORMAT(fecha_hora, '%Y-%m')";
    }

    $stmtTrans = $conexion->prepare(
        "SELECT id, concepto, monto, metodo_pago, fecha, miembro_id
         FROM transacciones
         $filtroTrans
         ORDER BY fecha DESC"
    );
    $stmtTrans->execute($params);
    $transacciones = $stmtTrans->fetchAll();

    $stmtAsist = $conexion->prepare(
        "SELECT $formatoFecha AS fecha, COUNT(*) AS total
         FROM asistencias
         $filtroAsist
         GROUP BY $formatoFecha
         ORDER BY fecha ASC"
    );
    $stmtAsist->execute($params);
    $asistenciasGrafico = $stmtAsist->fetchAll();

    responder([
        'success' => true,
        'transacciones' => $transacciones,
        'asistencias_grafico' => $asistenciasGrafico,
        'granularidad' => $dias > 0 ? 'dia' : 'mes',
    ]);
} catch (PDOException $e) {
    responder_error('Error al obtener las transacciones.', 500, $e);
}
