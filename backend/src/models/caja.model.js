// backend/src/models/caja.model.js
const db = require('../config/db');

/**
 * Registrar un movimiento de caja
 */
async function registrarMovimiento({
  tipo,
  concepto,
  monto,
  fecha_mov = new Date(),
  referencia_tipo = null,
  referencia_id = null,
  notas = null
}) {
  const [result] = await db.query(
    `
    INSERT INTO caja_movimientos (
      tipo,
      concepto,
      monto,
      fecha_mov,
      referencia_tipo,
      referencia_id,
      notas
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [tipo, concepto, monto, fecha_mov, referencia_tipo, referencia_id, notas]
  );

  return result.insertId;
}

/**
 * Obtener resumen de caja en un rango de fechas
 */
async function obtenerResumen({ desde = null, hasta = null }) {
  const params = [];
  let where = '1=1';
  
  if (desde) {
    where += ' AND DATE(fecha_mov) >= ?';
    params.push(desde);
  }
  if (hasta) {
    where += ' AND DATE(fecha_mov) <= ?';
    params.push(hasta);
  }

  const [rows] = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END), 0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END), 0) AS total_egresos
    FROM caja_movimientos
    WHERE ${where}
    `,
    params
  );

  const ingresos = Number(rows[0]?.total_ingresos || 0);
  const egresos = Number(rows[0]?.total_egresos || 0);

  return {
    ingresos,
    egresos,
    saldo: ingresos - egresos
  };
}

/**
 * Listar movimientos de caja
 */
async function listarMovimientos({ desde = null, hasta = null, tipo = null, limit = 100 }) {
  const params = [];
  let where = '1=1';
  
  if (desde) {
    where += ' AND DATE(fecha_mov) >= ?';
    params.push(desde);
  }
  if (hasta) {
    where += ' AND DATE(fecha_mov) <= ?';
    params.push(hasta);
  }
  if (tipo) {
    where += ' AND tipo = ?';
    params.push(tipo);
  }

  const [rows] = await db.query(
    `
    SELECT
      id_movimiento,
      tipo,
      concepto,
      monto,
      DATE_FORMAT(fecha_mov, '%Y-%m-%d %H:%i:%s') AS fecha_mov,
      referencia_tipo,
      referencia_id,
      notas,
      DATE_FORMAT(creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM caja_movimientos
    WHERE ${where}
    ORDER BY fecha_mov DESC, id_movimiento DESC
    LIMIT ?
    `,
    [...params, Number(limit)]
  );

  return rows;
}

module.exports = {
  registrarMovimiento,
  obtenerResumen,
  listarMovimientos
};