// backend/src/models/admin.model.js
const db = require('../config/db');

const columnsCache = new Map();

async function getTableColumns(tableName) {
  if (columnsCache.has(tableName)) return columnsCache.get(tableName);

  const [rows] = await db.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [tableName]
  );

  const set = new Set(rows.map(r => r.COLUMN_NAME));
  columnsCache.set(tableName, set);
  return set;
}

function pickFirstExisting(colsSet, candidates) {
  for (const c of candidates) {
    if (colsSet.has(c)) return c;
  }
  return null;
}

function moneyExpr(alias, colName) {
  if (!colName) return '0';
  return `COALESCE(${alias}.${colName}, 0)`;
}

async function ventasHoy() {
  const [rows] = await db.query(
    `
    SELECT COALESCE(SUM(v.total_neto), 0) AS total
    FROM ventas v
    WHERE DATE(v.fecha_venta) = CURDATE()
    `
  );
  return Number(rows[0]?.total || 0);
}

async function ventasMes() {
  const [rows] = await db.query(
    `
    SELECT COALESCE(SUM(v.total_neto), 0) AS total
    FROM ventas v
    WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
      AND MONTH(v.fecha_venta) = MONTH(CURDATE())
    `
  );
  return Number(rows[0]?.total || 0);
}

async function gananciaEstimadaMes() {
  const [rows] = await db.query(
    `
    SELECT
      COALESCE(SUM(d.subtotal), 0) AS ventas,
      COALESCE(SUM(d.cantidad * p.precio_compra), 0) AS costo,
      COALESCE(SUM(d.subtotal) - SUM(d.cantidad * p.precio_compra), 0) AS ganancia
    FROM ventas_detalle d
    INNER JOIN ventas v ON v.id_venta = d.id_venta
    INNER JOIN productos p ON p.id_producto = d.id_producto
    WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
      AND MONTH(v.fecha_venta) = MONTH(CURDATE())
    `
  );

  return {
    ventas: Number(rows[0]?.ventas || 0),
    costo: Number(rows[0]?.costo || 0),
    ganancia: Number(rows[0]?.ganancia || 0),
  };
}

async function creditosActivosCount() {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS n
    FROM cuentas_por_cobrar c
    WHERE c.saldo_pendiente > 0
      AND (c.estado IN ('pendiente','parcial') OR c.estado IS NULL)
    `
  );
  return Number(rows[0]?.n || 0);
}

async function ultimasVentas(limit = 5) {
  // ✅ CORRECCIÓN: Usamos DATE_FORMAT para formatear fecha_venta
  const [rows] = await db.query(
    `
    SELECT
      v.id_venta,
      DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i:%s') AS fecha_venta,
      COALESCE(cl.nombre_cliente, '—') AS nombre_cliente,
      v.tipo_venta,
      COALESCE(v.total_neto, 0) AS total_neto
    FROM ventas v
    LEFT JOIN clientes cl ON cl.id_cliente = v.id_cliente
    ORDER BY v.fecha_venta DESC, v.id_venta DESC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
}

async function ultimasCompras(limit = 5) {
  const cols = await getTableColumns('compras');

  const totalCol = pickFirstExisting(cols, [
    'total_neto',
    'total_bruto',
    'monto_total',
    'total_compra',
    'total',
  ]);

  const pagadoCol = pickFirstExisting(cols, [
    'pagado',
    'total_pagado'
  ]);

  const estadoCol = pickFirstExisting(cols, ['estado']);

  const totalExpr = moneyExpr('c', totalCol);
  const pagadoExpr = pagadoCol ? moneyExpr('c', pagadoCol) : '0';
  const estadoExpr = estadoCol ? `c.${estadoCol}` : `'—'`;

  // ✅ CORRECCIÓN: Usamos DATE_FORMAT para formatear fecha_compra
  const [rows] = await db.query(
    `
    SELECT
      c.id_compra,
      DATE_FORMAT(c.fecha_compra, '%Y-%m-%d %H:%i:%s') AS fecha_compra,
      COALESCE(p.nombre_proveedor, '—') AS nombre_proveedor,
      ${totalExpr} AS total,
      ${pagadoExpr} AS pagado,
      ${estadoExpr} AS estado
    FROM compras c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    ORDER BY c.fecha_compra DESC, c.id_compra DESC
    LIMIT ?
    `,
    [Number(limit)]
  );

  return rows;
}

