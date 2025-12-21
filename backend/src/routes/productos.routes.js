// backend/src/routes/productos.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productos.controller');

router.get('/buscar', ctrl.buscarProducto);
router.get('/sugerencias', ctrl.sugerenciasProductos); // ✅ NUEVO
router.get('/', ctrl.listarProductos);
router.get('/:id', ctrl.obtenerProductoPorId);
router.post('/', ctrl.crearProducto);
router.put('/:id', ctrl.actualizarProducto);
router.delete('/:id', ctrl.eliminarProducto);

module.exports = router;
