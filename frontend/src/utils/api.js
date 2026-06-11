// Cliente HTTP central: una sola puerta de salida hacia la API.
// - La URL base es relativa (/api) y nginx la proxea al backend, así el
//   mismo build funciona desde cualquier IP o dominio sin recompilar.
// - Adjunta el token de sesión en cada petición.
// - Si el servidor responde 401, cierra la sesión local y avisa a la app.

const API_URL = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'tramusa_token'
const USUARIO_KEY = 'tramusa_usuario'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

export function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USUARIO_KEY)
}

export function usuarioGuardado() {
  try {
    const guardado = localStorage.getItem(USUARIO_KEY)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

// Nunca lanza excepciones: siempre devuelve { success, mensaje, ...datos }.
export async function apiFetch(endpoint, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { success: false, mensaje: 'No se pudo conectar con el servidor.' }
  }

  if (response.status === 401) {
    limpiarSesion()
    window.dispatchEvent(new Event('tramusa:sesion-expirada'))
  }

  try {
    return await response.json()
  } catch {
    return { success: false, mensaje: 'El servidor devolvió una respuesta inválida.' }
  }
}
