// backend/src/models/cuentaPagar.model.js
const db = require('../config/db');

// ===============================
// LISTAR CUENTAS POR PAGAR
// ===============================
async function listarCuentas() {
  const [rows] = await db.query(
    `
    SELECT
      cp.id_cuenta_pagar,
      cp.id_compra,
      cp.id_proveedor,
      p.nombre_proveedor,
      cp.descripcion,
      cp.monto_total,
      cp.total_pagado,
      cp.saldo_pendiente,
      cp.fecha_registro,
      cp.fecha_vencimiento,
      cp.estado,
      cp.beneficiario,
      cp.categoria,
      cp.notas,
      cp.creado_en,
      cp.actualizado_en
    FROM cuentas_por_pagar cp
    LEFT JOIN proveedores p
      ON p.id_proveedor = cp.id_proveedor
    ORDER BY cp.fecha_registro DESC, cp.id_cuenta_pagar DESC
    `
  );
  return rows;
}

// ===============================
// OBTENER UNA CUENTA + PAGOS
// ===============================
async function obtenerPorId(id) {
  const [rows] = await db.query(
    `
    SELECT
      cp.*,
      p.nombre_proveedor
    FROM cuentas_por_pagar cp
    LEFT JOIN proveedores p
      ON p.id_proveedor = cp.id_proveedor
    WHERE cp.id_cuenta_pagar = ?
    `,
    [id]
  );

  if (rows.length === 0) return null;
  const cuenta = rows[0];

  const [pagos] = await db.query(
    `
    SELECT
      id_pago_cuenta,
      fecha_pago,
      monto_pagado,
      metodo_pago,
      referencia,
      notas,
      creado_en,
      actualizado_en
    FROM cuentas_pagar_pagos
    WHERE id_cuenta_pagar = ?
    ORDER BY fecha_pago ASC, id_pago_cuenta ASC
    `,
    [id]
  );

  return { cuenta, pagos };
}

// ===============================
// CREAR CUENTA MANUAL
// ===============================
async function crearManual({
  descripcion,
  monto_total,
  fecha_registro,
  fecha_vencimiento = null,
  beneficiario = null,
  categoria = null,
  notas = null,
  id_proveedor = null
}) {
  const saldo = monto_total;

  const [result] = await db.query(
    `
    INSERT INTO cuentas_por_pagar (
      id_compra,
      id_proveedor,
      descripcion,
      monto_total,
      total_pagado,
      saldo_pendiente,
      fecha_registro,
      fecha_vencimiento,
      estado,
      beneficiario,
      categoria,
      notas
    )
    VALUES (NULL, ?, ?, ?, 0, ?, ?, ?, 'pendiente', ?, ?, ?)
    `,
    [
      id_proveedor || null,
      descripcion,
      monto_total,
      saldo,
      fecha_registro,
      fecha_vencimiento || null,
      beneficiario,
      categoria,
      notas
    ]
  );

  return result.insertId;
}

// ===============================
// CREAR CUENTA DESDE COMPRA A CRÉDITO
// ===============================
async function crearDesdeCompra({
  id_compra,
  id_proveedor,
  total_neto,
  fecha_compra,
  fecha_vencimiento = null,
  notas = null
}) {
  const descripcion = `Compra #${id_compra}`;
  const saldo = total_neto;

  const [result] = await db.query(
    `
    INSERT INTO cuentas_por_pagar (
      id_compra,
      id_proveedor,
      descripcion,
      monto_total,
      total_pagado,
      saldo_pendiente,
      fecha_registro,
      fecha_vencimiento,
      estado,
      beneficiario,
      categoria,
      notas
    )
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'pendiente', NULL, 'Compras', ?)
    `,
    [
      id_compra,
      id_proveedor || null,
      descripcion,
      total_neto,
      saldo,
      fecha_compra,
      fecha_vencimiento || null,
      notas
    ]
  );

  return result.insertId;
}

// ===============================
// REGISTRAR PAGO / ABONO
// ===============================
async function registrarPago({
  id_cuenta_pagar,
  fecha_pago,
  monto_pagado,
  metodo_pago,
  referencia = null,
  notas = null
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insertar el pago
    const [resultPago] = await conn.query(
      `
      INSERT INTO cuentas_pagar_pagos (
        id_cuenta_pagar,
        fecha_pago,
        monto_pagado,
        metodo_pago,
        referencia,
        notas
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id_cuenta_pagar, fecha_pago, monto_pagado, metodo_pago, referencia, notas]
    );

    // 2) Recalcular totales de la cuenta
    const [[sumRow]] = await conn.query(
      `
      SELECT
        c.monto_total,
        COALESCE(SUM(p.monto_pagado), 0) AS total_pagado
      FROM cuentas_por_pagar c
      LEFT JOIN cuentas_pagar_pagos p
        ON p.id_cuenta_pagar = c.id_cuenta_pagar
      WHERE c.id_cuenta_pagar = ?
      GROUP BY c.monto_total
      `,
      [id_cuenta_pagar]
    );

    const total_pagado = sumRow.total_pagado;
    const saldo_pendiente = sumRow.monto_total - total_pagado;

    let nuevoEstado = 'pendiente';
    if (saldo_pendiente <= 0) {
      nuevoEstado = 'pagada';
    } else if (total_pagado > 0) {
      nuevoEstado = 'parcial';
    }

    await conn.query(
      `
      UPDATE cuentas_por_pagar
      SET total_pagado = ?, saldo_pendiente = ?, estado = ?
      WHERE id_cuenta_pagar = ?
      `,
      [total_pagado, saldo_pendiente, nuevoEstado, id_cuenta_pagar]
    );

    await conn.commit();
    conn.release();

    return {
      id_pago_cuenta: resultPago.insertId,
      total_pagado,
      saldo_pendiente,
      estado: nuevoEstado
    };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
}

module.exports = {
  listarCuentas,
  obtenerPorId,
  crearManual,
  crearDesdeCompra,
  registrarPago
};
