<?php
// Creador de versión para Producción (Ofuscador Básico)
$origen = __DIR__;
$destino = __DIR__ . '/build_api';

// Crear carpeta de destino si no existe
if (!file_exists($destino)) {
    mkdir($destino, 0777, true);
}

// Escanear todos los archivos en la carpeta actual
$archivos = scandir($origen);

$archivosIgnorados = ['.', '..', 'ofuscar.php', 'build_api'];

echo "Generando API segura para producción...\n<br>";

foreach ($archivos as $archivo) {
    if (in_array($archivo, $archivosIgnorados) || is_dir($origen . '/' . $archivo)) {
        continue;
    }

    $extension = pathinfo($archivo, PATHINFO_EXTENSION);
    
    if ($extension === 'php') {
        // Leer el código sin espacios ni comentarios (nativo de PHP)
        $codigoLimpio = php_strip_whitespace($origen . '/' . $archivo);
        
        // Quitar la etiqueta <?php para codificar solo el interior
        $codigoInterior = preg_replace('/^<\?php\s*/', '', $codigoLimpio);
        $codigoInterior = preg_replace('/\?>$/', '', $codigoInterior);
        
        // Comprimir y codificar el código
        $codificado = base64_encode(gzdeflate($codigoInterior, 9));
        
        // Crear el archivo envuelto para que PHP lo decodifique y ejecute automáticamente
        $codigoFinal = '<?php eval(gzinflate(base64_decode("' . $codificado . '")));';
        
        file_put_contents($destino . '/' . $archivo, $codigoFinal);
        echo "✅ " . $archivo . " -> Ofuscado correctamente.\n<br>";
        
    } else {
        // Si no es PHP (ej. un .htaccess u otro), solo se copia
        copy($origen . '/' . $archivo, $destino . '/' . $archivo);
        echo "➡️ " . $archivo . " -> Copiado (No es PHP).\n<br>";
    }
}

echo "<br><b>¡Proceso completado!</b> Tu código seguro está en la carpeta 📁 <b>build_api</b>.";
?>
