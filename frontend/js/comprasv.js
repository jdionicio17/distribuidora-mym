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

    // ✅ Formatear fecha/hora
    function formatDateTime(v) {
        if (!v) return '--';
        const dateStr = String(v).replace(' ', 'T');
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(v);
        
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const año = d.getFullYear();
        let hora = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const seg = String(d.getSeconds()).padStart(2, '0');
        const ampm = hora >= 12 ? 'PM' : 'AM';
        hora = hora % 12;
        if (hora === 0) hora = 12;
        
        return `${dia}/${mes}/${año}, ${hora}:${min}:${seg} ${ampm}`;
    }

    // APIs
    const API_PROVEEDORES = `${API_BASE}/api/proveedores`;
    const API_PRODUCTOS   = `${API_BASE}/api/productos`;
    const API_COMPRAS     = `${API_BASE}/api/compras`;


    // DOM
    const btnNuevaCompra = document.getElementById('btnNuevaCompra');
    const modalCompra = document.getElementById('modalCompra');
    const btnCerrarModalCompra = document.getElementById('btnCerrarModalCompra');
    const btnCancelarCompra = document.getElementById('btnCancelarCompra');
    const btnGuardarCompra = document.getElementById('btnGuardarCompra');
    const formCompra = document.getElementById('formCompra');

    const selectProveedorCompra = document.getElementById('id_proveedor_compra');
    const tipoCompraSelect = document.getElementById('tipo_compra');
    const fechaCompraInput = document.getElementById('fecha_compra');
    const fechaVencimientoInput = document.getElementById('fecha_vencimiento');
    const notasCompraInput = document.getElementById('notas_compra');
    const numeroDocumentoInput = document.getElementById('numero_documento');

    const formBuscarProductoCompra = document.getElementById('formBuscarProductoCompra');
    const terminoBusquedaCompra = document.getElementById('terminoBusquedaCompra');
    const dropdownSugerencias = document.getElementById('dropdownSugerencias');
    
    const alertaProductoNoExiste = document.getElementById('alertaProductoNoExiste');
    const btnIrProductos = document.getElementById('btnIrProductos');

    const formAgregarItem = document.getElementById('formAgregarItem');
    const hiddenIdProductoItem = document.getElementById('id_producto_item');
    const nombreProductoItem = document.getElementById('nombre_producto_item');
    const cantidadItemInput = document.getElementById('cantidad_item');
    const precioUnitarioInput = document.getElementById('precio_unitario_item');

    const tbodyItemsCompra = document.getElementById('tbodyItemsCompra');
    const totalBrutoTexto = document.getElementById('totalBrutoTexto');
    const descuentoTexto = document.getElementById('descuentoTexto');
    const totalNetoTexto = document.getElementById('totalNetoTexto');

    const tablaComprasBody = document.querySelector('#tablaCompras tbody');

    const modalDetalleCompra = document.getElementById('modalDetalleCompra');
    const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');
    const btnCerrarModalDetalle2 = document.getElementById('btnCerrarModalDetalle2');
    const detalleCompraHeader = document.getElementById('detalleCompraHeader');
    const tbodyDetalleCompra = document.getElementById('tbodyDetalleCompra');
    const detalleTotalBruto = document.getElementById('detalleTotalBruto');
    const detalleDescuento = document.getElementById('detalleDescuento');
    const detalleTotalNeto = document.getElementById('detalleTotalNeto');

    // Estado
    let itemsCompra = [];
    let sugerenciasActuales = [];
    let sugIndex = -1;
    let debounceTimer = null;

    // Funciones auxiliares
    function abrirModalCompra() {
        modalCompra.classList.add('open');
    }
    function cerrarModalCompra() {
        modalCompra.classList.remove('open');
        resetearFormularioCompra();
    }
    function abrirModalDetalle() {
        modalDetalleCompra.classList.add('open');
    }
    function cerrarModalDetalle() {
        modalDetalleCompra.classList.remove('open');
    }

    function resetearFormularioCompra() {
        formCompra.reset();
        formBuscarProductoCompra.reset();
        formAgregarItem.reset();
        formAgregarItem.style.display = 'none';
        alertaProductoNoExiste.style.display = 'none';
        itemsCompra = [];
        renderItemsCompra();
        cerrarDropdown();
        const hoy = new Date().toISOString().slice(0, 10);
        fechaCompraInput.value = hoy;
        fechaVencimientoInput.value = '';
    }

    function formatearMoneda(q) {
        return (Number(q) || 0).toFixed(2);
    }

    function calcularTotales() {
        const totalBruto = itemsCompra.reduce((acc, it) => acc + it.subtotal, 0);
        const descuento = 0;
        const totalNeto = totalBruto - descuento;

        totalBrutoTexto.textContent = formatearMoneda(totalBruto);
        descuentoTexto.textContent = formatearMoneda(descuento);
        totalNetoTexto.textContent = formatearMoneda(totalNeto);

        return { totalBruto, descuento, totalNeto };
    }

    function renderItemsCompra() {
        tbodyItemsCompra.innerHTML = '';
        if (itemsCompra.length === 0) {
            tbodyItemsCompra.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-row">
                        No has agregado productos a esta compra todavía
                    </td>
                </tr>
            `;
            calcularTotales();
            return;
        }

        itemsCompra.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>Q ${formatearMoneda(item.precio_unitario)}</td>
                <td>Q ${formatearMoneda(item.subtotal)}</td>
                <td class="tabla-acciones">
                    <button type="button" class="btn-icon btn-eliminar-item" data-index="${idx}" title="Eliminar">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tbodyItemsCompra.appendChild(tr);
        });

        calcularTotales();
    }

    // ===== AUTOCOMPLETE =====
    function cerrarDropdown() {
        if (!dropdownSugerencias) return;
        dropdownSugerencias.style.display = 'none';
        dropdownSugerencias.innerHTML = '';
        sugerenciasActuales = [];
        sugIndex = -1;
    }

    function abrirDropdownSug() {
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

        hiddenIdProductoItem.value = p.id_producto;
        nombreProductoItem.value = p.nombre_producto;
        precioUnitarioInput.value = p.precio_compra || 0;
        cantidadItemInput.value = 1;

        formAgregarItem.style.display = 'block';
        alertaProductoNoExiste.style.display = 'none';
        terminoBusquedaCompra.value = p.nombre_producto;

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
            abrirDropdownSug();
            return;
        }

        lista.forEach((p, idx) => {
            const prov = p.nombre_proveedor ? ` · ${p.nombre_proveedor}` : '';
            const cat = p.nombre_categoria ? ` · ${p.nombre_categoria}` : '';
            
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
                    <div>Precio compra: Q ${formatearMoneda(p.precio_compra)}</div>
                </div>
            `;

            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                seleccionarSugerencia(idx);
            });

            dropdownSugerencias.appendChild(div);
        });

        abrirDropdownSug();
        marcarActivo(0);
    }

    async function pedirSugerencias(term) {
        const res = await fetch(`${API_PRODUCTOS}/sugerencias?termino=${encodeURIComponent(term)}&limit=10`);
        if (!res.ok) throw new Error('Error sugerencias');
        return await res.json();
    }

    terminoBusquedaCompra.addEventListener('input', () => {
        const term = terminoBusquedaCompra.value.trim();

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

    terminoBusquedaCompra.addEventListener('keydown', (e) => {
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

    terminoBusquedaCompra.addEventListener('blur', () => {
        setTimeout(() => cerrarDropdown(), 120);
    });

    // ✅ BUSCAR PRODUCTO (fallback si no hay sugerencias)
    formBuscarProductoCompra.addEventListener('submit', async (e) => {
        e.preventDefault();
        const termino = terminoBusquedaCompra.value.trim();
        if (!termino) return alert('Escribe un código o nombre para buscar el producto');

        if (sugerenciasActuales.length > 0) {
            seleccionarSugerencia(sugIndex >= 0 ? sugIndex : 0);
            return;
        }

        // ✅ Fallback: búsqueda puntual
        try {
            const res = await fetch(`${API_PRODUCTOS}/buscar?termino=${encodeURIComponent(termino)}`);
            
            if (res.status === 404) {
                // ✅ PRODUCTO NO EXISTE - MOSTRAR ALERTA
                formAgregarItem.style.display = 'none';
                alertaProductoNoExiste.style.display = 'block';
                return;
            }
            
            if (!res.ok) throw new Error('Error al buscar producto');

            const prod = await res.json();
            hiddenIdProductoItem.value = prod.id_producto;
            nombreProductoItem.value = prod.nombre_producto;
            precioUnitarioInput.value = prod.precio_compra != null ? prod.precio_compra : 0;
            cantidadItemInput.value = 1;

            formAgregarItem.style.display = 'block';
            alertaProductoNoExiste.style.display = 'none';
        } catch (err) {
            console.error(err);
            alert('Error al buscar el producto');
        }
    });

    // ✅ REDIRIGIR A PRODUCTOS
    btnIrProductos.addEventListener('click', () => {
        if (confirm('¿Deseas ir a crear el producto ahora? Los datos de esta compra se perderán.')) {
            window.location.href = 'productosv.html';
        }
    });

    // AGREGAR ITEM
    formAgregarItem.addEventListener('submit', (e) => {
        e.preventDefault();

        const idProd = hiddenIdProductoItem.value;
        const nombre = nombreProductoItem.value;
        const cant = parseFloat(cantidadItemInput.value);
        const precio = parseFloat(precioUnitarioInput.value);

        if (!idProd) return alert('Debe haber un producto seleccionado');
        if (!cant || cant <= 0) return alert('La cantidad debe ser mayor que 0');
        if (precio == null || precio < 0) return alert('El precio unitario no puede ser negativo');

        const subtotal = cant * precio;
        itemsCompra.push({
            id_producto: idProd,
            nombre,
            cantidad: cant,
            precio_unitario: precio,
            subtotal
        });

        renderItemsCompra();
        cantidadItemInput.value = 1;
        precioUnitarioInput.value = precio;
    });

    // Eliminar item
    tbodyItemsCompra.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-eliminar-item');
        if (!btn) return;
        const index = parseInt(btn.dataset.index, 10);
        if (isNaN(index)) return;

        itemsCompra.splice(index, 1);
        renderItemsCompra();
    });

    // ✅ GUARDAR COMPRA (con validación de productos)
    btnGuardarCompra.addEventListener('click', async () => {
        if (itemsCompra.length === 0) {
            return alert('Agrega al menos un producto a la compra antes de guardar');
        }

        const id_proveedor = selectProveedorCompra.value;
        const tipo_compra = tipoCompraSelect.value;
        const fecha_compra = fechaCompraInput.value;
        const fecha_venc = fechaVencimientoInput.value || null;
        const numero_doc = numeroDocumentoInput.value.trim() || null;
        const notas = notasCompraInput.value.trim() || null;

        if (!id_proveedor) return alert('Selecciona un proveedor');
        if (!fecha_compra) return alert('Selecciona la fecha de compra');

        calcularTotales();

        const payload = {
            id_proveedor: Number(id_proveedor),
            tipo_compra,
            fecha_compra,
            fecha_vencimiento: fecha_venc,
            numero_documento: numero_doc,
            notas,
            items: itemsCompra.map(it => ({
                id_producto: Number(it.id_producto),
                cantidad: it.cantidad,
                precio_unitario: it.precio_unitario
            }))
        };

        try {
            const res = await fetch(API_COMPRAS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) {
                // ✅ PRODUCTO NO EXISTE - REDIRIGIR
                if (data.producto_no_encontrado) {
                    const irAProductos = confirm(
                        `${data.message}\n\n¿Deseas ir a crear el producto ahora? Los datos de esta compra se perderán.`
                    );
                    if (irAProductos) {
                        window.location.href = 'productosv.html';
                    }
                    return;
                }
                
                throw new Error(data.message || 'Error al guardar la compra');
            }

            alert('✓ Compra registrada correctamente. El inventario se ha actualizado automáticamente.');
            cerrarModalCompra();
            await cargarCompras();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Ocurrió un error al guardar la compra');
        }
    });

    // CARGAR PROVEEDORES
    async function cargarProveedores() {
        try {
            const res = await fetch(API_PROVEEDORES);
            if (!res.ok) throw new Error('Error al cargar proveedores');
            const proveedores = await res.json();

            selectProveedorCompra.innerHTML = `<option value="">Seleccione un proveedor</option>`;
            proveedores.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id_proveedor;
                opt.textContent = p.nombre_proveedor;
                selectProveedorCompra.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
            alert('No se pudieron cargar los proveedores');
        }
    }

    // CARGAR COMPRAS
    async function cargarCompras() {
        try {
            const res = await fetch(API_COMPRAS);
            if (!res.ok) throw new Error('Error al cargar compras');
            const compras = await res.json();

            tablaComprasBody.innerHTML = '';

            if (!compras || compras.length === 0) {
                tablaComprasBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="empty-row">
                            No hay compras registradas todavía
                        </td>
                    </tr>
                `;
                return;
            }

            compras.forEach(c => {
                const fechaTexto = formatDateTime(c.fecha_compra || c.creado_en);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.id_compra}</td>
                    <td>${fechaTexto}</td>
                    <td>${c.nombre_proveedor || ''}</td>
                    <td>${c.tipo_compra === 'credito' ? 'Crédito' : 'Contado'}</td>
                    <td>Q ${formatearMoneda(c.total_neto)}</td>
                    <td>Q ${formatearMoneda(c.saldo_pendiente)}</td>
                    <td>
                        <span class="badge ${
                            c.estado === 'pagada' ? 'badge-success'
                            : c.estado === 'anulada' ? 'badge-danger'
                            : ''
                        }">${c.estado}</span>
                    </td>
                    <td class="tabla-acciones">
                        <button type="button" class="btn-icon btn-ver-detalle" data-id="${c.id_compra}" title="Ver detalle">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </td>
                `;
                tablaComprasBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            alert('Error al cargar la lista de compras');
        }
    }

    // VER DETALLE
    tablaComprasBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.btn-ver-detalle');
        if (!btn) return;

        const id = btn.dataset.id;
        if (!id) return;

        try {
            const res = await fetch(`${API_COMPRAS}/${id}`);
            if (!res.ok) throw new Error('Error al cargar detalle de la compra');

            const data = await res.json();
            const { compra, detalles } = data;

            const fechaDetalle = formatDateTime(compra.fecha_compra || compra.creado_en);

            detalleCompraHeader.innerHTML = `
                <div><strong>Compra #${compra.id_compra}</strong></div>
                <div>Proveedor: <strong>${compra.nombre_proveedor || ''}</strong></div>
                <div>Fecha: ${fechaDetalle}</div>
                <div>Tipo: ${compra.tipo_compra === 'credito' ? 'Crédito' : 'Contado'} | Estado: ${compra.estado}</div>
                <div>Documento: ${compra.numero_documento || 'N/A'}</div>
            `;

            tbodyDetalleCompra.innerHTML = '';
            if (!detalles || detalles.length === 0) {
                tbodyDetalleCompra.innerHTML = `
                    <tr><td colspan="4" class="empty-row">Sin productos en esta compra</td></tr>
                `;
            } else {
                detalles.forEach(d => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${d.nombre_producto || d.descripcion_producto || ''}</td>
                        <td>${d.cantidad}</td>
                        <td>Q ${formatearMoneda(d.precio_unitario)}</td>
                        <td>Q ${formatearMoneda(d.subtotal)}</td>
                    `;
                    tbodyDetalleCompra.appendChild(tr);
                });
            }

            detalleTotalBruto.textContent = formatearMoneda(compra.total_bruto);
            detalleDescuento.textContent = formatearMoneda(compra.descuento_total);
            detalleTotalNeto.textContent = formatearMoneda(compra.total_neto);

            abrirModalDetalle();
        } catch (err) {
            console.error(err);
            alert('No se pudo cargar el detalle de la compra');
        }
    });

    // LISTENERS
    btnNuevaCompra.addEventListener('click', () => {
        resetearFormularioCompra();
        abrirModalCompra();
    });

    btnCerrarModalCompra.addEventListener('click', cerrarModalCompra);
    btnCancelarCompra.addEventListener('click', cerrarModalCompra);

    btnCerrarModalDetalle.addEventListener('click', cerrarModalDetalle);
    btnCerrarModalDetalle2.addEventListener('click', cerrarModalDetalle);

    modalCompra.addEventListener('click', (e) => {
        if (e.target === modalCompra) cerrarModalCompra();
    });
    modalDetalleCompra.addEventListener('click', (e) => {
        if (e.target === modalDetalleCompra) cerrarModalDetalle();
    });

    // INIT
    (async function initCompras() {
        resetearFormularioCompra();
        await cargarProveedores();
        await cargarCompras();
    })();