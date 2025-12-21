// backend/src/routes/reportes.routes.js
const express = require('express');
const router = express.Router();

const ReportesController = require('../controllers/reportes.controller');

// (OPCIONAL) Debug
router.get('/_debug/db', ReportesController.debugDb);

// Ventas
router.get('/ventas', ReportesController.ventasAgrupadas);

// Productos
router.get('/productos/mas-vendidos', ReportesController.productosMasVendidos);
router.get('/productos/menos-vendidos', ReportesController.productosMenosVendidos);

// Cuentas
router.get('/cxc', ReportesController.cxcDetalle);
router.get('/cxp', ReportesController.cxpDetalle);

// Caja e inventario
router.get('/caja', ReportesController.resumenCaja);
router.get('/inventario/bajo-stock', ReportesController.inventarioBajoStock);

// Utilidad
router.get('/utilidad', ReportesController.utilidadEstimada);

module.exports = router;
