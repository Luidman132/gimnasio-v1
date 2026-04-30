# Guía y Mapa del Sistema: Gymnasia Tramusa

Este documento proporciona una visión general y un mapa conceptual de cómo está estructurado y cómo funciona el sistema web "Gymnasia Tramusa". 

El proyecto consta de dos partes principales que se comunican entre sí: el **Frontend** (la interfaz de usuario en React) y el **Backend** (la API en PHP que interactúa con la base de datos MySQL).

---

## 🏗️ 1. Arquitectura General y Tecnologías

El proyecto sigue una arquitectura **Cliente-Servidor**.

- **Frontend (Cliente):** 
  - Desarrollado en **React.js** usando **Vite** como entorno de compilación.
  - Estilos manejados con **Tailwind CSS**.
  - Manejo de estado global con **Context API** (`GymContext`).
  - Enrutamiento básico e intercambio dinámico de vistas en una Single Page Application (SPA).
  
- **Backend (Servidor/API):** 
  - Desarrollado en **PHP puro**.
  - Proporciona diversos *endpoints* (archivos `.php`) para las peticiones de datos (crear miembros, consultar asistencias, verificar login, etc.).
  - Alojado localmente en MAMP (`/Applications/MAMP/htdocs/tramusagym-api`).

- **Base de Datos:** 
  - **MySQL**. Contiene tablas para miembros, planes, asistencias, transacciones de pagos, usuarios administradores y configuraciones del gimnasio.

---

## 🗺️ 2. Mapa del Frontend (Directorio `tramusa-gym-code/src`)

El Frontend es una *SPA* (Aplicación de Página Única). El archivo principal `App.jsx` gestiona la autenticación de sesión mediante `localStorage` y un renderizado condicional de la "Vista Activa" (`vistaActiva`).

### Funcionalidad por Componentes / Vistas:

1. **`App.jsx` & `main.jsx`**: Punto de entrada de la aplicación. Gestiona la autenticación general y mantiene en memoria cuál es la vista actual en la que se encuentra el usuario.
2. **`DashboardLayout.jsx`**: Proporciona el diseño estructural o marco base (Sidebar/Menú lateral, Barra de navegación superior) que envuelve a cualquier vista activa.
3. **`DashboardInicio.jsx`** (Inicio): Panel principal. Muestra resúmenes, estadísticas, miembros activos, ingresos recientes. Contacta al endpoint `obtener_resumen_dashboard.php` y `obtener_actividad_reciente.php`.
4. **`MiembrosView.jsx`** (Miembros): Muestra la lista de miembros, con filtros y opciones de búsqueda. Permite editar miembros (`editar_miembro.php`) y eliminar de manera lógica (`eliminar_miembro.php`).
5. **`NuevaInscripcionView.jsx`** (Nueva Inscripción): Formulario para añadir nuevos miembros, registrar los planes escogidos y emitir la transacción inicial. 
6. **`RegistrarAsistenciaView.jsx`** (Asistencias / Scanner): Permite registrar si un miembro ha asistido hoy, conectándose a `registrar_asistencia.php`. Se integra con un submódulo para escanear códigos QR (`AsistenciaQRScanner.jsx`).
7. **`ReportesView.jsx`** (Finanzas): Visualiza reportes, flujo de caja e ingresos.
8. **`PlanesView.jsx`** (Planes): Gestión del catálogo de planes/suscripciones del gimnasio. Permite crear, editar, eliminar o cambiar el estado (Activo/Inactivo) de las mensualidades ofrecidas.
9. **`ConfiguracionView.jsx`** (Configuración): Módulo dinámico para personalizar variables del gimnasio: nombre, divisa, logo, números de contacto e información de cuenta para integrar con WhatsApp (`TicketWhatsApp.jsx`).

### Estado Global (Contexto):
- **`GymContext.jsx`**: Contiene la lógica profunda persistente (si existe), realizando la carga de datos maestros al inicio si es necesario, o proveyendo las variables principales a los componentes.
- **`ToastContext.jsx`**: Sistema centralizado de notificaciones al usuario (alertas flotantes de éxito/error).
- **`ThemeContext.jsx`**: Gestiona el Modo Oscuro / Modo Claro de la aplicación web.

---

## 🔌 3. Mapa del Backend (Directorio `tramusagym-api`)

El backend expone en crudo los distintos archivos que el frontend consume usando funciones asíncronas de JavaScript (`fetch` / `axios`).

A continuación, los endpoints principales y de qué se encargan:

- **Autenticación:**
  - `login.php`: Valida las credenciales del usuario y permite el acceso al DashBoard.
  
- **Manejo de Miembros:**
  - `obtener_miembros.php`: Devuelve todos los clientes activos.
  - `guardar_miembro.php`: Registra un miembro nuevo en BD.
  - `editar_miembro.php`: Actualiza datos de un usuario ya existente.
  - `eliminar_miembro.php`: Hace un *soft delete* (borrado lógico) del cliente.

- **Manejo de Planes/Subscripciones:**
  - `obtener_planes.php`: Consulta los planes activos/inactivos disponibles.
  - `guardar_plan.php` y `editar_plan.php`: Creador y editor de planes.
  - `toggle_estado_plan.php` y `eliminar_plan.php`: Manejo del estatus y eliminación protegida de planes.

- **Asistencias y Seguimiento:**
  - `obtener_asistencias.php`: Historial de visitas.
  - `registrar_asistencia.php`: Valida si es válido el acceso y registra un ingreso al gimnasio.
  - `registrar_visita_libre.php`: Registra visita de personas sin un plan adscrito, si es necesario.

- **Finanzas / Transacciones:**
  - `obtener_transacciones.php`: Registros financieros.
  - `guardar_transaccion.php`: Efectúa y registra el cobro de un plan o venta.

- **Dashboard:**
  - `obtener_resumen_dashboard.php`: Suministra la analítica, conteo de afiliados e ingresos del mes para el Inicio.
  - `obtener_actividad_reciente.php`: Devuelve los últimos eventos y entradas.

- **Configuración (`obtener_configuracion.php`, `guardar_configuracion.php`)**: Guarda y obtiene la configuración global y personalización de la app.
- **`conexion.php`**: Es el archivo clave y core que establece la conexión PDO con la base de datos MySQL.

---

## ⚙️ 4. Flujo de Funcionamiento (Ejemplo)

_Así unifica todo este ecosistema sus componentes_:

1. El usuario intenta abrir el Frontend en `http://localhost:5173`.
2. Como no está logueado (`localStorage` no tiene sesión), React muestra `LoginView.jsx`.
3. El usuario ingresa sus datos y se envía un `POST` a la API (`/tramusagym-api/login.php`). El backend verifica en BD (`tramusagym_db`).
4. Si es correcto, React guarda sus datos en `localStorage`, recarga `App.jsx`, y enruta a la Vista Activa de `'Inicio'`.
5. Se dibuja `DashboardLayout.jsx` con su sidebar, y dentro `DashboardInicio.jsx`. Ese componente dispara funciones a `obtener_resumen_dashboard.php` y pinta la pantalla principal.
6. Al navegar el usuario al registro de asistencia y pasar el QR, envía `registrar_asistencia.php`. Este actualiza las tablas y el frontend despliega una notificación de `ToastContext.jsx` verde como confirmación de acceso.

---

Esta arquitectura modular asegura que puedes cambiar partes del backend sin romper el frontend, y el front puede ser desplegado de manera independiente o reconstruido.
