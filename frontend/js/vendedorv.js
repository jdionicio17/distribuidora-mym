  // Sidebar + año
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.getElementById('sidebar');
  const yearSpan      = document.getElementById('year');
  if (sidebarToggle && sidebar) sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  function formatearMoneda(q){ return (Number(q) || 0).toFixed(2); }

  function formatearFechaHoraGT(valor) {
    if (!valor) return '';
    let iso = valor;
    if (typeof valor === 'string' && valor.length === 19 && valor[10] === ' ') iso = valor.replace(' ', 'T');
    const d = new Date(iso);
    const f = new Intl.DateTimeFormat('es-GT', {
      timeZone: 'America/Guatemala',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      hour12: true
    });
    const parts = f.formatToParts(d);
    let day='00', month='00', year='0000', hour='00', minute='00', second='00', dayPeriod='';
    for (const p of parts) {
      if (p.type==='day') day=p.value;
      if (p.type==='month') month=p.value;
      if (p.type==='year') year=p.value;
      if (p.type==='hour') hour=p.value;
      if (p.type==='minute') minute=p.value;
      if (p.type==='second') second=p.value;
      if (p.type==='dayPeriod') dayPeriod=p.value;
    }
    let ampm = dayPeriod.toUpperCase().replace(/\./g,'').replace(/\s+/g,'');
    if (ampm !== 'AM' && ampm !== 'PM') ampm = dayPeriod.toUpperCase().includes('P') ? 'PM' : 'AM';
    return `${day}/${month}/${year}, ${hour}:${minute}:${second} ${ampm}`;
  }

  // APIs
    const API_CLIENTES  = `${API_BASE}/api/clientes`;
    const API_PRODUCTOS = `${API_BASE}/api/productos`;
    const API_VENTAS    = `${API_BASE}/api/ventas`;
  // DOM
  const tablaVentasBody = document.querySelector('#tablaVentas tbody');

  const radioClienteNo = document.getElementById('radioClienteNo');
  const radioClienteSi = document.getElementById('radioClienteSi');
  const formBuscarCliente = document.getElementById('formBuscarCliente');
  const nitBusquedaInput = document.getElementById('nitBusqueda');
  const infoClienteDisplay = document.getElementById('infoClienteDisplay');

  const tipoVentaSelect = document.getElementById('tipo_venta');
  const grupoFechaLimite = document.getElementById('grupoFechaLimite');
  const fechaLimiteInput = document.getElementById('fecha_limite_pago');

  const bloqueEfectivo = document.getElementById('bloqueEfectivo');
  const efectivoInput = document.getElementById('efectivo_recibido');
  const cambioTextoSpan = document.getElementById('cambioTexto');

  const btnCancelarVenta = document.getElementById('btnCancelarVenta');
  const btnGuardarVenta = document.getElementById('btnGuardarVenta');

  const formBuscarProductoVenta = document.getElementById('formBuscarProductoVenta');
  const terminoBusquedaVenta = document.getElementById('terminoBusquedaVenta');

  const dropdownSugerencias = document.getElementById('dropdownSugerencias');

  const formAgregarItemVenta = document.getElementById('formAgregarItemVenta');
  const idProductoVentaInput = document.getElementById('id_producto_venta');
  const nombreProductoVentaInput = document.getElementById('nombre_producto_venta');
  const existenciaProductoInput = document.getElementById('existencia_producto_venta');
  const tipoPrecioVentaSelect = document.getElementById('tipo_precio_venta');
  const precioUnitarioVentaInput = document.getElementById('precio_unitario_venta');
  const cantidadVentaInput = document.getElementById('cantidad_venta');

  const tbodyItemsVenta = document.getElementById('tbodyItemsVenta');
  const totalBrutoVentaTexto = document.getElementById('totalBrutoVentaTexto');
  const descuentoVentaTexto  = document.getElementById('descuentoVentaTexto');
  const totalNetoVentaTexto  = document.getElementById('totalNetoVentaTexto');

  // Estado
  let clienteSeleccionado = null;
  let itemsVenta = [];
  let productoActual = null;

  // =========================
  // AUTOCOMPLETE (SUGERENCIAS)
  // =========================
  let sugerenciasActuales = [];
  let sugIndex = -1;
  let debounceTimer = null;

  function cerrarDropdown() {
    if (!dropdownSugerencias) return;
    dropdownSugerencias.style.display = 'none';
    dropdownSugerencias.innerHTML = '';
    sugerenciasActuales = [];
    sugIndex = -1;
  }

  function abrirDropdown() {
    if (!dropdownSugerencias) return;
    dropdownSugerencias.style.display = 'block';
  }

  function marcarActivo(i) {
    if (!dropdownSugerencias) return;
    const items = dropdownSugerencias.querySelectorAll('.sug-item');
    items.forEach(el => el.classList.remove('active'));
    if (i >= 0 && i < items.length) {
      items[i].classList.add('active');
      sugIndex = i;
    } else {
      sugIndex = -1;
    }
  }

  function seleccionarSugerencia(idx) {
    const p = sugerenciasActuales[idx];
    if (!p) return;

    productoActual = {
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto,
      existencia: Number(p.existencia || 0),
      precio_camion: Number(p.precio_camion || 0),
      precio_preventa: Number(p.precio_preventa || 0),
      codigo_barra: p.codigo_barra,
      codigo_interno: p.codigo_interno
    };

    const existencia = productoActual.existencia;
    const precioCamion = productoActual.precio_camion;
    const precioPreventa = productoActual.precio_preventa;

    idProductoVentaInput.value = productoActual.id_producto;
    nombreProductoVentaInput.value = productoActual.nombre_producto;
    existenciaProductoInput.value = existencia;
    cantidadVentaInput.value = 1;

    tipoPrecioVentaSelect.innerHTML = '';
    const opt1 = document.createElement('option');
    opt1.value = 'camion';
    opt1.textContent = `Camión (Q ${formatearMoneda(precioCamion)})`;
    tipoPrecioVentaSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = 'preventa';
    opt2.textContent = `Preventa (Q ${formatearMoneda(precioPreventa)})`;
    tipoPrecioVentaSelect.appendChild(opt2);

    precioUnitarioVentaInput.value = precioCamion;

    formAgregarItemVenta.style.display = 'block';
    terminoBusquedaVenta.value = productoActual.nombre_producto;

    cerrarDropdown();
  }

  function renderSugerencias(lista) {
    if (!dropdownSugerencias) return;
    dropdownSugerencias.innerHTML = '';

    if (!lista || lista.length === 0) {
      dropdownSugerencias.innerHTML = `
        <div class="sug-empty">
          <div class="sug-title">Sin resultados</div>
          <div class="sug-sub">Prueba con otro nombre, código interno o código de barras</div>
        </div>
      `;
      abrirDropdown();
      return;
    }

    lista.forEach((p, idx) => {
      const prov = p.nombre_proveedor ? ` · ${p.nombre_proveedor}` : '';
      const cat  = p.nombre_categoria ? ` · ${p.nombre_categoria}` : '';
      
      // Mostramos código interno O código de barras
      let codTexto = '';
      if (p.codigo_interno) {
        codTexto = `Código: ${p.codigo_interno}`;
      } else if (p.codigo_barra) {
        codTexto = `Barras: ${p.codigo_barra}`;
      } else {
        codTexto = 'Sin código';
      }

      const div = document.createElement('div');
      div.className = 'sug-item';
      div.dataset.index = String(idx);
      div.innerHTML = `
        <div class="sug-left">
          <div class="sug-title">${p.nombre_producto}</div>
          <div class="sug-sub">${codTexto}${prov}${cat}</div>
        </div>
        <div class="sug-right">
          <div><strong>Stock: ${Number(p.existencia || 0)}</strong></div>
          <div>
            Camión: Q ${formatearMoneda(p.precio_camion)}
            <span class="sug-badge">Preventa Q ${formatearMoneda(p.precio_preventa)}</span>
          </div>
        </div>
      `;

      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        seleccionarSugerencia(idx);
      });

      dropdownSugerencias.appendChild(div);
    });

    abrirDropdown();
    marcarActivo(0);
  }

  async function pedirSugerencias(term) {
    const res = await fetch(`${API_PRODUCTOS}/sugerencias?termino=${encodeURIComponent(term)}&limit=10`);
    if (!res.ok) throw new Error('Error sugerencias');
    return await res.json();
  }

  terminoBusquedaVenta.addEventListener('input', () => {
    const term = terminoBusquedaVenta.value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (term.length < 2) {
      cerrarDropdown();
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const lista = await pedirSugerencias(term);
        sugerenciasActuales = Array.isArray(lista) ? lista : [];
        renderSugerencias(sugerenciasActuales);
      } catch (e) {
        console.error(e);
        cerrarDropdown();
      }
    }, 180);
  });

  terminoBusquedaVenta.addEventListener('keydown', (e) => {
    if (!dropdownSugerencias || dropdownSugerencias.style.display !== 'block') return;

    const max = sugerenciasActuales.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (sugIndex < max - 1) ? sugIndex + 1 : 0;
      marcarActivo(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (sugIndex > 0) ? sugIndex - 1 : (max - 1);
      marcarActivo(prev);
    } else if (e.key === 'Enter') {
      if (sugIndex >= 0) {
        e.preventDefault();
        seleccionarSugerencia(sugIndex);
      }
    } else if (e.key === 'Escape') {
      cerrarDropdown();
    }
  });

  terminoBusquedaVenta.addEventListener('blur', () => {
    setTimeout(() => cerrarDropdown(), 120);
  });

  formBuscarProductoVenta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const termino = terminoBusquedaVenta.value.trim();
    if (!termino) return alert('Escribe un código o nombre para buscar el producto');

    if (sugerenciasActuales.length > 0) {
      seleccionarSugerencia(sugIndex >= 0 ? sugIndex : 0);
      return;
    }

    // fallback: búsqueda puntual
    try {
      const res = await fetch(`${API_PRODUCTOS}/buscar?termino=${encodeURIComponent(termino)}`);
      if (res.status === 404) {
        productoActual = null;
        formAgregarItemVenta.style.display = 'none';
        return alert('No se encontró ningún producto con ese término');
      }
      if (!res.ok) throw new Error('Error al buscar producto');

      const p = await res.json();
      productoActual = p;

      const existencia = Number(p.existencia ?? p.stock_actual ?? 0);
      const precioCamion = Number(p.precio_camion ?? p.precio_venta_camion ?? 0);
      const precioPreventa = Number(p.precio_preventa ?? p.precio_venta_preventa ?? 0);

      idProductoVentaInput.value = p.id_producto;
      nombreProductoVentaInput.value = p.nombre_producto;
      existenciaProductoInput.value = existencia;
      cantidadVentaInput.value = 1;

      tipoPrecioVentaSelect.innerHTML = '';
      const opt1 = document.createElement('option');
      opt1.value = 'camion';
      opt1.textContent = `Camión (Q ${formatearMoneda(precioCamion)})`;
      tipoPrecioVentaSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = 'preventa';
      opt2.textContent = `Preventa (Q ${formatearMoneda(precioPreventa)})`;
      tipoPrecioVentaSelect.appendChild(opt2);

      precioUnitarioVentaInput.value = precioCamion;

      formAgregarItemVenta.style.display = 'block';
    } catch (err) {
      console.error(err);
      alert('Error al buscar el producto');
    }
  });

  // =========================
  // CLIENTE FRECUENTE
  // =========================
  function actualizarModoCliente() {
    if (radioClienteSi.checked) {
      formBuscarCliente.style.display = 'block';
      infoClienteDisplay.textContent = 'Escribe NIT y presiona "Buscar"';
      infoClienteDisplay.classList.remove('con-cliente');
    } else {
      formBuscarCliente.style.display = 'none';
      nitBusquedaInput.value = '';
      clienteSeleccionado = null;
      infoClienteDisplay.textContent = 'Venta sin cliente asociado';
      infoClienteDisplay.classList.remove('con-cliente');
    }
  }
  radioClienteNo.addEventListener('change', actualizarModoCliente);
  radioClienteSi.addEventListener('change', actualizarModoCliente);
  actualizarModoCliente();

  formBuscarCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nit = nitBusquedaInput.value.trim();
    if (!nit) return alert('Ingresa un NIT para buscar');

    try {
      const res = await fetch(`${API_CLIENTES}/buscar?nit=${encodeURIComponent(nit)}`);
      if (res.status === 404) {
        clienteSeleccionado = null;
        infoClienteDisplay.textContent = 'No se encontró ningún cliente con ese NIT';
        infoClienteDisplay.classList.remove('con-cliente');
        return;
      }
      if (!res.ok) throw new Error('Error al buscar cliente');

      const c = await res.json();
      clienteSeleccionado = c;

      const limite = Number(c.limite_credito || 0);
      const saldo  = Number(c.saldo_credito || 0);
      const disp = Math.max(0, limite - saldo);

      infoClienteDisplay.innerHTML = `
        <strong style="font-size:0.95rem; color:#15803d;">${c.nombre_cliente}</strong><br>
        <span style="color:#64748b;">NIT: ${c.nit || 'CF'}</span><br>
        <span style="font-size:0.85rem;">Límite: Q ${formatearMoneda(limite)} · Usado: Q ${formatearMoneda(saldo)} · <strong style="color:#15803d;">Disponible: Q ${formatearMoneda(disp)}</strong></span>
      `;
      infoClienteDisplay.classList.add('con-cliente');
    } catch (err) {
      console.error(err);
      alert('Error al buscar el cliente');
    }
  });

  // =========================
  // TIPO VENTA
  // =========================
  tipoVentaSelect.addEventListener('change', () => {
    const tipo = tipoVentaSelect.value;
    grupoFechaLimite.style.display = (tipo === 'credito') ? 'block' : 'none';
    if (bloqueEfectivo) bloqueEfectivo.style.display = (tipo === 'contado') ? 'block' : 'none';
    calcularTotalesVenta();
  });
  tipoVentaSelect.dispatchEvent(new Event('change'));

  // =========================
  // ITEMS + TOTALES
  // =========================
  function calcularTotalesVenta() {
    const totalBruto = itemsVenta.reduce((acc, it) => acc + it.subtotal, 0);
    const descuento = 0;
    const totalNeto = totalBruto - descuento;

    totalBrutoVentaTexto.textContent = formatearMoneda(totalBruto);
    descuentoVentaTexto.textContent  = formatearMoneda(descuento);
    totalNetoVentaTexto.textContent  = formatearMoneda(totalNeto);

    let cambio = 0;
    if (tipoVentaSelect.value === 'contado') {
      const efectivo = Number(efectivoInput.value || 0);
      if (efectivo > 0 && efectivo >= totalNeto) cambio = efectivo - totalNeto;
    }
    cambioTextoSpan.textContent = formatearMoneda(cambio);

    return { totalBruto, descuento, totalNeto, cambio };
  }

  function renderItemsVenta() {
    tbodyItemsVenta.innerHTML = '';
    if (itemsVenta.length === 0) {
      tbodyItemsVenta.innerHTML = `<tr><td colspan="6" class="empty-row">No has agregado productos a esta venta todavía</td></tr>`;
      calcularTotalesVenta();
      return;
    }

    itemsVenta.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.nombre}</td>
        <td>${it.cantidad}</td>
        <td>${it.tipo_precio === 'camion' ? 'Camión' : 'Preventa'}</td>
        <td>Q ${formatearMoneda(it.precio_unitario)}</td>
        <td>Q ${formatearMoneda(it.subtotal)}</td>
        <td class="tabla-acciones">
          <button type="button" class="btn-icon btn-eliminar-item-venta" data-index="${idx}" title="Eliminar">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      `;
      tbodyItemsVenta.appendChild(tr);
    });

    calcularTotalesVenta();
  }

  efectivoInput.addEventListener('input', calcularTotalesVenta);

  tbodyItemsVenta.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar-item-venta');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (isNaN(index)) return;
    itemsVenta.splice(index, 1);
    renderItemsVenta();
  });

  tipoPrecioVentaSelect.addEventListener('change', () => {
    if (!productoActual) return;
    const tipo = tipoPrecioVentaSelect.value;
    const precioCamion = Number(productoActual.precio_camion ?? productoActual.precio_venta_camion ?? 0);
    const precioPreventa = Number(productoActual.precio_preventa ?? productoActual.precio_venta_preventa ?? 0);
    precioUnitarioVentaInput.value = (tipo === 'camion') ? precioCamion : precioPreventa;
  });

  // Agregar item
  formAgregarItemVenta.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!productoActual) return alert('No hay producto seleccionado');

    const existencia = Number(existenciaProductoInput.value || 0);
    const cantidad = parseFloat(cantidadVentaInput.value);
    const tipoPrecio = tipoPrecioVentaSelect.value;
    const precioUnit = parseFloat(precioUnitarioVentaInput.value);

    if (!cantidad || cantidad <= 0) return alert('La cantidad debe ser mayor que 0');
    if (cantidad > existencia) return alert(`No hay existencia suficiente. Disponible: ${existencia}`);
    if (precioUnit < 0) return alert('El precio unitario no puede ser negativo');

    const subtotal = cantidad * precioUnit;

    itemsVenta.push({
      id_producto: productoActual.id_producto,
      nombre: productoActual.nombre_producto,
      existencia,
      cantidad,
      tipo_precio: tipoPrecio,
      precio_unitario: precioUnit,
      subtotal
    });

    renderItemsVenta();
  });

  function resetearVenta() {
    radioClienteNo.checked = true;
    radioClienteSi.checked = false;
    actualizarModoCliente();

    tipoVentaSelect.value = 'contado';
    tipoVentaSelect.dispatchEvent(new Event('change'));

    fechaLimiteInput.value = '';
    efectivoInput.value = '';
    cambioTextoSpan.textContent = '0.00';

    productoActual = null;
    formBuscarProductoVenta.reset();
    formAgregarItemVenta.reset();
    formAgregarItemVenta.style.display = 'none';

    itemsVenta = [];
    renderItemsVenta();
    cerrarDropdown();
  }

  btnCancelarVenta.addEventListener('click', resetearVenta);

  btnGuardarVenta.addEventListener('click', async () => {
    if (itemsVenta.length === 0) return alert('Agrega al menos un producto a la venta antes de guardar');

    const tipoVenta = tipoVentaSelect.value;
    const { totalNeto } = calcularTotalesVenta();

    let idCliente = null;

    if (tipoVenta === 'credito') {
      if (!clienteSeleccionado) return alert('Para una venta a crédito debes seleccionar un cliente frecuente');
      if (!fechaLimiteInput.value) return alert('La fecha límite de pago es obligatoria para ventas a crédito');

      const limite = Number(clienteSeleccionado.limite_credito || 0);
      const saldo  = Number(clienteSeleccionado.saldo_credito || 0);
      const disp = Math.max(0, limite - saldo);

      if (disp <= 0) return alert('El cliente no tiene crédito disponible');
      if (totalNeto > disp + 0.001) {
        return alert(`El monto (Q ${formatearMoneda(totalNeto)}) supera el crédito disponible (Q ${formatearMoneda(disp)})`);
      }

      idCliente = clienteSeleccionado.id_cliente;
    } else {
      idCliente = clienteSeleccionado ? clienteSeleccionado.id_cliente : null;
    }

    let efectivo = null, cambio = null;
    if (tipoVenta === 'contado' && efectivoInput.value !== '') {
      efectivo = Number(efectivoInput.value);
      cambio = efectivo - totalNeto;
      if (!isFinite(cambio)) cambio = null;
    }

    const payload = {
      id_cliente: idCliente,
      tipo_venta: tipoVenta,
      fecha_limite_pago: (tipoVenta === 'credito') ? fechaLimiteInput.value : null,
      efectivo_recibido: efectivo,
      cambio: cambio,
      items: itemsVenta.map(it => ({
        id_producto: Number(it.id_producto),
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        tipo_precio: it.tipo_precio
      }))
    };

    try {
      const res = await fetch(API_VENTAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.message || 'Error al guardar la venta');

      alert('✓ Venta registrada correctamente');
      resetearVenta();
      await cargarVentas();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar la venta');
    }
  });

  async function cargarVentas() {
    try {
      const res = await fetch(API_VENTAS);
      if (!res.ok) throw new Error('Error al listar ventas');
      const ventas = await res.json();

      tablaVentasBody.innerHTML = '';
      if (!ventas || ventas.length === 0) {
        tablaVentasBody.innerHTML = `<tr><td colspan="6" class="empty-row">No hay ventas registradas todavía</td></tr>`;
        return;
      }

      ventas.forEach(v => {
        const fechaTexto = v.creado_en ? formatearFechaHoraGT(v.creado_en) : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${v.id_venta}</td>
          <td>${fechaTexto}</td>
          <td>${v.nombre_cliente || '—'}</td>
          <td>${v.tipo_venta === 'credito' ? 'Crédito' : 'Contado'}</td>
          <td>Q ${formatearMoneda(v.total_neto)}</td>
          <td><span class="badge ${v.estado === 'pagada' ? 'badge-success' : (v.estado === 'anulada' ? 'badge-danger' : 'badge-secondary')}">${v.estado || 'registrada'}</span></td>
        `;
        tablaVentasBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las ventas');
    }
  }

  (async function initVentas() {
    renderItemsVenta();
    await cargarVentas();
  })();