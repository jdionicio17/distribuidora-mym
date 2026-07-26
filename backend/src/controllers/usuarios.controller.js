const db = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// =====================================================
// GET /api/usuarios
// Obtener todos los usuarios
// =====================================================
exports.listarUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id_usuario,
                nombre_completo,
                usuario,
                correo,
                rol,
                estado,
                debe_cambiar_password,
                ultimo_acceso,
                creado_en,
                actualizado_en
            FROM usuarios
            ORDER BY id_usuario DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error('Error al listar usuarios:', error);

        return res.status(500).json({
            message: 'Error al obtener los usuarios.'
        });
    }
};


// =====================================================
// POST /api/usuarios
// Crear un nuevo usuario
// =====================================================
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

        // Limpiar datos recibidos
        const nombreFinal =
            typeof nombre_completo === 'string'
                ? nombre_completo.trim()
                : '';

        const usuarioFinal =
            typeof usuario === 'string'
                ? usuario.trim()
                : '';

        const correoFinal =
            typeof correo === 'string' && correo.trim() !== ''
                ? correo.trim()
                : null;

        // Validar campos obligatorios
        if (
            !nombreFinal ||
            !usuarioFinal ||
            !rol ||
            !password ||
            !password_confirm
        ) {
            return res.status(400).json({
                message: 'Por favor completa los campos obligatorios.'
            });
        }

        // Validar contraseñas
        if (password !== password_confirm) {
            return res.status(400).json({
                message: 'Las contraseñas no coinciden.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'La contraseña debe contener al menos 6 caracteres.'
            });
        }

        // Validar rol
        const rolesPermitidos = [
            'admin',
            'ventas',
            'bodega',
            'cobros'
        ];

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                message: 'El rol seleccionado no es válido.'
            });
        }

        // Validar estado
        const estadosPermitidos = [
            'activo',
            'inactivo'
        ];

        const estadoFinal = estadosPermitidos.includes(estado)
            ? estado
            : 'activo';

        // Convertir checkbox a 1 o 0
        const debeCambiarPassword =
            debe_cambiar_password === true ||
                debe_cambiar_password === 1 ||
                debe_cambiar_password === '1'
                ? 1
                : 0;

        // Verificar si el nombre de usuario ya existe
        const [usuariosExistentes] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE usuario = ?
            LIMIT 1
            `,
            [usuarioFinal]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                message: 'El nombre de usuario ya está en uso.'
            });
        }

        // Verificar correo repetido solamente cuando se proporciona correo
        if (correoFinal) {
            const [correosExistentes] = await db.query(
                `
                SELECT id_usuario
                FROM usuarios
                WHERE correo = ?
                LIMIT 1
                `,
                [correoFinal]
            );

            if (correosExistentes.length > 0) {
                return res.status(409).json({
                    message: 'El correo electrónico ya está registrado.'
                });
            }
        }

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        // Insertar usuario
        const [result] = await db.query(
            `
            INSERT INTO usuarios (
                nombre_completo,
                usuario,
                correo,
                rol,
                password_hash,
                estado,
                debe_cambiar_password
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                nombreFinal,
                usuarioFinal,
                correoFinal,
                rol,
                passwordHash,
                estadoFinal,
                debeCambiarPassword
            ]
        );

        return res.status(201).json({
            message: 'Usuario creado correctamente.',
            id_usuario: result.insertId
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'El usuario o correo electrónico ya está registrado.'
            });
        }

        return res.status(500).json({
            message: 'Error interno al crear el usuario.'
        });
    }
};


// =====================================================
// DELETE /api/usuarios/:id
// Eliminar un usuario
// =====================================================
exports.eliminarUsuario = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);

        // Validar ID
        if (
            !Number.isInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            return res.status(400).json({
                message: 'El ID del usuario no es válido.'
            });
        }

        // Comprobar que el usuario existe
        const [usuarios] = await db.query(
            `
            SELECT
                id_usuario,
                usuario,
                nombre_completo
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: 'El usuario no existe.'
            });
        }

        const usuarioEncontrado = usuarios[0];

        // Eliminar usuario
        const [result] = await db.query(
            `
            DELETE FROM usuarios
            WHERE id_usuario = ?
            `,
            [idUsuario]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'No se pudo encontrar el usuario para eliminarlo.'
            });
        }

        return res.status(200).json({
            message: `El usuario "${usuarioEncontrado.usuario}" fue eliminado correctamente.`,
            id_usuario: idUsuario
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);

        // El usuario está relacionado con ventas, movimientos u otras tablas
        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.code === 'ER_ROW_IS_REFERENCED'
        ) {
            return res.status(409).json({
                message:
                    'No se puede eliminar este usuario porque tiene registros relacionados. Puedes cambiar su estado a inactivo.'
            });
        }

        return res.status(500).json({
            message: 'Error interno al eliminar el usuario.'
        });
    }
};