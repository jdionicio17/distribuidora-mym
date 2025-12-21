// backend/src/controllers/auth.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// POST /api/auth/login
async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios.' });
    }

    // Buscar usuario en la BD
    const [rows] = await db.query(
      `SELECT id_usuario, usuario, nombre_completo, correo,
              rol, password_hash, estado, debe_cambiar_password
       FROM usuarios
       WHERE usuario = ?`,
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    const u = rows[0];

    // Verificar estado
    if (u.estado !== 'activo') {
      return res.status(403).json({ message: 'El usuario está inactivo.' });
    }

    // Comparar contraseña con bcrypt
    const coincide = await bcrypt.compare(password, u.password_hash);
    if (!coincide) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
    }

    // Actualizar último acceso
    await db.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?',
      [u.id_usuario]
    );

    // Respuesta al frontend
    return res.json({
      message: 'Login correcto',
      usuario: {
        id_usuario: u.id_usuario,
        usuario: u.usuario,
        nombre_completo: u.nombre_completo,
        rol: u.rol,
        debe_cambiar_password: !!u.debe_cambiar_password,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
}

module.exports = {
  login,
};
