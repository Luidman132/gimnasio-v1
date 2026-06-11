# Cómo actualizar la PRODUCCIÓN sin perder los datos

> Para el compañero que administra el servidor.
> El sistema ya está en uso con datos reales (miembros, pagos, asistencias).
> Esta guía explica cómo subir esta versión corregida **sin tocar esos datos**.

---

## Sobre las dependencias (clonar y que no falte nada)

Al clonar el repo **no vienen** `node_modules` ni el `.env` — y eso es lo
correcto, no falta nada:

- Las versiones EXACTAS de todas las dependencias están fijadas en
  `frontend/package-lock.json` (sí se sube al repo). Durante el build, Docker
  ejecuta `npm ci`, que instala **exactamente** esas versiones. Nada se pierde.
- El `.env` no se sube por seguridad (lleva la contraseña de la BD). Se crea a
  partir de `.env.example`.

Es decir: clonas + `docker compose up -d --build` y Docker arma todo solo.

---

## Caso A — Servidor NUEVO (sin datos previos)

Instalación desde cero. La base de datos se crea con su esquema y dos usuarios
semilla automáticamente.

```bash
git clone https://github.com/RonaldoHorta159/gimnasio-v1.git
cd gimnasio-v1
cp .env.example .env          # edita DB_PASS con una contraseña fuerte
docker compose up -d --build
```

Entra a `http://IP_DEL_SERVIDOR:9000`. Usuarios por defecto:
`julio@tramusa.pe / admin123` y `dina@tramusa.pe / recepcion123`
→ **cámbialas de inmediato** (DEPLOY.md, Parte F).

---

## Caso B — Actualizar la producción que YA tiene datos

Es tu caso. Sigue leyendo: el resto de la guía es exactamente esto.

---

## Lo primero que tienes que entender (es la clave de todo)

**Los datos NO están en el código ni en ningún archivo `.sql`.**
Los 152 miembros, los pagos y las asistencias viven dentro de un **volumen de
Docker** llamado `gym_db_data`. Ese volumen:

- ✅ **Sobrevive** a `docker compose up`, `down`, `build` y a reiniciar el servidor.
- ✅ **No lo toca** el código nuevo: actualizar el frontend/backend no afecta la BD.
- ❌ **Solo se borra** si alguien ejecuta `docker compose down -v` (con `-v`).

> ### 🚫 REGLA DE ORO
> **NUNCA uses `-v` ni `--volumes`.** Ese es el único comando que borra los datos.
> Para actualizar usarás `docker compose up -d --build`, que **conserva** el volumen.

El archivo `database/tramusagym_db.sql` que viene en el paquete **NO** sobrescribe
nada: MySQL solo lo ejecuta cuando se crea una base de datos desde cero (vacía).
En tu servidor, como el volumen ya existe con datos, ese archivo **se ignora**.

---

## ⚠️ Regla #2: actualiza en la MISMA carpeta de siempre

Docker nombra el volumen usando el **nombre de la carpeta** del proyecto
(ej. `gimnasio-v1_gym_db_data`). Si extraes esta versión en una carpeta con
**otro nombre**, Docker creará un volumen nuevo y **vacío** (parecerá que se
perdieron los miembros, aunque en realidad siguen en el volumen viejo).

👉 **Actualiza dentro de la misma carpeta donde ya corre la producción.**
Para confirmar el nombre del volumen actual:

```bash
docker volume ls | grep gym
# Anota el nombre exacto, ej: gimnasio-v1_gym_db_data
```

---

## Pasos de actualización (en orden)

Todo esto en el servidor, dentro de la carpeta del proyecto. Hazlo fuera del
horario de atención del gimnasio (corte estimado: 3–6 minutos).

### 1. Respaldo de seguridad (SIEMPRE primero)

```bash
# Usa la contraseña ACTUAL de la BD de producción
docker exec gym_database mysqldump -uroot -p'CONTRASEÑA_ACTUAL' \
  --single-transaction tramusagym_db > backup_$(date +%F_%H%M).sql

# Verifica que NO esté vacío y que contenga los miembros
ls -lh backup_*.sql
grep -c "INSERT INTO \`miembros\`" backup_*.sql   # debe dar 1 o más
```

Guarda una copia de ese `.sql` **fuera del servidor** (USB u otra PC). Es tu
botón de "deshacer todo" por si algo sale mal.

### 2. Conserva tu archivo `.env` actual

El paquete trae un `.env.example`, **no** un `.env`. Tu `.env` de producción
(con la contraseña de la BD) **no se toca**. Si actualizas sobre la misma
carpeta, déjalo tal cual.

