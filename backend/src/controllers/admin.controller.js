// backend/src/controllers/admin.controller.js
const Admin = require('../models/admin.model');

// GET /api/admin/dashboard
async function dashboard(req, res) {
  try {
    const data = await Admin.dashboardResumen();
    return res.json(data);
  } catch (err) {
    console.error('Error admin dashboard:', err);
    return res.status(500).json({ message: 'Error al cargar dashboard.' });
  }
}

module.exports = {
  dashboard
};
