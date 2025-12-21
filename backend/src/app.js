// backend/src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const usuariosRoutes     = require('./routes/usuarios.routes');
const proveedoresRoutes  = require('./routes/proveedores.routes');
const categoriasRoutes   = require('./routes/categorias.routes');
const authRoutes         = require('./routes/auth.routes');
const productosRoutes    = require('./routes/productos.routes');
const comprasRoutes      = require('./routes/compras.routes');
const cuentasPagarRoutes = require('./routes/cuentasPagar.routes');
const clientesRoutes     = require('./routes/clientes.routes');
const ventasRoutes       = require('./routes/ventas.routes');
const cuentasCobrarRoutes= require('./routes/cuentasCobrar.routes');
const reportesRoutes     = require('./routes/reportes.routes');
const adminRoutes        = require('./routes/admin.routes');
const ventasDetalleRoutes = require('./routes/ventasDetalle.routes');
const cajaRoutes         = require('./routes/caja.routes'); // ✅ NUEVO

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FRONTEND_PATH = path.join(__dirname, '../../frontend');
app.use(express.static(FRONTEND_PATH));

app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// Rutas backend
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/cuentas-pagar', cuentasPagarRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cuentas-cobrar', cuentasCobrarRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ventas-detalle', ventasDetalleRoutes);
app.use('/api/caja', cajaRoutes); // ✅ NUEVO

// Test MySQL...
const db = require('./config/db');
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Conectado a MySQL');
  } catch (err) {
    console.log('❌ Error conectando a MySQL:', err.message);
  }
})();

module.exports = app;