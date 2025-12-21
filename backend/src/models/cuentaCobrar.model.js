// backend/src/models/cuentaCobrar.model.js
const db = require('../config/db');

async function listarCuentas() {
  const [rows] = await db.query(
    `
    SELECT
      c.id_cuenta_cobrar,
      c.id_venta,
      c.id_cliente,
      cl.nombre_cliente,
      cl.nit,
      c.descripcion,
      c.monto_total,
      c.total_pagado,
      c.saldo_pendiente,
      c.fecha_registro,
      c.fecha_vencimiento,
      c.estado,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM cuentas_por_cobrar c
    INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
    ORDER BY c.fecha_registro DESC, c.id_cuenta_cobrar DESC
    `
  );
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await db.query(
    `
    SELECT
      c.id_cuenta_cobrar,
      c.id_venta,
      c.id_cliente,
      cl.nombre_cliente,
      cl.nit,
      c.descripcion,
      c.monto_total,
      c.total_pagado,
      c.saldo_pendiente,
      c.fecha_registro,
      c.fecha_vencimiento,
      c.estado,
      c.notas,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM cuentas_por_cobrar c
    INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
    WHERE c.id_cuenta_cobrar = ?
    `,
    [id]
  );

  if (rows.length === 0) return null;

  // Obtener pagos realizados
  const [pagos] = await db.query(
    `
    SELECT
      id_pago_cxc,
      fecha_pago,
      monto_pagado,
      metodo_pago,
      referencia,
      notas,
      DATE_FORMAT(creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM cuentas_cobrar_pagos
    WHERE id_cuenta_cobrar = ?
    ORDER BY fecha_pago DESC, id_pago_cxc DESC
    `,
    [id]
  );

  return { ...rows[0], pagos };
}

async function crearDesdeVenta({
  id_venta,
  id_cliente,
  descripcion,
  monto_total,
  fecha_venta,
  fecha_vencimiento,
  notas = null
}) {
  const [result] = await db.query(
    `
    INSERT INTO cuentas_por_cobrar (
      id_venta,
      id_cliente,
      descripcion,
      monto_total,
      total_pagado,
      saldo_pendiente,
      fecha_registro,
      fecha_vencimiento,
      estado,
      notas
    )
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'pendiente', ?)
    `,
    [
      id_venta,
      id_cliente,
      descripcion,
      monto_total,
      monto_total,
      fecha_venta,
      fecha_vencimiento,
      notas
    ]
  );

  return result.insertId;
}

async function registrarPago({
  id_cuenta_cobrar,
  fecha_pago,
  monto_pagado,
  metodo_pago,
  referencia = null,
  notas = null
}) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Obtener datos de la cuenta (incluyendo id_venta)
    const [cxc] = await conn.query(
      `
      SELECT 
        id_cuenta_cobrar,
        id_venta,
        id_cliente,
        monto_total,
        total_pagado,
        saldo_pendiente,
        estado
      FROM cuentas_por_cobrar
      WHERE id_cuenta_cobrar = ?
      `,
      [id_cuenta_cobrar]
    );

    if (cxc.length === 0) {
      throw new Error('Cuenta por cobrar no encontrada');
    }

    const cuenta = cxc[0];
    const saldoActual = Number(cuenta.saldo_pendiente);

    if (monto_pagado > saldoActual + 0.01) {
      throw new Error(
        `El monto a pagar (${monto_pagado.toFixed(2)}) excede el saldo pendiente (${saldoActual.toFixed(2)})`
      );
    }

    // 2. Insertar registro de pago
    const [pagoResult] = await conn.query(
      `
      INSERT INTO cuentas_cobrar_pagos (
        id_cuenta_cobrar,
        fecha_pago,
        monto_pagado,
        metodo_pago,
        referencia,
        notas
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id_cuenta_cobrar, fecha_pago, monto_pagado, metodo_pago, referencia, notas]
    );

    // 3. Actualizar cuenta por cobrar
    const nuevoTotalPagado = Number(cuenta.total_pagado) + Number(monto_pagado);
    const nuevoSaldo = Number(cuenta.monto_total) - nuevoTotalPagado;

    let nuevoEstado = 'pendiente';
    if (Math.abs(nuevoSaldo) < 0.01) {
      nuevoEstado = 'pagada';
    } else if (nuevoTotalPagado > 0.01) {
      nuevoEstado = 'parcial';
    }

    await conn.query(
      `
      UPDATE cuentas_por_cobrar
      SET 
        total_pagado = ?,
        saldo_pendiente = ?,
        estado = ?
      WHERE id_cuenta_cobrar = ?
      `,
      [nuevoTotalPagado, nuevoSaldo, nuevoEstado, id_cuenta_cobrar]
    );

    // 4. ✅ Actualizar estado de la venta (SI EXISTE id_venta)
    if (cuenta.id_venta) {
      let estadoVenta = 'pendiente';
      if (Math.abs(nuevoSaldo) < 0.01) {
        estadoVenta = 'pagada';
      } else if (nuevoTotalPagado > 0.01) {
        estadoVenta = 'parcial';
      }

      await conn.query(
        `
        UPDATE ventas
        SET estado = ?
        WHERE id_venta = ?
        `,
        [estadoVenta, cuenta.id_venta]
      );
    }

    await conn.commit();

    return {
      id_pago_cxc: pagoResult.insertId,
      nuevo_estado: nuevoEstado,
      nuevo_saldo: nuevoSaldo,
      nuevo_total_pagado: nuevoTotalPagado
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  listarCuentas,
  obtenerPorId,
  crearDesdeVenta,
  registrarPago
};
