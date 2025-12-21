// backend/src/models/reporte.model.js
const db = require('../config/db');

// Para campos DATE o DATETIME: filtramos por DATE(campo)
function buildDateWhereDate(field, desde, hasta, params) {
  let where = '1=1';
  if (desde) { where += ` AND DATE(${field}) >= ?`; params.push(desde); }
  if (hasta) { where += ` AND DATE(${field}) <= ?`; params.push(hasta); }
  return where;
}

async function ventasAgrupadas({ desde = null, hasta = null, granularidad = 'dia' }) {
  const params = [];
  const where = buildDateWhereDate('v.creado_en', desde, hasta, params);

  const g = String(granularidad || 'dia').toLowerCase();

  // Default: DIA
  let keyExpr = "DATE(v.creado_en)";
  let innerOrdenExpr = "MIN(DATE(v.creado_en))";
  let outerPeriodoExpr = "DATE_FORMAT(t.periodo_key, '%d/%m/%Y')";

  // SEMANA (FIX: no usar v afuera, usar t.periodo_orden)
  if (g === 'semana') {
    keyExpr = "YEARWEEK(v.creado_en, 1)";
    innerOrdenExpr = "MIN(DATE(v.creado_en))";
    outerPeriodoExpr = "CONCAT('Semana ', WEEK(t.periodo_orden, 1), ' - ', YEAR(t.periodo_orden))";
  }

  // MES (mejor usar periodo_orden para mostrar el nombre del mes)
  if (g === 'mes') {
    keyExpr = "DATE_FORMAT(v.creado_en, '%Y-%m')";
    innerOrdenExpr = "MIN(DATE_FORMAT(v.creado_en, '%Y-%m-01'))";
    outerPeriodoExpr = "DATE_FORMAT(t.periodo_orden, '%M %Y')";
  }

  const [rows] = await db.query(
    `
    SELECT
      ${outerPeriodoExpr} AS periodo,
      t.cantidad_ventas,
      t.total_neto,
      t.total_contado,
      t.total_credito
    FROM (
      SELECT
        ${keyExpr} AS periodo_key,
        ${innerOrdenExpr} AS periodo_orden,
        COUNT(*) AS cantidad_ventas,
        COALESCE(SUM(v.total_neto), 0) AS total_neto,
        COALESCE(SUM(CASE WHEN v.tipo_venta='contado' THEN v.total_neto ELSE 0 END), 0) AS total_contado,
        COALESCE(SUM(CASE WHEN v.tipo_venta='credito' THEN v.total_neto ELSE 0 END), 0) AS total_credito
      FROM ventas v
      WHERE ${where}
      GROUP BY periodo_key
    ) t
    ORDER BY t.periodo_orden ASC
    `,
    params
  );

  return rows.map(r => ({
    periodo: r.periodo,
    cantidad_ventas: Number(r.cantidad_ventas || 0),
    total_neto: Number(r.total_neto || 0),
    total_contado: Number(r.total_contado || 0),
    total_credito: Number(r.total_credito || 0),
  }));
}

async function productosVendidosRanking({ desde = null, hasta = null, limit = 10, orden = 'DESC' }) {
  const params = [];
  const where = buildDateWhereDate('v.creado_en', desde, hasta, params);

  const dir = String(orden).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) && lim > 0 ? lim : 10;

  const [rows] = await db.query(
    `
    SELECT
      d.id_producto,
      d.descripcion_producto AS nombre_producto,
      COALESCE(SUM(d.cantidad), 0) AS cantidad_vendida,
      COALESCE(SUM(d.subtotal), 0) AS monto_vendido
    FROM ventas_detalle d
    INNER JOIN ventas v ON v.id_venta = d.id_venta
    WHERE ${where}
    GROUP BY d.id_producto, d.descripcion_producto
    ORDER BY cantidad_vendida ${dir}, monto_vendido ${dir}
    LIMIT ?
    `,
    [...params, safeLimit]
  );

  return rows;
}

