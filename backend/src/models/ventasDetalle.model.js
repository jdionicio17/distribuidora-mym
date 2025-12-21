// backend/src/models/ventasDetalle.model.js
const db = require('../config/db');

function buildWhere({ id_venta, cliente, dia, mes }, params) {
  let where = '1=1';

  // Buscar por ID exacto
  if (id_venta) {
    where += ' AND v.id_venta = ?';
    params.push(Number(id_venta));
  }

  // Buscar por nombre cliente (LIKE)
  if (cliente && String(cliente).trim()) {
    where += ' AND LOWER(COALESCE(c.nombre_cliente, "")) LIKE CONCAT("%", LOWER(?), "%")';
    params.push(String(cliente).trim());
  }

  // Buscar por día exacto (YYYY-MM-DD)
  if (dia) {
    where += ' AND DATE(v.fecha_venta) = ?';
    params.push(String(dia).slice(0, 10));
  }

  // Buscar por mes (YYYY-MM)
  if (mes) {
    // Mes llega como "2025-12"
    where += ' AND DATE_FORMAT(v.fecha_venta, "%Y-%m") = ?';
    params.push(String(mes).slice(0, 7));
  }

  return where;
}

async function listarVentasDetalle({ id_venta = null, cliente = null, dia = null, mes = null, limit = 50 }) {
  const params = [];
  const where = buildWhere({ id_venta, cliente, dia, mes }, params);

  const lim = Math.max(1, Math.min(Number(limit) || 50, 200));

  const [rows] = await db.query(
    `
    SELECT
      v.id_venta,
      DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_venta,
      v.id_cliente,
      COALESCE(c.nombre_cliente, 'Venta sin cliente') AS nombre_cliente,
      v.tipo_venta,
      v.total_neto,
      v.estado,
      DATE_FORMAT(v.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    WHERE ${where}
    ORDER BY v.id_venta DESC
    LIMIT ?
    `,
    [...params, lim]
  );

  return rows;
}

async function obtenerVentaHeader(id_venta) {
  const [rows] = await db.query(
    `
    SELECT
      v.id_venta,
      DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_venta,
      v.id_cliente,
      COALESCE(c.nombre_cliente, 'Venta sin cliente') AS nombre_cliente,
      v.tipo_venta,
      v.total_bruto,
      v.descuento_total,
      v.total_neto,
      v.efectivo_recibido,
      v.cambio,
      v.estado,
      DATE_FORMAT(v.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM ventas v
    LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
    WHERE v.id_venta = ?
    `,
    [Number(id_venta)]
  );

  return rows[0] || null;
}

async function obtenerVentaItems(id_venta) {
  const [rows] = await db.query(
    `
    SELECT
      d.id_detalle_venta,
      d.id_producto,
      d.descripcion_producto,
      d.cantidad,
      d.precio_unitario,
      d.tipo_precio,
      d.subtotal
    FROM ventas_detalle d
    WHERE d.id_venta = ?
    ORDER BY d.id_detalle_venta ASC
    `,
    [Number(id_venta)]
  );

  return rows;
}

async function obtenerVentaCompleta(id_venta) {
  const header = await obtenerVentaHeader(id_venta);
  if (!header) return null;

  const items = await obtenerVentaItems(id_venta);

  return { header, items };
}

module.exports = {
  listarVentasDetalle,
  obtenerVentaCompleta
};