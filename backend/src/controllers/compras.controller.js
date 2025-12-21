// backend/src/controllers/compras.controller.js
const Compra = require('../models/compra.model');
const Producto = require('../models/producto.model');
const Proveedor = require('../models/proveedor.model');
const CxP = require('../models/cuentaPagar.model');
const Caja = require('../models/caja.model');

// GET /api/compras
async function listarCompras(req, res) {
  try {
    const compras = await Compra.listarCompras();
    return res.json(compras);
  } catch (err) {
    console.error('Error al listar compras:', err);
    return res.status(500).json({ message: 'Error al listar las compras.' });
  }
}

// GET /api/compras/:id
async function obtenerCompraPorId(req, res) {
  try {
    const { id } = req.params;
    const data = await Compra.obtenerCompraConDetalles(id);

    if (!data) {
      return res.status(404).json({ message: 'Compra no encontrada.' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error al obtener compra:', err);
    return res.status(500).json({ message: 'Error al obtener la compra.' });
  }
}

// POST /api/compras
async function crearCompra(req, res) {
  try {
    const {
      id_proveedor,
      tipo_compra,
      fecha_compra,
      fecha_vencimiento,
      numero_documento,
      notas,
      items
    } = req.body || {};

    if (!id_proveedor) {
      return res.status(400).json({ message: 'El proveedor es obligatorio.' });
    }

    if (!fecha_compra) {
      return res.status(400).json({ message: 'La fecha de compra es obligatoria.' });
    }

    const tipoValido = tipo_compra === 'contado' || tipo_compra === 'credito';
    if (!tipoValido) {
      return res
        .status(400)
        .json({ message: 'El tipo de compra debe ser "contado" o "credito".' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: 'Debe agregar al menos un producto a la compra.' });
    }

    // ✅ VALIDAR QUE TODOS LOS PRODUCTOS EXISTAN
    for (const it of items) {
      const producto = await Producto.obtenerPorId(it.id_producto);
      if (!producto) {
        return res.status(400).json({
          message: `El producto con ID ${it.id_producto} no existe. Por favor, créalo primero.`,
          producto_no_encontrado: true,
          id_producto_faltante: it.id_producto
        });
      }
    }

    const itemsNormalizados = items.map(it => ({
      id_producto: Number(it.id_producto),
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario)
    }));

    // Recalcular total neto aquí
    const totalBruto = itemsNormalizados.reduce(
      (acc, it) => acc + it.cantidad * it.precio_unitario,
      0
    );
    const descuentoTotal = 0;
    const totalNeto = totalBruto - descuentoTotal;

    // Obtener datos del proveedor
    const proveedorData = await Proveedor.obtenerPorId(id_proveedor);

    const idNueva = await Compra.crearCompraConDetalles({
      id_proveedor: Number(id_proveedor),
      tipo_compra,
      fecha_compra,
      fecha_vencimiento: fecha_vencimiento || null,
      numero_documento: numero_documento || null,
      notas: notas || null,
      items: itemsNormalizados
    });

    // Si la compra es a CRÉDITO, crear automáticamente una cuenta por pagar
    if (tipo_compra === 'credito') {
      try {
        await CxP.crearDesdeCompra({
          id_compra: idNueva,
          id_proveedor: Number(id_proveedor),
          total_neto: totalNeto,
          fecha_compra,
          fecha_vencimiento: fecha_vencimiento || null,
          notas: notas || null
        });
      } catch (errCxP) {
        console.error('⚠️ Error al crear cuenta por pagar desde compra:', errCxP);
      }
    } 
    // ✅ Si es CONTADO -> registrar egreso en caja
    else {
      const nombreProveedor = proveedorData ? ` - ${proveedorData.nombre_proveedor}` : '';
      await Caja.registrarMovimiento({
        tipo: 'egreso',
        concepto: `Compra de contado #${idNueva}${nombreProveedor}`,
        monto: totalNeto,
        fecha_mov: new Date(fecha_compra),
        referencia_tipo: 'compra',
        referencia_id: idNueva,
        notas: numero_documento ? `Doc: ${numero_documento}` : null
      });
    }

    return res.status(201).json({
      message: 'Compra creada correctamente. Inventario actualizado.',
      id_compra: idNueva
    });
  } catch (err) {
    console.error('Error al crear compra:', err);
    return res.status(500).json({ message: 'Error al crear la compra.' });
  }
}

module.exports = {
  listarCompras,
  obtenerCompraPorId,
  crearCompra
};