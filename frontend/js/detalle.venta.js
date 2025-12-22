// Sidebar + año
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const yearSpan = document.getElementById('year');
if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// API
const API = `${API_BASE}/api/ventas-detalle`;

// DOM filtros
const form = document.getElementById('formFiltrosVentas');
const f_id = document.getElementById('f_id_venta');
const f_cliente = document.getElementById('f_cliente');
const f_dia = document.getElementById('f_dia');
const f_mes = document.getElementById('f_mes');
const btnLimpiar = document.getElementById('btnLimpiar');

// Tabla
const tbody = document.querySelector('#tablaVentas tbody');

// Modal
const modal = document.getElementById('modalDetalle');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const m_id = document.getElementById('m_id');
const m_fecha = document.getElementById('m_fecha');
const m_cliente = document.getElementById('m_cliente');
const m_tipo = document.getElementById('m_tipo');
const m_estado = document.getElementById('m_estado');
const m_bruto = document.getElementById('m_bruto');
const m_descuento = document.getElementById('m_descuento');
const m_neto = document.getElementById('m_neto');
const m_efectivo = document.getElementById('m_efectivo');
const m_cambio = document.getElementById('m_cambio');
const m_items_count = document.getElementById('m_items_count');
const itemsBody = document.querySelector('#tablaItems tbody');

function moneyQ(n){ return `Q ${Number(n || 0).toFixed(2)}`; }

function badgeEstado(estado){
  const e = String(estado || '').toLowerCase();
  if (e === 'pagada') return `<span class="badge b-ok">pagada</span>`;
  if (e === 'pendiente') return `<span class="badge b-warn">pendiente</span>`;
  if (e === 'anulada') return `<span class="badge b-bad">anulada</span>`;
  return `<span class="badge">${estado || ''}</span>`;
}

// ✅ FUNCIÓN MEJORADA - Formatea fechas correctamente
function formatDateTime(v){
  if (!v) return '--';

  // MySQL devuelve formato: 'YYYY-MM-DD HH:mm:ss'
  // Reemplazamos el espacio con 'T' para que JavaScript lo parsee correctamente
  const dateStr = String(v).replace(' ', 'T');
  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return String(v);

  // Formato personalizado: DD/MM/YYYY HH:mm:ss
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const año = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${año} ${hora}:${min}:${seg}`;
}

async function cargarVentas(){
  const url = new URL(API, window.location.origin);

  const idv = f_id.value ? Number(f_id.value) : null;
  const cli = f_cliente.value.trim();
  const dia = f_dia.value;
  const mes = f_mes.value;

  if (idv) url.searchParams.set('id_venta', idv);
  if (cli) url.searchParams.set('cliente', cli);

  // prioridad: día o mes
  if (dia) {
    url.searchParams.set('dia', dia);
  } else if (mes) {
    url.searchParams.set('mes', mes);
  }

  url.searchParams.set('limit', 50);

  const res = await fetch(url.toString());
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    alert(data.message || 'Error al cargar ventas.');
    return;
  }

  renderTabla(data);
}

function renderTabla(rows){
  tbody.innerHTML = '';

  if (!rows || rows.length === 0){
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No se encontraron ventas con esos filtros.</td></tr>`;
    return;
  }

  rows.forEach(v => {
    const tr = document.createElement('tr');
    tr.dataset.id = v.id_venta;

    tr.innerHTML = `
      <td>${v.id_venta}</td>
      <td>${formatDateTime(v.fecha_venta || v.creado_en)}</td>
      <td>${v.nombre_cliente || 'Venta sin cliente'}</td>
      <td>${(v.tipo_venta || '').toLowerCase() === 'credito' ? 'Crédito' : 'Contado'}</td>
      <td>${moneyQ(v.total_neto)}</td>
      <td>${badgeEstado(v.estado)}</td>
      <td>
        <button class="btn-eye" type="button" title="Ver detalle">
          <i class="fa-solid fa-eye"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function verDetalle(id){
  const res = await fetch(`${API}/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok){
    alert(data.message || 'No se pudo cargar detalle.');
    return;
  }

  const h = data.header;
  const items = data.items || [];

  m_id.textContent = `#${h.id_venta}`;
  m_fecha.textContent = formatDateTime(h.fecha_venta || h.creado_en);
  m_cliente.textContent = h.nombre_cliente || 'Venta sin cliente';
  m_tipo.textContent = (h.tipo_venta || '').toLowerCase() === 'credito' ? 'Crédito' : 'Contado';
  m_estado.innerHTML = badgeEstado(h.estado);

  m_bruto.textContent = moneyQ(h.total_bruto);
  m_descuento.textContent = moneyQ(h.descuento_total);
  m_neto.textContent = moneyQ(h.total_neto);

  // En crédito puede venir null (lo mostramos igual)
  m_efectivo.textContent = h.efectivo_recibido == null ? '--' : moneyQ(h.efectivo_recibido);
  m_cambio.textContent = h.cambio == null ? '--' : moneyQ(h.cambio);

  m_items_count.textContent = `${items.length} producto(s)`;

  itemsBody.innerHTML = '';
  if (items.length === 0){
    itemsBody.innerHTML = `<tr><td colspan="5" class="empty-row">No hay detalles para esta venta.</td></tr>`;
  } else {
    items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.descripcion_producto}</td>
        <td class="right">${Number(it.cantidad || 0).toFixed(2)}</td>
        <td class="right">${moneyQ(it.precio_unitario)}</td>
        <td>${it.tipo_precio}</td>
        <td class="right">${moneyQ(it.subtotal)}</td>
      `;
      itemsBody.appendChild(tr);
    });
  }

  modal.classList.remove('modal-hidden');
}

// Eventos
form.addEventListener('submit', (e) => {
  e.preventDefault();
  cargarVentas();
});

btnLimpiar.addEventListener('click', () => {
  f_id.value = '';
  f_cliente.value = '';
  f_dia.value = '';
  f_mes.value = '';
  cargarVentas();
});

tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-eye');
  if (!btn) return;
  const tr = btn.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;
  if (id) verDetalle(id);
});

btnCerrarModal.addEventListener('click', () => modal.classList.add('modal-hidden'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('modal-hidden'); });

// Cargar al inicio (sin filtros: últimas 50)
cargarVentas();
