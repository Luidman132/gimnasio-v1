# Guía de despliegue seguro — TramusaGym

Esta guía describe cómo llevar esta versión al servidor de la empresa
**sin perder datos**. La base de datos de producción tiene información real:
**cada paso destructivo va precedido de backup**.

---

## Qué cambió en esta versión

| Área | Antes | Ahora |
|---|---|---|
| Autenticación | Ninguna: la API estaba abierta a toda la red | Token de sesión obligatorio en todos los endpoints + roles (Admin/Recepción) |
| Contraseñas | Texto plano en la BD | Hash bcrypt (se migran solas en el primer login de cada usuario) |
| Renovaciones | **No se guardaban en la BD** (el cobro sí) | Endpoint atómico `renovar_miembro.php`: miembro + cobro en una transacción SQL |
| Editar miembro | Ignoraba plan y fechas | Actualización parcial completa (plan, fechas, turno, etc.) |
| URL de la API | Horneada en el build (`localhost:8888` → error "MAMP") | Relativa `/api` con proxy nginx: funciona desde cualquier IP o dominio |
| CORS | Contradictorio (`*` vs dominio fijo) | Innecesario (mismo origen); configurable por `.env` para desarrollo |
| Puertos | MySQL y phpMyAdmin expuestos a la red | Solo el puerto web (9000) sale a la red; BD interna, phpMyAdmin solo desde el servidor |
| Imágenes | 8 MB en el login (foto 4032px) | ~800 KB total |
| Bundle JS | 596 KB monolítico | Dividido por vista (lazy loading) |
| Errores | Detalles de la BD enviados al navegador | Mensaje genérico al cliente, detalle al log del servidor |
| `test.php` / `ofuscar.php` | Públicos en producción | Eliminados |
| Hora | MySQL en UTC (cobros después de las 7pm caían al día siguiente) | Todo en hora de Perú (−05:00) |
| Dashboard | Contaba miembros eliminados y vencidos como activos | Cuenta correcta por fecha y estado |

---

## PARTE A — Backup (SIEMPRE, antes de cualquier cosa)

En el servidor de la empresa:

```bash
# 1. Backup de la base de datos (ajusta la contraseña actual)
docker exec gym_database mysqldump -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  > backup_tramusagym_$(date +%F_%H%M).sql

# 2. Verificar que el backup no esté vacío
ls -lh backup_tramusagym_*.sql
head -5 backup_tramusagym_*.sql
```

Guarda una copia de ese archivo **fuera del servidor** (USB, otra máquina).

> Recomendación permanente: programar este mysqldump en un cron diario.

---

## PARTE B — Preparar el servidor

```bash
cd /ruta/del/proyecto/gimnasio-v1
git pull   # (o copiar los archivos nuevos)

# Crear el archivo de secretos (NUNCA se sube a git)
cp .env.example .env
nano .env
```

En `.env` define una **contraseña nueva y fuerte** para `DB_PASS`.

> ⚠️ **Importante**: la contraseña antigua (`tramusa_db_password`) estuvo
> publicada en GitHub. Hay que rotarla. MySQL guarda la contraseña dentro
> del volumen de datos, así que cambiarla requiere un paso extra (PARTE C).

---

## PARTE C — Aplicar la migración de BD (con los contenedores viejos aún corriendo)

La migración `database/migrations/001_seguridad_y_rendimiento.sql` es
**solo aditiva e idempotente**: crea la tabla `sesiones`, agrega columnas
(`turno`, `dias_restantes`), amplía el enum de estados y crea índices.
**No modifica ni borra ningún dato existente.**

```bash
# 1. Aplicar la migración (usa la contraseña ACTUAL de la BD)
docker exec -i gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  < database/migrations/001_seguridad_y_rendimiento.sql

# 2. Verificar
docker exec gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  -e "SHOW TABLES; SHOW COLUMNS FROM miembros LIKE 'turno';"
# Debe aparecer la tabla `sesiones` y la columna `turno`.

# 3. Rotar la contraseña de root de MySQL (la nueva de tu .env)
docker exec gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' \
  -e "ALTER USER 'root'@'%' IDENTIFIED BY 'LA_NUEVA_DE_TU_ENV'; ALTER USER 'root'@'localhost' IDENTIFIED BY 'LA_NUEVA_DE_TU_ENV'; FLUSH PRIVILEGES;"
```

---

## PARTE D — Desplegar los contenedores nuevos

```bash
docker compose down          # detiene web/api/db (los DATOS quedan en el volumen)
docker compose up -d --build # reconstruye y levanta todo
docker compose ps            # los 4 servicios deben quedar "running/healthy"
```

Tiempo estimado de corte: 3–6 minutos (el build del frontend es lo más lento).
Hazlo fuera del horario de atención del gimnasio.

---

## PARTE E — Verificación

