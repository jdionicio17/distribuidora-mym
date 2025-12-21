// backend/src/routes/compras.routes.js
const express = require('express');
const router = express.Router();

const {
  listarCompras,
  obtenerCompraPorId,
  crearCompra
} = require('../controllers/compras.controller');


router.get('/', listarCompras);          // GET /api/compras
router.get('/:id', obtenerCompraPorId);  // GET /api/compras/:id
router.post('/', crearCompra);           // POST /api/compras

module.exports = router;
