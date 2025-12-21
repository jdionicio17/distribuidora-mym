// backend/src/routes/ventas.routes.js
const express = require('express');
const router = express.Router();

const {
  listarVentas,
  crearVenta
} = require('../controllers/ventas.controller');

router.get('/', listarVentas);
router.post('/', crearVenta);

module.exports = router;