// backend/src/controllers/caja.controller.js
const Caja = require('../models/caja.model');

// GET /api/caja/resumen
async function obtenerResumen(req, res) {
  try {
    const { desde, hasta } = req.query;
    const resumen = await Caja.obtenerResumen({ desde, hasta });
    return res.json(resumen);
  } catch (err) {
    console.error('Error al obtener resumen de caja:', err);
    return res.status(500).json({ message: 'Error al obtener resumen de caja.' });
  }
}

// GET /api/caja/movimientos
async function listarMovimientos(req, res) {
  try {
    const { desde, hasta, tipo, limit } = req.query;
    const movimientos = await Caja.listarMovimientos({
      desde,
      hasta,
      tipo,
      limit: limit ? Number(limit) : 100
    });
    return res.json(movimientos);
  } catch (err) {
    console.error('Error al listar movimientos de caja:', err);
    return res.status(500).json({ message: 'Error al listar movimientos de caja.' });
  }
}

// POST /api/caja/movimientos
async function registrarMovimiento(req, res) {
  try {
    const { tipo, concepto, monto, fecha_mov, referencia_tipo, referencia_id, notas } = req.body;

    if (!tipo || !['ingreso', 'egreso'].includes(tipo)) {
      return res.status(400).json({ message: 'El tipo debe ser "ingreso" o "egreso".' });
    }

    if (!concepto || !concepto.trim()) {
      return res.status(400).json({ message: 'El concepto es obligatorio.' });
    }

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' });
    }

    const idMovimiento = await Caja.registrarMovimiento({
      tipo,
      concepto: concepto.trim(),
      monto: montoNum,
      fecha_mov: fecha_mov ? new Date(fecha_mov) : new Date(),
      referencia_tipo: referencia_tipo || null,
      referencia_id: referencia_id ? Number(referencia_id) : null,
      notas: notas || null
    });

    return res.status(201).json({
      message: 'Movimiento registrado correctamente.',
      id_movimiento: idMovimiento
    });
  } catch (err) {
    console.error('Error al registrar movimiento de caja:', err);
    return res.status(500).json({ message: 'Error al registrar movimiento de caja.' });
  }
}

module.exports = {
  obtenerResumen,
  listarMovimientos,
  registrarMovimiento
};