// backend/src/routes/cuentasCobrar.routes.js
const express = require('express');
const router = express.Router();

const {
  listarCuentas,
  obtenerCuenta,
  registrarPago
} = require('../controllers/cuentasCobrar.controller');

// GET /api/cuentas-cobrar
router.get('/', listarCuentas);

// GET /api/cuentas-cobrar/:id
router.get('/:id', obtenerCuenta);

// POST /api/cuentas-cobrar/:id/abonos
router.post('/:id/abonos', registrarPago);

module.exports = router;