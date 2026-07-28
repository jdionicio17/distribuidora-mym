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

    const form =
        document.querySelector('.user-form');

    const tbody =
        document.getElementById('usuarios-tbody');

    const nombreCompletoInput =
        document.getElementById('nombre_completo');

    const usuarioInput =
        document.getElementById('usuario');

    const correoInput =
        document.getElementById('correo');

    const rolInput =
        document.getElementById('rol');

    const passwordInput =
        document.getElementById('password');

    const passwordConfirmInput =
        document.getElementById('password_confirm');

    const estadoInput =
        document.getElementById('estado');

    const cambiarPasswordInput =
        document.getElementById('cambiar_password');

    const botonGuardar = form
        ? form.querySelector('button[type="submit"]')
        : null;

    const botonLimpiar = form
        ? form.querySelector('button[type="reset"]')
        : null;

    const seccionFormulario = form
        ? form.closest('.section')
        : null;

    const tituloFormulario = seccionFormulario
        ? seccionFormulario.querySelector(
            '.section-header h3'
        )
        : null;

    const descripcionFormulario = seccionFormulario
        ? seccionFormulario.querySelector(
            '.section-header p'
        )
        : null;

    const labelPassword =
        document.querySelector(
            'label[for="password"]'
        );

    const labelPasswordConfirm =
        document.querySelector(
            'label[for="password_confirm"]'
        );

    const BASE_URL =
        typeof API_BASE !== 'undefined'
            ? String(API_BASE).replace(/\/+$/, '')
            : '';

    const USUARIOS_URL =
        `${BASE_URL}/api/usuarios`;

    let idUsuarioEditando = null;


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
    // FORMATEAR ROL
    // ==================================================
    function formatearRol(rol) {
        switch (rol) {
            case 'admin':
                return 'Administrador';

            case 'ventas':
                return 'Ventas';

            case 'bodega':
                return 'Bodega / Inventario';

            case 'cobros':
                return 'Cobros / Créditos';

            default:
                return rol || 'Sin rol';
        }
    }


    // ==================================================
    // FORMATEAR FECHA
    // ==================================================
    function formatearFecha(valor) {
        if (!valor) {
            return '--/--/----';
        }

        const fecha = new Date(valor);

        if (Number.isNaN(fecha.getTime())) {
            return '--/--/----';
        }

        const dia = String(
            fecha.getDate()
        ).padStart(2, '0');

        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, '0');

        const anio = fecha.getFullYear();

        const hora = String(
            fecha.getHours()
        ).padStart(2, '0');

        const minuto = String(
            fecha.getMinutes()
        ).padStart(2, '0');

        return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
    }


    // ==================================================
    // RESTABLECER BOTÓN GUARDAR
    // ==================================================
    function actualizarBotonGuardar() {
        if (!botonGuardar) {
            return;
        }

        if (idUsuarioEditando === null) {
            botonGuardar.innerHTML = `
                <i class="fa-solid fa-user-plus"></i>
                &nbsp;Guardar usuario
            `;
        } else {
            botonGuardar.innerHTML = `
                <i class="fa-solid fa-floppy-disk"></i>
                &nbsp;Actualizar usuario
            `;
        }
    }


    // ==================================================
    // MODO CREACIÓN
    // ==================================================
    function activarModoCreacion() {
        /*
         * No existe ningún evento "reset" que vuelva a
         * ejecutar esta función. Esto elimina el ciclo
         * que borraba los datos al editar.
         */

        idUsuarioEditando = null;

        if (form) {
            form.reset();
        }

        if (estadoInput) {
            estadoInput.value = 'activo';
        }

        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.required = true;
            passwordInput.placeholder = '';
        }

        if (passwordConfirmInput) {
            passwordConfirmInput.value = '';
            passwordConfirmInput.required = true;
            passwordConfirmInput.placeholder = '';
        }

        if (tituloFormulario) {
            tituloFormulario.textContent =
                'Registrar usuario';
        }

        if (descripcionFormulario) {
            descripcionFormulario.textContent =
                'Completa la información para crear un nuevo usuario del sistema.';
        }

        if (labelPassword) {
            labelPassword.textContent =
                'Contraseña';
        }

        if (labelPasswordConfirm) {
            labelPasswordConfirm.textContent =
                'Confirmar contraseña';
        }

        if (botonLimpiar) {
            botonLimpiar.innerHTML = `
                <i class="fa-solid fa-rotate-left"></i>
                &nbsp;Limpiar
            `;
        }

        actualizarBotonGuardar();
    }


    // ==================================================
    // MODO EDICIÓN
    // ==================================================
    function activarModoEdicion(usuarioData) {
        idUsuarioEditando =
            Number(usuarioData.id_usuario);

        nombreCompletoInput.value =
            usuarioData.nombre_completo || '';

        usuarioInput.value =
            usuarioData.usuario || '';

        correoInput.value =
            usuarioData.correo || '';

        rolInput.value =
            usuarioData.rol || '';

        estadoInput.value =
            usuarioData.estado || 'activo';

        cambiarPasswordInput.checked =
            Number(
                usuarioData.debe_cambiar_password
            ) === 1;

        // No se muestra el hash guardado
        passwordInput.value = '';
        passwordConfirmInput.value = '';

        // En edición la contraseña es opcional
        passwordInput.required = false;
        passwordConfirmInput.required = false;

        passwordInput.placeholder =
            'Vacío para conservar la contraseña actual';

        passwordConfirmInput.placeholder =
            'Vacío para conservar la contraseña actual';

        if (tituloFormulario) {
            tituloFormulario.textContent =
                'Editar usuario';
        }

        if (descripcionFormulario) {
            descripcionFormulario.textContent =
                `Modificando el usuario "${usuarioData.usuario}".`;
        }

        if (labelPassword) {
            labelPassword.textContent =
                'Nueva contraseña (opcional)';
        }

        if (labelPasswordConfirm) {
            labelPasswordConfirm.textContent =
                'Confirmar nueva contraseña';
        }

        if (botonLimpiar) {
            botonLimpiar.innerHTML = `
                <i class="fa-solid fa-xmark"></i>
                &nbsp;Cancelar edición
            `;
        }

        actualizarBotonGuardar();

        form.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        nombreCompletoInput.focus();
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
    // CARGAR USUARIOS
    // ==================================================
    async function cargarUsuarios() {
        if (!tbody) {
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    Cargando usuarios...
                </td>
            </tr>
        `;

        try {
            const respuesta = await fetch(
                USUARIOS_URL,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const usuarios =
                await leerRespuesta(respuesta);

            if (!respuesta.ok) {
                throw new Error(
                    usuarios.message ||
                    'Error al obtener usuarios.'
                );
            }

            tbody.innerHTML = '';

            if (
                !Array.isArray(usuarios) ||
                usuarios.length === 0
            ) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-row">
                            Sin usuarios registrados.
                        </td>
                    </tr>
                `;

                return;
            }

            usuarios.forEach((usuarioData) => {
                const fila =
                    document.createElement('tr');

                fila.dataset.id =
                    usuarioData.id_usuario;

                // Usuario
                fila.appendChild(
                    crearCelda(usuarioData.usuario)
                );

                // Nombre completo
                fila.appendChild(
                    crearCelda(
                        usuarioData.nombre_completo
                    )
                );

                // Rol
                fila.appendChild(
                    crearCelda(
                        formatearRol(usuarioData.rol)
                    )
                );

                // Estado
                const tdEstado =
                    document.createElement('td');

                const badgeEstado =
                    document.createElement('span');

                badgeEstado.classList.add('badge');

                if (
                    usuarioData.estado === 'activo'
                ) {
                    badgeEstado.classList.add(
                        'badge-success'
                    );

                    badgeEstado.textContent =
                        'Activo';

                } else {
                    badgeEstado.classList.add(
                        'badge-danger'
                    );

                    badgeEstado.textContent =
                        'Inactivo';
                }

                tdEstado.appendChild(badgeEstado);
                fila.appendChild(tdEstado);

                // Último acceso
                fila.appendChild(
                    crearCelda(
                        formatearFecha(
                            usuarioData.ultimo_acceso
                        )
                    )
                );

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
                btnEditar.className = 'btn-icon';
                btnEditar.title = 'Editar';

                btnEditar.setAttribute(
                    'aria-label',
                    `Editar usuario ${usuarioData.usuario}`
                );

                btnEditar.innerHTML = `
                    <i class="fa-solid fa-pen-to-square"></i>
                `;

                btnEditar.addEventListener(
                    'click',
                    () => {
                        activarModoEdicion(
                            usuarioData
                        );
                    }
                );

                tdAcciones.appendChild(btnEditar);

                // Botón eliminar
                const btnEliminar =
                    document.createElement('button');

                btnEliminar.type = 'button';

                btnEliminar.className =
                    'btn-icon btn-icon-danger';

                btnEliminar.title = 'Eliminar';

                btnEliminar.setAttribute(
                    'aria-label',
                    `Eliminar usuario ${usuarioData.usuario}`
                );

                btnEliminar.innerHTML = `
                    <i class="fa-solid fa-trash-can"></i>
                `;

                btnEliminar.addEventListener(
                    'click',
                    async () => {
                        await eliminarUsuario(
                            usuarioData.id_usuario,
                            usuarioData.usuario,
                            btnEliminar
                        );
                    }
                );

                tdAcciones.appendChild(btnEliminar);

                fila.appendChild(tdAcciones);
                tbody.appendChild(fila);
            });

        } catch (error) {
            console.error(
                'Error al cargar usuarios:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-row">
                        ${error.message ||
                'Error al cargar usuarios.'
                }
                    </td>
                </tr>
            `;
        }
    }


    // ==================================================
    // ELIMINAR USUARIO
    // ==================================================
    async function eliminarUsuario(
        idUsuario,
        nombreUsuario,
        boton
    ) {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al usuario "${nombreUsuario}"?\n\nEsta acción no se puede deshacer.`
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
                `${USUARIOS_URL}/${encodeURIComponent(idUsuario)}`,
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
                    'No se pudo eliminar el usuario.'
                );

                return;
            }

            alert(
                data.message ||
                'Usuario eliminado correctamente.'
            );

            if (
                Number(idUsuarioEditando) ===
                Number(idUsuario)
            ) {
                activarModoCreacion();
            }

            await cargarUsuarios();

        } catch (error) {
            console.error(
                'Error al eliminar usuario:',
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
    // CREAR O ACTUALIZAR USUARIO
    // ==================================================
    if (form) {
        form.addEventListener(
            'submit',
            async (evento) => {
                evento.preventDefault();

                const nombre_completo =
                    nombreCompletoInput.value.trim();

                const usuario =
                    usuarioInput.value.trim();

                const correo =
                    correoInput.value.trim();

                const rol =
                    rolInput.value;

                const password =
                    passwordInput.value;

                const password_confirm =
                    passwordConfirmInput.value;

                const estado =
                    estadoInput.value;

                const debe_cambiar_password =
                    cambiarPasswordInput.checked;

                const estaEditando =
                    idUsuarioEditando !== null;

                if (
                    !nombre_completo ||
                    !usuario ||
                    !rol ||
                    !estado
                ) {
                    alert(
                        'Completa los campos obligatorios.'
                    );

                    return;
                }

                // Contraseña obligatoria al crear
                if (
                    !estaEditando &&
                    (!password || !password_confirm)
                ) {
                    alert(
                        'Debes escribir y confirmar la contraseña.'
                    );

                    return;
                }

                const intentaCambiarPassword =
                    password !== '' ||
                    password_confirm !== '';

                if (
                    intentaCambiarPassword &&
                    (!password || !password_confirm)
                ) {
                    alert(
                        'Debes escribir y confirmar la nueva contraseña.'
                    );

                    return;
                }

                if (
                    intentaCambiarPassword &&
                    password !== password_confirm
                ) {
                    alert(
                        'Las contraseñas no coinciden.'
                    );

                    return;
                }

                if (
                    intentaCambiarPassword &&
                    password.length < 6
                ) {
                    alert(
                        'La contraseña debe tener al menos 6 caracteres.'
                    );

                    return;
                }

                const metodo =
                    estaEditando
                        ? 'PUT'
                        : 'POST';

                const url =
                    estaEditando
                        ? `${USUARIOS_URL}/${encodeURIComponent(idUsuarioEditando)}`
                        : USUARIOS_URL;

                botonGuardar.disabled = true;

                botonGuardar.innerHTML = `
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

                            body: JSON.stringify({
                                nombre_completo,
                                usuario,
                                correo,
                                rol,
                                password,
                                password_confirm,
                                estado,
                                debe_cambiar_password
                            })
                        }
                    );

                    const data =
                        await leerRespuesta(respuesta);

                    if (!respuesta.ok) {
                        alert(
                            data.message ||
                            'No se pudo guardar el usuario.'
                        );

                        return;
                    }

                    alert(
                        data.message ||
                        (
                            estaEditando
                                ? 'Usuario actualizado correctamente.'
                                : 'Usuario creado correctamente.'
                        )
                    );

                    activarModoCreacion();
                    await cargarUsuarios();

                } catch (error) {
                    console.error(
                        'Error al guardar usuario:',
                        error
                    );

                    alert(
                        'Error de comunicación con el servidor.'
                    );

                } finally {
                    botonGuardar.disabled = false;
                    actualizarBotonGuardar();
                }
            }
        );
    }


    // ==================================================
    // LIMPIAR O CANCELAR EDICIÓN
    // ==================================================
    if (botonLimpiar) {
        botonLimpiar.addEventListener(
            'click',
            (evento) => {
                /*
                 * Se evita el reset automático y se
                 * controla manualmente.
                 */
                evento.preventDefault();
                activarModoCreacion();
            }
        );
    }


    // ==================================================
    // INICIO
    // ==================================================
    activarModoCreacion();
    cargarUsuarios();
});