// backend/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usuariosRoutes      = require('./routes/usuarios.routes');
const proveedoresRoutes   = require('./routes/proveedores.routes');
const categoriasRoutes    = require('./routes/categorias.routes');
const authRoutes          = require('./routes/auth.routes');
const productosRoutes     = require('./routes/productos.routes');
const comprasRoutes       = require('./routes/compras.routes');
const cuentasPagarRoutes  = require('./routes/cuentasPagar.routes');
const clientesRoutes      = require('./routes/clientes.routes');
const ventasRoutes        = require('./routes/ventas.routes');
const cuentasCobrarRoutes = require('./routes/cuentasCobrar.routes');
const reportesRoutes      = require('./routes/reportes.routes');
const adminRoutes         = require('./routes/admin.routes');
const ventasDetalleRoutes = require('./routes/ventasDetalle.routes');
const cajaRoutes          = require('./routes/caja.routes');

const app = express();

// ✅ CORS (por ahora abierto para que Netlify/Render Static funcione)
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check (para probar que está vivo y “despertarlo”)
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'distribuidora-mym-api' });
});

// ✅ Ruta base simple
app.get('/', (req, res) => {
  res.status(200).json({ ok: true, msg: 'API Distribuidora MyM funcionando' });
});

// Rutas API
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
app.use('/api/caja', cajaRoutes);

// ✅ Test MySQL al arrancar (opcional; está bien tenerlo)
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
