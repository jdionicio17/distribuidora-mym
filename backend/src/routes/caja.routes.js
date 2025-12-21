// backend/src/routes/caja.routes.js
const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');

// GET /api/caja/resumen
router.get('/resumen', cajaController.obtenerResumen);

// GET /api/caja/movimientos
router.get('/movimientos', cajaController.listarMovimientos);

// POST /api/caja/movimientos
router.post('/movimientos', cajaController.registrarMovimiento);

module.exports = router;