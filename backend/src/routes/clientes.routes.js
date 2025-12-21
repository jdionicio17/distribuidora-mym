const express = require('express');
const router = express.Router();

const {
  listarClientes,
  obtenerCliente,
  buscarClientePorNit,
  crearCliente,
  actualizarCliente
} = require('../controllers/clientes.controller');

// GET /api/clientes
router.get('/', listarClientes);

// GET /api/clientes/buscar?nit=XXXX
router.get('/buscar', buscarClientePorNit);

// GET /api/clientes/:id
router.get('/:id', obtenerCliente);

// POST /api/clientes
router.post('/', crearCliente);

// PUT /api/clientes/:id
router.put('/:id', actualizarCliente);

module.exports = router;
