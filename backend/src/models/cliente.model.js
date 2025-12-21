// backend/src/models/cliente.model.js
const db = require('../config/db');

// Listar todos
async function listarClientes() {
  const [rows] = await db.query(
    `
    SELECT
      id_cliente,
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      saldo_credito,
      estado,
      notas,
      creado_en,
      actualizado_en
    FROM clientes
    ORDER BY nombre_cliente ASC
    `
  );
  return rows;
}

// Obtener por ID
async function obtenerPorId(id) {
  const [rows] = await db.query(
    `
    SELECT
      id_cliente,
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      saldo_credito,
      estado,
      notas,
      creado_en,
      actualizado_en
    FROM clientes
    WHERE id_cliente = ?
    `,
    [id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

// Buscar por NIT (para el módulo de ventas)
async function buscarPorNit(nit) {
  const [rows] = await db.query(
    `
    SELECT
      id_cliente,
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      saldo_credito,
      estado,
      notas,
      creado_en,
      actualizado_en
    FROM clientes
    WHERE nit = ?
    LIMIT 1
    `,
    [nit]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

// Crear
async function crearCliente({
  nombre_cliente,
  nit = null,
  telefono = null,
  direccion = null,
  email = null,
  limite_credito = 0,
  notas = null
}) {
  const [result] = await db.query(
    `
    INSERT INTO clientes (
      nombre_cliente, nit, telefono, direccion, email,
      limite_credito, saldo_credito, estado, notas
    )
    VALUES (?, ?, ?, ?, ?, ?, 0, 'activo', ?)
    `,
    [nombre_cliente, nit, telefono, direccion, email, limite_credito, notas]
  );
  return result.insertId;
}

// Actualizar
async function actualizarCliente(id, {
  nombre_cliente,
  nit = null,
  telefono = null,
  direccion = null,
  email = null,
  limite_credito = 0,
  estado = 'activo',
  notas = null
}) {
  await db.query(
    `
    UPDATE clientes
    SET
      nombre_cliente = ?,
      nit = ?,
      telefono = ?,
      direccion = ?,
      email = ?,
      limite_credito = ?,
      estado = ?,
      notas = ?
    WHERE id_cliente = ?
    `,
    [
      nombre_cliente,
      nit,
      telefono,
      direccion,
      email,
      limite_credito,
      estado,
      notas,
      id
    ]
  );
}

// Sumar al saldo de crédito (delta puede ser negativo)
async function sumarSaldoCredito(id_cliente, delta) {
  await db.query(
    `
    UPDATE clientes
    SET saldo_credito = saldo_credito + ?
    WHERE id_cliente = ?
    `,
    [delta, id_cliente]
  );
}

module.exports = {
  listarClientes,
  obtenerPorId,
  buscarPorNit,
  crearCliente,
  actualizarCliente,
  sumarSaldoCredito
};
