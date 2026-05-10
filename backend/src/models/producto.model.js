const db = require('../config/db');

function mapProductoSelect() {
  return `
    SELECT 
      p.id_producto,
      p.codigo_producto,
      p.codigo_producto AS codigo_interno,
      p.codigo_producto AS codigo_barra,
      p.nombre_producto,
      p.descripcion,
      p.id_categoria,
      p.id_proveedor,
      p.precio_compra,
      p.precio_venta,
      p.precio_venta AS precio_venta_cliente,
      p.precio_venta AS precio_venta_camion,
      p.precio_mayoreo AS precio_venta_preventa,
      p.stock_actual,
      p.stock_actual AS existencia,
      p.stock_minimo,
      p.unidad_medida,
      p.estado,
      p.creado_en,
      p.creado_en AS actualizado_en,
      c.nombre_categoria,
      pr.nombre_proveedor
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
    LEFT JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
  `;
}

async function buscarPorTermino(termino) {
  const term = String(termino || '').trim();

  const [rows] = await db.query(
    `
    ${mapProductoSelect()}
    WHERE
      p.codigo_producto = ?
      OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
    ORDER BY p.nombre_producto ASC
    LIMIT 1
    `,
    [term, term]
  );

  return rows[0] || null;
}

async function sugerenciasPorTermino(termino, limit = 10) {
  const term = String(termino || '').trim();
  const lim = Math.min(Math.max(Number(limit) || 10, 1), 30);

  const [rows] = await db.query(
    `
    ${mapProductoSelect()}
    WHERE
      p.estado = 'activo'
      AND (
        p.codigo_producto = ?
        OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
      )
    ORDER BY
      CASE
        WHEN p.codigo_producto = ? THEN 0
        WHEN LOWER(p.nombre_producto) LIKE CONCAT(LOWER(?), '%') THEN 1
        ELSE 2
      END,
      p.nombre_producto ASC
    LIMIT ?
    `,
    [term, term, term, term, lim]
  );

  return rows;
}

async function listarConFiltros({ id_categoria = null, ordenar = 'nombre_asc' }) {
  let orderBy = 'p.nombre_producto ASC';

  switch (ordenar) {
    case 'nombre_desc':
      orderBy = 'p.nombre_producto DESC';
      break;
    case 'stock_desc':
      orderBy = 'p.stock_actual DESC';
      break;
    case 'stock_asc':
      orderBy = 'p.stock_actual ASC';
      break;
    case 'actualizado_desc':
      orderBy = 'p.creado_en DESC';
      break;
    case 'actualizado_asc':
      orderBy = 'p.creado_en ASC';
      break;
  }

  const params = [];
  let where = '1=1';

  if (id_categoria) {
    where += ' AND p.id_categoria = ?';
    params.push(id_categoria);
  }

  const [rows] = await db.query(
    `
    ${mapProductoSelect()}
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
    ${mapProductoSelect()}
    WHERE p.id_producto = ?
    `,
    [id]
  );

  return rows[0] || null;
}

async function crear(datos) {
  const codigo = datos.codigo_interno || datos.codigo_barra || datos.codigo_producto;

  const [result] = await db.query(
    `
    INSERT INTO productos (
      codigo_producto,
      nombre_producto,
      descripcion,
      id_categoria,
      id_proveedor,
      precio_compra,
      precio_venta,
      precio_mayoreo,
      stock_actual,
      stock_minimo,
      unidad_medida,
      estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      codigo,
      datos.nombre_producto,
      datos.descripcion || null,
      datos.id_categoria || null,
      datos.id_proveedor || null,
      datos.precio_compra || 0,
      datos.precio_venta_cliente || datos.precio_venta || 0,
      datos.precio_venta_preventa || datos.precio_mayoreo || 0,
      datos.stock_actual || 0,
      datos.stock_minimo || 0,
      datos.unidad_medida || 'unidad',
      datos.estado || 'activo'
    ]
  );

  return result.insertId;
}

async function actualizar(id, datos) {
  const codigo = datos.codigo_interno || datos.codigo_barra || datos.codigo_producto;

  const [result] = await db.query(
    `
    UPDATE productos
    SET
      codigo_producto = ?,
      nombre_producto = ?,
      descripcion = ?,
      id_categoria = ?,
      id_proveedor = ?,
      precio_compra = ?,
      precio_venta = ?,
      precio_mayoreo = ?,
      stock_actual = ?,
      stock_minimo = ?,
      unidad_medida = ?,
      estado = ?
    WHERE id_producto = ?
    `,
    [
      codigo,
      datos.nombre_producto,
      datos.descripcion || null,
      datos.id_categoria || null,
      datos.id_proveedor || null,
      datos.precio_compra || 0,
      datos.precio_venta_cliente || datos.precio_venta || 0,
      datos.precio_venta_preventa || datos.precio_mayoreo || 0,
      datos.stock_actual || 0,
      datos.stock_minimo || 0,
      datos.unidad_medida || 'unidad',
      datos.estado || 'activo',
      id
    ]
  );

  return result.affectedRows > 0;
}

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
  sugerenciasPorTermino,
  listarConFiltros,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};