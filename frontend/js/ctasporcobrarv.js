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

  // ===== FORMATO FECHA/HORA =====
  function formatearFechaHoraGT(valor) {
    if (!valor) return '';
    let iso = valor;
    if (typeof valor === 'string' && valor.length === 19 && valor[10] === ' ') {
      iso = valor.replace(' ', 'T');
    }
    const d = new Date(iso);
    const f = new Intl.DateTimeFormat('es-GT', {
      timeZone: 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const parts = f.formatToParts(d);
    let day='00', month='00', year='0000';
    let hour='00', minute='00', second='00', dayPeriod='';
    for (const p of parts) {
      switch (p.type) {
        case 'day': day = p.value; break;
        case 'month': month = p.value; break;
        case 'year': year = p.value; break;
        case 'hour': hour = p.value; break;
        case 'minute': minute = p.value; break;
        case 'second': second = p.value; break;
        case 'dayPeriod': dayPeriod = p.value; break;
      }
    }
    let ampm = dayPeriod.toUpperCase().replace(/\./g,'').replace(/\s+/g,'');
    if (ampm !== 'AM' && ampm !== 'PM') {
      ampm = dayPeriod.toUpperCase().includes('P') ? 'PM' : 'AM';
    }
    return `${day}/${month}/${year}, ${hour}:${minute}:${second} ${ampm}`;
  }

  function formatearFechaGT(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    const f = new Intl.DateTimeFormat('es-GT', {
      timeZone: 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return f.format(d);
  }

  function formatearMoneda(q) {
    return (Number(q) || 0).toFixed(2);
  }

  // ===== API =====
 const API_CXC = `${API_BASE}/api/cuentas-cobrar`;


  // ===== DOM =====
  const tablaCxcBody           = document.querySelector('#tablaCuentasCobrar tbody');
  const modalDetalleCxC        = document.getElementById('modalDetalleCxC');
  const btnCerrarModalDetalleCxC  = document.getElementById('btnCerrarModalDetalleCxC');
  const btnCerrarModalDetalleCxC2 = document.getElementById('btnCerrarModalDetalleCxC2');
  const detalleCxCHeader       = document.getElementById('detalleCxCHeader');

  const formPagoCxC            = document.getElementById('formPagoCxC');
  const idCxcPagoHidden        = document.getElementById('id_cxc_pago');
  const fechaPagoCxCInput      = document.getElementById('fecha_pago_cxc');
  const montoPagoCxCInput      = document.getElementById('monto_pago_cxc');
  const metodoPagoCxCSelect    = document.getElementById('metodo_pago_cxc');
  const referenciaPagoCxCInput = document.getElementById('referencia_pago_cxc');
  const notasPagoCxCInput      = document.getElementById('notas_pago_cxc');
  const btnGuardarPagoCxC      = document.getElementById('btnGuardarPagoCxC');

  // ===== MODAL =====
  function abrirModalDetalleCxC() {
    modalDetalleCxC.classList.add('open');
  }
  function cerrarModalDetalleCxC() {
    modalDetalleCxC.classList.remove('open');
    formPagoCxC.reset();
  }

  btnCerrarModalDetalleCxC.addEventListener('click', cerrarModalDetalleCxC);
  btnCerrarModalDetalleCxC2.addEventListener('click', cerrarModalDetalleCxC);
  modalDetalleCxC.addEventListener('click', (e) => {
    if (e.target === modalDetalleCxC) cerrarModalDetalleCxC();
  });

  // ===== CARGAR CUENTAS POR COBRAR =====
  async function cargarCuentasCobrar() {
    try {
      const res = await fetch(API_CXC);
      if (!res.ok) throw new Error('Error al listar cuentas por cobrar');
      const cuentas = await res.json();

      tablaCxcBody.innerHTML = '';

      if (!cuentas || cuentas.length === 0) {
        tablaCxcBody.innerHTML = `
          <tr>
            <td colspan="9" class="empty-row">
              No hay cuentas por cobrar registradas todavía.
            </td>
          </tr>
        `;
        return;
      }

      cuentas.forEach(c => {
        const fechaReg = c.creado_en
          ? formatearFechaHoraGT(c.creado_en)
          : (c.fecha_registro ? formatearFechaGT(c.fecha_registro) : '');
        const fechaVen = c.fecha_vencimiento ? formatearFechaGT(c.fecha_vencimiento) : '—';

        const tr = document.createElement('tr');
        tr.dataset.id = c.id_cuenta_cobrar;
        tr.innerHTML = `
          <td>${c.id_cuenta_cobrar}</td>
          <td>
            <strong>${c.nombre_cliente || ''}</strong><br>
            <span style="font-size:0.8rem; color:#666;">
              ${c.descripcion || ''} 
            </span>
          </td>
          <td>Q ${formatearMoneda(c.monto_total)}</td>
          <td>Q ${formatearMoneda(c.total_pagado)}</td>
          <td>Q ${formatearMoneda(c.saldo_pendiente)}</td>
          <td>${fechaReg}</td>
          <td>${fechaVen}</td>
          <td>
            <span class="badge ${
              c.estado === 'pagada' ? 'badge-success' :
              c.estado === 'anulada' ? 'badge-danger' :
              c.estado === 'parcial' ? 'badge-warning' : 'badge-secondary'
            }">${c.estado}</span>
          </td>
          <td class="tabla-acciones">
            <button type="button" class="btn-icon btn-ver-cxc" title="Ver / registrar pago">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        `;
        tablaCxcBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las cuentas por cobrar.');
    }
  }

  // ===== ABRIR DETALLE / PREPARAR PAGO =====
  tablaCxcBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver-cxc');
    if (!btn) return;

    const fila = btn.closest('tr');
    const id   = fila.dataset.id;
    if (!id) return;

    const cliente   = fila.children[1].querySelector('strong').innerText;
    const descLinea = fila.children[1].querySelector('span').innerText;
    const monto     = fila.children[2].innerText;
    const pagado    = fila.children[3].innerText;
    const saldo     = fila.children[4].innerText;
    const fechaReg  = fila.children[5].innerText;
    const fechaVen  = fila.children[6].innerText;
    const estado    = fila.children[7].innerText.trim();

    detalleCxCHeader.innerHTML = `
      <div><strong>Cuenta #${id}</strong> (${estado})</div>
      <div>Cliente: <strong>${cliente}</strong></div>
      <div>${descLinea}</div>
      <div>Monto: ${monto} · Pagado: ${pagado} · Saldo: ${saldo}</div>
      <div>Registro: ${fechaReg} · Vencimiento: ${fechaVen}</div>
    `;

    const hoy = new Date().toISOString().slice(0,10);
    fechaPagoCxCInput.value = hoy;
    idCxcPagoHidden.value = id;

    abrirModalDetalleCxC();
  });

  // ===== GUARDAR PAGO CxC =====
  btnGuardarPagoCxC.addEventListener('click', async () => {
    const idCuenta  = idCxcPagoHidden.value;
    const fechaPago = fechaPagoCxCInput.value;
    const monto     = parseFloat(montoPagoCxCInput.value || '0');
    const metodo    = metodoPagoCxCSelect.value;
    const ref       = referenciaPagoCxCInput.value.trim() || null;
    const notas     = notasPagoCxCInput.value.trim() || null;

    if (!idCuenta) {
      alert('No hay cuenta seleccionada.');
      return;
    }
    if (!fechaPago) {
      alert('La fecha de pago es obligatoria.');
      return;
    }
    if (!monto || monto <= 0) {
      alert('El monto del pago debe ser mayor a 0.');
      return;
    }

    const payload = {
      fecha_pago: fechaPago,
      monto_pagado: monto,
      metodo_pago: metodo,
      referencia: ref,
      notas
    };

    try {
      const res = await fetch(`${API_CXC}/${idCuenta}/abonos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Error al registrar el pago.');
        return;
      }

      alert('Pago registrado correctamente.');
      cerrarModalDetalleCxC();
      await cargarCuentasCobrar();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al registrar el pago.');
    }
  });

  // ===== INIT =====
  (async function initCxC() {
    const hoy = new Date().toISOString().slice(0,10);
    fechaPagoCxCInput.value = hoy;
    await cargarCuentasCobrar();
  })();