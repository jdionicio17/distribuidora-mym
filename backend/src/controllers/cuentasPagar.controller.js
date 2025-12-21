// backend/src/controllers/cuentasPagar.controller.js
const CxP = require('../models/cuentaPagar.model');
const Proveedor = require('../models/proveedor.model');
const Caja = require('../models/caja.model');

// GET /api/cuentas-pagar
async function listarCuentas(req, res) {
  try {
    const cuentas = await CxP.listarCuentas();
    return res.json(cuentas);
  } catch (err) {
    console.error('Error al listar cuentas por pagar:', err);
    return res.status(500).json({ message: 'Error al listar las cuentas por pagar.' });
  }
}

// GET /api/cuentas-pagar/:id
async function obtenerCuenta(req, res) {
  try {
    const { id } = req.params;
    const data = await CxP.obtenerPorId(id);

    if (!data) {
      return res.status(404).json({ message: 'Cuenta por pagar no encontrada.' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error al obtener cuenta por pagar:', err);
    return res.status(500).json({ message: 'Error al obtener la cuenta por pagar.' });
  }
}

// POST /api/cuentas-pagar   (crear manualmente)
async function crearCuentaManual(req, res) {
  try {
    const {
      descripcion,
      monto_total,
      fecha_registro,
      fecha_vencimiento,
      beneficiario,
      categoria,
      notas,
      id_proveedor
    } = req.body || {};

    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ message: 'La descripción es obligatoria.' });
    }

    const montoNum = Number(monto_total);
    if (!montoNum || montoNum <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
    }

    if (!fecha_registro) {
      return res.status(400).json({ message: 'La fecha de registro es obligatoria.' });
    }

    const idNueva = await CxP.crearManual({
      descripcion: descripcion.trim(),
      monto_total: montoNum,
      fecha_registro,
      fecha_vencimiento: fecha_vencimiento || null,
      beneficiario: beneficiario || null,
      categoria: categoria || null,
      notas: notas || null,
      id_proveedor: id_proveedor || null
    });

    const data = await CxP.obtenerPorId(idNueva);
    return res.status(201).json(data);
  } catch (err) {
    console.error('Error al crear cuenta por pagar:', err);
    return res.status(500).json({ message: 'Error al crear la cuenta por pagar.' });
  }
}

// POST /api/cuentas-pagar/:id/abonos
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

    const cuenta = await CxP.obtenerPorId(id);
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por pagar no encontrada.' });
    }

    // Registrar pago en tablas de CxP
    const result = await CxP.registrarPago({
      id_cuenta_pagar: Number(id),
      fecha_pago,
      monto_pagado: montoNum,
      metodo_pago,
      referencia: referencia || null,
      notas: notas || null
    });

    // Disminuir saldo de crédito del proveedor
    if (cuenta.id_proveedor) {
      await Proveedor.sumarSaldoCredito(cuenta.id_proveedor, -montoNum);
    }

    // ✅ REGISTRAR EGRESO EN CAJA
    await Caja.registrarMovimiento({
      tipo: 'egreso',
      concepto: `Pago de ${cuenta.descripcion}${cuenta.nombre_proveedor ? ' - ' + cuenta.nombre_proveedor : ''}`,
      monto: montoNum,
      fecha_mov: new Date(fecha_pago + 'T12:00:00'),
      referencia_tipo: 'pago_cxp',
      referencia_id: result.id_pago_cxp,
      notas: `Método: ${metodo_pago}${referencia ? ', Ref: ' + referencia : ''}`
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error al registrar pago de cuenta por pagar:', err);
    return res.status(500).json({ message: 'Error al registrar el pago.' });
  }
}

module.exports = {
  listarCuentas,
  obtenerCuenta,
  crearCuentaManual,
  registrarPago
};