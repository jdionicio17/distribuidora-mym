const db = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const ROLES_PERMITIDOS = [
    'admin',
    'ventas',
    'bodega',
    'cobros'
];

const ESTADOS_PERMITIDOS = [
    'activo',
    'inactivo'
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================
function obtenerIdValido(valor) {
    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

function convertirBooleano(valor) {
    return (
        valor === true ||
        valor === 1 ||
        valor === '1' ||
        valor === 'true'
    ) ? 1 : 0;
}


// =====================================================
// GET /api/usuarios
// Listar todos los usuarios
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
// GET /api/usuarios/:id
// Obtener un usuario por ID
// =====================================================
exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const idUsuario = obtenerIdValido(req.params.id);

        if (!idUsuario) {
            return res.status(400).json({
                message: 'El ID del usuario no es válido.'
            });
        }

        const [rows] = await db.query(
            `
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
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'El usuario no existe.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al obtener usuario:', error);

        return res.status(500).json({
            message: 'Error interno al obtener el usuario.'
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

        if (!ROLES_PERMITIDOS.includes(rol)) {
            return res.status(400).json({
                message: 'El rol seleccionado no es válido.'
            });
        }

        const estadoFinal = ESTADOS_PERMITIDOS.includes(estado)
            ? estado
            : 'activo';

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

        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        const debeCambiarPassword = convertirBooleano(
            debe_cambiar_password
        );

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
                message:
                    'El nombre de usuario o correo electrónico ya está registrado.'
            });
        }

        return res.status(500).json({
            message: 'Error interno al crear el usuario.'
        });
    }
};


// =====================================================
// PUT /api/usuarios/:id
// Actualizar un usuario
// =====================================================
exports.actualizarUsuario = async (req, res) => {
    try {
        const idUsuario = obtenerIdValido(req.params.id);

        if (!idUsuario) {
            return res.status(400).json({
                message: 'El ID del usuario no es válido.'
            });
        }

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

        if (
            !nombreFinal ||
            !usuarioFinal ||
            !rol ||
            !estado
        ) {
            return res.status(400).json({
                message:
                    'Nombre completo, usuario, rol y estado son obligatorios.'
            });
        }

        if (!ROLES_PERMITIDOS.includes(rol)) {
            return res.status(400).json({
                message: 'El rol seleccionado no es válido.'
            });
        }

        if (!ESTADOS_PERMITIDOS.includes(estado)) {
            return res.status(400).json({
                message: 'El estado seleccionado no es válido.'
            });
        }

        // Verificar que el usuario exista
        const [usuarioActual] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarioActual.length === 0) {
            return res.status(404).json({
                message: 'El usuario que intentas editar no existe.'
            });
        }

        // Comprobar que otro registro no tenga el mismo usuario
        const [usuarioDuplicado] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE usuario = ?
              AND id_usuario <> ?
            LIMIT 1
            `,
            [
                usuarioFinal,
                idUsuario
            ]
        );

        if (usuarioDuplicado.length > 0) {
            return res.status(409).json({
                message: 'El nombre de usuario ya está en uso.'
            });
        }

        // Comprobar que otro registro no tenga el mismo correo
        if (correoFinal) {
            const [correoDuplicado] = await db.query(
                `
                SELECT id_usuario
                FROM usuarios
                WHERE correo = ?
                  AND id_usuario <> ?
                LIMIT 1
                `,
                [
                    correoFinal,
                    idUsuario
                ]
            );

            if (correoDuplicado.length > 0) {
                return res.status(409).json({
                    message: 'El correo electrónico ya está registrado.'
                });
            }
        }

        const debeCambiarPassword = convertirBooleano(
            debe_cambiar_password
        );

        const nuevaPassword =
            typeof password === 'string'
                ? password
                : '';

        const confirmacionPassword =
            typeof password_confirm === 'string'
                ? password_confirm
                : '';

        const quiereCambiarPassword =
            nuevaPassword !== '' ||
            confirmacionPassword !== '';

        let result;

        // Actualizar también la contraseña
        if (quiereCambiarPassword) {
            if (!nuevaPassword || !confirmacionPassword) {
                return res.status(400).json({
                    message:
                        'Debes escribir y confirmar la nueva contraseña.'
                });
            }

            if (nuevaPassword !== confirmacionPassword) {
                return res.status(400).json({
                    message: 'Las contraseñas no coinciden.'
                });
            }

            if (nuevaPassword.length < 6) {
                return res.status(400).json({
                    message:
                        'La contraseña debe contener al menos 6 caracteres.'
                });
            }

            const nuevoPasswordHash = await bcrypt.hash(
                nuevaPassword,
                SALT_ROUNDS
            );

            [result] = await db.query(
                `
                UPDATE usuarios
                SET
                    nombre_completo = ?,
                    usuario = ?,
                    correo = ?,
                    rol = ?,
                    password_hash = ?,
                    estado = ?,
                    debe_cambiar_password = ?,
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id_usuario = ?
                `,
                [
                    nombreFinal,
                    usuarioFinal,
                    correoFinal,
                    rol,
                    nuevoPasswordHash,
                    estado,
                    debeCambiarPassword,
                    idUsuario
                ]
            );

        } else {
            // Actualizar sin modificar la contraseña
            [result] = await db.query(
                `
                UPDATE usuarios
                SET
                    nombre_completo = ?,
                    usuario = ?,
                    correo = ?,
                    rol = ?,
                    estado = ?,
                    debe_cambiar_password = ?,
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id_usuario = ?
                `,
                [
                    nombreFinal,
                    usuarioFinal,
                    correoFinal,
                    rol,
                    estado,
                    debeCambiarPassword,
                    idUsuario
                ]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'No se pudo actualizar el usuario.'
            });
        }

        return res.status(200).json({
            message: 'Usuario actualizado correctamente.',
            id_usuario: idUsuario
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'El nombre de usuario o correo electrónico ya está registrado.'
            });
        }

        return res.status(500).json({
            message: 'Error interno al actualizar el usuario.'
        });
    }
};


// =====================================================
// DELETE /api/usuarios/:id
// Eliminar un usuario
// =====================================================
exports.eliminarUsuario = async (req, res) => {
    try {
        const idUsuario = obtenerIdValido(req.params.id);

        if (!idUsuario) {
            return res.status(400).json({
                message: 'El ID del usuario no es válido.'
            });
        }

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

        const [result] = await db.query(
            `
            DELETE FROM usuarios
            WHERE id_usuario = ?
            `,
            [idUsuario]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'No se pudo encontrar el usuario para eliminarlo.'
            });
        }

        return res.status(200).json({
            message:
                `El usuario "${usuarioEncontrado.usuario}" fue eliminado correctamente.`,
            id_usuario: idUsuario
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);

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