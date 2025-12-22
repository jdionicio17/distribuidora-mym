 // Sidebar toggle + año
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
  }
  document.getElementById('year').textContent = new Date().getFullYear();

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => (Number(n||0)).toFixed(2);

  const desde = $('desde');
  const hasta = $('hasta');
  const gran = $('granularidad');

  const loading = $('loading');
  const tbVentas = $('tbVentas');
  const tbMas = $('tbMasVendidos');
  const tbMenos = $('tbMenosVendidos');
  const tbCxc = $('tbCxc');
  const tbCxp = $('tbCxp');
  const tbStock = $('tbStock');

  const kpiIng = $('kpiIng');
  const kpiEgr = $('kpiEgr');
  const kpiCaja = $('kpiCaja');

  const kpiCxcTotal = $('kpiCxcTotal');
  const kpiCxcPagado = $('kpiCxcPagado');
  const kpiCxcSaldo = $('kpiCxcSaldo');
  const kpiCxcVenc = $('kpiCxcVenc');

  const kpiVentas = $('kpiVentas');
  const kpiCosto = $('kpiCosto');
  const kpiUtilidad = $('kpiUtilidad');

  function fillEmpty(tbody, cols) {
    tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-row"><i class="fa-solid fa-inbox"></i> Sin datos en este rango</td></tr>`;
  }

  function qParams() {
    const p = new URLSearchParams();
    if (desde.value) p.set('desde', desde.value);
    if (hasta.value) p.set('hasta', hasta.value);
    return p;
  }

  // Formatear fecha y hora
  function formatDateTime(datetime) {
    if (!datetime) return '—';
    const d = new Date(datetime);
    const fecha = d.toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const hora = d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    return `<div class="datetime-display"><span class="date">${fecha}</span><br><span class="time">${hora}</span></div>`;
  }

  // Formatear solo fecha
  function formatDate(date) {
    if (!date) return '—';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Badge de estado
  function getEstadoBadge(estado) {
    const badges = {
      'pendiente': '<span class="badge badge-warning">Pendiente</span>',
      'parcial': '<span class="badge badge-info">Parcial</span>',
      'pagada': '<span class="badge badge-success">Pagada</span>',
      'anulada': '<span class="badge badge-secondary">Anulada</span>',
      'registrada': '<span class="badge badge-info">Registrada</span>'
    };
    return badges[estado] || `<span class="badge badge-secondary">${estado}</span>`;
  }

  async function loadVentas() {
    const p = qParams();
    p.set('granularidad', gran.value);
    const res = await fetch(`${API_BASE}/api/reportes/ventas?${p.toString()}`);
    const data = await res.json();

    tbVentas.innerHTML = '';
    if (!data || data.length === 0) return fillEmpty(tbVentas, 5);

    for (const r of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.periodo}</strong></td>
        <td class="text-center"><span class="badge badge-info">${r.cantidad_ventas}</span></td>
        <td class="text-right"><strong>Q ${fmt(r.total_neto)}</strong></td>
        <td class="text-right">Q ${fmt(r.total_contado)}</td>
        <td class="text-right">Q ${fmt(r.total_credito)}</td>
      `;
      tbVentas.appendChild(tr);
    }
  }

  async function loadProductos() {
    const p = qParams();
    p.set('limit', '10');

    const [masRes, menosRes] = await Promise.all([
      fetch(`${API_BASE}/api/reportes/productos/mas-vendidos?${p.toString()}`),
      fetch(`${API_BASE}/api/reportes/productos/menos-vendidos?${p.toString()}`)
    ]);

    const mas = await masRes.json();
    const menos = await menosRes.json();

    tbMas.innerHTML = '';
    if (!mas || mas.length === 0) fillEmpty(tbMas, 3);
    else {
      for (const r of mas) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.nombre_producto}</strong></td>
          <td class="text-center"><span class="badge badge-success">${r.cantidad_vendida}</span></td>
          <td class="text-right"><strong>Q ${fmt(r.monto_vendido)}</strong></td>
        `;
        tbMas.appendChild(tr);
      }
    }

    tbMenos.innerHTML = '';
    if (!menos || menos.length === 0) fillEmpty(tbMenos, 3);
    else {
      for (const r of menos) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.nombre_producto}</strong></td>
          <td class="text-center"><span class="badge badge-warning">${r.cantidad_vendida}</span></td>
          <td class="text-right">Q ${fmt(r.monto_vendido)}</td>
        `;
        tbMenos.appendChild(tr);
      }
    }
  }

  async function loadCuentas() {
    const p = qParams();
    const [cxcRes, cxpRes] = await Promise.all([
      fetch(`${API_BASE}/api/reportes/cxc?${p.toString()}`),
      fetch(`${API_BASE}/api/reportes/cxp?${p.toString()}`)
    ]);

    const cxc = await cxcRes.json();
    const cxp = await cxpRes.json();

    // KPI CxC
    kpiCxcTotal.textContent = fmt(cxc?.resumen?.monto_total);
    kpiCxcPagado.textContent = fmt(cxc?.resumen?.total_pagado);
    kpiCxcSaldo.textContent = fmt(cxc?.resumen?.saldo_pendiente);
    kpiCxcVenc.textContent = String(cxc?.resumen?.vencidas || 0);

    tbCxc.innerHTML = '';
    const cxcRows = cxc?.cuentas || [];
    if (cxcRows.length === 0) fillEmpty(tbCxc, 6);
    else {
      for (const r of cxcRows.slice(0, 30)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center"><strong>#${r.id_cuenta_cobrar}</strong></td>
          <td>
            <strong>${r.nombre_cliente}</strong><br>
            <small style="color:#9ca3af">${r.nit || 'C/F'}</small>
          </td>
          <td>
            ${r.descripcion}
            ${r.vencida ? '<br><span class="badge badge-danger"><i class="fa-solid fa-clock"></i> Vencida</span>' : ''}
          </td>
          <td class="text-right"><strong>Q ${fmt(r.saldo_pendiente)}</strong></td>
          <td class="text-center">${formatDate(r.fecha_vencimiento)}</td>
          <td class="text-center">${getEstadoBadge(r.estado)}</td>
        `;
        tbCxc.appendChild(tr);
      }
    }

    tbCxp.innerHTML = '';
    const cxpRows = cxp?.cuentas || [];
    if (cxpRows.length === 0) fillEmpty(tbCxp, 6);
    else {
      for (const r of cxpRows.slice(0, 30)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center"><strong>#${r.id_cuenta_pagar}</strong></td>
          <td><strong>${r.nombre_proveedor || 'Sin proveedor'}</strong></td>
          <td>
            ${r.descripcion}
            ${r.vencida ? '<br><span class="badge badge-danger"><i class="fa-solid fa-clock"></i> Vencida</span>' : ''}
          </td>
          <td class="text-right"><strong>Q ${fmt(r.saldo_pendiente)}</strong></td>
          <td class="text-center">${formatDate(r.fecha_vencimiento)}</td>
          <td class="text-center">${getEstadoBadge(r.estado)}</td>
        `;
        tbCxp.appendChild(tr);
      }
    }
  }

  async function loadCaja() {
    const p = qParams();
    const res = await fetch(`${API_BASE}/api/reportes/caja?${p.toString()}`);
    const data = await res.json();
    kpiIng.textContent = fmt(data.ingresos);
    kpiEgr.textContent = fmt(data.egresos);
    kpiCaja.textContent = fmt(data.saldo_en_caja);
  }

  async function loadInventario() {
    const res = await fetch(`${API_BASE}/api/reportes/inventario/bajo-stock`);
    const data = await res.json();
    tbStock.innerHTML = '';
    if (!data || data.length === 0) return fillEmpty(tbStock, 5);

    for (const r of data) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center"><strong>#${r.id_producto}</strong></td>
        <td><strong>${r.nombre_producto}</strong></td>
        <td class="text-center"><span class="badge badge-danger">${r.stock_actual}</span></td>
        <td class="text-center"><span class="badge badge-warning">${r.stock_minimo}</span></td>
        <td class="text-center"><strong class="stat-trend down"><i class="fa-solid fa-arrow-down"></i> ${fmt(r.faltante)}</strong></td>
      `;
      tbStock.appendChild(tr);
    }
  }

  async function loadUtilidad() {
    const p = qParams();
    const res = await fetch(`${API_BASE}/api/reportes/utilidad?${p.toString()}`);
    const data = await res.json();
    kpiVentas.textContent = fmt(data.ventas);
    kpiCosto.textContent = fmt(data.costo_estimado);
    kpiUtilidad.textContent = fmt(data.utilidad_estimada);
  }

  async function cargarTodo() {
    try {
      loading.classList.add('active');
      await Promise.all([
        loadCaja(),
        loadUtilidad(),
        loadVentas(),
        loadProductos(),
        loadCuentas(),
        loadInventario()
      ]);
    } catch (e) {
      console.error(e);
      alert('Error cargando reportes. Revisa la consola para más detalles.');
    } finally {
      loading.classList.remove('active');
    }
  }

  // Función para exportar tablas a CSV
  function exportarTabla(tbodyId, nombreArchivo) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    const table = tbody.closest('table');
    const rows = Array.from(table.querySelectorAll('tr'));
    
    let csv = '';
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowData = cells.map(cell => {
        let text = cell.textContent.trim();
        text = text.replace(/"/g, '""'); // Escapar comillas
        return `"${text}"`;
      }).join(',');
      csv += rowData + '\n';
    });
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  document.getElementById('btnCargar').addEventListener('click', cargarTodo);

  // defaults: últimos 30 días
  (function init(){
    const hoy = new Date();
    const h = new Date(hoy);
    const d = new Date(hoy);
    d.setDate(d.getDate() - 30);

    const toISO = (x) => x.toISOString().slice(0,10);
    desde.value = toISO(d);
    hasta.value = toISO(h);

    cargarTodo();
  })();