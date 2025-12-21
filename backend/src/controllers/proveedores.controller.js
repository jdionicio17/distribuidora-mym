// backend/src/controllers/proveedores.controller.js
const ProveedorModel = require('../models/proveedor.model');

// GET /api/proveedores
async function listarProveedores(req, res) {
  try {
    const proveedores = await ProveedorModel.getAllProveedores();
    res.json(proveedores);
  } catch (err) {
    console.error('Error al listar proveedores:', err);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
}

// GET /api/proveedores/:id
async function obtenerProveedor(req, res) {
  try {
    const { id } = req.params;
    const proveedor = await ProveedorModel.getProveedorById(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json(proveedor);
  } catch (err) {
    console.error('Error al obtener proveedor:', err);
    res.status(500).json({ message: 'Error al obtener el proveedor' });
  }
}

// POST /api/proveedores
async function crearProveedor(req, res) {
  try {
    const {
      nombre_proveedor,
      nombre_contacto,
      telefono,
      telefono_alt,
      email,
      nit,
      ciudad,
      departamento,
      direccion,
      estado,
      notas
    } = req.body;

    if (!nombre_proveedor || nombre_proveedor.trim() === '') {
      return res
        .status(400)
        .json({ message: 'El nombre del proveedor es obligatorio' });
    }

    const nuevo = await ProveedorModel.createProveedor({
      nombre_proveedor,
      nombre_contacto,
      telefono,
      telefono_alt,
      email,
      nit,
      ciudad,
      departamento,
      direccion,
      estado,
      notas
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('Error al crear proveedor:', err);

    // posibles errores por UNIQUE (email/nit)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message:
          'Ya existe un proveedor con el mismo correo o NIT. Verifica los datos.'
      });
    }

    res.status(500).json({ message: 'Error al crear el proveedor' });
  }
}

// PUT /api/proveedores/:id
async function actualizarProveedor(req, res) {
  try {
    const { id } = req.params;

    const proveedorActualizado = await ProveedorModel.updateProveedor(id, req.body);

    if (!proveedorActualizado) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json(proveedorActualizado);
  } catch (err) {
    console.error('Error al actualizar proveedor:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message:
          'Ya existe un proveedor con el mismo correo o NIT. Verifica los datos.'
      });
    }

    res.status(500).json({ message: 'Error al actualizar el proveedor' });
  }
}

// DELETE /api/proveedores/:id
async function eliminarProveedor(req, res) {
  try {
    const { id } = req.params;

    const eliminado = await ProveedorModel.deleteProveedor(id);

    if (!eliminado) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar proveedor:', err);
    res.status(500).json({ message: 'Error al eliminar el proveedor' });
  }
}

module.exports = {
  listarProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};
