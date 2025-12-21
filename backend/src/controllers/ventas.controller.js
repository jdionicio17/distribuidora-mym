// backend/src/controllers/ventas.controller.js
const Venta = require('../models/venta.model');
const Cliente = require('../models/cliente.model');
const CxC = require('../models/cuentaCobrar.model');
const Caja = require('../models/caja.model');

// GET /api/ventas
async function listarVentas(req, res) {
  try {
    const ventas = await Venta.listarVentas();
    return res.json(ventas);
  } catch (err) {
    console.error('Error al listar ventas:', err);
    return res.status(500).json({ message: 'Error al listar las ventas.' });
  }
}

// POST /api/ventas
async function crearVenta(req, res) {
  try {
    const {
      id_cliente,
      tipo_venta,
      fecha_limite_pago,
      efectivo_recibido,
      cambio,
      items
    } = req.body || {};

    const tipo = (tipo_venta === 'credito') ? 'credito' : 'contado';

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debe agregar al menos un producto a la venta.' });
    }

    // Normalizar items y calcular totales
    const itemsNorm = [];
    let totalBruto = 0;

    for (const it of items) {
      const id_prod = Number(it.id_producto);
      const cantidad = Number(it.cantidad);
      const precio_unitario = Number(it.precio_unitario);
      const tipo_precio = (it.tipo_precio === 'preventa') ? 'preventa' : 'camion';

      if (!id_prod || cantidad <= 0 || precio_unitario < 0) {
        return res.status(400).json({ message: 'Datos inválidos en los productos de la venta.' });
      }

      const subtotal = cantidad * precio_unitario;
      totalBruto += subtotal;

      itemsNorm.push({ id_producto: id_prod, cantidad, precio_unitario, tipo_precio });
    }

    const descuentoTotal = 0;
    const totalNeto = totalBruto - descuentoTotal;

    // Validar cliente
    let clienteData = null;
    let idClienteFinal = null;

    if (id_cliente) {
      clienteData = await Cliente.obtenerPorId(id_cliente);
      if (!clienteData) {
        return res.status(400).json({ message: 'El cliente indicado no existe.' });
      }
      idClienteFinal = Number(id_cliente);
    }

    // Validar crédito
    if (tipo === 'credito') {
      if (!idClienteFinal) {
        return res.status(400).json({ message: 'Para una venta a crédito debe seleccionar un cliente.' });
      }
      if (!fecha_limite_pago) {
        return res.status(400).json({ message: 'La fecha límite de pago es obligatoria para ventas a crédito.' });
      }

      const limite = Number(clienteData.limite_credito || 0);
      const saldo  = Number(clienteData.saldo_credito || 0);
      const disponible = Math.max(0, limite - saldo);

      if (disponible <= 0) {
        return res.status(400).json({ message: 'El cliente no tiene crédito disponible.' });
      }
      if (totalNeto > disponible + 0.001) {
        return res.status(400).json({
          message: `El monto de la venta (Q ${totalNeto.toFixed(2)}) supera el crédito disponible del cliente (Q ${disponible.toFixed(2)}).`
        });
      }
    }

    const fechaVenta = new Date();
    const fechaVentaStr = fechaVenta.toISOString().slice(0, 10);

    // Efectivo/cambio opcional solo contado
    const efectivoNum = (efectivo_recibido != null && efectivo_recibido !== '') ? Number(efectivo_recibido) : null;
    const cambioNum   = (cambio != null && cambio !== '') ? Number(cambio) : null;

    // Crear venta con transacción + descuento stock
    const idVenta = await Venta.crearVentaConDetalles({
      id_cliente: idClienteFinal,
      tipo_venta: tipo,
      fecha_venta: fechaVenta,
      total_bruto: totalBruto,
      descuento_total: descuentoTotal,
      total_neto: totalNeto,
      efectivo_recibido: efectivoNum,
      cambio: cambioNum,
      items: itemsNorm
    });

    // Si es crédito -> crear cuenta por cobrar y aumentar saldo
    if (tipo === 'credito') {
      await CxC.crearDesdeVenta({
        id_venta: idVenta,
        id_cliente: idClienteFinal,
        descripcion: `Venta #${idVenta}`,
        monto_total: totalNeto,
        fecha_venta: fechaVentaStr,
        fecha_vencimiento: fecha_limite_pago,
        notas: null
      });

      await Cliente.sumarSaldoCredito(idClienteFinal, totalNeto);
    } 
    // ✅ Si es CONTADO -> registrar ingreso en caja
    else {
      const nombreCliente = clienteData ? ` - ${clienteData.nombre_cliente}` : '';
      await Caja.registrarMovimiento({
        tipo: 'ingreso',
        concepto: `Venta de contado #${idVenta}${nombreCliente}`,
        monto: totalNeto,
        fecha_mov: fechaVenta,
        referencia_tipo: 'venta',
        referencia_id: idVenta,
        notas: efectivoNum ? `Efectivo recibido: Q${efectivoNum.toFixed(2)}` : null
      });
    }

    const ventaCreada = await Venta.obtenerVentaBasica(idVenta);
    return res.status(201).json(ventaCreada);

  } catch (err) {
    console.error('Error al crear venta:', err);
    if (err.message && err.message.startsWith('Existencia insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al crear la venta.' });
  }
}

module.exports = {
  listarVentas,
  crearVenta
};