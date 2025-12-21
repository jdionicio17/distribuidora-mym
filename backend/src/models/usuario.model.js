const pool = require('../config/db');

// insertar usuario
async function crearUsuario(data) {
  const sql = `
    INSERT INTO usuarios
      (nombre_completo, usuario, correo, rol, password_hash, estado, debe_cambiar_password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    data.nombre_completo,
    data.usuario,
    data.correo || null,
    data.rol,
    data.password_hash,
    data.estado || 'activo',
    data.debe_cambiar_password ? 1 : 0
  ]);

  return result.insertId;
}

// obtener usuarios
async function obtenerUsuarios() {
  const [rows] = await pool.execute(`
    SELECT id_usuario, nombre_completo, usuario, correo,
           rol, estado, ultimo_acceso, creado_en
    FROM usuarios
    ORDER BY id_usuario DESC
  `);

  return rows;
}

module.exports = {
  crearUsuario,
  obtenerUsuarios
};
