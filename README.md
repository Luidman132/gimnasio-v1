# TramusaGym — Sistema de gestión del gimnasio

Sistema de membresías, asistencias (QR), cobros y reportes del gimnasio
de TRAMUSA S.A.

## Arquitectura

```
Navegador ──► gym-frontend (nginx :9000)
                ├── React (build de Vite)
                └── /api/* ──proxy──► gym-api (PHP 8.2 + Apache)
                                        └──► gym-db (MySQL 8, solo red interna)
```

- **frontend/** — React 19 + Vite + Tailwind. Toda llamada HTTP pasa por
  `src/utils/api.js` (token de sesión incluido). La URL de la API es
  relativa (`/api`), así el mismo build sirve para cualquier IP o dominio.
- **backend/** — PHP plano, un archivo por endpoint. `conexion.php` (PDO,
  zona horaria, CORS), `helpers.php` (respuestas JSON), `auth.php`
  (sesiones por token + roles). Todos los endpoints exigen sesión;
  los administrativos exigen rol Admin.
- **database/** — `tramusagym_db.sql` (esquema base) y `migrations/`
  (cambios aplicables a producción; ver `DEPLOY.md`).

## Desarrollo en local

Requisitos: Docker Desktop.

```bash
cp .env.example .env       # definir DB_PASS
docker compose up -d --build
# Web:        http://localhost:9000
# phpMyAdmin: http://localhost:9002 (solo accesible desde esta máquina)
```

Para trabajar el frontend con recarga en caliente:

```bash
cd frontend && npm install && npm run dev
# Vite proxea /api → http://localhost:9001 (la API del Docker local)
```

## Despliegue / actualización

- **`ACTUALIZAR.md`** ← empezar aquí. Cómo clonar o actualizar la producción
  (que ya tiene datos) **sin perderlos**. Cubre servidor nuevo y actualización.
- **`DEPLOY.md`** ← referencia completa: backup, migración de BD, rotación de
  contraseñas, reparación de datos históricos, rollback.

Regla de oro: nunca desplegar sin backup, y nunca usar `docker compose down -v`
(la `-v` borra el volumen con todos los datos).

### Clonar e instalar (servidor nuevo)

```bash
git clone https://github.com/Luidman132/gimnasio-v1.git
cd gimnasio-v1
cp .env.example .env      # editar DB_PASS
docker compose up -d --build
```

No se clonan `node_modules` (se reinstalan con `npm ci` desde
`package-lock.json` durante el build) ni `.env` (se crea desde `.env.example`).

## Usuarios y roles

| Rol | Puede |
|---|---|
| Recepción | Dashboard, miembros, asistencias, inscripciones, cobros |
| Admin | Todo lo anterior + finanzas, planes, configuración y eliminar miembros |

Las contraseñas se guardan hasheadas (bcrypt). Para resetear una desde la
BD basta escribirla en texto plano con un UPDATE: el sistema la hashea
automáticamente en el siguiente inicio de sesión.
