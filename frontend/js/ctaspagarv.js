 // ===== Sidebar + año =====
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const yearSpan = document.getElementById('year');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ========= FORMATO FECHA/HORA GT =========
  // Ej. entrada: "2025-12-10T08:46:55.000Z" o "2025-12-10 08:46:55"
  // Salida: "10/12/2025, 8:46:55 AM"
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

  // Solo fecha: "2025-12-10" -> "10/12/2025"
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

  // ========= CONSTANTES API =========
  const API_CXP = `${API_BASE}/api/cuentas-pagar`;

  // ========= ELEMENTOS DOM =========
  const tablaCuentasBody = document.querySelector('#tablaCuentasPagar tbody');

  const btnNuevaCuenta   = document.getElementById('btnNuevaCuenta');
  const modalCuenta      = document.getElementById('modalCuenta');
  const btnCerrarModalCuenta = document.getElementById('btnCerrarModalCuenta');
  const btnCancelarCuenta = document.getElementById('btnCancelarCuenta');
  const btnGuardarCuenta  = document.getElementById('btnGuardarCuenta');
  const formCuenta        = document.getElementById('formCuenta');

  const descripcionCXP    = document.getElementById('descripcion_cxp');
  const montoTotalCXP     = document.getElementById('monto_total_cxp');
  const fechaRegistroCXP  = document.getElementById('fecha_registro_cxp');
  const fechaVencCXP      = document.getElementById('fecha_vencimiento_cxp');
  const beneficiarioCXP   = document.getElementById('beneficiario_cxp');
  const categoriaCXP      = document.getElementById('categoria_cxp');
  const notasCXP          = document.getElementById('notas_cxp');

  // Detalle / pago
  const modalDetalleCuenta    = document.getElementById('modalDetalleCuenta');
  const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');
  const btnCerrarModalDetalle2= document.getElementById('btnCerrarModalDetalle2');
  const detalleCuentaHeader   = document.getElementById('detalleCuentaHeader');

  const formPagoCuenta        = document.getElementById('formPagoCuenta');
  const idCuentaPagoHidden    = document.getElementById('id_cuenta_pago');
  const fechaPagoInput        = document.getElementById('fecha_pago_cxp');
  const montoPagoInput        = document.getElementById('monto_pago_cxp');
  const metodoPagoSelect      = document.getElementById('metodo_pago_cxp');
  const referenciaPagoInput   = document.getElementById('referencia_pago_cxp');
  const notasPagoInput        = document.getElementById('notas_pago_cxp');
  const btnGuardarPago        = document.getElementById('btnGuardarPago');

  // ========= FUNCIONES MODAL =========
  function abrirModalCuenta() {
    modalCuenta.classList.add('open');
  }
  function cerrarModalCuenta() {
    modalCuenta.classList.remove('open');
    formCuenta.reset();
    const hoy = new Date().toISOString().slice(0,10);
    fechaRegistroCXP.value = hoy;
  }

  function abrirModalDetalle() {
    modalDetalleCuenta.classList.add('open');
  }
  function cerrarModalDetalle() {
    modalDetalleCuenta.classList.remove('open');
    formPagoCuenta.reset();
  }

  // ========= AYUDAS =========
  function formatearMoneda(q) {
    return (Number(q) || 0).toFixed(2);
  }

  // ========= CARGAR LISTA CXP =========
  async function cargarCuentasPagar() {
    try {
      const res = await fetch(API_CXP);
      if (!res.ok) throw new Error('Error al listar cuentas por pagar');
      const cuentas = await res.json();

      tablaCuentasBody.innerHTML = '';

      if (!cuentas || cuentas.length === 0) {
        tablaCuentasBody.innerHTML = `
          <tr>
            <td colspan="9" class="empty-row">
              No hay cuentas por pagar registradas todavía.
            </td>
          </tr>
        `;
        return;
      }

      cuentas.forEach(c => {
        // Para mostrar FECHA + HORA exacta usamos creado_en,
        // si por algo viene null usamos fecha_registro.
        const fechaRegistroTexto = c.creado_en
          ? formatearFechaHoraGT(c.creado_en)
          : (c.fecha_registro ? formatearFechaGT(c.fecha_registro) : '');

        const fechaVencTexto = c.fecha_vencimiento
          ? formatearFechaGT(c.fecha_vencimiento)
          : '—';

        const tr = document.createElement('tr');
        tr.dataset.id = c.id_cuenta_pagar;
        tr.innerHTML = `
          <td>${c.id_cuenta_pagar}</td>
          <td>
            <strong>${c.descripcion}</strong><br>
            <span style="font-size:0.8rem; color:#666;">
              ${c.beneficiario || ''} ${c.categoria ? ' · ' + c.categoria : ''}
            </span>
          </td>
          <td>Q ${formatearMoneda(c.monto_total)}</td>
          <td>Q ${formatearMoneda(c.total_pagado)}</td>
          <td>Q ${formatearMoneda(c.saldo_pendiente)}</td>
          <td>${fechaRegistroTexto}</td>
          <td>${fechaVencTexto}</td>
          <td>
            <span class="badge ${
              c.estado === 'pagada' ? 'badge-success' :
              c.estado === 'anulada' ? 'badge-danger' :
              c.estado === 'parcial' ? 'badge-warning' : 'badge-secondary'
            }">${c.estado}</span>
          </td>
          <td class="tabla-acciones">
            <button type="button" class="btn-icon btn-ver-cuenta" title="Ver / registrar pago">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        `;
        tablaCuentasBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las cuentas por pagar.');
    }
  }

  // ========= GUARDAR NUEVA CUENTA MANUAL =========
  btnGuardarCuenta.addEventListener('click', async () => {
    const descripcion = descripcionCXP.value.trim();
    const monto       = parseFloat(montoTotalCXP.value || '0');
    const fechaReg    = fechaRegistroCXP.value;
    const fechaVenc   = fechaVencCXP.value || null;
    const beneficiario= beneficiarioCXP.value.trim() || null;
    const categoria   = categoriaCXP.value.trim() || null;
    const notas       = notasCXP.value.trim() || null;

    if (!descripcion) {
      alert('La descripción es obligatoria.');
      return;
    }
    if (!fechaReg) {
      alert('La fecha de registro es obligatoria.');
      return;
    }
    if (!monto || monto <= 0) {
      alert('El monto total debe ser mayor a 0.');
      return;
    }

    const payload = {
      descripcion,
      monto_total: monto,
      fecha_registro: fechaReg,
      fecha_vencimiento: fechaVenc,
      beneficiario,
      categoria,
      notas
    };

    try {
      const res = await fetch(API_CXP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Error al guardar la cuenta por pagar.');
        return;
      }

      alert('Cuenta por pagar registrada correctamente.');
      cerrarModalCuenta();
      await cargarCuentasPagar();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar la cuenta por pagar.');
    }
  });

  // ========= ABRIR DETALLE / PREPARAR PAGO =========
  tablaCuentasBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver-cuenta');
    if (!btn) return;

    const fila = btn.closest('tr');
    const id   = fila.dataset.id;
    if (!id) return;

    // Tomamos los datos directamente de la fila para el header
    const descripcion = fila.children[1].innerText.split('\n')[0];
    const monto       = fila.children[2].innerText;
    const pagado      = fila.children[3].innerText;
    const saldo       = fila.children[4].innerText;
    const fechaRegTxt = fila.children[5].innerText;
    const fechaVenTxt = fila.children[6].innerText;
    const estadoTxt   = fila.children[7].innerText.trim();

    detalleCuentaHeader.innerHTML = `
      <div><strong>Cuenta #${id}</strong> (${estadoTxt})</div>
      <div>${descripcion}</div>
      <div>Monto: ${monto} · Pagado: ${pagado} · Saldo: ${saldo}</div>
      <div>Registro: ${fechaRegTxt} · Vencimiento: ${fechaVenTxt}</div>
    `;

    const hoy = new Date().toISOString().slice(0,10);
    fechaPagoInput.value = hoy;
    idCuentaPagoHidden.value = id;

    abrirModalDetalle();
  });

  // ========= GUARDAR PAGO =========
  btnGuardarPago.addEventListener('click', async () => {
    const idCuenta  = idCuentaPagoHidden.value;
    const fechaPago = fechaPagoInput.value;
    const monto     = parseFloat(montoPagoInput.value || '0');
    const metodo    = metodoPagoSelect.value;
    const ref       = referenciaPagoInput.value.trim() || null;
    const notas     = notasPagoInput.value.trim() || null;

    if (!idCuenta) {
      alert('No hay cuenta seleccionada.');
      return;
    }
    if (!fechaPago) {
      alert('La fecha de pago es obligatoria.');
      return;
    }
    if (!monto || monto <= 0) {
      alert('El monto de pago debe ser mayor a 0.');
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
      const res = await fetch(`${API_CXP}/${idCuenta}/pagos`, {
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
      cerrarModalDetalle();
      await cargarCuentasPagar();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al registrar el pago.');
    }
  });

  // ========= LISTENERS MODALES =========
  btnNuevaCuenta.addEventListener('click', () => {
    cerrarModalCuenta(); // limpia y pone fecha hoy
    abrirModalCuenta();
  });
  btnCerrarModalCuenta.addEventListener('click', cerrarModalCuenta);
  btnCancelarCuenta.addEventListener('click', cerrarModalCuenta);

  btnCerrarModalDetalle.addEventListener('click', cerrarModalDetalle);
  btnCerrarModalDetalle2.addEventListener('click', cerrarModalDetalle);

  modalCuenta.addEventListener('click', (e) => {
    if (e.target === modalCuenta) cerrarModalCuenta();
  });
  modalDetalleCuenta.addEventListener('click', (e) => {
    if (e.target === modalDetalleCuenta) cerrarModalDetalle();
  });

  // ========= INIT =========
  (async function initCXP() {
    // Fecha por defecto en el formulario
    fechaRegistroCXP.value = new Date().toISOString().slice(0,10);
    await cargarCuentasPagar();
  })();