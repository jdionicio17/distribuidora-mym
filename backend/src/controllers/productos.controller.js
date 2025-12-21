// backend/src/controllers/productos.controller.js
const Producto = require('../models/producto.model');

// GET /api/productos/buscar?termino=...
async function buscarProducto(req, res) {
  try {
    const { termino } = req.query;

    if (!termino || !termino.trim()) {
      return res.status(400).json({ message: 'El término de búsqueda es obligatorio.' });
    }

    const prod = await Producto.buscarPorTermino(termino.trim());
    if (!prod) return res.status(404).json({ message: 'Producto no encontrado.' });

    return res.json(prod);
  } catch (err) {
    console.error('Error al buscar producto:', err);
    return res.status(500).json({ message: 'Error al buscar el producto.' });
  }
}

// ✅ NUEVO: GET /api/productos/sugerencias?termino=...&limit=10
async function sugerenciasProductos(req, res) {
  try {
    const termino = String(req.query.termino || '').trim();
    const limit = Number(req.query.limit || 10);

    if (!termino || termino.length < 2) {
      return res.json([]); // para autocompletar, mejor vacío
    }

    const lista = await Producto.sugerenciasPorTermino(termino, limit);
    return res.json(lista);
  } catch (err) {
    console.error('Error al listar sugerencias:', err);
    return res.status(500).json({ message: 'Error al listar sugerencias.' });
  }
}

async function listarProductos(req, res) {
  try {
    const { categoria, ordenar } = req.query;

    const filtros = {
      id_categoria: categoria || null,
      ordenar: ordenar || 'nombre_asc'
    };

    const productos = await Producto.listarConFiltros(filtros);
    return res.json(productos);
  } catch (err) {
    console.error('Error al listar productos:', err);
    return res.status(500).json({ message: 'Error al listar los productos.' });
  }
}

async function obtenerProductoPorId(req, res) {
  try {
    const { id } = req.params;
    const prod = await Producto.obtenerPorId(id);

    if (!prod) return res.status(404).json({ message: 'Producto no encontrado.' });
    return res.json(prod);
  } catch (err) {
    console.error('Error al obtener producto:', err);
    return res.status(500).json({ message: 'Error al obtener el producto.' });
  }
}

async function crearProducto(req, res) {
  try {
    const datos = req.body;

    if (!datos.nombre_producto || !datos.nombre_producto.trim()) {
      return res.status(400).json({ message: 'El nombre del producto es obligatorio.' });
    }
    if (!datos.id_categoria) {
      return res.status(400).json({ message: 'La categoría es obligatoria.' });
    }

    datos.nombre_producto = datos.nombre_producto.trim();

    try {
      const nuevoId = await Producto.crear(datos);
      const creado  = await Producto.obtenerPorId(nuevoId);
      return res.status(201).json(creado);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Ya existe un producto con ese código de barras o código interno.' });
      }
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'La categoría o el proveedor no existen.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error al crear producto:', err);
    return res.status(500).json({ message: 'Error al crear el producto.' });
  }
}

async function actualizarProducto(req, res) {
  try {
    const { id } = req.params;
    const datos  = req.body;

    if (!datos.nombre_producto || !datos.nombre_producto.trim()) {
      return res.status(400).json({ message: 'El nombre del producto es obligatorio.' });
    }
    if (!datos.id_categoria) {
      return res.status(400).json({ message: 'La categoría es obligatoria.' });
    }

    datos.nombre_producto = datos.nombre_producto.trim();

    try {
      const ok = await Producto.actualizar(id, datos);
      if (!ok) return res.status(404).json({ message: 'Producto no encontrado.' });

      const actualizado = await Producto.obtenerPorId(id);
      return res.json(actualizado);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Ya existe un producto con ese código de barras o código interno.' });
      }
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'La categoría o el proveedor no existen.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    return res.status(500).json({ message: 'Error al actualizar el producto.' });
  }
}

async function eliminarProducto(req, res) {
  try {
    const { id } = req.params;
    const ok = await Producto.eliminar(id);

    if (!ok) return res.status(404).json({ message: 'Producto no encontrado.' });
    return res.json({ message: 'Producto eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    return res.status(500).json({ message: 'Error al eliminar el producto.' });
  }
}

module.exports = {
  buscarProducto,
  sugerenciasProductos, // ✅ NUEVO
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
