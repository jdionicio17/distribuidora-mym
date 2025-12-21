// backend/src/controllers/cuentasCobrar.controller.js
const CxC = require('../models/cuentaCobrar.model');
const Cliente = require('../models/cliente.model');
const Caja = require('../models/caja.model');

// GET /api/cuentas-cobrar
async function listarCuentas(req, res) {
  try {
    const cuentas = await CxC.listarCuentas();
    return res.json(cuentas);
  } catch (err) {
    console.error('Error al listar cuentas por cobrar:', err);
    return res.status(500).json({ message: 'Error al listar las cuentas por cobrar.' });
  }
}

// GET /api/cuentas-cobrar/:id
async function obtenerCuenta(req, res) {
  try {
    const { id } = req.params;
    const data = await CxC.obtenerPorId(id);
    if (!data) {
      return res.status(404).json({ message: 'Cuenta por cobrar no encontrada.' });
    }
    return res.json(data);
  } catch (err) {
    console.error('Error al obtener cuenta por cobrar:', err);
    return res.status(500).json({ message: 'Error al obtener la cuenta por cobrar.' });
  }
}

// POST /api/cuentas-cobrar/:id/abonos
async function registrarPago(req, res) {
  try {
    const { id } = req.params;
    const { fecha_pago, monto_pagado, metodo_pago, referencia, notas } = req.body || {};

    const montoNum = Number(monto_pagado);
    if (!montoNum || montoNum <= 0) {
      return res.status(400).json({ message: 'El monto del pago debe ser mayor a 0.' });
    }
    if (!fecha_pago) {
      return res.status(400).json({ message: 'La fecha de pago es obligatoria.' });
    }
    if (!metodo_pago) {
      return res.status(400).json({ message: 'El método de pago es obligatorio.' });
    }

    const cuenta = await CxC.obtenerPorId(id);
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por cobrar no encontrada.' });
    }

    // Registrar pago en tablas de CxC y actualizar venta
    const result = await CxC.registrarPago({
      id_cuenta_cobrar: Number(id),
      fecha_pago,
      monto_pagado: montoNum,
      metodo_pago,
      referencia: referencia || null,
      notas: notas || null
    });

    // Disminuir saldo de crédito del cliente
    await Cliente.sumarSaldoCredito(cuenta.id_cliente, -montoNum);

    // ✅ REGISTRAR INGRESO EN CAJA
    await Caja.registrarMovimiento({
      tipo: 'ingreso',
      concepto: `Cobro de ${cuenta.descripcion} - ${cuenta.nombre_cliente}`,
      monto: montoNum,
      fecha_mov: new Date(fecha_pago + 'T12:00:00'),
      referencia_tipo: 'cobro_cxc',
      referencia_id: result.id_pago_cxc,
      notas: `Método: ${metodo_pago}${referencia ? ', Ref: ' + referencia : ''}`
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error al registrar pago de cuenta por cobrar:', err);
    return res.status(500).json({ message: 'Error al registrar el pago.' });
  }
}

module.exports = {
  listarCuentas,
  obtenerCuenta,
  registrarPago
};