// backend/src/models/venta.model.js
const db = require('../config/db');

async function listarVentas() {
  const [rows] = await db.query(
    `
    SELECT
      v.id_venta,
      v.id_cliente,
      c.nombre_cliente,
      v.tipo_venta,
      v.total_neto,
      v.estado,
      v.creado_en
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    ORDER BY v.id_venta DESC
    `
  );
  return rows;
}

async function obtenerVentaBasica(id_venta) {
  const [rows] = await db.query(
    `
    SELECT
      v.id_venta,
      v.id_cliente,
      c.nombre_cliente,
      v.tipo_venta,
      v.total_bruto,
      v.descuento_total,
      v.total_neto,
      v.efectivo_recibido,
      v.cambio,
      v.estado,
      v.creado_en
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    WHERE v.id_venta = ?
    `,
    [id_venta]
  );
  return rows[0] || null;
}

async function crearVentaConDetalles({
  id_cliente,
  tipo_venta,
  fecha_venta,
  total_bruto,
  descuento_total,
  total_neto,
  efectivo_recibido,
  cambio,
  items
}) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Insertar venta
    const [resVenta] = await conn.query(
      `
      INSERT INTO ventas (
        id_cliente,
        tipo_venta,
        fecha_venta,
        total_bruto,
        descuento_total,
        total_neto,
        efectivo_recibido,
        cambio,
        estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_cliente || null,
        tipo_venta,
        fecha_venta,
        total_bruto,
        descuento_total,
        total_neto,
        efectivo_recibido,
        cambio,
        (tipo_venta === 'credito') ? 'pendiente' : 'pagada'
      ]
    );

    const id_venta = resVenta.insertId;

    // 2) Por cada item: validar stock y descontar
    for (const it of items) {
      const id_producto = Number(it.id_producto);
      const cantidad = Number(it.cantidad);
      const precio_unitario = Number(it.precio_unitario);
      const tipo_precio = it.tipo_precio === 'preventa' ? 'preventa' : 'camion';
      const subtotal = cantidad * precio_unitario;

      // Bloquear fila de producto
      const [[prod]] = await conn.query(
        `SELECT stock_actual, nombre_producto FROM productos WHERE id_producto = ? FOR UPDATE`,
        [id_producto]
      );

      if (!prod) {
        throw new Error(`Producto no existe (ID ${id_producto}).`);
      }

      const stock = Number(prod.stock_actual || 0);
      if (cantidad > stock + 0.000001) {
        throw new Error(`Existencia insuficiente para "${prod.nombre_producto}". Disponible: ${stock}`);
      }

      // Insert detalle
      await conn.query(
        `
        INSERT INTO ventas_detalle (
          id_venta,
          id_producto,
          descripcion_producto,
          cantidad,
          precio_unitario,
          tipo_precio,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [id_venta, id_producto, prod.nombre_producto, cantidad, precio_unitario, tipo_precio, subtotal]
      );

      // Descontar inventario
      await conn.query(
        `UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?`,
        [cantidad, id_producto]
      );
    }

    await conn.commit();
    conn.release();
    return id_venta;
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
}

module.exports = {
  listarVentas,
  obtenerVentaBasica,
  crearVentaConDetalles
};