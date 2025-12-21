// backend/src/routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// GET /api/usuarios -> listar
router.get('/', usuariosController.listarUsuarios);

// POST /api/usuarios -> crear
router.post('/', usuariosController.crearUsuario);

module.exports = router;
