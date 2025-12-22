// ===== Sidebar + año =====
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar       = document.getElementById('sidebar');
const yearSpan      = document.getElementById('year');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
  });
}
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// ====== CONSTANTES API ======
const API_CLIENTES = `${API_BASE}/api/clientes`;

// ====== ELEMENTOS DOM ======
const tablaClientesBody   = document.querySelector('#tablaClientes tbody');

const btnNuevoCliente     = document.getElementById('btnNuevoCliente');
const modalCliente        = document.getElementById('modalCliente');
const btnCerrarModalCliente = document.getElementById('btnCerrarModalCliente');
const btnCancelarCliente  = document.getElementById('btnCancelarCliente');
const btnGuardarCliente   = document.getElementById('btnGuardarCliente');
const formCliente         = document.getElementById('formCliente');

const nombreInput         = document.getElementById('nombre_cliente');
const nitInput            = document.getElementById('nit_cliente');
const telInput            = document.getElementById('telefono_cliente');
const emailInput          = document.getElementById('email_cliente');
const direccionInput      = document.getElementById('direccion_cliente');
const limiteCreditoInput  = document.getElementById('limite_credito_cliente');
const notasInput          = document.getElementById('notas_cliente');

// ====== MODAL ======
function abrirModalCliente() {
  modalCliente.classList.add('open');
}
function cerrarModalCliente() {
  modalCliente.classList.remove('open');
  formCliente.reset();
  limiteCreditoInput.value = 0;
}

// ====== AYUDAS ======
function formatearMoneda(q) {
  return (Number(q) || 0).toFixed(2);
}

// ====== CARGAR CLIENTES ======
async function cargarClientes() {
  try {
    const res = await fetch(API_CLIENTES);
    if (!res.ok) throw new Error('Error al listar clientes');
    const clientes = await res.json();

    tablaClientesBody.innerHTML = '';

    if (!clientes || clientes.length === 0) {
      tablaClientesBody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-row">
            No hay clientes registrados todavía.
          </td>
        </tr>
      `;
      return;
    }

    clientes.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id_cliente}</td>
        <td>
          <strong>${c.nombre_cliente}</strong><br>
          <span style="font-size:0.8rem; color:#666;">
            ${c.direccion || ''} ${c.email ? ' · ' + c.email : ''}
          </span>
        </td>
        <td>${c.nit || 'CF'}</td>
        <td>${c.telefono || ''}</td>
        <td>Q ${formatearMoneda(c.limite_credito)}</td>
        <td>Q ${formatearMoneda(c.saldo_credito)}</td>
        <td>
          <span class="badge ${
            c.estado === 'activo' ? 'badge-success' : 'badge-secondary'
          }">${c.estado}</span>
        </td>
        <td class="tabla-acciones">
          <button type="button" class="btn-icon" title="(futuro) Ver créditos">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </button>
        </td>
      `;
      tablaClientesBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert('Error al cargar los clientes.');
  }
}

// ====== GUARDAR CLIENTE ======
btnGuardarCliente.addEventListener('click', async () => {
  const nombre      = nombreInput.value.trim();
  const nit         = nitInput.value.trim() || null;
  const telefono    = telInput.value.trim() || null;
  const email       = emailInput.value.trim() || null;
  const direccion   = direccionInput.value.trim() || null;
  const notas       = notasInput.value.trim() || null;
  const limiteCred  = parseFloat(limiteCreditoInput.value || '0');

  if (!nombre) {
    alert('El nombre del cliente es obligatorio.');
    return;
  }
  if (limiteCred < 0) {
    alert('El límite de crédito no puede ser negativo.');
    return;
  }

  const payload = {
    nombre_cliente: nombre,
    nit,
    telefono,
    direccion,
    email,
    limite_credito: limiteCred,
    notas
  };

  try {
    const res = await fetch(API_CLIENTES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || 'Error al guardar el cliente.');
      return;
    }

    alert('Cliente registrado correctamente.');
    cerrarModalCliente();
    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al guardar el cliente.');
  }
});

// ====== LISTENERS DE MODAL ======
btnNuevoCliente.addEventListener('click', () => {
  cerrarModalCliente();
  abrirModalCliente();
});
btnCerrarModalCliente.addEventListener('click', cerrarModalCliente);
btnCancelarCliente.addEventListener('click', cerrarModalCliente);

modalCliente.addEventListener('click', (e) => {
  if (e.target === modalCliente) cerrarModalCliente();
});

// ====== INIT ======
(async function initClientes() {
  await cargarClientes();
})();
