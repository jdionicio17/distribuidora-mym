// backend/src/controllers/usuarios.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// GET /api/usuarios
exports.listarUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT 
                id_usuario,
                nombre_completo,
                usuario,
                correo,
                rol,
                estado,
                ultimo_acceso
             FROM usuarios
             ORDER BY id_usuario DESC`
        );

        res.json(rows);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// POST /api/usuarios
exports.crearUsuario = async (req, res) => {
    try {
        const {
            nombre_completo,
            usuario,
            correo,
            rol,
            password,
            password_confirm,
            estado,
            debe_cambiar_password
        } = req.body;

        // Validaciones básicas
        if (!nombre_completo || !usuario || !rol || !password || !password_confirm) {
            return res.status(400).json({ message: 'Por favor completa los campos obligatorios.' });
        }

        if (password !== password_confirm) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
        }

        // Validar rol
        const rolesPermitidos = ['admin', 'ventas', 'bodega', 'cobros'];
        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({ message: 'Rol inválido.' });
        }

        // Validar estado
        const estadosPermitidos = ['activo', 'inactivo'];
        const estadoFinal = estadosPermitidos.includes(estado) ? estado : 'activo';

        const debeCambiar = debe_cambiar_password ? 1 : 0;

        // Verificar si el usuario ya existe
        const [existente] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE usuario = ?',
            [usuario]
        );

        if (existente.length > 0) {
            return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        // Hashear contraseña
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await db.query(
            `INSERT INTO usuarios
                (nombre_completo, usuario, correo, rol, password_hash, estado, debe_cambiar_password)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre_completo,
                usuario,
                correo || null,
                rol,
                hash,
                estadoFinal,
                debeCambiar
            ]
        );

        res.status(201).json({
            message: 'Usuario creado correctamente.',
            id_usuario: result.insertId
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        res.status(500).json({ message: 'Error interno al crear usuario.' });
    }
};