```bash
# 1. La web responde
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000        # → 200

# 2. La API exige autenticación (esto es lo NUEVO e importante)
curl -s http://localhost:9000/api/obtener_miembros.php               # → {"success":false,...} con HTTP 401

# 3. Login funciona y devuelve token
curl -s -X POST http://localhost:9000/api/login.php \
  -H 'Content-Type: application/json' \
  -d '{"correo":"julio@tramusa.pe","password":"LA_CONTRASEÑA_DE_JULIO"}'
# → {"success":true,"token":"...","usuario":{...}}
```

Después, desde una tablet/PC del gimnasio: entrar a `http://IP_DEL_SERVIDOR:9000`,
iniciar sesión, registrar una asistencia de prueba y **hacer una renovación de
prueba y verificar que la fecha de fin quede guardada tras recargar la página**.

phpMyAdmin ya no está expuesto a la red. Para usarlo desde tu Mac:

```bash
ssh -L 9002:127.0.0.1:9002 usuario@IP_DEL_SERVIDOR
# luego abrir http://localhost:9002 en tu navegador
```

---

## PARTE F — Rotar las contraseñas de los usuarios del sistema

`admin123` y `recepcion123` estuvieron publicadas. Para rotarlas **no hace
falta generar el hash a mano**: el nuevo login convierte automáticamente a
hash seguro cualquier contraseña en texto plano en el primer inicio de
sesión. Entonces:

```sql
-- En phpMyAdmin o consola MySQL:
UPDATE usuarios SET password = 'NuevaClaveFuerteJulio2026'  WHERE correo = 'julio@tramusa.pe';
UPDATE usuarios SET password = 'NuevaClaveFuerteDina2026'   WHERE correo = 'dina@tramusa.pe';
```

En el primer login con la clave nueva, quedará guardada hasheada
(verás que en la BD empieza con `$2y$`).

---

## PARTE G — Reparación de datos históricos (revisión manual)

### G.1 Renovaciones que se cobraron pero no se guardaron (bug corregido)

Esta consulta lista los miembros cuyo cobro de renovación es posterior a su
última actualización — candidatos a tener `fecha_fin` desactualizada:

```sql
SELECT m.id, m.nombres, m.fecha_fin AS fin_actual, t.fecha AS fecha_cobro,
       t.concepto, t.monto
FROM transacciones t
JOIN miembros m ON m.id = t.miembro_id
WHERE t.concepto LIKE 'Renovación%'
  AND t.fecha > m.updated_at
ORDER BY t.fecha DESC;
```

Corregir cada caso desde la app (botón **Editar cliente** → fecha de fin),
que ahora sí persiste los cambios.

### G.2 Miembros sin plan asignado (`plan_id` en NULL)

```sql
SELECT id, nombres, fecha_inicio, fecha_fin
FROM miembros WHERE plan_id IS NULL AND eliminado = 0;
```

Asignarles plan desde la app si se desea el dato completo (no es urgente:
las fechas de membresía son las que mandan).

### G.3 (Opcional) Fechas históricas guardadas en UTC

Hasta esta versión, MySQL guardaba `transacciones.fecha`,
`visitas_libres.fecha_registro` y `miembros.created_at/updated_at` en UTC
(5 horas adelantadas respecto a Perú). Las filas nuevas ya se guardan en
hora de Perú. Si quieres alinear las históricas (afecta reportes por día):

```sql
-- SOLO con backup fresco de la PARTE A. Ejecutar UNA sola vez.
UPDATE transacciones   SET fecha = DATE_SUB(fecha, INTERVAL 5 HOUR)
  WHERE fecha < 'FECHA_DEL_DESPLIEGUE';
UPDATE visitas_libres  SET fecha_registro = DATE_SUB(fecha_registro, INTERVAL 5 HOUR)
  WHERE fecha_registro < 'FECHA_DEL_DESPLIEGUE';
```

Reemplaza `FECHA_DEL_DESPLIEGUE` por la fecha/hora exacta del despliegue
(ej. `2026-06-12 03:00:00`). Si no te afecta, puedes omitirlo.

---

## Rollback (si algo sale mal)

```bash
docker compose down
git checkout COMMIT_ANTERIOR        # volver al código previo
docker compose up -d --build

# Solo si la BD quedara dañada (no debería: la migración es aditiva):
docker exec -i gym_database mysql -uroot -p'CONTRASEÑA' tramusagym_db \
  < backup_tramusagym_FECHA.sql
```

La tabla `sesiones` y las columnas nuevas no estorban al código viejo:
puede convivir con ellas sin problema.

---

## Pendientes recomendados (no bloqueantes)

- Cron de backup diario de la BD (mysqldump + copia fuera del servidor).
- HTTPS si el sistema se publica fuera de la LAN (Caddy/Traefik o túnel Cloudflare).
- Paginación de miembros/transacciones cuando crezcan (hoy: 152/154 filas, sin problema).
- UI para cambio de contraseña y gestión de usuarios.
- Registrar egresos (la columna `tipo_transaccion` existe pero la UI no la usa).
