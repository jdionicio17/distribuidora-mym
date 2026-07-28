document.addEventListener('DOMContentLoaded', () => {
    // ==================================================
    // ELEMENTOS GENERALES
    // ==================================================
    const sidebarToggle =
        document.getElementById('sidebarToggle');

    const sidebar =
        document.getElementById('sidebar');

    const yearSpan =
        document.getElementById('year');

    const proveedorForm =
        document.getElementById('proveedorForm');

    const tablaProveedores =
        document.getElementById('tablaProveedores');

    const tablaProveedoresBody =
        tablaProveedores
            ? tablaProveedores.querySelector('tbody')
            : null;

    const idProveedorInput =
        document.getElementById('id_proveedor');

    const nombreProveedorInput =
        document.getElementById('nombre_proveedor');

    const nombreContactoInput =
        document.getElementById('nombre_contacto');

    const telefonoInput =
        document.getElementById('telefono');

    const telefonoAltInput =
        document.getElementById('telefono_alt');

    const emailInput =
        document.getElementById('email');

    const nitInput =
        document.getElementById('nit');

    const ciudadInput =
        document.getElementById('ciudad');

    const departamentoInput =
        document.getElementById('departamento');

    const direccionInput =
        document.getElementById('direccion');

    const estadoInput =
        document.getElementById('estado');

    const notasInput =
        document.getElementById('notas');

    const btnGuardar =
        document.getElementById(
            'btnGuardarProveedor'
        );

    const btnLimpiar =
        document.getElementById(
            'btnLimpiarProveedor'
        );

    const seccionFormulario =
        proveedorForm
            ? proveedorForm.closest('.section')
            : null;

    const tituloFormulario =
        seccionFormulario
            ? seccionFormulario.querySelector(
                '.section-header h3'
            )
            : null;

    const descripcionFormulario =
        seccionFormulario
            ? seccionFormulario.querySelector(
                '.section-header p'
            )
            : null;

    const BASE_URL =
        typeof API_BASE !== 'undefined'
            ? String(API_BASE).replace(/\/+$/, '')
            : '';

    const API_PROVEEDORES =
        `${BASE_URL}/api/proveedores`;

    let idProveedorEditando = null;


    // ==================================================
    // SIDEBAR
    // ==================================================
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener(
            'click',
            () => {
                sidebar.classList.toggle(
                    'sidebar-open'
                );
            }
        );
    }


    // ==================================================
    // AÑO DEL FOOTER
    // ==================================================
    if (yearSpan) {
        yearSpan.textContent =
            new Date().getFullYear();
    }


    // ==================================================
    // LEER RESPUESTA JSON
    // ==================================================
    async function leerRespuesta(respuesta) {
        try {
            return await respuesta.json();
        } catch (error) {
            return {};
        }
    }


    // ==================================================
    // CREAR CELDA SEGURA
    // ==================================================
    function crearCelda(texto) {
        const td = document.createElement('td');

        td.textContent =
            texto === null || texto === undefined
                ? ''
                : String(texto);

        return td;
    }


    // ==================================================
    // RESTABLECER FORMULARIO
    // ==================================================
    function activarModoCreacion() {
        idProveedorEditando = null;

        if (proveedorForm) {
            proveedorForm.reset();
        }

        if (idProveedorInput) {
            idProveedorInput.value = '';
        }

        if (estadoInput) {
            estadoInput.value = 'activo';
        }

        if (tituloFormulario) {
            tituloFormulario.textContent =
                'Agregar proveedor';
        }

        if (descripcionFormulario) {
            descripcionFormulario.textContent =
                'Completa los datos para registrar un nuevo proveedor.';
        }

        if (btnGuardar) {
            btnGuardar.innerHTML = `
                <i class="fa-solid fa-truck-field"></i>
                &nbsp;Guardar proveedor
            `;
        }

        if (btnLimpiar) {
            btnLimpiar.innerHTML = `
                <i class="fa-solid fa-rotate-left"></i>
                &nbsp;Limpiar
            `;
        }
    }


    // ==================================================
    // ACTIVAR MODO EDICIÓN
    // ==================================================
    function activarModoEdicion(proveedor) {
        idProveedorEditando =
            Number(proveedor.id_proveedor);

        idProveedorInput.value =
            proveedor.id_proveedor;

        nombreProveedorInput.value =
            proveedor.nombre_proveedor || '';

        nombreContactoInput.value =
            proveedor.nombre_contacto || '';

        telefonoInput.value =
            proveedor.telefono || '';

        telefonoAltInput.value =
            proveedor.telefono_alt || '';

        emailInput.value =
            proveedor.email || '';

        nitInput.value =
            proveedor.nit || '';

        ciudadInput.value =
            proveedor.ciudad || '';

        departamentoInput.value =
            proveedor.departamento || '';

        direccionInput.value =
            proveedor.direccion || '';

        estadoInput.value =
            proveedor.estado || 'activo';

        notasInput.value =
            proveedor.notas || '';

        if (tituloFormulario) {
            tituloFormulario.textContent =
                'Editar proveedor';
        }

        if (descripcionFormulario) {
            descripcionFormulario.textContent =
                `Modificando el proveedor "${proveedor.nombre_proveedor}".`;
        }

        if (btnGuardar) {
            btnGuardar.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                &nbsp;Actualizar proveedor
            `;
        }

        if (btnLimpiar) {
            btnLimpiar.innerHTML = `
                <i class="fa-solid fa-xmark"></i>
                &nbsp;Cancelar edición
            `;
        }

        proveedorForm.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        nombreProveedorInput.focus();
    }


    // ==================================================
    // CARGAR PROVEEDORES
    // ==================================================
    async function cargarProveedores() {
        if (!tablaProveedoresBody) {
            return;
        }

        tablaProveedoresBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    Cargando proveedores...
                </td>
            </tr>
        `;

        try {
            const respuesta = await fetch(
                API_PROVEEDORES,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const proveedores =
                await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                throw new Error(
                    proveedores.message ||
                    'Error al obtener proveedores.'
                );
            }

            tablaProveedoresBody.innerHTML = '';

            if (
                !Array.isArray(proveedores) ||
                proveedores.length === 0
            ) {
                tablaProveedoresBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">
                            No hay proveedores registrados.
                        </td>
                    </tr>
                `;

                return;
            }

            proveedores.forEach((proveedor) => {
                const fila =
                    document.createElement('tr');

                fila.dataset.id =
                    proveedor.id_proveedor;

                // Nombre del proveedor
                fila.appendChild(
                    crearCelda(
                        proveedor.nombre_proveedor
                    )
                );

                // Contacto
                fila.appendChild(
                    crearCelda(
                        proveedor.nombre_contacto
                    )
                );

                // Teléfono
                fila.appendChild(
                    crearCelda(
                        proveedor.telefono
                    )
                );

                // Correo
                fila.appendChild(
                    crearCelda(
                        proveedor.email
                    )
                );

                // Estado
                const tdEstado =
                    document.createElement('td');

                const badge =
                    document.createElement('span');

                badge.classList.add('badge');

                if (proveedor.estado === 'activo') {
                    badge.classList.add(
                        'badge-success'
                    );

                    badge.textContent = 'Activo';

                } else {
                    badge.classList.add(
                        'badge-danger'
                    );

                    badge.textContent = 'Inactivo';
                }

                tdEstado.appendChild(badge);
                fila.appendChild(tdEstado);

                // Acciones
                const tdAcciones =
                    document.createElement('td');

                tdAcciones.classList.add(
                    'tabla-acciones'
                );

                // Botón editar
                const btnEditar =
                    document.createElement('button');

                btnEditar.type = 'button';
                btnEditar.className =
                    'btn-icon btn-editar';

                btnEditar.title = 'Editar';

                btnEditar.setAttribute(
                    'aria-label',
                    `Editar proveedor ${proveedor.nombre_proveedor}`
                );

                btnEditar.innerHTML = `
                    <i class="fa-solid fa-pen-to-square"></i>
                `;

                btnEditar.addEventListener(
                    'click',
                    async () => {
                        await cargarProveedorEnFormulario(
                            proveedor.id_proveedor,
                            btnEditar
                        );
                    }
                );

                tdAcciones.appendChild(btnEditar);

                // Botón eliminar
                const btnEliminar =
                    document.createElement('button');

                btnEliminar.type = 'button';

                btnEliminar.className =
                    'btn-icon btn-icon-danger btn-eliminar';

                btnEliminar.title = 'Eliminar';

                btnEliminar.setAttribute(
                    'aria-label',
                    `Eliminar proveedor ${proveedor.nombre_proveedor}`
                );

                btnEliminar.innerHTML = `
                    <i class="fa-solid fa-trash-can"></i>
                `;

                btnEliminar.addEventListener(
                    'click',
                    async () => {
                        await eliminarProveedor(
                            proveedor.id_proveedor,
                            proveedor.nombre_proveedor,
                            btnEliminar
                        );
                    }
                );

                tdAcciones.appendChild(btnEliminar);

                fila.appendChild(tdAcciones);

                tablaProveedoresBody.appendChild(
                    fila
                );
            });

        } catch (error) {
            console.error(
                'Error al cargar proveedores:',
                error
            );

            tablaProveedoresBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        ${error.message ||
                'Error al cargar proveedores.'
                }
                    </td>
                </tr>
            `;
        }
    }


    // ==================================================
    // CARGAR PROVEEDOR EN EL FORMULARIO
    // ==================================================
    async function cargarProveedorEnFormulario(
        idProveedor,
        boton
    ) {
        const contenidoOriginal =
            boton.innerHTML;

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        try {
            const respuesta = await fetch(
                `${API_PROVEEDORES}/${encodeURIComponent(idProveedor)}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const proveedor =
                await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                alert(
                    proveedor.message ||
                    'No se pudo obtener el proveedor.'
                );

                return;
            }

            activarModoEdicion(proveedor);

        } catch (error) {
            console.error(
                'Error al cargar proveedor:',
                error
            );

            alert(
                'Error de comunicación con el servidor.'
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }


    // ==================================================
    // ELIMINAR PROVEEDOR
    // ==================================================
    async function eliminarProveedor(
        idProveedor,
        nombreProveedor,
        boton
    ) {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al proveedor "${nombreProveedor}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmar) {
            return;
        }

        const contenidoOriginal =
            boton.innerHTML;

        boton.disabled = true;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        try {
            const respuesta = await fetch(
                `${API_PROVEEDORES}/${encodeURIComponent(idProveedor)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const data =
                await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                alert(
                    data.message ||
                    'No se pudo eliminar el proveedor.'
                );

                return;
            }

            alert(
                data.message ||
                'Proveedor eliminado correctamente.'
            );

            if (
                Number(idProveedorEditando) ===
                Number(idProveedor)
            ) {
                activarModoCreacion();
            }

            await cargarProveedores();

        } catch (error) {
            console.error(
                'Error al eliminar proveedor:',
                error
            );

            alert(
                'Error de comunicación con el servidor.'
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }


    // ==================================================
    // CREAR O ACTUALIZAR PROVEEDOR
    // ==================================================
    if (proveedorForm) {
        proveedorForm.addEventListener(
            'submit',
            async (evento) => {
                evento.preventDefault();

                const payload = {
                    nombre_proveedor:
                        nombreProveedorInput.value.trim(),

                    nombre_contacto:
                        nombreContactoInput.value.trim(),

                    telefono:
                        telefonoInput.value.trim(),

                    telefono_alt:
                        telefonoAltInput.value.trim(),

                    email:
                        emailInput.value.trim(),

                    nit:
                        nitInput.value.trim(),

                    ciudad:
                        ciudadInput.value.trim(),

                    departamento:
                        departamentoInput.value.trim(),

                    direccion:
                        direccionInput.value.trim(),

                    estado:
                        estadoInput.value,

                    notas:
                        notasInput.value.trim()
                };

                if (!payload.nombre_proveedor) {
                    alert(
                        'El nombre del proveedor es obligatorio.'
                    );

                    nombreProveedorInput.focus();
                    return;
                }

                if (
                    payload.email &&
                    !emailInput.checkValidity()
                ) {
                    alert(
                        'Escribe un correo electrónico válido.'
                    );

                    emailInput.focus();
                    return;
                }

                const estaEditando =
                    idProveedorEditando !== null;

                const metodo =
                    estaEditando
                        ? 'PUT'
                        : 'POST';

                const url =
                    estaEditando
                        ? `${API_PROVEEDORES}/${encodeURIComponent(idProveedorEditando)}`
                        : API_PROVEEDORES;

                const contenidoOriginal =
                    btnGuardar.innerHTML;

                btnGuardar.disabled = true;

                btnGuardar.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    &nbsp;Guardando...
                `;

                try {
                    const respuesta = await fetch(
                        url,
                        {
                            method: metodo,
                            headers: {
                                'Content-Type':
                                    'application/json',

                                Accept:
                                    'application/json'
                            },

                            body: JSON.stringify(
                                payload
                            )
                        }
                    );

                    const data =
                        await leerRespuesta(respuesta);

                    if (!respuesta.ok) {
                        alert(
                            data.message ||
                            'No se pudo guardar el proveedor.'
                        );

                        return;
                    }

                    alert(
                        data.message ||
                        (
                            estaEditando
                                ? 'Proveedor actualizado correctamente.'
                                : 'Proveedor creado correctamente.'
                        )
                    );

                    activarModoCreacion();
                    await cargarProveedores();

                } catch (error) {
                    console.error(
                        'Error al guardar proveedor:',
                        error
                    );

                    alert(
                        'Error de comunicación con el servidor.'
                    );

                } finally {
                    btnGuardar.disabled = false;

                    if (
                        idProveedorEditando === null
                    ) {
                        btnGuardar.innerHTML = `
                            <i class="fa-solid fa-truck-field"></i>
                            &nbsp;Guardar proveedor
                        `;
                    } else {
                        btnGuardar.innerHTML =
                            contenidoOriginal;
                    }
                }
            }
        );
    }


    // ==================================================
    // LIMPIAR O CANCELAR EDICIÓN
    // ==================================================
    if (btnLimpiar) {
        btnLimpiar.addEventListener(
            'click',
            (evento) => {
                evento.preventDefault();
                activarModoCreacion();
            }
        );
    }


    // ==================================================
    // INICIO
    // ==================================================
    activarModoCreacion();
    cargarProveedores();
});