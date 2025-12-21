// backend/src/controllers/reportes.controller.js
const Reporte = require('../models/reporte.model');

function parseDateOrNull(v) {
  if (!v) return null;
  return String(v).slice(0, 10); // YYYY-MM-DD
}

function parseIntOr(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

async function ventasAgrupadas(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);
    const granularidad = (req.query.granularidad || 'dia').toLowerCase();

    const data = await Reporte.ventasAgrupadas({ desde, hasta, granularidad });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte ventasAgrupadas:', err);
    return res.status(500).json({ message: 'Error al generar reporte de ventas.' });
  }
}

async function productosMasVendidos(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);
    const limit = parseIntOr(req.query.limit, 10);

    const data = await Reporte.productosVendidosRanking({ desde, hasta, limit, orden: 'DESC' });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte productosMasVendidos:', err);
    return res.status(500).json({ message: 'Error al generar productos más vendidos.' });
  }
}

async function productosMenosVendidos(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);
    const limit = parseIntOr(req.query.limit, 10);

    const data = await Reporte.productosVendidosRanking({ desde, hasta, limit, orden: 'ASC' });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte productosMenosVendidos:', err);
    return res.status(500).json({ message: 'Error al generar productos menos vendidos.' });
  }
}

async function cxcDetalle(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);
    const estado = (req.query.estado || '').toLowerCase();

    const data = await Reporte.cxcDetalle({ desde, hasta, estado: estado || null });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte cxcDetalle:', err);
    return res.status(500).json({ message: 'Error al generar informe de cuentas por cobrar.' });
  }
}

async function cxpDetalle(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);
    const estado = (req.query.estado || '').toLowerCase();

    const data = await Reporte.cxpDetalle({ desde, hasta, estado: estado || null });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte cxpDetalle:', err);
    return res.status(500).json({ message: 'Error al generar informe de cuentas por pagar.' });
  }
}

async function resumenCaja(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);

    const data = await Reporte.resumenCaja({ desde, hasta });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte resumenCaja:', err);
    return res.status(500).json({ message: 'Error al generar reporte de caja.' });
  }
}

async function inventarioBajoStock(req, res) {
  try {
    const data = await Reporte.inventarioBajoStock();
    return res.json(data);
  } catch (err) {
    console.error('Error reporte inventarioBajoStock:', err);
    return res.status(500).json({ message: 'Error al generar reporte de inventario.' });
  }
}

async function utilidadEstimada(req, res) {
  try {
    const desde = parseDateOrNull(req.query.desde);
    const hasta = parseDateOrNull(req.query.hasta);

    const data = await Reporte.utilidadEstimada({ desde, hasta });
    return res.json(data);
  } catch (err) {
    console.error('Error reporte utilidadEstimada:', err);
    return res.status(500).json({ message: 'Error al generar reporte de utilidad.' });
  }
}

// (OPCIONAL) Debug: para confirmar BD y columnas de ventas
async function debugDb(req, res) {
  try {
    const data = await Reporte.debugDb();
    return res.json(data);
  } catch (err) {
    console.error('Error debugDb:', err);
    return res.status(500).json({ message: 'Error al consultar debug de base de datos.' });
  }
}

module.exports = {
  ventasAgrupadas,
  productosMasVendidos,
  productosMenosVendidos,
  cxcDetalle,
  cxpDetalle,
  resumenCaja,
  inventarioBajoStock,
  utilidadEstimada,
  debugDb, // opcional
};
