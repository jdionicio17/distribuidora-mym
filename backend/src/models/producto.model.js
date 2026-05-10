// backend/src/models/producto.model.js
const db = require('../config/db');

// ✅ 1 producto exacto (para scanner / código / búsqueda puntual)
async function buscarPorTermino(termino) {
  const term = String(termino || '').trim();

  const [rows] = await db.query(
    `
    SELECT 
      p.*,
      p.stock_actual AS existencia,
      p.precio_venta_camion AS precio_camion,
      p.precio_venta_preventa AS precio_preventa,
      c.nombre_categoria,
      pr.nombre_proveedor
    FROM productos p
    LEFT JOIN categorias c   ON c.id_categoria   = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor  = p.id_proveedor
    WHERE
      p.codigo_barra     = ?
      OR p.codigo_interno = ?
      OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
    ORDER BY p.nombre_producto ASC
    LIMIT 1
    `,
    [term, term, term]
  );

  return rows[0] || null;
}

// ✅ NUEVO: sugerencias (lista) para autocompletar tipo Google
async function sugerenciasPorTermino(termino, limit = 10) {
  const term = String(termino || '').trim();
  const lim = Math.min(Math.max(Number(limit) || 10, 1), 30); // 1..30

  // Para ranking básico:
  // 1) match exacto por código interno/barra (sale primero)
  // 2) nombre empieza con term
  // 3) nombre contiene term
  const [rows] = await db.query(
    `
    SELECT
      p.id_producto,
      p.codigo_barra,
      p.codigo_interno,
      p.nombre_producto,
      p.unidad_medida,
      p.stock_actual AS existencia,
      p.precio_venta_camion AS precio_camion,
      p.precio_venta_preventa AS precio_preventa,
      c.nombre_categoria,
      pr.nombre_proveedor,
      CASE
        WHEN p.codigo_barra = ? OR p.codigo_interno = ? THEN 0
        WHEN LOWER(p.nombre_producto) LIKE CONCAT(LOWER(?), '%') THEN 1
        WHEN LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%') THEN 2
        ELSE 3
      END AS score
    FROM productos p
    LEFT JOIN categorias c   ON c.id_categoria   = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor  = p.id_proveedor
    WHERE
      p.estado = 'activo'
      AND (
        p.codigo_barra = ?
        OR p.codigo_interno = ?
        OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
      )
    ORDER BY score ASC, p.nombre_producto ASC
    LIMIT ?
    `,
    [term, term, term, term, term, term, term, lim]
  );

  return rows;
}

// Listar productos con filtros (inventario)
async function listarConFiltros({ id_categoria = null, ordenar = 'nombre_asc' }) {
  let orderBy = 'p.nombre_producto ASC';
  switch (ordenar) {
    case 'nombre_desc':       orderBy = 'p.nombre_producto DESC'; break;
    case 'stock_desc':        orderBy = 'p.stock_actual DESC'; break;
    case 'stock_asc':         orderBy = 'p.stock_actual ASC'; break;
    case 'actualizado_desc':  orderBy = 'p.actualizado_en DESC'; break;
    case 'actualizado_asc':   orderBy = 'p.actualizado_en ASC'; break;
  }

  const params = [];
  let where = '1=1';
  if (id_categoria) {
    where += ' AND p.id_categoria = ?';
    params.push(id_categoria);
  }

  const [rows] = await db.query(
    `
    SELECT
      p.*,
      p.stock_actual AS existencia,
      p.precio_venta_camion AS precio_camion,
      p.precio_venta_preventa AS precio_preventa,
      c.nombre_categoria,
      pr.nombre_proveedor
    FROM productos p
    LEFT JOIN categorias c   ON c.id_categoria   = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor  = p.id_proveedor
    WHERE ${where}
    ORDER BY ${orderBy}
    `,
    params
  );

  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await db.query(
    `
    SELECT
      p.*,
      p.stock_actual AS existencia,
      p.precio_venta_camion AS precio_camion,
      p.precio_venta_preventa AS precio_preventa,
      c.nombre_categoria,
      pr.nombre_proveedor
    FROM productos p
    LEFT JOIN categorias c   ON c.id_categoria   = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor  = p.id_proveedor
    WHERE p.id_producto = ?
    `,
    [id]
  );
  return rows[0] || null;
}

async function crear(datos) {
  const [result] = await db.query(
    `
    INSERT INTO productos (
      id_categoria,
      id_proveedor,
      codigo_barra,
      codigo_interno,
      nombre_producto,
      descripcion,
      unidad_medida,
      stock_actual,
      stock_minimo,
      precio_compra,
      precio_venta_cliente,
      precio_venta_camion,
      precio_venta_preventa,
      estado,
      notas
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      datos.id_categoria,
      datos.id_proveedor || null,
      datos.codigo_barra || null,
      datos.codigo_interno || null,
      datos.nombre_producto,
      datos.descripcion || null,
      datos.unidad_medida || 'unidad',
      datos.stock_actual || 0,
      datos.stock_minimo || 0,
      datos.precio_compra || 0,
      datos.precio_venta_cliente || 0,
      datos.precio_venta_camion || 0,
      datos.precio_venta_preventa || 0,
      datos.estado || 'activo',
      datos.notas || null
    ]
  );
  return result.insertId;
}

async function actualizar(id, datos) {
  const [result] = await db.query(
    `
    UPDATE productos
    SET
      id_categoria          = ?,
      id_proveedor          = ?,
      codigo_barra          = ?,
      codigo_interno        = ?,
      nombre_producto       = ?,
      descripcion           = ?,
      unidad_medida         = ?,
      stock_actual          = ?,
      stock_minimo          = ?,
      precio_compra         = ?,
      precio_venta_cliente  = ?,
      precio_venta_camion   = ?,
      precio_venta_preventa = ?,
      estado                = ?,
      notas                 = ?
    WHERE id_producto = ?
    `,
    [
      datos.id_categoria,
      datos.id_proveedor || null,
      datos.codigo_barra || null,
      datos.codigo_interno || null,
      datos.nombre_producto,
      datos.descripcion || null,
      datos.unidad_medida || 'unidad',
      datos.stock_actual || 0,
      datos.stock_minimo || 0,
      datos.precio_compra || 0,
      datos.precio_venta_cliente || 0,
      datos.precio_venta_camion || 0,
      datos.precio_venta_preventa || 0,
      datos.estado || 'activo',
      datos.notas || null,
      id
    ]
  );
  return result.affectedRows > 0;
}

// Intenta DELETE físico. Si hay FK (producto con movimientos en compras/ventas),
// hace soft delete marcando estado='inactivo' para preservar el historial.
async function eliminar(id) {
  try {
    const [result] = await db.query(
      'DELETE FROM productos WHERE id_producto = ?',
      [id]
    );
    if (result.affectedRows === 0) return { ok: false };
    return { ok: true, soft: false };
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      const [up] = await db.query(
        `UPDATE productos SET estado = 'inactivo' WHERE id_producto = ?`,
        [id]
      );
      if (up.affectedRows === 0) return { ok: false };
      return { ok: true, soft: true };
    }
    throw err;
  }
}

module.exports = {
  buscarPorTermino,
  sugerenciasPorTermino, // ✅ NUEVO
  listarConFiltros,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