async function cxcDetalle({ desde = null, hasta = null, estado = null }) {
  const params = [];
  let where = buildDateWhereDate('c.fecha_registro', desde, hasta, params);

  if (estado) { where += ' AND c.estado = ?'; params.push(estado); }

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
      CASE
        WHEN c.estado IN ('pendiente','parcial')
         AND c.fecha_vencimiento IS NOT NULL
         AND c.fecha_vencimiento < CURDATE()
         AND c.saldo_pendiente > 0
        THEN 1 ELSE 0
      END AS vencida,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM cuentas_por_cobrar c
    INNER JOIN clientes cl ON cl.id_cliente = c.id_cliente
    WHERE ${where}
    ORDER BY c.fecha_registro DESC, c.id_cuenta_cobrar DESC
    `,
    params
  );

  const resumen = rows.reduce((acc, r) => {
    acc.monto_total += Number(r.monto_total || 0);
    acc.total_pagado += Number(r.total_pagado || 0);
    acc.saldo_pendiente += Number(r.saldo_pendiente || 0);
    acc.vencidas += Number(r.vencida || 0);
    return acc;
  }, { monto_total: 0, total_pagado: 0, saldo_pendiente: 0, vencidas: 0 });

  return { resumen, cuentas: rows };
}

async function cxpDetalle({ desde = null, hasta = null, estado = null }) {
  const params = [];
  let where = buildDateWhereDate('c.fecha_registro', desde, hasta, params);

  if (estado) { where += ' AND c.estado = ?'; params.push(estado); }

  const [rows] = await db.query(
    `
    SELECT
      c.id_cuenta_pagar,
      c.id_compra,
      c.id_proveedor,
      p.nombre_proveedor,
      c.descripcion,
      c.monto_total,
      c.total_pagado,
      c.saldo_pendiente,
      c.fecha_registro,
      c.fecha_vencimiento,
      c.estado,
      CASE
        WHEN c.estado IN ('pendiente','parcial')
         AND c.fecha_vencimiento IS NOT NULL
         AND c.fecha_vencimiento < CURDATE()
         AND c.saldo_pendiente > 0
        THEN 1 ELSE 0
      END AS vencida,
      DATE_FORMAT(c.creado_en, '%Y-%m-%d %H:%i:%s') AS creado_en
    FROM cuentas_por_pagar c
    LEFT JOIN proveedores p ON p.id_proveedor = c.id_proveedor
    WHERE ${where}
    ORDER BY c.fecha_registro DESC, c.id_cuenta_pagar DESC
    `,
    params
  );

  const resumen = rows.reduce((acc, r) => {
    acc.monto_total += Number(r.monto_total || 0);
    acc.total_pagado += Number(r.total_pagado || 0);
    acc.saldo_pendiente += Number(r.saldo_pendiente || 0);
    acc.vencidas += Number(r.vencida || 0);
    return acc;
  }, { monto_total: 0, total_pagado: 0, saldo_pendiente: 0, vencidas: 0 });

  return { resumen, cuentas: rows };
}

async function resumenCaja({ desde = null, hasta = null }) {
  const params = [];
  let where = '1=1';
  if (desde) { where += ' AND DATE(cm.fecha_mov) >= ?'; params.push(desde); }
  if (hasta) { where += ' AND DATE(cm.fecha_mov) <= ?'; params.push(hasta); }

  const [rows] = await db.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN cm.tipo='ingreso' THEN cm.monto ELSE 0 END), 0) AS ingresos,
      COALESCE(SUM(CASE WHEN cm.tipo='egreso' THEN cm.monto ELSE 0 END), 0) AS egresos
    FROM caja_movimientos cm
    WHERE ${where}
    `,
    params
  );

  const ingresos = Number(rows[0]?.ingresos || 0);
  const egresos = Number(rows[0]?.egresos || 0);

  return { ingresos, egresos, saldo_en_caja: ingresos - egresos };
}

async function inventarioBajoStock() {
  const [rows] = await db.query(
    `
    SELECT
      id_producto,
      nombre_producto,
      stock_actual,
      stock_minimo,
      (stock_minimo - stock_actual) AS faltante
    FROM productos
    WHERE estado='activo' AND stock_actual <= stock_minimo
    ORDER BY faltante DESC, nombre_producto ASC
    `
  );
  return rows;
}

async function utilidadEstimada({ desde = null, hasta = null }) {
  const params = [];
  const where = buildDateWhereDate('v.creado_en', desde, hasta, params);

  const [rows] = await db.query(
    `
    SELECT
      COALESCE(SUM(d.subtotal), 0) AS ventas,
      COALESCE(SUM(d.cantidad * p.precio_compra), 0) AS costo_estimado,
      COALESCE(SUM(d.subtotal) - SUM(d.cantidad * p.precio_compra), 0) AS utilidad_estimada
    FROM ventas_detalle d
    INNER JOIN ventas v ON v.id_venta = d.id_venta
    INNER JOIN productos p ON p.id_producto = d.id_producto
    WHERE ${where}
    `,
    params
  );

  return {
    ventas: Number(rows[0]?.ventas || 0),
    costo_estimado: Number(rows[0]?.costo_estimado || 0),
    utilidad_estimada: Number(rows[0]?.utilidad_estimada || 0),
  };
}

// (OPCIONAL) Debug: ver BD actual y si existe creado_en
async function debugDb() {
  const [bd] = await db.query("SELECT DATABASE() AS bd_actual");
  const [cols] = await db.query("SHOW COLUMNS FROM ventas");
  return {
    bd_actual: bd?.[0]?.bd_actual || null,
    columnas_ventas: cols.map(c => c.Field),
  };
}

module.exports = {
  ventasAgrupadas,
  productosVendidosRanking,
  cxcDetalle,
  cxpDetalle,
  resumenCaja,
  inventarioBajoStock,
  utilidadEstimada,
  debugDb, // opcional
};
