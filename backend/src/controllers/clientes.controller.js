// backend/src/controllers/clientes.controller.js
const Cliente = require('../models/cliente.model');

// GET /api/clientes
async function listarClientes(req, res) {
  try {
    const clientes = await Cliente.listarClientes();
    return res.json(clientes);
  } catch (err) {
    console.error('Error al listar clientes:', err);
    return res.status(500).json({ message: 'Error al listar los clientes.' });
  }
}

// GET /api/clientes/:id
async function obtenerCliente(req, res) {
  try {
    const { id } = req.params;
    const cliente = await Cliente.obtenerPorId(id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    return res.json(cliente);
  } catch (err) {
    console.error('Error al obtener cliente:', err);
    return res.status(500).json({ message: 'Error al obtener el cliente.' });
  }
}

// GET /api/clientes/buscar?nit=XXXX
async function buscarClientePorNit(req, res) {
  try {
    const { nit } = req.query;
    if (!nit) {
      return res.status(400).json({ message: 'Debe proporcionar el NIT.' });
    }

    const cliente = await Cliente.buscarPorNit(nit);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    return res.json(cliente);
  } catch (err) {
    console.error('Error al buscar cliente por NIT:', err);
    return res.status(500).json({ message: 'Error al buscar el cliente.' });
  }
}

// POST /api/clientes
async function crearCliente(req, res) {
  try {
    const {
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      notas
    } = req.body || {};

    if (!nombre_cliente || !nombre_cliente.trim()) {
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio.' });
    }

    const limiteNum = Number(limite_credito || 0);
    if (limiteNum < 0) {
      return res.status(400).json({ message: 'El límite de crédito no puede ser negativo.' });
    }

    const idNuevo = await Cliente.crearCliente({
      nombre_cliente: nombre_cliente.trim(),
      nit: nit || null,
      telefono: telefono || null,
      direccion: direccion || null,
      email: email || null,
      limite_credito: limiteNum,
      notas: notas || null
    });

    const data = await Cliente.obtenerPorId(idNuevo);
    return res.status(201).json(data);
  } catch (err) {
    console.error('Error al crear cliente:', err);
    return res.status(500).json({ message: 'Error al crear el cliente.' });
  }
}

// PUT /api/clientes/:id
async function actualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      estado,
      notas
    } = req.body || {};

    if (!nombre_cliente || !nombre_cliente.trim()) {
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio.' });
    }

    const limiteNum = Number(limite_credito || 0);
    if (limiteNum < 0) {
      return res.status(400).json({ message: 'El límite de crédito no puede ser negativo.' });
    }

    await Cliente.actualizarCliente(id, {
      nombre_cliente: nombre_cliente.trim(),
      nit: nit || null,
      telefono: telefono || null,
      direccion: direccion || null,
      email: email || null,
      limite_credito: limiteNum,
      estado: estado || 'activo',
      notas: notas || null
    });

    const data = await Cliente.obtenerPorId(id);
    return res.json(data);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    return res.status(500).json({ message: 'Error al actualizar el cliente.' });
  }
}

module.exports = {
  listarClientes,
  obtenerCliente,
  buscarClientePorNit,
  crearCliente,
  actualizarCliente
};
