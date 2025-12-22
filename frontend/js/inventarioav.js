 // Sidebar + año
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const yearSpan = document.getElementById('year');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // =========================
  // CONSTANTES FRONT INVENTARIO
  // =========================
    const API_PRODUCTOS   = `${API_BASE}/api/productos`;
    const API_CATEGORIAS  = `${API_BASE}/api/categorias`;
    const API_PROVEEDORES = `${API_BASE}/api/proveedores`;


  const formBuscadorRapido    = document.getElementById('formBuscadorRapido');
  const inputBusquedaRapida   = document.getElementById('terminoBusquedaRapida');

  const autoPanelRapido = document.getElementById('autoPanelRapido');
  const autoListRapido  = document.getElementById('autoListRapido');

  const formFiltrosInventario = document.getElementById('formFiltrosInventario');
  const btnLimpiarFiltros     = document.getElementById('btnLimpiarFiltros');
  const filtroCategoriaSelect = document.getElementById('filtroCategoria');
  const filtroOrdenSelect     = document.getElementById('filtroOrden');
  const tablaInventarioBody   = document.getElementById('tablaInventario').querySelector('tbody');

  const modalBackdrop   = document.getElementById('modalInventario');
  const btnCerrarModal  = document.getElementById('btnCerrarModal');
  const btnCerrarModal2 = document.getElementById('btnCerrarModal2');
  const formProductoModal = document.getElementById('formProductoModal');

  // Campos del modal
  const m_id_producto           = document.getElementById('modal_id_producto');
  const m_codigo_barra          = document.getElementById('modal_codigo_barra');
  const m_codigo_interno        = document.getElementById('modal_codigo_interno');
  const m_nombre_producto       = document.getElementById('modal_nombre_producto');
  const m_id_categoria          = document.getElementById('modal_id_categoria');
  const m_id_proveedor          = document.getElementById('modal_id_proveedor');
  const m_unidad_medida         = document.getElementById('modal_unidad_medida');
  const m_estado                = document.getElementById('modal_estado');
  const m_stock_actual          = document.getElementById('modal_stock_actual');
  const m_stock_minimo          = document.getElementById('modal_stock_minimo');
  const m_precio_compra         = document.getElementById('modal_precio_compra');
  const m_precio_venta_cliente  = document.getElementById('modal_precio_venta_cliente');
  const m_precio_venta_camion   = document.getElementById('modal_precio_venta_camion');
  const m_precio_venta_preventa = document.getElementById('modal_precio_venta_preventa');
  const m_descripcion           = document.getElementById('modal_descripcion');
  const m_notas                 = document.getElementById('modal_notas');

  // =========================
  // UTILIDADES
  // =========================
  function moneyQ(n){ return `Q ${Number(n || 0).toFixed(2)}`; }
  function safeStr(v){ return (v == null) ? '' : String(v); }

  function debounce(fn, ms=220){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // =========================
  // AUTOCOMPLETE: Índice local de productos
  // =========================
  let productosIndex = [];
  let productosIndexLoaded = false;

  async function cargarIndiceProductos(){
    if (productosIndexLoaded) return;
    try{
      const url = new URL(API_PRODUCTOS, window.location.origin);
      url.searchParams.set('ordenar', 'nombre_asc');

      const res = await fetch(url.toString());
      if(!res.ok) throw new Error('No se pudo cargar índice de productos');
      const data = await res.json();

      productosIndex = (Array.isArray(data) ? data : []).map(p => ({
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        codigo_interno: p.codigo_interno,
        codigo_barra: p.codigo_barra,
        stock_actual: p.stock_actual,
        precio_venta_cliente: p.precio_venta_cliente,
        precio_venta_camion: p.precio_venta_camion,
        precio_venta_preventa: p.precio_venta_preventa,
        nombre_categoria: p.nombre_categoria,
        nombre_proveedor: p.nombre_proveedor
      }));

      productosIndexLoaded = true;
    }catch(err){
      console.error(err);
    }
  }

  function matchScore(p, q){
    const qc = q.toLowerCase();
    const name = safeStr(p.nombre_producto).toLowerCase();
    const interno = safeStr(p.codigo_interno).toLowerCase();
    const barra = safeStr(p.codigo_barra).toLowerCase();

    if (interno && interno === qc) return 0;
    if (barra && barra === qc) return 0;

    if (interno && interno.startsWith(qc)) return 1;
    if (barra && barra.startsWith(qc)) return 1;
    if (name.startsWith(qc)) return 1;

    if (interno && interno.includes(qc)) return 2;
    if (barra && barra.includes(qc)) return 2;
    if (name.includes(qc)) return 2;

    return 999;
  }

  function filtrarSugerencias(q, limit=8){
    const qc = q.trim().toLowerCase();
    if (!qc) return [];
    const out = [];
    for (const p of productosIndex){
      const s = matchScore(p, qc);
      if (s !== 999) out.push({p, s});
      if (out.length > 120) break;
    }
    out.sort((a,b) => a.s - b.s);
    return out.slice(0, limit).map(x => x.p);
  }

  let autoActiveIndex = -1;
  let autoCurrentItems = [];

  function hideAuto(){
    autoPanelRapido.classList.remove('show');
    autoListRapido.innerHTML = '';
    autoActiveIndex = -1;
    autoCurrentItems = [];
  }

  function setActive(i){
    autoActiveIndex = i;
    const items = autoListRapido.querySelectorAll('.auto-item');
    items.forEach((el, idx) => {
      if (idx === autoActiveIndex) el.classList.add('active');
      else el.classList.remove('active');
    });
    const activeEl = items[autoActiveIndex];
    if (activeEl) activeEl.scrollIntoView({block:'nearest'});
  }

  function renderAuto(items){
    autoCurrentItems = items;
    autoActiveIndex = -1;

    if (!items || items.length === 0){
      autoListRapido.innerHTML = `<div class="auto-empty">Sin resultados. Prueba con otro nombre o código.</div>`;
      autoPanelRapido.classList.add('show');
      return;
    }

    autoListRapido.innerHTML = items.map((p, idx) => {
      const code = p.codigo_interno || p.codigo_barra || '—';
      const stock = Number(p.stock_actual || 0);
      const stockClass = stock <= 0 ? 'soft' : 'ok';

      const cat = p.nombre_categoria ? `<span class="pill">Cat: ${p.nombre_categoria}</span>` : '';
      const prov = p.nombre_proveedor ? `<span class="pill">Prov: ${p.nombre_proveedor}</span>` : '';

      return `
        <div class="auto-item" data-idx="${idx}">
          <div class="auto-top">
            <div class="auto-title">${p.nombre_producto || 'Producto'}</div>
            <div class="auto-code">${code}</div>
          </div>

          <div class="auto-bottom">
            <div class="auto-chips">
              <span class="pill ${stockClass}">Stock: ${stock.toFixed(2)}</span>
              ${cat}
              ${prov}
            </div>

            <div class="prices">
              <span class="price">Cli: ${moneyQ(p.precio_venta_cliente)}</span>
              <span class="price camion">Cam: ${moneyQ(p.precio_venta_camion)}</span>
              <span class="price preventa">Pre: ${moneyQ(p.precio_venta_preventa)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    autoPanelRapido.classList.add('show');
  }

  function pickItem(p){
    const value = p.codigo_interno || p.codigo_barra || p.nombre_producto || '';
    inputBusquedaRapida.value = value;
    hideAuto();
    inputBusquedaRapida.focus();
  }

  const onInputAuto = debounce(async () => {
    const q = inputBusquedaRapida.value.trim();
    if (q.length < 1){
      hideAuto();
      return;
    }
    await cargarIndiceProductos();
    const items = filtrarSugerencias(q, 8);
    renderAuto(items);
  }, 160);

  inputBusquedaRapida.addEventListener('input', onInputAuto);

  inputBusquedaRapida.addEventListener('keydown', (e) => {
    if (!autoPanelRapido.classList.contains('show')) return;

    if (e.key === 'Escape'){
      e.preventDefault();
      hideAuto();
      return;
    }
    if (e.key === 'ArrowDown'){
      e.preventDefault();
      if (autoCurrentItems.length === 0) return;
      const next = Math.min(autoActiveIndex + 1, autoCurrentItems.length - 1);
      setActive(next);
      return;
    }
    if (e.key === 'ArrowUp'){
      e.preventDefault();
      if (autoCurrentItems.length === 0) return;
      const prev = Math.max(autoActiveIndex - 1, 0);
      setActive(prev);
      return;
    }
    if (e.key === 'Enter'){
      if (autoActiveIndex >= 0 && autoCurrentItems[autoActiveIndex]){
        e.preventDefault();
        pickItem(autoCurrentItems[autoActiveIndex]);
      }
      return;
    }
  });

  autoListRapido.addEventListener('mousemove', (e) => {
    const row = e.target.closest('.auto-item');
    if (!row) return;
    const idx = Number(row.dataset.idx);
    if (!Number.isFinite(idx)) return;
    setActive(idx);
  });

  autoListRapido.addEventListener('click', (e) => {
    const row = e.target.closest('.auto-item');
    if (!row) return;
    const idx = Number(row.dataset.idx);
    const p = autoCurrentItems[idx];
    if (p) pickItem(p);
  });

  document.addEventListener('click', (e) => {
    const wrap = inputBusquedaRapida.closest('.auto-wrap');
    if (!wrap) return;
    if (!wrap.contains(e.target)) hideAuto();
  });

  // =========================
  // CARGAR CATEGORÍAS Y PROVEEDORES
  // =========================
  async function cargarCategorias() {
    try {
      const res = await fetch(API_CATEGORIAS);
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();

      filtroCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
      data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id_categoria;
        opt.textContent = cat.nombre_categoria;
        filtroCategoriaSelect.appendChild(opt);
      });

      m_id_categoria.innerHTML = '<option value="">Seleccione una categoría</option>';
      data.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id_categoria;
        opt.textContent = cat.nombre_categoria;
        m_id_categoria.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar las categorías.');
    }
  }

  async function cargarProveedores() {
    try {
      const res = await fetch(API_PROVEEDORES);
      if (!res.ok) throw new Error('Error al cargar proveedores');
      const data = await res.json();

      m_id_proveedor.innerHTML = '<option value="">Sin proveedor asignado</option>';
      data.forEach(prov => {
        const opt = document.createElement('option');
        opt.value = prov.id_proveedor;
        opt.textContent = prov.nombre_proveedor;
        m_id_proveedor.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar los proveedores.');
    }
  }

  // =========================
  // LISTAR INVENTARIO
  // =========================
  async function cargarInventario() {
    const categoria = filtroCategoriaSelect.value || '';
    const ordenar   = filtroOrdenSelect.value || 'nombre_asc';

    const url = new URL(API_PRODUCTOS, window.location.origin);
    if (categoria) url.searchParams.set('categoria', categoria);
    if (ordenar)   url.searchParams.set('ordenar', ordenar);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Error al listar inventario');
      const data = await res.json();

      tablaInventarioBody.innerHTML = '';

      if (!data || data.length === 0) {
        tablaInventarioBody.innerHTML = `
          <tr>
            <td colspan="10" class="empty-row">No hay productos en el inventario con los filtros actuales.</td>
          </tr>
        `;
        return;
      }

      data.forEach(prod => {
        const tr = document.createElement('tr');
        tr.dataset.id = prod.id_producto;

        const codigoTexto = prod.codigo_interno || prod.codigo_barra || '--';

        tr.innerHTML = `
          <td>${codigoTexto}</td>
          <td>${prod.nombre_producto}</td>
          <td>${prod.nombre_categoria || ''}</td>
          <td>${prod.nombre_proveedor || ''}</td>
          <td>${Number(prod.stock_actual || 0).toFixed(2)}</td>
          <td>${Number(prod.stock_minimo || 0).toFixed(2)}</td>
          <td>Q ${Number(prod.precio_venta_cliente || 0).toFixed(2)}</td>
          <td>
            <span class="badge ${prod.estado === 'activo' ? 'badge-success' : 'badge-danger'}">
              ${prod.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td>${prod.actualizado_en ? new Date(prod.actualizado_en).toLocaleString() : '--'}</td>
          <td class="tabla-acciones">
            <button type="button" class="btn-icon btn-ver-editar" title="Ver / Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </td>
        `;

        tablaInventarioBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al cargar el inventario.');
    }
  }

  // =========================
  // MODAL: ABRIR / CERRAR / LLENAR
  // =========================
  function abrirModal() { modalBackdrop.classList.remove('modal-hidden'); }
  function cerrarModal() { modalBackdrop.classList.add('modal-hidden'); }

  function llenarModalConProducto(prod) {
    m_id_producto.value           = prod.id_producto || '';
    m_codigo_barra.value          = prod.codigo_barra || '';
    m_codigo_interno.value        = prod.codigo_interno || '';
    m_nombre_producto.value       = prod.nombre_producto || '';
    m_unidad_medida.value         = prod.unidad_medida || 'unidad';
    m_estado.value                = prod.estado || 'activo';
    m_stock_actual.value          = prod.stock_actual ?? 0;
    m_stock_minimo.value          = prod.stock_minimo ?? 0;
    m_precio_compra.value         = prod.precio_compra ?? 0;
    m_precio_venta_cliente.value  = prod.precio_venta_cliente ?? 0;
    m_precio_venta_camion.value   = prod.precio_venta_camion ?? 0;
    m_precio_venta_preventa.value = prod.precio_venta_preventa ?? 0;
    m_descripcion.value           = prod.descripcion || '';
    m_notas.value                 = prod.notas || '';

    m_id_categoria.value = prod.id_categoria ? String(prod.id_categoria) : '';
    m_id_proveedor.value = prod.id_proveedor ? String(prod.id_proveedor) : '';

    abrirModal();
  }

  // =========================
  // BUSCADOR RÁPIDO (abre modal)
  // =========================
  formBuscadorRapido.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuto();

    const termino = inputBusquedaRapida.value.trim();
    if (!termino) {
      alert('Escribe un código o nombre para buscar.');
      return;
    }

    try {
      const res = await fetch(`${API_PRODUCTOS}/buscar?termino=${encodeURIComponent(termino)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Producto no encontrado.');
        return;
      }

      llenarModalConProducto(data);
    } catch (err) {
      console.error(err);
      alert('Error al buscar el producto.');
    }
  });

  // =========================
  // CLICK EN "VER / EDITAR" EN LA TABLA
  // =========================
  tablaInventarioBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-ver-editar');
    if (!btn) return;

    const fila = btn.closest('tr');
    if (!fila) return;

    const id = fila.dataset.id;
    if (!id) return;

    try {
      const res = await fetch(`${API_PRODUCTOS}/${id}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'No se pudo obtener el producto.');
        return;
      }

      llenarModalConProducto(data);
    } catch (err) {
      console.error(err);
      alert('Error al obtener el producto.');
    }
  });

  // =========================
  // APLICAR FILTROS
  // =========================
  formFiltrosInventario.addEventListener('submit', (e) => {
    e.preventDefault();
    cargarInventario();
  });

  btnLimpiarFiltros.addEventListener('click', () => {
    filtroCategoriaSelect.value = '';
    filtroOrdenSelect.value = 'nombre_asc';
    cargarInventario();
  });

  // =========================
  // GUARDAR CAMBIOS DESDE EL MODAL (PUT)
  // =========================
  formProductoModal.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = m_id_producto.value;
    if (!id) {
      alert('No hay producto cargado.');
      return;
    }

    const payload = {
      id_categoria: m_id_categoria.value,
      id_proveedor: m_id_proveedor.value || null,
      codigo_barra: m_codigo_barra.value.trim() || null,
      codigo_interno: m_codigo_interno.value.trim() || null,
      nombre_producto: m_nombre_producto.value.trim(),
      descripcion: m_descripcion.value.trim() || null,
      unidad_medida: m_unidad_medida.value.trim() || 'unidad',
      stock_actual: parseFloat(m_stock_actual.value || '0'),
      stock_minimo: parseFloat(m_stock_minimo.value || '0'),
      precio_compra: parseFloat(m_precio_compra.value || '0'),
      precio_venta_cliente: parseFloat(m_precio_venta_cliente.value || '0'),
      precio_venta_camion: parseFloat(m_precio_venta_camion.value || '0'),
      precio_venta_preventa: parseFloat(m_precio_venta_preventa.value || '0'),
      estado: m_estado.value || 'activo',
      notas: m_notas.value.trim() || null,
    };

    if (!payload.nombre_producto) {
      alert('El nombre del producto es obligatorio.');
      return;
    }
    if (!payload.id_categoria) {
      alert('La categoría es obligatoria.');
      return;
    }

    try {
      const res = await fetch(`${API_PRODUCTOS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || 'Error al guardar los cambios.');
        return;
      }

      alert('Producto actualizado correctamente.');
      llenarModalConProducto(data);
      cargarInventario();

      // refrescar índice del autocomplete para que muestre cambios
      productosIndexLoaded = false;
      cargarIndiceProductos();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar los cambios.');
    }
  });

  // Cerrar modal con botones
  btnCerrarModal.addEventListener('click', cerrarModal);
  btnCerrarModal2.addEventListener('click', cerrarModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) cerrarModal();
  });

  // =========================
  // INICIALIZAR PÁGINA
  // =========================
  (async () => {
    await Promise.all([cargarCategorias(), cargarProveedores()]);
    await cargarInventario();
    cargarIndiceProductos();
  })();