async function inventarioBajo(limit = 5) {
  const [rows] = await db.query(
    `
    SELECT
      id_producto,
      nombre_producto,
      stock_actual,
      stock_minimo
    FROM productos
    WHERE estado='activo' AND stock_actual <= stock_minimo
    ORDER BY (stock_minimo - stock_actual) DESC, nombre_producto ASC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
}

async function productosMasVendidos(limit = 5) {
  const [rows] = await db.query(
    `
    SELECT
      d.id_producto,
      d.descripcion_producto AS nombre_producto,
      COALESCE(SUM(d.cantidad), 0) AS cantidad_vendida
    FROM ventas_detalle d
    INNER JOIN ventas v ON v.id_venta = d.id_venta
    WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
      AND MONTH(v.fecha_venta) = MONTH(CURDATE())
    GROUP BY d.id_producto, d.descripcion_producto
    ORDER BY cantidad_vendida DESC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
}

async function productosMenosVendidos(limit = 5) {
  const [rows] = await db.query(
    `
    SELECT
      d.id_producto,
      d.descripcion_producto AS nombre_producto,
      COALESCE(SUM(d.cantidad), 0) AS cantidad_vendida
    FROM ventas_detalle d
    INNER JOIN ventas v ON v.id_venta = d.id_venta
    WHERE YEAR(v.fecha_venta) = YEAR(CURDATE())
      AND MONTH(v.fecha_venta) = MONTH(CURDATE())
    GROUP BY d.id_producto, d.descripcion_producto
    ORDER BY cantidad_vendida ASC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
}

async function creditosProximosCobro(limit = 5) {
  const [rows] = await db.query(
    `
    SELECT
      cl.nombre_cliente,
      COALESCE(c.saldo_pendiente, 0) AS saldo_pendiente,
      c.fecha_vencimiento
    FROM cuentas_por_cobrar c
    INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
    WHERE c.saldo_pendiente > 0
      AND (c.estado IN ('pendiente','parcial') OR c.estado IS NULL)
    ORDER BY
      (CASE WHEN c.fecha_vencimiento IS NULL THEN 1 ELSE 0 END) ASC,
      c.fecha_vencimiento ASC,
      c.id_cuenta_cobrar ASC
    LIMIT ?
    `,
    [Number(limit)]
  );
  return rows;
}

async function ventasPorDiaUltimos7() {
  const [rows] = await db.query(
    `
    SELECT
      DATE(v.fecha_venta) AS dia,
      COALESCE(SUM(v.total_neto), 0) AS total
    FROM ventas v
    WHERE v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(v.fecha_venta)
    ORDER BY dia ASC
    `
  );
  return rows.map(r => ({
    dia: r.dia,
    total: Number(r.total || 0),
  }));
}

async function dashboardResumen() {
  const [
    totalHoy,
    totalMes,
    utilidadMes,
    creditosActivos,
    ventasRecientes,
    comprasRecientes,
    inventarioBajoList,
    topMas,
    topMenos,
    creditosLista,
    ventas7
  ] = await Promise.all([
    ventasHoy(),
    ventasMes(),
    gananciaEstimadaMes(),
    creditosActivosCount(),
    ultimasVentas(5),
    ultimasCompras(5),
    inventarioBajo(5),
    productosMasVendidos(5),
    productosMenosVendidos(5),
    creditosProximosCobro(5),
    ventasPorDiaUltimos7()
  ]);

  return {
    kpis: {
      ventas_hoy: totalHoy,
      ventas_mes: totalMes,
      ganancia_estimada_mes: utilidadMes.ganancia,
      creditos_activos: creditosActivos
    },
    tablas: {
      ultimas_ventas: ventasRecientes,
      ultimas_compras: comprasRecientes,
      inventario_bajo: inventarioBajoList,
      productos_mas_vendidos: topMas,
      productos_menos_vendidos: topMenos,
      creditos_proximos: creditosLista,
      ventas_ultimos_7_dias: ventas7
    }
  };
}

module.exports = {
  dashboardResumen
};