// backend/src/models/proveedor.model.js
const db = require('../config/db');

// Obtener todos los proveedores
async function getAllProveedores() {
  const [rows] = await db.query(
    `SELECT 
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
     ORDER BY nombre_proveedor ASC`
  );
  return rows;
}

// Obtener un proveedor por ID
async function getProveedorById(id) {
  const [rows] = await db.query(
    `SELECT 
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
     WHERE id_proveedor = ?`,
    [id]
  );
  return rows[0] || null;
}

// Crear proveedor
async function createProveedor(data) {
  const {
    nombre_proveedor,
    nombre_contacto,
    telefono,
    telefono_alt,
    email,
    nit,
    ciudad,
    departamento,
    direccion,
    estado = 'activo',
    notas
  } = data;

  const [result] = await db.query(
    `INSERT INTO proveedores (
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
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      nombre_proveedor,
      nombre_contacto || null,
      telefono || null,
      telefono_alt || null,
      email || null,
      nit || null,
      ciudad || null,
      departamento || null,
      direccion || null,
      estado || 'activo',
      notas || null
    ]
  );

  // devolvemos el registro recién creado
  return await getProveedorById(result.insertId);
}

// Actualizar proveedor
async function updateProveedor(id, data) {
  const proveedorActual = await getProveedorById(id);
  if (!proveedorActual) return null;

  const {
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
  } = data;

  const [result] = await db.query(
    `UPDATE proveedores
     SET 
        nombre_proveedor   = ?,
        nombre_contacto    = ?,
        telefono           = ?,
        telefono_alt       = ?,
        email              = ?,
        nit                = ?,
        ciudad             = ?,
        departamento       = ?,
        direccion          = ?,
        estado             = ?,
        notas              = ?
     WHERE id_proveedor = ?`,
    [
      nombre_proveedor   ?? proveedorActual.nombre_proveedor,
      nombre_contacto    ?? proveedorActual.nombre_contacto,
      telefono           ?? proveedorActual.telefono,
      telefono_alt       ?? proveedorActual.telefono_alt,
      email              ?? proveedorActual.email,
      nit                ?? proveedorActual.nit,
      ciudad             ?? proveedorActual.ciudad,
      departamento       ?? proveedorActual.departamento,
      direccion          ?? proveedorActual.direccion,
      estado             ?? proveedorActual.estado,
      notas              ?? proveedorActual.notas,
      id
    ]
  );

  if (result.affectedRows === 0) return null;

  return await getProveedorById(id);
}

// Eliminar proveedor (DELETE real en BD)
async function deleteProveedor(id) {
  const [result] = await db.query(
    'DELETE FROM proveedores WHERE id_proveedor = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getAllProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
};
