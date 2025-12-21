// backend/src/routes/cuentasPagar.routes.js
const express = require('express');
const router = express.Router();

const {
  listarCuentas,
  obtenerCuenta,
  crearCuentaManual,
  registrarPago
} = require('../controllers/cuentasPagar.controller');

// GET /api/cuentas-pagar
router.get('/', listarCuentas);

// GET /api/cuentas-pagar/:id
router.get('/:id', obtenerCuenta);

// POST /api/cuentas-pagar
router.post('/', crearCuentaManual);


router.post('/:id/pagos', registrarPago);

module.exports = router;
