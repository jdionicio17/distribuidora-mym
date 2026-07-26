const express = require('express');
const router = express.Router();

const usuariosController = require(
    '../controllers/usuarios.controller'
);

// GET /api/usuarios
router.get(
    '/',
    usuariosController.listarUsuarios
);

// POST /api/usuarios
router.post(
    '/',
    usuariosController.crearUsuario
);

// DELETE /api/usuarios/:id
router.delete(
    '/:id',
    usuariosController.eliminarUsuario
);

module.exports = router;