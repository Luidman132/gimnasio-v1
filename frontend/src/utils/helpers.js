export function formatHora(date) {
  return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

export function addMonths(date, months) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function handleMontoInput(value) {
  let val = value.replace(/[^0-9.]/g, '')
  if (val.split('.').length > 2) return null
  return val
}

export function formatMontoBlur(value) {
  if (!value) return value
  const numericVal = parseFloat(value)
  if (!isNaN(numericVal)) return 'S/ ' + numericVal.toFixed(2)
  return value
}

export function parseMonto(value) {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0
}