> Importante: el `DB_PASS` del `.env` debe seguir siendo **la contraseña que ya
> tiene tu base de datos**. Cambiarla en el `.env` NO cambia la contraseña real
> de MySQL (esa está guardada en el volumen). Si quieres rotarla — recomendable
> porque la anterior estuvo expuesta — hazlo como paso aparte (ver DEPLOY.md,
> Parte C y F). Para esta actualización, déjala igual y nada se rompe.

### 3. Trae el código nuevo desde GitHub (sin tocar `.env` ni el volumen)

**Dentro de la misma carpeta de producción de siempre.** Si esa carpeta ya es
un clon de git (lo normal), basta con:

```bash
cd /ruta/de/produccion        # la MISMA carpeta de siempre (Regla #2)
git pull origin main
```

`git pull` actualiza solo el código. **No toca** tu `.env` (está en `.gitignore`)
ni el volumen de datos. Si `git pull` se queja por cambios locales, guarda una
copia de tu `.env` y usa `git stash` antes de volver a intentar.

> ¿La carpeta de producción no es un clon de git? Conviértela una sola vez:
> ```bash
> git init && git remote add origin https://github.com/RonaldoHorta159/gimnasio-v1.git
> git fetch origin && git reset --hard origin/main   # NO borra .env ni el volumen
> ```
> (Esto reemplaza solo los archivos versionados; tu `.env` y el volumen de
> Docker quedan intactos.)

### 4. Aplica la migración de la base de datos (UNA vez)

El código nuevo necesita una tabla de sesiones y unas columnas extra. La
migración **solo agrega** cosas nuevas — no modifica ni borra datos, y se puede
correr varias veces sin problema (es idempotente).

```bash
docker exec -i gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  < database/migrations/001_seguridad_y_rendimiento.sql

# Verifica que se creó la tabla 'sesiones' y la columna 'turno'
docker exec gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  -e "SHOW TABLES LIKE 'sesiones'; SHOW COLUMNS FROM miembros LIKE 'turno';"
```

> ⚠️ Aplica la migración **antes o junto** con el código nuevo. Si subes el
> backend nuevo sin la tabla `sesiones`, el login fallará hasta que la apliques.

### 5. Reconstruye y levanta (esto conserva el volumen)

```bash
docker compose up -d --build
docker compose ps        # los 4 servicios deben quedar "running"/"healthy"
```

### 6. Verifica que todo quedó bien

```bash
# La web responde
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000          # 200

# La API ahora exige sesión (antes estaba abierta)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000/api/obtener_miembros.php   # 401

# Los miembros siguen ahí
docker exec gym_database mysql -uroot -p'CONTRASEÑA_ACTUAL' tramusagym_db \
  -e "SELECT COUNT(*) AS miembros FROM miembros WHERE eliminado=0;"
```

Luego entra desde el navegador a `http://IP_DEL_SERVIDOR:9000`, inicia sesión
con la cuenta de siempre y confirma que la lista de miembros está completa.

---

## Si algo sale mal: volver atrás (rollback)

```bash
docker compose down            # SIN -v (no borres el volumen)
# vuelve a poner el código anterior y:
docker compose up -d --build

# La migración no estorba al código viejo (solo agregó tablas/columnas nuevas),
# así que normalmente NO necesitas restaurar la BD. Solo en caso extremo:
docker exec -i gym_database mysql -uroot -p'CONTRASEÑA' tramusagym_db < backup_FECHA.sql
```

---

## (Opcional, recomendado) Probar la actualización ANTES de tocar producción

Si quieres ir 100% seguro, prueba todo en tu PC con una copia real de los datos:

1. Lleva el `backup_FECHA.sql` del paso 1 a tu PC (con Docker).
2. En una carpeta nueva, pon este proyecto, crea un `.env` con cualquier
   `DB_PASS`, y levanta solo la BD: `docker compose up -d gym-db`
3. Restaura el backup: `docker exec -i gym_database mysql -uroot -pTU_PASS tramusagym_db < backup_FECHA.sql`
4. Aplica la migración y levanta todo. Verifica que los 152 miembros estén y que
   el sistema funcione. Si todo va bien, repite en producción con confianza.

---

## Resumen en 5 líneas

1. **Respalda** con `mysqldump` (y guarda el `.sql` afuera).
2. Actualiza **en la misma carpeta**, conservando tu `.env`.
3. Aplica la **migración** (solo agrega, no borra).
4. `docker compose up -d --build` (**nunca** con `-v`).
5. Verifica que los miembros siguen y que el login pide contraseña.

Los detalles finos (rotar contraseñas, reparar datos históricos, HTTPS) están
en `DEPLOY.md`.
