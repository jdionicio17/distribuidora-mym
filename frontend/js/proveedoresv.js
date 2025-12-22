
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

    // ==============================
    // LÓGICA FRONTEND PROVEEDORES
    // ==============================

    const API_PROVEEDORES = `${API_BASE}/api/proveedores`;


    const proveedorForm   = document.getElementById('proveedorForm');
    const btnGuardar      = document.getElementById('btnGuardarProveedor');
    const btnLimpiar      = document.getElementById('btnLimpiarProveedor');
    const tablaProveedoresBody = document
        .getElementById('tablaProveedores')
        .querySelector('tbody');

    // Al cargar la página, traemos proveedores desde el backend
    document.addEventListener('DOMContentLoaded', () => {
        cargarProveedores();
    });

    async function cargarProveedores() {
        try {
            const res = await fetch(API_PROVEEDORES);
            if (!res.ok) throw new Error('Error al obtener proveedores');
            const data = await res.json();

            // Limpiar tbody
            tablaProveedoresBody.innerHTML = '';

            if (!data || data.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 6;
                td.classList.add('empty-row');
                td.textContent = 'No hay proveedores registrados.';
                tr.appendChild(td);
                tablaProveedoresBody.appendChild(tr);
                return;
            }

            data.forEach((prov) => {
                const tr = document.createElement('tr');
                tr.dataset.id = prov.id_proveedor;

                tr.innerHTML = `
                    <td>${prov.nombre_proveedor || ''}</td>
                    <td>${prov.nombre_contacto || ''}</td>
                    <td>${prov.telefono || ''}</td>
                    <td>${prov.email || ''}</td>
                    <td>
                        <span class="badge ${prov.estado === 'activo' ? 'badge-success' : 'badge-danger'}">
                            ${prov.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td class="tabla-acciones">
                        <button type="button" class="btn-icon btn-editar" title="Editar">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-icon btn-icon-danger btn-eliminar" title="Eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;

                tablaProveedoresBody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            alert('Error al cargar proveedores. Revisa la consola.');
        }
    }

    // Cargar un proveedor por ID al formulario
    async function cargarProveedorEnFormulario(id) {
        try {
            const res = await fetch(`${API_PROVEEDORES}/${id}`);
            if (!res.ok) {
                alert('No se pudo obtener el proveedor');
                return;
            }
            const prov = await res.json();

            document.getElementById('id_proveedor').value      = prov.id_proveedor;
            document.getElementById('nombre_proveedor').value  = prov.nombre_proveedor || '';
            document.getElementById('nombre_contacto').value   = prov.nombre_contacto || '';
            document.getElementById('telefono').value          = prov.telefono || '';
            document.getElementById('telefono_alt').value      = prov.telefono_alt || '';
            document.getElementById('email').value             = prov.email || '';
            document.getElementById('nit').value               = prov.nit || '';
            document.getElementById('ciudad').value            = prov.ciudad || '';
            document.getElementById('departamento').value      = prov.departamento || '';
            document.getElementById('direccion').value         = prov.direccion || '';
            document.getElementById('estado').value            = prov.estado || 'activo';
            document.getElementById('notas').value             = prov.notas || '';

            btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>&nbsp;Actualizar proveedor';
        } catch (err) {
            console.error('Error al cargar proveedor:', err);
            alert('Error al cargar los datos del proveedor.');
        }
    }

    // Manejar clic en botones Editar / Eliminar dentro de la tabla
    tablaProveedoresBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const fila = btn.closest('tr');
        if (!fila) return;

        const id = fila.dataset.id;

        if (btn.classList.contains('btn-editar')) {
            cargarProveedorEnFormulario(id);
        }

        if (btn.classList.contains('btn-eliminar')) {
            const nombre = fila.querySelector('td').textContent.trim();
            const confirmar = confirm(`¿Seguro que deseas eliminar al proveedor "${nombre}"?`);

            if (confirmar) {
                eliminarProveedor(id);
            }
        }
    });

    async function eliminarProveedor(id) {
        try {
            const res = await fetch(`${API_PROVEEDORES}/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.message || 'Error al eliminar el proveedor';
                alert(msg);
                return;
            }

            await cargarProveedores();
            alert('Proveedor eliminado correctamente');
        } catch (err) {
            console.error('Error al eliminar proveedor:', err);
            alert('Error al eliminar el proveedor. Revisa la consola.');
        }
    }

    // Enviar formulario (crear / actualizar)
    proveedorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id_proveedor = document.getElementById('id_proveedor').value;

        const payload = {
            nombre_proveedor: document.getElementById('nombre_proveedor').value.trim(),
            nombre_contacto:  document.getElementById('nombre_contacto').value.trim(),
            telefono:         document.getElementById('telefono').value.trim(),
            telefono_alt:     document.getElementById('telefono_alt').value.trim(),
            email:            document.getElementById('email').value.trim(),
            nit:              document.getElementById('nit').value.trim(),
            ciudad:           document.getElementById('ciudad').value.trim(),
            departamento:     document.getElementById('departamento').value.trim(),
            direccion:        document.getElementById('direccion').value.trim(),
            estado:           document.getElementById('estado').value,
            notas:            document.getElementById('notas').value.trim()
        };

        if (!payload.nombre_proveedor) {
            alert('El nombre del proveedor es obligatorio.');
            return;
        }

        try {
            let url = API_PROVEEDORES;
            let method = 'POST';

            if (id_proveedor) {
                url = `${API_PROVEEDORES}/${id_proveedor}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const msg = data.message || 'Error al guardar el proveedor';
                alert(msg);
                return;
            }

            // Exito
            proveedorForm.reset();
            document.getElementById('id_proveedor').value = '';
            btnGuardar.innerHTML = '<i class="fa-solid fa-truck-field"></i>&nbsp;Guardar proveedor';

            await cargarProveedores();

            if (method === 'POST') {
                alert('Proveedor creado correctamente');
            } else {
                alert('Proveedor actualizado correctamente');
            }

        } catch (err) {
            console.error('Error al guardar proveedor:', err);
            alert('Error al guardar el proveedor. Revisa la consola.');
        }
    });

    // Limpiar formulario y volver a modo "Guardar"
    btnLimpiar.addEventListener('click', (e) => {
        // para que no haga reset antes de limpiar id, igual funciona pero por claridad:
        setTimeout(() => {
            document.getElementById('id_proveedor').value = '';
            btnGuardar.innerHTML = '<i class="fa-solid fa-truck-field"></i>&nbsp;Guardar proveedor';
        }, 0);
    });