// backend/src/controllers/ventasDetalle.controller.js
const VentasDetalle = require('../models/ventasDetalle.model');

function parseIntOr(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function parseDateOrNull(v) {
  if (!v) return null;
  return String(v).slice(0, 10);
}

function parseMonthOrNull(v) {
  if (!v) return null;
  return String(v).slice(0, 7); // YYYY-MM
}

// GET /api/ventas-detalle?cliente=&id_venta=&dia=&mes=&limit=
async function listar(req, res) {
  try {
    const id_venta = req.query.id_venta ? Number(req.query.id_venta) : null;
    const cliente  = req.query.cliente ? String(req.query.cliente) : null;
    const dia      = parseDateOrNull(req.query.dia);
    const mes      = parseMonthOrNull(req.query.mes);
    const limit    = parseIntOr(req.query.limit, 50);

    const data = await VentasDetalle.listarVentasDetalle({ id_venta, cliente, dia, mes, limit });
    return res.json(data);
  } catch (err) {
    console.error('Error listar ventas detalle:', err);
    return res.status(500).json({ message: 'Error al listar detalle de ventas.' });
  }
}

// GET /api/ventas-detalle/:id
async function ver(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID inválido.' });

    const data = await VentasDetalle.obtenerVentaCompleta(id);
    if (!data) return res.status(404).json({ message: 'Venta no encontrada.' });

    return res.json(data);
  } catch (err) {
    console.error('Error ver venta detalle:', err);
    return res.status(500).json({ message: 'Error al obtener detalle de venta.' });
  }
}

module.exports = {
  listar,
  ver
};