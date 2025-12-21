// backend/src/routes/categorias.routes.js
const express = require('express');
const router = express.Router();

const categoriasController = require('../controllers/categorias.controller');

// NO poner paréntesis aquí (no: obtenerCategorias())
// Solo se pasa la referencia de la función
router.get('/', categoriasController.obtenerCategorias);
router.get('/:id', categoriasController.obtenerCategoriaPorId);
router.post('/', categoriasController.crearCategoria);
router.put('/:id', categoriasController.actualizarCategoria);
router.delete('/:id', categoriasController.eliminarCategoria);

module.exports = router;
