// backend/src/controllers/categorias.controller.js
const Categoria = require('../models/categoria.model');

// GET /api/categorias
async function obtenerCategorias(req, res) {
  try {
    const categorias = await Categoria.obtenerTodas();
    return res.json(categorias);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    return res.status(500).json({ message: 'Error al obtener categorías.' });
  }
}

// GET /api/categorias/:id
async function obtenerCategoriaPorId(req, res) {
  try {
    const { id } = req.params;
    const cat = await Categoria.obtenerPorId(id);

    if (!cat) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    return res.json(cat);
  } catch (err) {
    console.error('Error al obtener categoría:', err);
    return res.status(500).json({ message: 'Error al obtener la categoría.' });
  }
}

// POST /api/categorias
async function crearCategoria(req, res) {
  try {
    const { nombre_categoria, descripcion, estado } = req.body;

    if (!nombre_categoria || !nombre_categoria.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }

    try {
      const nuevoId = await Categoria.crear({
        nombre_categoria: nombre_categoria.trim(),
        descripcion: descripcion || null,
        estado: estado || 'activa',
      });

      const creada = await Categoria.obtenerPorId(nuevoId);
      return res.status(201).json(creada);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res
          .status(400)
          .json({ message: 'Ya existe una categoría con ese nombre.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error al crear categoría:', err);
    return res.status(500).json({ message: 'Error al crear la categoría.' });
  }
}

// PUT /api/categorias/:id
async function actualizarCategoria(req, res) {
  try {
    const { id } = req.params;
    const { nombre_categoria, descripcion, estado } = req.body;

    if (!nombre_categoria || !nombre_categoria.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }

    try {
      const ok = await Categoria.actualizar(id, {
        nombre_categoria: nombre_categoria.trim(),
        descripcion: descripcion || null,
        estado: estado || 'activa',
      });

      if (!ok) {
        return res.status(404).json({ message: 'Categoría no encontrada.' });
      }

      const actualizada = await Categoria.obtenerPorId(id);
      return res.json(actualizada);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res
          .status(400)
          .json({ message: 'Ya existe una categoría con ese nombre.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    return res.status(500).json({ message: 'Error al actualizar la categoría.' });
  }
}

// DELETE /api/categorias/:id
async function eliminarCategoria(req, res) {
  try {
    const { id } = req.params;

    const ok = await Categoria.eliminar(id);
    if (!ok) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    return res.json({ message: 'Categoría eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    return res.status(500).json({ message: 'Error al eliminar la categoría.' });
  }
}

module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};
