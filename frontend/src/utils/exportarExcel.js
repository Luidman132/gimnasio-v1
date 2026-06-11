// Generación del Excel de miembros (3 hojas: Miembros, Asistencias, Pagos).
// exceljs se importa dinámicamente: solo se descarga al exportar.

function fechaCorta(valor) {
  if (!valor) return ''
  const soloFecha = String(valor).split(' ')[0].split('T')[0]
  const [y, m, d] = soloFecha.split('-')
  return y && m && d ? `${d}/${m}/${y}` : String(valor)
}

function fechaHora(valor) {
  if (!valor) return ''
  const [fecha, hora] = String(valor).replace('T', ' ').split(' ')
  return `${fechaCorta(fecha)} ${hora ? hora.slice(0, 5) : ''}`.trim()
}

function estilizarCabecera(hoja) {
  const fila = hoja.getRow(1)
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }
  fila.alignment = { vertical: 'middle' }
  fila.height = 22
  hoja.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function generarExcelMiembros({ miembros = [], asistencias = [], pagos = [] }) {
  const mod = await import('exceljs')
  const ExcelJS = mod.default ?? mod

  const wb = new ExcelJS.Workbook()
  wb.creator = 'TramusaGym'
  wb.created = new Date()

  // ── Hoja 1: Miembros ──
  const hojaMiembros = wb.addWorksheet('Miembros')
  hojaMiembros.columns = [
    { header: 'N°', key: 'n', width: 6 },
    { header: 'DNI', key: 'dni', width: 13 },
    { header: 'Nombres y Apellidos', key: 'nombres', width: 38 },
    { header: 'Teléfono', key: 'telefono', width: 17 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Plan', key: 'plan', width: 22 },
    { header: 'Inicio', key: 'inicio', width: 12 },
    { header: 'Vencimiento', key: 'fin', width: 13 },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Turno', key: 'turno', width: 10 },
    { header: 'Contacto de Emergencia', key: 'contactoNombre', width: 26 },
    { header: 'Tel. Emergencia', key: 'contactoTel', width: 16 },
    { header: 'Total Asistencias', key: 'asistencias', width: 16 },
    { header: 'Última Asistencia', key: 'ultima', width: 18 },
    { header: 'N° Pagos', key: 'numPagos', width: 10 },
    { header: 'Total Pagado (S/)', key: 'totalPagado', width: 17 },
    { header: 'Fecha de Registro', key: 'registro', width: 17 },
  ]
  miembros.forEach((m, i) => {
    hojaMiembros.addRow({
      n: i + 1,
      dni: m.dni || '',
      nombres: m.nombres || '',
      telefono: m.telefono || '',
      email: m.email || '',
      plan: m.plan_nombre || 'Sin plan',
      inicio: fechaCorta(m.fecha_inicio),
      fin: fechaCorta(m.fecha_fin),
      estado: m.estado || '',
      turno: m.turno || '',
      contactoNombre: m.contacto_emergencia_nombre || '',
      contactoTel: m.contacto_emergencia_telefono || '',
      asistencias: Number(m.total_asistencias) || 0,
      ultima: fechaHora(m.ultima_asistencia),
      numPagos: Number(m.total_pagos) || 0,
      totalPagado: Number(m.total_pagado) || 0,
      registro: fechaCorta(m.fecha_registro),
    })
  })
  hojaMiembros.getColumn('totalPagado').numFmt = '#,##0.00'

  // ── Hoja 2: Asistencias ──
  const hojaAsistencias = wb.addWorksheet('Asistencias')
  hojaAsistencias.columns = [
    { header: 'N°', key: 'n', width: 6 },
    { header: 'Fecha y Hora', key: 'fecha', width: 18 },
    { header: 'Miembro', key: 'nombres', width: 38 },
    { header: 'DNI', key: 'dni', width: 13 },
    { header: 'Tipo', key: 'tipo', width: 14 },
  ]
  asistencias.forEach((a, i) => {
    hojaAsistencias.addRow({
      n: i + 1,
      fecha: fechaHora(a.fecha_hora),
      nombres: a.nombres || '',
      dni: a.dni || '',
      tipo: a.tipo || 'Asistencia',
    })
  })

  // ── Hoja 3: Pagos (inscripciones, renovaciones, pases, visitas) ──
  const hojaPagos = wb.addWorksheet('Pagos')
  hojaPagos.columns = [
    { header: 'N°', key: 'n', width: 6 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Concepto', key: 'concepto', width: 40 },
    { header: 'Monto (S/)', key: 'monto', width: 12 },
    { header: 'Método', key: 'metodo', width: 12 },
    { header: 'Miembro', key: 'miembro', width: 38 },
    { header: 'DNI', key: 'dni', width: 13 },
    { header: 'Registrado por', key: 'usuario', width: 16 },
  ]
  pagos.forEach((p, i) => {
    hojaPagos.addRow({
      n: i + 1,
      fecha: fechaHora(p.fecha),
      concepto: p.concepto || '',
      monto: Number(p.monto) || 0,
      metodo: p.metodo_pago || '',
      miembro: p.miembro || 'Visita / Sin asignar',
      dni: p.dni || '',
      usuario: p.registrado_por || '',
    })
  })
  hojaPagos.getColumn('monto').numFmt = '#,##0.00'

  ;[hojaMiembros, hojaAsistencias, hojaPagos].forEach(estilizarCabecera)

  // Descargar
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const hoy = new Date()
  const stamp = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = `Miembros_TramusaGym_${stamp}.xlsx`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
