// backend/src/routes/proveedores.routes.js
const express = require('express');
const router = express.Router();

const ProveedoresController = require('../controllers/proveedores.controller');

// /api/proveedores
router.get('/', ProveedoresController.listarProveedores);
router.get('/:id', ProveedoresController.obtenerProveedor);
router.post('/', ProveedoresController.crearProveedor);
router.put('/:id', ProveedoresController.actualizarProveedor);
router.delete('/:id', ProveedoresController.eliminarProveedor);

module.exports = router;
