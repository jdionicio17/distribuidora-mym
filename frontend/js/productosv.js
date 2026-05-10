 // Sidebar responsive + año
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const yearSpan = document.getElementById('year');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-open');
      });
    }
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // =============================
    // LÓGICA FRONTEND CON BACKEND
    // =============================
    const buscadorProductoForm = document.getElementById('buscadorProductoForm');
    const productoForm        = document.getElementById('productoForm');
    const btnGuardarProducto  = document.getElementById('btnGuardarProducto');
    const btnLimpiarProducto  = document.getElementById('btnLimpiarProducto');
    const btnEliminarProducto = document.getElementById('btnEliminarProducto');

    const selectCategoria = document.getElementById('id_categoria');
    const selectProveedor = document.getElementById('id_proveedor');

    const API_PRODUCTOS   = `${API_BASE}/api/productos`;
    const API_CATEGORIAS  = `${API_BASE}/api/categorias`;
    const API_PROVEEDORES = `${API_BASE}/api/proveedores`;


    // ===== Autocomplete refs
    const inputBusqueda = document.getElementById('terminoBusqueda');
    const acPanel = document.getElementById('acPanel');
    const acList  = document.getElementById('acList');

    let catalogoProductos = [];   // cache
    let acOpen = false;
    let acActiveIndex = -1;
    let acItems = [];

    function moneyQ(v){
      const n = Number(v || 0);
      return 'Q ' + n.toFixed(2);
    }

    function normalizeText(s){
      return String(s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim();
    }

    function openAC(){
      acPanel.classList.add('open');
      acPanel.setAttribute('aria-hidden','false');
      acOpen = true;
    }

    function closeAC(){
      acPanel.classList.remove('open');
      acPanel.setAttribute('aria-hidden','true');
      acOpen = false;
      acActiveIndex = -1;
      acItems = [];
      acList.innerHTML = '';
    }

    function setActive(index){
      acActiveIndex = index;
      const nodes = acList.querySelectorAll('.ac-item');
      nodes.forEach((n,i)=> n.classList.toggle('active', i===index));

      const activeNode = nodes[index];
      if(activeNode){
        const container = acList;
        const top = activeNode.offsetTop;
        const bottom = top + activeNode.offsetHeight;
        if(top < container.scrollTop) container.scrollTop = Math.max(0, top - 10);
        if(bottom > container.scrollTop + container.clientHeight){
          container.scrollTop = bottom - container.clientHeight + 10;
        }
      }
    }

    function renderAC(items){
      acList.innerHTML = '';
      acItems = items;

      if(!items.length){
        acList.innerHTML = `<div class="ac-empty">Sin resultados. Prueba con otro nombre o código.</div>`;
        openAC();
        return;
      }

      const frag = document.createDocumentFragment();

      items.forEach((p, idx)=>{
        const div = document.createElement('div');
        div.className = 'ac-item';
        div.setAttribute('role','option');

        const nombre = p.nombre_producto || 'Producto';
        const cb = p.codigo_barra || '';
        const ci = p.codigo_interno || '';
        const stock = (p.stock_actual ?? p.existencia ?? 0);

        const pc = p.precio_venta_camion ?? p.precio_camion ?? null;
        const pp = p.precio_venta_preventa ?? p.precio_preventa ?? null;
        const pv = p.precio_venta_cliente ?? null;

        const codText = [
          cb ? `Barras: ${cb}` : null,
          ci ? `Interno: ${ci}` : null
        ].filter(Boolean).join(' • ');

        div.innerHTML = `
          <div class="ac-left">
            <div class="ac-title">${nombre}</div>
            <div class="ac-sub">
              ${codText ? `<span class="badge soft">${codText}</span>` : `<span class="badge soft">Sin códigos</span>`}
              ${p.nombre_categoria ? `<span class="badge">${p.nombre_categoria}</span>` : ``}
            </div>
          </div>
          <div class="ac-right">
            <div class="stock"><strong>Stock:</strong> ${Number(stock)}</div>
            <div class="price-row">
              ${pv != null ? `<span class="price">Cliente: ${moneyQ(pv)}</span>` : ``}
              ${pc != null ? `<span class="price">Camión: ${moneyQ(pc)}</span>` : ``}
              ${pp != null ? `<span class="price">Preventa: ${moneyQ(pp)}</span>` : ``}
            </div>
          </div>
        `;

        div.addEventListener('mousedown', (ev)=>{
          ev.preventDefault();
          seleccionarProductoDesdeAC(idx);
        });

        frag.appendChild(div);
      });

      acList.appendChild(frag);
      openAC();
      setActive(0);
    }

    async function ensureCatalogoCargado(){
      if(catalogoProductos.length) return;
      const res = await fetch(`${API_PRODUCTOS}?ordenar=nombre_asc`);
      if(!res.ok) throw new Error('No se pudo cargar el catálogo de productos.');
      const data = await res.json();
      catalogoProductos = Array.isArray(data) ? data : [];
    }

    function filtrarProductos(term){
      const raw = String(term || '').trim();
      const t = normalizeText(raw);
      if(!t) return [];

      const isNumericLike = /^[0-9-]+$/.test(raw);

      return catalogoProductos.map(p=>{
        const nombre = normalizeText(p.nombre_producto);
        const cb = normalizeText(p.codigo_barra);
        const ci = normalizeText(p.codigo_interno);

        let score = 0;
        if(cb && cb.includes(t)) score += (cb === t ? 120 : 80);
        if(ci && ci.includes(t)) score += (ci === t ? 110 : 70);
        if(nombre && nombre.includes(t)) score += (nombre.startsWith(t) ? 60 : 45);

        if(isNumericLike){
          score += (cb && cb.includes(t)) ? 30 : 0;
          score += (ci && ci.includes(t)) ? 20 : 0;
        }

        const stock = Number(p.stock_actual ?? p.existencia ?? 0);
        if(stock <= 0) score -= 3;

        return { p, score };
      })
      .filter(x => x.score > 0)
      .sort((a,b)=> b.score - a.score)
      .slice(0, 10)
      .map(x => x.p);
    }

    async function seleccionarProductoDesdeAC(idx){
      const item = acItems[idx];
      if(!item) return;

      inputBusqueda.value = item.nombre_producto || '';
      closeAC();

      try{
        const res = await fetch(`${API_PRODUCTOS}/${item.id_producto}`);
        const data = await res.json().catch(()=> ({}));
        if(!res.ok) throw new Error(data.message || 'No se pudo cargar el producto.');
        llenarFormularioProducto(data);
      }catch(err){
        console.error(err);
        alert('Error al cargar el producto seleccionado.');
      }
    }

    // Eventos autocomplete
    inputBusqueda.addEventListener('focus', async ()=>{
      try{
        await ensureCatalogoCargado();
        const items = filtrarProductos(inputBusqueda.value);
        if(items.length) renderAC(items);
      }catch(err){
        console.error(err);
      }
    });

    inputBusqueda.addEventListener('input', async ()=>{
      try{
        await ensureCatalogoCargado();
        const items = filtrarProductos(inputBusqueda.value);
        renderAC(items);
      }catch(err){
        console.error(err);
        closeAC();
      }
    });

    inputBusqueda.addEventListener('keydown', (e)=>{
      if(!acOpen) return;

      if(e.key === 'ArrowDown'){
        e.preventDefault();
        const next = Math.min(acItems.length - 1, (acActiveIndex < 0 ? 0 : acActiveIndex + 1));
        setActive(next);
      }else if(e.key === 'ArrowUp'){
        e.preventDefault();
        const prev = Math.max(0, (acActiveIndex < 0 ? 0 : acActiveIndex - 1));
        setActive(prev);
      }else if(e.key === 'Enter'){
        if(acItems.length && acActiveIndex >= 0){
          e.preventDefault();
          seleccionarProductoDesdeAC(acActiveIndex);
        }
      }else if(e.key === 'Escape'){
        closeAC();
      }
    });

    document.addEventListener('click', (e)=>{
      if(!acOpen) return;
      const wrap = inputBusqueda.closest('.autocomplete-wrap');
      if(wrap && !wrap.contains(e.target)){
        closeAC();
      }
    });

    // Cargar categorías
    async function cargarCategorias() {
      try {
        const res = await fetch(API_CATEGORIAS);
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();

        selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
        data.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat.id_categoria;
          opt.textContent = cat.nombre_categoria;
          selectCategoria.appendChild(opt);
        });
      } catch (err) {
        console.error(err);
        alert('No se pudieron cargar las categorías.');
      }
    }

    // Cargar proveedores
    async function cargarProveedores() {
      try {
        const res = await fetch(API_PROVEEDORES);
        if (!res.ok) throw new Error('Error al cargar proveedores');
        const data = await res.json();

        selectProveedor.innerHTML = '<option value="">Sin proveedor asignado</option>';
        data.forEach(prov => {
          const opt = document.createElement('option');
          opt.value = prov.id_proveedor;
          opt.textContent = prov.nombre_proveedor;
          selectProveedor.appendChild(opt);
        });
      } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los proveedores.');
      }
    }

    function llenarFormularioProducto(prod) {
      document.getElementById('id_producto').value           = prod.id_producto || '';
      document.getElementById('codigo_barra').value          = prod.codigo_barra || '';
      document.getElementById('codigo_interno').value        = prod.codigo_interno || '';
      document.getElementById('nombre_producto').value       = prod.nombre_producto || '';
      document.getElementById('descripcion').value           = prod.descripcion || '';
      document.getElementById('unidad_medida').value         = prod.unidad_medida || 'unidad';
      document.getElementById('stock_actual').value          = prod.stock_actual ?? 0;
      document.getElementById('stock_minimo').value          = prod.stock_minimo ?? 0;
      document.getElementById('precio_compra').value         = prod.precio_compra ?? 0;
      document.getElementById('precio_venta_cliente').value  = prod.precio_venta_cliente ?? 0;
      document.getElementById('precio_venta_camion').value   = prod.precio_venta_camion ?? 0;
      document.getElementById('precio_venta_preventa').value = prod.precio_venta_preventa ?? 0;
      document.getElementById('estado').value                = prod.estado || 'activo';
      document.getElementById('notas').value                 = prod.notas || '';

      selectCategoria.value = prod.id_categoria ? String(prod.id_categoria) : '';
      selectProveedor.value = prod.id_proveedor ? String(prod.id_proveedor) : '';

      btnGuardarProducto.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>&nbsp;Actualizar producto';
    }

    function limpiarFormularioProducto() {
      productoForm.reset();
      document.getElementById('id_producto').value = '';
      btnGuardarProducto.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>&nbsp;Guardar producto';
    }

    // Submit buscador exacto
    buscadorProductoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      closeAC();

      const termino = inputBusqueda.value.trim();
      if (!termino) {
        alert('Escribe al menos un código o nombre para buscar.');
        return;
      }

      try {
        const res = await fetch(`${API_PRODUCTOS}/buscar?termino=${encodeURIComponent(termino)}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(data.message || 'Producto no encontrado.');
          return;
        }

        llenarFormularioProducto(data);
      } catch (err) {
        console.error(err);
        alert('Error al buscar el producto.');
      }
    });

    // Crear / actualizar
    productoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id_producto = document.getElementById('id_producto').value;

      const payload = {
        id_categoria: document.getElementById('id_categoria').value,
        id_proveedor: document.getElementById('id_proveedor').value || null,
        codigo_barra: document.getElementById('codigo_barra').value.trim() || null,
        codigo_interno: document.getElementById('codigo_interno').value.trim() || null,
        nombre_producto: document.getElementById('nombre_producto').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        unidad_medida: document.getElementById('unidad_medida').value.trim() || 'unidad',
        stock_actual: parseFloat(document.getElementById('stock_actual').value || '0'),
        stock_minimo: parseFloat(document.getElementById('stock_minimo').value || '0'),
        precio_compra: parseFloat(document.getElementById('precio_compra').value || '0'),
        precio_venta_cliente: parseFloat(document.getElementById('precio_venta_cliente').value || '0'),
        precio_venta_camion: parseFloat(document.getElementById('precio_venta_camion').value || '0'),
        precio_venta_preventa: parseFloat(document.getElementById('precio_venta_preventa').value || '0'),
        estado: document.getElementById('estado').value || 'activo',
        notas: document.getElementById('notas').value.trim() || null,
      };

      if (!payload.nombre_producto) { alert('El nombre del producto es obligatorio.'); return; }
      if (!payload.id_categoria) { alert('Selecciona una categoría.'); return; }

      const esEditar = !!id_producto;
      const url      = esEditar ? `${API_PRODUCTOS}/${id_producto}` : API_PRODUCTOS;
      const metodo   = esEditar ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || 'Error al guardar el producto.');
          return;
        }

        llenarFormularioProducto(data);

        // refrescar catálogo para sugerencias
        catalogoProductos = [];
        await ensureCatalogoCargado();

        alert('Producto guardado correctamente.');
      } catch (err) {
        console.error(err);
        alert('Ocurrió un error guardando el producto.');
      }
    });

    // Eliminar
    btnEliminarProducto.addEventListener('click', async () => {
      const id = document.getElementById('id_producto').value;
      if (!id) {
        alert('Primero carga un producto (buscar) antes de intentar eliminar.');
        return;
      }

      if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

      try {
        const res = await fetch(`${API_PRODUCTOS}/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(data.message || 'Error al eliminar el producto.');
          return;
        }

        limpiarFormularioProducto();

        catalogoProductos = [];
        await ensureCatalogoCargado();

        alert(data.message || 'Producto eliminado correctamente.');
      } catch (err) {
        console.error(err);
        alert('Ocurrió un error eliminando el producto.');
      }
    });

    // Limpiar
    btnLimpiarProducto.addEventListener('click', () => {
      setTimeout(() => limpiarFormularioProducto(), 0);
    });

    (async () => {
      await Promise.all([cargarCategorias(), cargarProveedores()]);
      try { await ensureCatalogoCargado(); } catch(e){ console.error(e); }
    })();