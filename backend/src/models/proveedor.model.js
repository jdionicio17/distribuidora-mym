const db = require('../config/db');

// =====================================================
// OBTENER TODOS LOS PROVEEDORES
// =====================================================
async function getAllProveedores() {
  const [rows] = await db.query(`
        SELECT
            id_proveedor,
            nombre_proveedor,
            nombre_contacto,
            telefono,
            telefono_alt,
            email,
            nit,
            ciudad,
            departamento,
            direccion,
            estado,
            notas,
            creado_en,
            actualizado_en
        FROM proveedores
        ORDER BY nombre_proveedor ASC
    `);

  return rows;
}


// =====================================================
// OBTENER PROVEEDOR POR ID
// =====================================================
async function getProveedorById(idProveedor) {
  const [rows] = await db.query(
    `
        SELECT
            id_proveedor,
            nombre_proveedor,
            nombre_contacto,
            telefono,
            telefono_alt,
            email,
            nit,
            ciudad,
            departamento,
            direccion,
            estado,
            notas,
            creado_en,
            actualizado_en
        FROM proveedores
        WHERE id_proveedor = ?
        LIMIT 1
        `,
    [idProveedor]
  );

  return rows[0] || null;
}


// =====================================================
// BUSCAR CORREO O NIT DUPLICADO
// =====================================================
async function buscarDuplicado({
  email,
  nit,
  excluirId = null
}) {
  const condiciones = [];
  const parametros = [];

  if (email) {
    condiciones.push('email = ?');
    parametros.push(email);
  }

  if (nit) {
    condiciones.push('nit = ?');
    parametros.push(nit);
  }

  if (condiciones.length === 0) {
    return null;
  }

  let sql = `
        SELECT
            id_proveedor,
            nombre_proveedor,
            email,
            nit
        FROM proveedores
        WHERE (${condiciones.join(' OR ')})
    `;

  if (excluirId) {
    sql += ' AND id_proveedor <> ?';
    parametros.push(excluirId);
  }

  sql += ' LIMIT 1';

  const [rows] = await db.query(sql, parametros);

  return rows[0] || null;
}


// =====================================================
// CREAR PROVEEDOR
// =====================================================
async function createProveedor(data) {
  const [result] = await db.query(
    `
        INSERT INTO proveedores (
            nombre_proveedor,
            nombre_contacto,
            telefono,
            telefono_alt,
            email,
            nit,
            ciudad,
            departamento,
            direccion,
            estado,
            notas
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
    [
      data.nombre_proveedor,
      data.nombre_contacto,
      data.telefono,
      data.telefono_alt,
      data.email,
      data.nit,
      data.ciudad,
      data.departamento,
      data.direccion,
      data.estado,
      data.notas
    ]
  );

  return getProveedorById(result.insertId);
}


// =====================================================
// ACTUALIZAR PROVEEDOR
// =====================================================
async function updateProveedor(idProveedor, data) {
  await db.query(
    `
        UPDATE proveedores
        SET
            nombre_proveedor = ?,
            nombre_contacto = ?,
            telefono = ?,
            telefono_alt = ?,
            email = ?,
            nit = ?,
            ciudad = ?,
            departamento = ?,
            direccion = ?,
            estado = ?,
            notas = ?,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id_proveedor = ?
        `,
    [
      data.nombre_proveedor,
      data.nombre_contacto,
      data.telefono,
      data.telefono_alt,
      data.email,
      data.nit,
      data.ciudad,
      data.departamento,
      data.direccion,
      data.estado,
      data.notas,
      idProveedor
    ]
  );

  return getProveedorById(idProveedor);
}


// =====================================================
// ELIMINAR PROVEEDOR
// =====================================================
async function deleteProveedor(idProveedor) {
  const [result] = await db.query(
    `
        DELETE FROM proveedores
        WHERE id_proveedor = ?
        `,
    [idProveedor]
  );

  return result.affectedRows > 0;
}


module.exports = {
  getAllProveedores,
  getProveedorById,
  buscarDuplicado,
  createProveedor,
  updateProveedor,
  deleteProveedor
};