const express = require('express');
const router = express.Router();

const ProveedoresController = require(
    '../controllers/proveedores.controller'
);

// GET /api/proveedores
router.get(
    '/',
    ProveedoresController.listarProveedores
);

// GET /api/proveedores/:id
router.get(
    '/:id',
    ProveedoresController.obtenerProveedor
);

// POST /api/proveedores
router.post(
    '/',
    ProveedoresController.crearProveedor
);

// PUT /api/proveedores/:id
router.put(
    '/:id',
    ProveedoresController.actualizarProveedor
);

// DELETE /api/proveedores/:id
router.delete(
    '/:id',
    ProveedoresController.eliminarProveedor
);

module.exports = router;