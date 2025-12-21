// backend/src/routes/ventasDetalle.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ventasDetalle.controller');

router.get('/', ctrl.listar);
router.get('/:id', ctrl.ver);

module.exports = router;