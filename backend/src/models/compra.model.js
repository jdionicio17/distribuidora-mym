// backend/src/models/compra.model.js
const db = require('../config/db');

/**
 * Crea una compra con sus detalles en una transacción.
 * ✅ ACTUALIZA INVENTARIO automáticamente
 */
async function crearCompraConDetalles(datos) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      id_proveedor,
      tipo_compra,
      fecha_compra,
      fecha_vencimiento,
      numero_documento,
      notas,
      items
    } = datos;

    // Totales
    let total_bruto = 0;
    for (const it of items) {
      total_bruto += Number(it.cantidad) * Number(it.precio_unitario);
    }
    const descuento_total = 0;
    const total_neto = total_bruto - descuento_total;

    let total_pagado = 0;
    let saldo_pendiente = 0;
    let estado = 'registrada';

    if (tipo_compra === 'contado') {
      total_pagado = total_neto;
      saldo_pendiente = 0;
      estado = 'pagada';
    } else {
      total_pagado = 0;
      saldo_pendiente = total_neto;
      estado = 'registrada';
    }

    // Insert en compras
    const [resultCompra] = await conn.query(
      `
      INSERT INTO compras (
        id_proveedor,
        id_usuario,
        numero_documento,
        tipo_compra,
        fecha_compra,
        fecha_vencimiento,
        total_bruto,
        descuento_total,
        total_neto,
        total_pagado,
        saldo_pendiente,
        estado,
        notas
      ) VALUES (?, NULL, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_proveedor,
        numero_documento,
        tipo_compra,
        fecha_vencimiento,
        total_bruto,
        descuento_total,
        total_neto,
        total_pagado,
        saldo_pendiente,
        estado,
        notas
      ]
    );

    const id_compra = resultCompra.insertId;

    // Insert en compras_detalle + Actualizar inventario
    const sqlDetalle = `
      INSERT INTO compras_detalle (
        id_compra,
        id_producto,
        descripcion_producto,
        cantidad,
        precio_unitario,
        subtotal
      ) VALUES (?, ?, NULL, ?, ?, ?)
    `;

    for (const it of items) {
      const cantidad = Number(it.cantidad);
      const precio = Number(it.precio_unitario);
      const subtotal = cantidad * precio;

      // 1. Insertar detalle
      await conn.query(sqlDetalle, [
        id_compra,
        it.id_producto,
        cantidad,
        precio,
        subtotal
      ]);

      // ✅ 2. ACTUALIZAR INVENTARIO DEL PRODUCTO
      await conn.query(
        `
        UPDATE productos 
        SET 
          stock_actual = stock_actual + ?,
          precio_compra = ?
        WHERE id_producto = ?
        `,
        [cantidad, precio, it.id_producto]
      );
    }

    await conn.commit();
    return id_compra;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Lista compras para la tabla de "Compras recientes".
 */
async function listarCompras() {
  const [rows] = await db.query(
    `
    SELECT
      c.id_compra,
      c.id_proveedor,
      p.nombre_proveedor,
      c.tipo_compra,
      DATE_FORMAT(c.fecha_compra, '%Y-%m-%d %H:%i:%s') AS fecha_compra,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en,
      c.total_bruto,
      c.descuento_total,
      c.total_neto,
      c.total_pagado,
      c.saldo_pendiente,
      c.estado,
      c.numero_documento,
      c.notas
    FROM compras c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    ORDER BY c.id_compra DESC
    `
  );
  return rows;
}

/**
 * Compra + detalles
 */
async function obtenerCompraConDetalles(id_compra) {
  const [rowsCompra] = await db.query(
    `
    SELECT
      c.id_compra,
      c.id_proveedor,
      p.nombre_proveedor,
      c.tipo_compra,
      DATE_FORMAT(c.fecha_compra, '%Y-%m-%d %H:%i:%s') AS fecha_compra,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en,
      c.fecha_vencimiento,
      c.total_bruto,
      c.descuento_total,
      c.total_neto,
      c.total_pagado,
      c.saldo_pendiente,
      c.estado,
      c.numero_documento,
      c.notas
    FROM compras c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    WHERE c.id_compra = ?
    LIMIT 1
    `,
    [id_compra]
  );

  if (rowsCompra.length === 0) return null;

  const [rowsDetalle] = await db.query(
    `
    SELECT
      cd.id_detalle_compra,
      cd.id_compra,
      cd.id_producto,
      pr.nombre_producto,
      cd.descripcion_producto,
      cd.cantidad,
      cd.precio_unitario,
      cd.subtotal,
      DATE_FORMAT(cd.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM compras_detalle cd
    LEFT JOIN productos pr ON pr.id_producto = cd.id_producto
    WHERE cd.id_compra = ?
    ORDER BY cd.id_detalle_compra ASC
    `,
    [id_compra]
  );

  return {
    compra: rowsCompra[0],
    detalles: rowsDetalle
  };
}

module.exports = {
  crearCompraConDetalles,
  listarCompras,
  obtenerCompraConDetalles
};