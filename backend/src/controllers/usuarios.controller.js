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

function limpiarTexto(valor) {
    if (typeof valor !== 'string') {
        return '';
    }

    return valor.trim();
}

function textoOpcional(valor) {
    const texto = limpiarTexto(valor);

    return texto === '' ? null : texto;
}

function convertirBooleano(valor) {
    return (
        valor === true ||
        valor === 1 ||
        valor === '1' ||
        valor === 'true'
    ) ? 1 : 0;
}

function correoValido(correo) {
    if (!correo) {
        return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}


// =====================================================
// GET /api/usuarios
// LISTAR USUARIOS
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
// OBTENER USUARIO POR ID
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
// CREAR USUARIO
// =====================================================
exports.crearUsuario = async (req, res) => {
    try {
        const nombreFinal = limpiarTexto(
            req.body.nombre_completo
        );

        const usuarioFinal = limpiarTexto(
            req.body.usuario
        );

        const correoFinal = textoOpcional(
            req.body.correo
        );

        const rol = limpiarTexto(
            req.body.rol
        );

        const estadoRecibido = limpiarTexto(
            req.body.estado
        );

        const password =
            typeof req.body.password === 'string'
                ? req.body.password
                : '';

        const passwordConfirm =
            typeof req.body.password_confirm === 'string'
                ? req.body.password_confirm
                : '';

        const estadoFinal =
            ESTADOS_PERMITIDOS.includes(estadoRecibido)
                ? estadoRecibido
                : 'activo';

        const debeCambiarPassword = convertirBooleano(
            req.body.debe_cambiar_password
        );

        if (
            !nombreFinal ||
            !usuarioFinal ||
            !rol ||
            !password ||
            !passwordConfirm
        ) {
            return res.status(400).json({
                message:
                    'Por favor completa los campos obligatorios.'
            });
        }

        if (!ROLES_PERMITIDOS.includes(rol)) {
            return res.status(400).json({
                message: 'El rol seleccionado no es válido.'
            });
        }

        if (!correoValido(correoFinal)) {
            return res.status(400).json({
                message:
                    'El correo electrónico no es válido.'
            });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({
                message: 'Las contraseñas no coinciden.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    'La contraseña debe contener al menos 6 caracteres.'
            });
        }

        // Verificar nombre de usuario duplicado
        const [usuarioDuplicado] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE usuario = ?
            LIMIT 1
            `,
            [usuarioFinal]
        );

        if (usuarioDuplicado.length > 0) {
            return res.status(409).json({
                message:
                    'El nombre de usuario ya está en uso.'
            });
        }

        // Verificar correo duplicado
        if (correoFinal) {
            const [correoDuplicado] = await db.query(
                `
                SELECT id_usuario
                FROM usuarios
                WHERE correo = ?
                LIMIT 1
                `,
                [correoFinal]
            );

            if (correoDuplicado.length > 0) {
                return res.status(409).json({
                    message:
                        'El correo electrónico ya está registrado.'
                });
            }
        }

        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
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
                    'El usuario o correo electrónico ya está registrado.'
            });
        }

        return res.status(500).json({
            message: 'Error interno al crear el usuario.'
        });
    }
};


// =====================================================
// PUT /api/usuarios/:id
// ACTUALIZAR USUARIO
// =====================================================
exports.actualizarUsuario = async (req, res) => {
    try {
        const idUsuario = obtenerIdValido(req.params.id);

        if (!idUsuario) {
            return res.status(400).json({
                message: 'El ID del usuario no es válido.'
            });
        }

        const nombreFinal = limpiarTexto(
            req.body.nombre_completo
        );

        const usuarioFinal = limpiarTexto(
            req.body.usuario
        );

        const correoFinal = textoOpcional(
            req.body.correo
        );

        const rol = limpiarTexto(
            req.body.rol
        );

        const estado = limpiarTexto(
            req.body.estado
        );

        const password =
            typeof req.body.password === 'string'
                ? req.body.password
                : '';

        const passwordConfirm =
            typeof req.body.password_confirm === 'string'
                ? req.body.password_confirm
                : '';

        const debeCambiarPassword = convertirBooleano(
            req.body.debe_cambiar_password
        );

        if (
            !nombreFinal ||
            !usuarioFinal ||
            !rol ||
            !estado
        ) {
            return res.status(400).json({
                message:
                    'Nombre, usuario, rol y estado son obligatorios.'
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

        if (!correoValido(correoFinal)) {
            return res.status(400).json({
                message:
                    'El correo electrónico no es válido.'
            });
        }

        // Comprobar que el usuario exista
        const [usuarioExistente] = await db.query(
            `
            SELECT id_usuario
            FROM usuarios
            WHERE id_usuario = ?
            LIMIT 1
            `,
            [idUsuario]
        );

        if (usuarioExistente.length === 0) {
            return res.status(404).json({
                message:
                    'El usuario que intentas editar no existe.'
            });
        }

        // Comprobar usuario duplicado, excluyendo el actual
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
                message:
                    'Otro usuario ya utiliza ese nombre de usuario.'
            });
        }

        // Comprobar correo duplicado, excluyendo el actual
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
                    message:
                        'Otro usuario ya utiliza ese correo electrónico.'
                });
            }
        }

        const cambiarPassword =
            password !== '' ||
            passwordConfirm !== '';

        let result;

        if (cambiarPassword) {
            if (!password || !passwordConfirm) {
                return res.status(400).json({
                    message:
                        'Debes escribir y confirmar la nueva contraseña.'
                });
            }

            if (password !== passwordConfirm) {
                return res.status(400).json({
                    message: 'Las contraseñas no coinciden.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    message:
                        'La nueva contraseña debe contener al menos 6 caracteres.'
                });
            }

            const passwordHash = await bcrypt.hash(
                password,
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
                    passwordHash,
                    estado,
                    debeCambiarPassword,
                    idUsuario
                ]
            );

        } else {
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
                    'El usuario o correo electrónico ya está registrado.'
            });
        }

        return res.status(500).json({
            message:
                'Error interno al actualizar el usuario.'
        });
    }
};


// =====================================================
// DELETE /api/usuarios/:id
// ELIMINAR USUARIO
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
                message: 'No se pudo eliminar el usuario.'
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