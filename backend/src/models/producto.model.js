const db = require('../config/db');

const SELECT_PRODUCTOS = `
  SELECT
    p.id_producto,
    p.id_categoria,
    p.id_proveedor,
    p.codigo_barra,
    p.codigo_interno,
    p.nombre_producto,
    p.descripcion,
    p.unidad_medida,
    p.stock_actual,
    p.stock_actual AS existencia,
    p.stock_minimo,
    p.precio_compra,
    p.precio_venta_cliente,
    p.precio_venta_cliente AS precio_cliente,
    p.precio_venta_camion,
    p.precio_venta_camion AS precio_camion,
    p.precio_venta_preventa,
    p.precio_venta_preventa AS precio_preventa,
    p.estado,
    p.notas,
    p.creado_en,
    p.actualizado_en,
    c.nombre_categoria,
    pr.nombre_proveedor
  FROM productos p
  LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
  LEFT JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
`;

async function buscarPorTermino(termino) {
  const term = String(termino || '').trim();

  const [rows] = await db.query(
    `
    ${SELECT_PRODUCTOS}
    WHERE
      p.codigo_barra = ?
      OR p.codigo_interno = ?
      OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
    ORDER BY p.nombre_producto ASC
    LIMIT 1
    `,
    [term, term, term]
  );

  return rows[0] || null;
}

async function sugerenciasPorTermino(termino, limit = 10) {
  const term = String(termino || '').trim();
  const lim = Math.min(Math.max(Number(limit) || 10, 1), 30);

  const [rows] = await db.query(
    `
    ${SELECT_PRODUCTOS}
    WHERE
      p.estado = 'activo'
      AND (
        p.codigo_barra = ?
        OR p.codigo_interno = ?
        OR LOWER(p.nombre_producto) LIKE CONCAT('%', LOWER(?), '%')
      )
    ORDER BY
      CASE
        WHEN p.codigo_barra = ? OR p.codigo_interno = ? THEN 0
        WHEN LOWER(p.nombre_producto) LIKE CONCAT(LOWER(?), '%') THEN 1
        ELSE 2
      END,
      p.nombre_producto ASC
    LIMIT ?
    `,
    [term, term, term, term, term, term, lim]
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
      orderBy = 'p.actualizado_en DESC';
      break;
    case 'actualizado_asc':
      orderBy = 'p.actualizado_en ASC';
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
    ${SELECT_PRODUCTOS}
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
    ${SELECT_PRODUCTOS}
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
      id_categoria = ?,
      id_proveedor = ?,
      codigo_barra = ?,
      codigo_interno = ?,
      nombre_producto = ?,
      descripcion = ?,
      unidad_medida = ?,
      stock_actual = ?,
      stock_minimo = ?,
      precio_compra = ?,
      precio_venta_cliente = ?,
      precio_venta_camion = ?,
      precio_venta_preventa = ?,
      estado = ?,
      notas = ?
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