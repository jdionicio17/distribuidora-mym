// backend/src/models/categoria.model.js
const db = require('../config/db');

// Obtener todas las categorías
async function obtenerTodas() {
  const [rows] = await db.query(
    `SELECT id_categoria, nombre_categoria, descripcion, estado, creado_en, actualizado_en
     FROM categorias
     ORDER BY nombre_categoria`
  );
  return rows;
}

// Obtener una categoría por ID
async function obtenerPorId(id_categoria) {
  const [rows] = await db.query(
    `SELECT id_categoria, nombre_categoria, descripcion, estado, creado_en, actualizado_en
     FROM categorias
     WHERE id_categoria = ?`,
    [id_categoria]
  );
  return rows[0] || null;
}

// Crear una nueva categoría
async function crear({ nombre_categoria, descripcion, estado }) {
  const [result] = await db.query(
    `INSERT INTO categorias (nombre_categoria, descripcion, estado)
     VALUES (?, ?, ?)`,
    [nombre_categoria, descripcion || null, estado || 'activa']
  );
  return result.insertId;
}

// Actualizar una categoría
async function actualizar(id_categoria, { nombre_categoria, descripcion, estado }) {
  const [result] = await db.query(
    `UPDATE categorias
     SET nombre_categoria = ?, descripcion = ?, estado = ?
     WHERE id_categoria = ?`,
    [nombre_categoria, descripcion || null, estado || 'activa', id_categoria]
  );
  return result.affectedRows > 0;
}

// Eliminar una categoría
async function eliminar(id_categoria) {
  const [result] = await db.query(
    `DELETE FROM categorias WHERE id_categoria = ?`,
    [id_categoria]
  );
  return result.affectedRows > 0;
}

module.exports = {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
